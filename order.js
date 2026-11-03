// Root & Radiance: Sprout Pod order form
// Validates the form, calculates the total owed and shows a summary.

const UNIT_PRICE = 89.0;
const GST_RATE = 0.05;        // Canadian orders
const US_TARIFF_RATE = 0.10;  // US orders
const COMMISSION_RATE = 0.05; // salesperson gets 5% of the pre-tax sale
const MAX_QTY = 20;

const form = document.getElementById("orderForm");
const nameInput = document.getElementById("customerName");
const emailInput = document.getElementById("customerEmail");
const qtyInput = document.getElementById("quantity");
const shippingGroup = document.getElementById("shippingGroup");
const errorBox = document.getElementById("formError");
const summary = document.getElementById("orderSummary");

const money = (amount) =>
  amount.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

// Escape user-entered text before putting it into innerHTML.
const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

function setValid(input, isValid) {
  input.classList.toggle("is-invalid", !isValid);
  input.classList.toggle("is-valid", isValid);
}

function validate() {
  const errors = [];

  const name = nameInput.value.trim();
  const nameOk = name.length >= 2 && /^[A-Za-zÀ-ÿ' .-]+$/.test(name);
  setValid(nameInput, nameOk);
  if (!nameOk) errors.push("Enter a valid name.");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.value.trim());
  setValid(emailInput, emailOk);
  if (!emailOk) errors.push("Enter a valid email address.");

  // Quantity must be a whole number between 1 and MAX_QTY (no decimals, letters or negatives).
  const rawQty = qtyInput.value.trim();
  const qty = Number(rawQty);
  const qtyOk = /^\d+$/.test(rawQty) && qty >= 1 && qty <= MAX_QTY;
  setValid(qtyInput, qtyOk);
  if (!qtyOk) errors.push(`Quantity must be a whole number from 1 to ${MAX_QTY}.`);

  const shipping = form.querySelector('input[name="shipping"]:checked');
  const radios = shippingGroup.querySelectorAll('input[name="shipping"]');
  radios.forEach((r) => r.classList.toggle("is-invalid", !shipping));
  if (!shipping) errors.push("Choose a shipping destination.");

  return { errors, name, qty, shipping: shipping ? shipping.value : null };
}

function calculate(qty, shipping) {
  const addons = [...form.querySelectorAll(".addon:checked")].map((box) => ({
    name: box.dataset.name,
    price: Number(box.value)
  }));

  const addonsPerPod = addons.reduce((sum, a) => sum + a.price, 0);
  const podsCost = UNIT_PRICE * qty;
  const addonsCost = addonsPerPod * qty;
  const subtotal = podsCost + addonsCost;

  const gst = shipping === "CA" ? subtotal * GST_RATE : 0;
  const tariff = shipping === "US" ? subtotal * US_TARIFF_RATE : 0;
  const total = subtotal + gst + tariff;

  return { addons, podsCost, addonsCost, subtotal, gst, tariff, total };
}

function showSummary(name, qty, shipping, c) {
  const addonRows = c.addons
    .map((a) => `<tr><td>&nbsp;&nbsp;+ ${a.name} &times; ${qty}</td><td>${money(a.price * qty)}</td></tr>`)
    .join("");

  summary.innerHTML = `
    <h3 class="h4">Thanks, ${escapeHtml(name)}!</h3>
    <p class="mb-3">Here's what you owe for your order:</p>
    <table>
      <tr><td>Sprout Pod &times; ${qty} @ ${money(UNIT_PRICE)}</td><td>${money(c.podsCost)}</td></tr>
      ${addonRows}
      <tr><td>Subtotal</td><td>${money(c.subtotal)}</td></tr>
      <tr><td>Shipping (${shipping === "CA" ? "Canada" : "USA"})</td><td>${shipping === "CA" ? "FREE" : "Included"}</td></tr>
      ${shipping === "CA"
        ? `<tr><td>GST (5%)</td><td>${money(c.gst)}</td></tr>`
        : `<tr><td>US import tariff (10%)</td><td>${money(c.tariff)}</td></tr>`}
      <tr class="total-row"><td>Total owed</td><td>${money(c.total)}</td></tr>
    </table>`;

  summary.classList.remove("d-none");
  summary.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const { errors, name, qty, shipping } = validate();
  if (errors.length) {
    errorBox.innerHTML = `<strong>Please fix the following:</strong><ul class="mb-0">${errors
      .map((e) => `<li>${e}</li>`)
      .join("")}</ul>`;
    errorBox.classList.remove("d-none");
    summary.classList.add("d-none");
    return;
  }
  errorBox.classList.add("d-none");

  const totals = calculate(qty, shipping);
  showSummary(name, qty, shipping, totals);

  // Bonus: salesperson commission (5% of the pre-tax sale)
  const commission = totals.subtotal * COMMISSION_RATE;
  console.log(`Whoa, Sally in sales just made ${money(commission)} for that!`);
});

// Clear the red outline on the shipping radios as soon as one is picked.
shippingGroup.addEventListener("change", () => {
  shippingGroup.querySelectorAll('input[name="shipping"]').forEach((r) => r.classList.remove("is-invalid"));
});
