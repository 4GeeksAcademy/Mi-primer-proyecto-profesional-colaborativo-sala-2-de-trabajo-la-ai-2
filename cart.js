const CART_KEY = "bararaza_cart_v1";
const TAX_RATE = 0.19;

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function sanitizeQty(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function getCart() {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart:updated"));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateSummary(cart) {
  const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * sanitizeQty(item.qty), 0);
  const taxes = subtotal * TAX_RATE;
  const total = subtotal + taxes;

  const subtotalElement = document.getElementById("subtotal-value");
  const taxElement = document.getElementById("tax-value");
  const totalElement = document.getElementById("total-value");

  if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
  if (taxElement) taxElement.textContent = formatCurrency(taxes);
  if (totalElement) totalElement.textContent = formatCurrency(total);
}

function buildCartItem(item, index) {
  const qty = sanitizeQty(item.qty);
  const price = Number(item.price);
  const thumbClass = item.thumbClass || "thumb-1";
  const lineTotal = price * qty;

  return [
    `<li class="cart-item" data-index="${index}" data-product-price="${price.toFixed(2)}">`,
    `<div class="thumb ${escapeHtml(thumbClass)}" role="img" aria-label="Miniatura ${escapeHtml(item.name)}"></div>`,
    '<div class="item-main">',
    `<h3>${escapeHtml(item.name)}</h3>`,
    `<p class="item-meta">Talla ${escapeHtml(item.size || "Unica")}</p>`,
    `<p class="unit-price">Precio unitario: <span class="js-unit-price">${formatCurrency(price)}</span></p>`,
    "</div>",
    '<div class="qty-control">',
    '<button class="qty-btn js-minus" type="button" aria-label="Disminuir cantidad">-</button>',
    `<input class="qty-input js-qty" type="number" min="1" value="${qty}" aria-label="Cantidad" />`,
    '<button class="qty-btn js-plus" type="button" aria-label="Aumentar cantidad">+</button>',
    "</div>",
    `<p class="line-total">Total: <span class="js-line-total">${formatCurrency(lineTotal)}</span></p>`,
    '<button class="remove-btn js-remove" type="button" aria-label="Eliminar producto">Eliminar</button>',
    "</li>",
  ].join("");
}

function renderCart() {
  const cartList = document.getElementById("cart-list");
  if (!cartList) return;

  const cart = getCart();

  if (!cart.length) {
    cartList.innerHTML =
      '<li class="cart-empty">Aun no has agregado productos. Ve al <a href="catalogo.html">catalogo</a> para seleccionar articulos.</li>';
    updateSummary([]);
    return;
  }

  cartList.innerHTML = cart.map(buildCartItem).join("");
  updateSummary(cart);
}

function handleCartAction(target) {
  const cartItem = target.closest(".cart-item");
  if (!cartItem) return;

  const itemIndex = Number.parseInt(cartItem.dataset.index || "-1", 10);
  const cart = getCart();
  if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= cart.length) return;

  const currentItem = cart[itemIndex];

  if (target.classList.contains("js-remove")) {
    cart.splice(itemIndex, 1);
    saveCart(cart);
    renderCart();
    return;
  }

  if (target.classList.contains("js-minus")) {
    currentItem.qty = Math.max(1, sanitizeQty(currentItem.qty) - 1);
    saveCart(cart);
    renderCart();
    return;
  }

  if (target.classList.contains("js-plus")) {
    currentItem.qty = sanitizeQty(currentItem.qty) + 1;
    saveCart(cart);
    renderCart();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const cartList = document.getElementById("cart-list");
  if (!cartList) return;

  cartList.addEventListener("click", (event) => {
    handleCartAction(event.target);
  });

  cartList.addEventListener("change", (event) => {
    const input = event.target;
    if (!input.classList.contains("js-qty")) return;

    const cartItem = input.closest(".cart-item");
    if (!cartItem) return;

    const itemIndex = Number.parseInt(cartItem.dataset.index || "-1", 10);
    const cart = getCart();

    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= cart.length) return;

    cart[itemIndex].qty = sanitizeQty(input.value);
    saveCart(cart);
    renderCart();
  });

  renderCart();
});