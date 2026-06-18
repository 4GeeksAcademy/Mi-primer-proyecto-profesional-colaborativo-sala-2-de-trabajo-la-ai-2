const TAX_RATE = 0.19;

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function sanitizeQty(input) {
  const parsed = Number.parseInt(input.value, 10);
  const safeQty = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  input.value = safeQty;
  return safeQty;
}

function updateCartTotals() {
  const cartItems = document.querySelectorAll(".cart-item");
  let subtotal = 0;

  cartItems.forEach((item) => {
    const price = Number.parseFloat(item.dataset.productPrice || "0");
    const qtyInput = item.querySelector(".js-qty");
    const lineTotalElement = item.querySelector(".js-line-total");

    if (!qtyInput || !lineTotalElement) {
      return;
    }

    const qty = sanitizeQty(qtyInput);
    const lineTotal = price * qty;
    subtotal += lineTotal;
    lineTotalElement.textContent = formatCurrency(lineTotal);
  });

  const taxes = subtotal * TAX_RATE;
  const total = subtotal + taxes;

  const subtotalElement = document.getElementById("subtotal-value");
  const taxElement = document.getElementById("tax-value");
  const totalElement = document.getElementById("total-value");

  if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
  if (taxElement) taxElement.textContent = formatCurrency(taxes);
  if (totalElement) totalElement.textContent = formatCurrency(total);
}

function bindCartEvents() {
  const cartItems = document.querySelectorAll(".cart-item");

  cartItems.forEach((item) => {
    const qtyInput = item.querySelector(".js-qty");
    const minusBtn = item.querySelector(".js-minus");
    const plusBtn = item.querySelector(".js-plus");

    if (qtyInput) {
      qtyInput.addEventListener("input", updateCartTotals);
      qtyInput.addEventListener("blur", updateCartTotals);
    }

    if (minusBtn && qtyInput) {
      minusBtn.addEventListener("click", () => {
        qtyInput.value = Math.max(1, sanitizeQty(qtyInput) - 1);
        updateCartTotals();
      });
    }

    if (plusBtn && qtyInput) {
      plusBtn.addEventListener("click", () => {
        qtyInput.value = sanitizeQty(qtyInput) + 1;
        updateCartTotals();
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindCartEvents();
  updateCartTotals();
});