(function () {
  var CART_KEY = "bararaza_cart_v1";

  function sanitizeQty(value) {
    var parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }

  function getCartCount() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      if (!raw) return 0;

      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return 0;

      return parsed.reduce(function (acc, item) {
        return acc + sanitizeQty(item && item.qty);
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  function updateCartBadges() {
    var count = getCartCount();
    var badges = document.querySelectorAll(".js-cart-count");

    badges.forEach(function (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  }

  document.addEventListener("DOMContentLoaded", updateCartBadges);
  window.addEventListener("storage", updateCartBadges);
  window.addEventListener("cart:updated", updateCartBadges);
})();