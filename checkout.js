(function () {
  var CART_KEY = "bararaza_cart_v1";
  var TAX_RATE = 0.19;

  var form = document.getElementById("checkout-form");
  var prevButton = document.getElementById("checkout-prev");
  var nextButton = document.getElementById("checkout-next");
  var submitButton = document.getElementById("checkout-submit");
  var errorNode = document.getElementById("checkout-error");
  var successNode = document.getElementById("checkout-success");

  if (!form) return;

  var panels = Array.prototype.slice.call(document.querySelectorAll(".checkout-panel"));
  var indicators = Array.prototype.slice.call(document.querySelectorAll("[data-step-indicator]"));
  var currentStep = 1;

  var formatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });

  function sanitizeQty(value) {
    var parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }

  function getCart() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function getFieldsForStep(step) {
    var panel = document.querySelector('.checkout-panel[data-step="' + step + '"]');
    if (!panel) return [];

    return Array.prototype.slice
      .call(panel.querySelectorAll("input, select, textarea"))
      .filter(function (field) {
        return field.required;
      });
  }

  function clearError() {
    errorNode.textContent = "";
    errorNode.classList.remove("is-visible");
  }

  function showError(message) {
    errorNode.textContent = message;
    errorNode.classList.add("is-visible");
  }

  function clearSuccess() {
    successNode.hidden = true;
    successNode.textContent = "";
  }

  function validateStep(step) {
    clearError();

    var fields = getFieldsForStep(step);
    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    if (step === 3) {
      var cardNumberInput = document.getElementById("numero");
      var expiryInput = document.getElementById("vencimiento");
      var cvvInput = document.getElementById("cvv");

      var cardDigits = (cardNumberInput.value || "").replace(/\D/g, "");
      if (cardDigits.length < 13 || cardDigits.length > 19) {
        showError("Introduce un numero de tarjeta valido.");
        cardNumberInput.focus();
        return false;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryInput.value || "")) {
        showError("El vencimiento debe tener formato MM/AA.");
        expiryInput.focus();
        return false;
      }

      var cvvDigits = (cvvInput.value || "").replace(/\D/g, "");
      if (cvvDigits.length < 3 || cvvDigits.length > 4) {
        showError("Introduce un CVV valido.");
        cvvInput.focus();
        return false;
      }
    }

    return true;
  }

  function updateStepUI() {
    panels.forEach(function (panel) {
      var step = Number(panel.getAttribute("data-step"));
      panel.hidden = step !== currentStep;
    });

    indicators.forEach(function (indicator) {
      var step = Number(indicator.getAttribute("data-step-indicator"));
      indicator.classList.toggle("is-active", step === currentStep);
      indicator.classList.toggle("is-done", step < currentStep);
    });

    prevButton.disabled = currentStep === 1;
    nextButton.hidden = currentStep === 3;
    submitButton.hidden = currentStep !== 3;
  }

  function renderSummary() {
    var cart = getCart();
    var list = document.getElementById("checkout-summary-list");
    var subtotalNode = document.getElementById("checkout-subtotal");
    var taxNode = document.getElementById("checkout-tax");
    var totalNode = document.getElementById("checkout-total");

    if (!list || !subtotalNode || !taxNode || !totalNode) return;

    if (!cart.length) {
      list.innerHTML = '<li class="checkout-summary-item"><span>Tu carrito esta vacio.</span><strong><a href="catalogo.html">Ir al catalogo</a></strong></li>';
      subtotalNode.textContent = formatter.format(0);
      taxNode.textContent = formatter.format(0);
      totalNode.textContent = formatter.format(0);
      return;
    }

    list.innerHTML = cart
      .map(function (item) {
        var qty = sanitizeQty(item.qty);
        var totalLine = Number(item.price) * qty;
        return [
          '<li class="checkout-summary-item">',
          '<span>' + item.name + ' x' + qty + '</span>',
          '<strong>' + formatter.format(totalLine) + '</strong>',
          "</li>",
        ].join("");
      })
      .join("");

    var subtotal = cart.reduce(function (acc, item) {
      return acc + Number(item.price) * sanitizeQty(item.qty);
    }, 0);
    var tax = subtotal * TAX_RATE;
    var total = subtotal + tax;

    subtotalNode.textContent = formatter.format(subtotal);
    taxNode.textContent = formatter.format(tax);
    totalNode.textContent = formatter.format(total);
  }

  prevButton.addEventListener("click", function () {
    clearError();
    clearSuccess();
    currentStep = Math.max(1, currentStep - 1);
    updateStepUI();
  });

  nextButton.addEventListener("click", function () {
    clearSuccess();
    if (!validateStep(currentStep)) return;

    currentStep = Math.min(3, currentStep + 1);
    updateStepUI();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearSuccess();

    if (!validateStep(3)) return;

    successNode.hidden = false;
    successNode.textContent =
      "Pedido simulado confirmado. En un entorno real, aqui se conectaria el gateway de pago.";

    window.localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event("cart:updated"));

    form.reset();
    currentStep = 1;
    updateStepUI();
    renderSummary();
  });

  var cardInput = document.getElementById("numero");
  if (cardInput) {
    cardInput.addEventListener("input", function () {
      var digits = (cardInput.value || "").replace(/\D/g, "").slice(0, 19);
      var chunks = digits.match(/.{1,4}/g) || [];
      cardInput.value = chunks.join(" ");
    });
  }

  var expiryInput = document.getElementById("vencimiento");
  if (expiryInput) {
    expiryInput.addEventListener("input", function () {
      var digits = (expiryInput.value || "").replace(/\D/g, "").slice(0, 4);
      if (digits.length >= 3) {
        expiryInput.value = digits.slice(0, 2) + "/" + digits.slice(2);
      } else {
        expiryInput.value = digits;
      }
    });
  }

  renderSummary();
  updateStepUI();
})();
