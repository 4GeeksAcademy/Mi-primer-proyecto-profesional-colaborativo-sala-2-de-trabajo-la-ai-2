(function () {
  var productsById = window.PRODUCTOS || {};
  var products = Object.keys(productsById).map(function (id) {
    return productsById[id];
  });

  if (!products.length) {
    return;
  }

  function normalize(value) {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function tokenize(query) {
    var normalized = normalize(query);
    if (!normalized) return [];
    return normalized.split(/\s+/).filter(Boolean);
  }

  function createSuggestionText(product) {
    return product.name + " - " + product.categoryLabel;
  }

  function productScore(product, query) {
    if (!query) return 0;

    var name = normalize(product.name);
    var category = normalize(product.categoryLabel);
    var description = normalize(product.description);
    var materials = normalize(product.materials);
    var tokens = tokenize(query);
    var score = 0;

    if (!tokens.length) return 0;

    if (name === query) score += 120;
    if (name.indexOf(query) === 0) score += 90;
    if (category === query) score += 45;

    tokens.forEach(function (token) {
      var nameStarts = name.indexOf(token) === 0;
      var nameContains = name.indexOf(token) >= 0;
      var categoryContains = category.indexOf(token) >= 0;
      var descContains = description.indexOf(token) >= 0;
      var matContains = materials.indexOf(token) >= 0;

      if (nameStarts) score += 28;
      if (!nameStarts && nameContains) score += 18;
      if (categoryContains) score += 10;
      if (descContains) score += 4;
      if (matContains) score += 3;
    });

    return score;
  }

  function buildSuggestions(query) {
    var term = normalize(query);

    if (!term) {
      return products.slice(0, 8);
    }

    return products
      .map(function (product) {
        return { product: product, score: productScore(product, term) };
      })
      .filter(function (entry) {
        return entry.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 8)
      .map(function (entry) {
        return entry.product;
      });
  }

  var datalistId = "product-suggestions-global";
  var datalist = document.getElementById(datalistId);

  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = datalistId;
    document.body.appendChild(datalist);
  }

  function renderSuggestions(items) {
    datalist.innerHTML = items
      .map(function (item) {
        return '<option value="' + item.name.replace(/"/g, "&quot;") + '">' + createSuggestionText(item) + "</option>";
      })
      .join("");
  }

  renderSuggestions(products.slice(0, 8));

  var searchInputs = [document.getElementById("q"), document.getElementById("q-mobile")].filter(Boolean);
  var searchForms = [];

  searchInputs.forEach(function (input) {
    input.setAttribute("list", datalistId);

    var form = input.closest("form");
    if (form && searchForms.indexOf(form) === -1) {
      searchForms.push(form);
    }

    input.addEventListener("input", function () {
      renderSuggestions(buildSuggestions(input.value));
    });
  });

  searchForms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var query = (formData.get("q") || "").toString().trim();
      var target = "catalogo.html";

      if (query) {
        target += "?q=" + encodeURIComponent(query);
      }

      window.location.href = target;
    });
  });
})();
