(function () {
  var params = new URLSearchParams(window.location.search);
  var productId = params.get("id") || "camisa-atelier-blanche";
  var product = window.PRODUCTOS[productId] || window.PRODUCTOS["camisa-atelier-blanche"];

  function formatPrice(value) {
    return value.toFixed(2).replace(".", ",") + " EUR";
  }

  function renderSizes(sizes) {
    return sizes
      .map(function (size, index) {
        var id = "talla-" + size.toLowerCase().replace(/\s+/g, "-");
        var checked = index === 0 ? " checked" : "";
        return (
          '<input type="radio" name="talla" id="' +
          id +
          '" value="' +
          size +
          '" class="size-option"' +
          checked +
          ">" +
          '<label for="' +
          id +
          '">' +
          size +
          "</label>"
        );
      })
      .join("");
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  document.title = product.name + " | Bararaza Clothing Co.";
  setText("product-badge", product.badge);
  setText("product-name", product.name);
  setText("product-sku", product.sku);
  setText("product-price", formatPrice(product.price));
  setText("product-materials", product.materials);
  setText("product-description", product.description);
  setText("breadcrumb-category", product.categoryLabel);
  setText("breadcrumb-product", product.name);

  var categoryLink = document.getElementById("breadcrumb-category-link");
  if (categoryLink) {
    categoryLink.textContent = product.categoryLabel;
    categoryLink.href = "catalogo.html?categoria=" + product.category;
  }

  var media = document.getElementById("product-media");
  if (media) {
    media.innerHTML = '<div class="thumb ' + product.thumbClass + '" role="img" aria-label="' + product.name + '"></div>';
  }

  var sizesContainer = document.getElementById("product-sizes");
  if (sizesContainer) {
    sizesContainer.innerHTML = renderSizes(product.sizes);
  }

  var priceData = document.getElementById("product-price-data");
  if (priceData) {
    priceData.setAttribute("value", product.price.toFixed(2));
    priceData.setAttribute("content", product.price.toFixed(2));
  }

  var cartForm = document.getElementById("product-cart-form");
  if (cartForm) {
    cartForm.action = "carrito.html";
  }

  var schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    brand: { "@type": "Brand", name: "Bararaza" },
    offers: {
      "@type": "Offer",
      url: "producto.html?id=" + product.id,
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
    },
    material: product.materials,
  };

  var schemaNode = document.getElementById("product-schema");
  if (schemaNode) {
    schemaNode.textContent = JSON.stringify(schema);
  }

  window.updateQty = function (delta) {
    var input = document.getElementById("cantidad");
    if (!input) return;
    var val = parseInt(input.value, 10) + delta;
    var min = parseInt(input.min, 10);
    var max = parseInt(input.max, 10);
    if (val >= min && val <= max) {
      input.value = val;
    }
  };
})();
