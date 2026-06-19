(function () {
  var CART_KEY = "bararaza_cart_v1";
  var productsById = window.PRODUCTOS || {};
  var products = Object.keys(productsById).map(function (id) {
    return productsById[id];
  });

  var grid = document.getElementById("catalog-grid");
  if (!grid || !products.length) {
    return;
  }

  var resultCount = document.getElementById("result-count");
  var emptyState = document.getElementById("empty-state");
  var categorySelect = document.getElementById("categoria");
  var sizeSelect = document.getElementById("talla");
  var orderSelect = document.getElementById("orden");
  var priceMinInput = document.getElementById("precio-min");
  var priceMaxInput = document.getElementById("precio-max");
  var applyBtn = document.getElementById("apply-filters");
  var searchDesktop = document.getElementById("q");
  var searchMobile = document.getElementById("q-mobile");

  var url = new URL(window.location.href);
  var params = new URLSearchParams(url.search);

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

  function escapeHtml(value) {
    return (value || "")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildSuggestionText(product) {
    return product.name + " - " + product.categoryLabel;
  }

  function productScore(product, query) {
    if (!query) return 0;

    var name = normalize(product.name);
    var category = normalize(product.categoryLabel);
    var description = normalize(product.description);
    var materials = normalize(product.materials);
    var haystack = [name, category, description, materials].join(" ");
    var tokens = tokenize(query);
    var score = 0;

    if (!tokens.length) {
      return 0;
    }

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

    if (haystack.indexOf(query) >= 0) {
      score += 8;
    }

    return score;
  }

  function buildSuggestions(query, sourceProducts) {
    var term = normalize(query);
    var pool = sourceProducts && sourceProducts.length ? sourceProducts : products;

    if (!term) {
      return pool.slice(0, 8);
    }

    return pool
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

  function createCard(product) {
    var sizes = product.sizes.join("-");

    return [
      '<article class="catalog-card" role="listitem" itemscope itemtype="https://schema.org/Product">',
      '<a href="producto.html?id=' + escapeHtml(product.id) + '" class="catalog-link">',
      '<div class="catalog-thumb thumb ' + escapeHtml(product.thumbClass) + '"></div>',
      "<h3 itemprop=\"name\">" + escapeHtml(product.name) + "</h3>",
      '<p class="catalog-meta">' + escapeHtml(product.categoryLabel) + " | Talla " + escapeHtml(sizes) + "</p>",
      '<p class="catalog-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">',
      '<span itemprop="priceCurrency" content="EUR">EUR</span> <span itemprop="price" content="' + Number(product.price) + '">' + Number(product.price) + "</span>",
      "</p>",
      "</a>",
      '<div class="catalog-actions">',
      '<button type="button" class="btn-primary catalog-add-btn" data-add-to-cart="' + escapeHtml(product.id) + '">Anadir al carrito</button>',
      "</div>",
      "</article>",
    ].join("");
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

  function saveCart(cart) {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:updated"));
  }

  function addToCart(productId) {
    var product = productsById[productId];
    if (!product) return;

    var cart = getCart();
    var defaultSize = product.sizes[0] || "Unica";
    var existingIndex = cart.findIndex(function (entry) {
      return entry.id === product.id && entry.size === defaultSize;
    });

    if (existingIndex >= 0) {
      cart[existingIndex].qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        thumbClass: product.thumbClass,
        size: defaultSize,
        qty: 1,
      });
    }

    saveCart(cart);
  }

  var datalistId = "product-suggestions-catalog";
  var datalist = document.getElementById(datalistId);

  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = datalistId;
    document.body.appendChild(datalist);
  }

  function renderSuggestions(items) {
    datalist.innerHTML = items
      .map(function (item) {
        return '<option value="' + escapeHtml(item.name) + '">' + escapeHtml(buildSuggestionText(item)) + "</option>";
      })
      .join("");
  }

  function getSearchTerm() {
    var value = "";

    if (searchDesktop && searchDesktop.value) {
      value = searchDesktop.value;
    }

    if (!value && searchMobile && searchMobile.value) {
      value = searchMobile.value;
    }

    return value.trim();
  }

  function parsePrice(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  }

  function getState() {
    var searchText = getSearchTerm();

    return {
      q: searchText,
      qNormalized: normalize(searchText),
      categoria: normalize(categorySelect ? categorySelect.value : ""),
      talla: normalize(sizeSelect ? sizeSelect.value : ""),
      orden: orderSelect ? orderSelect.value : "destacados",
      precioMin: parsePrice(priceMinInput ? priceMinInput.value : ""),
      precioMax: parsePrice(priceMaxInput ? priceMaxInput.value : ""),
    };
  }

  function matchesCategory(product, categoria) {
    if (!categoria) return true;
    return normalize(product.category) === categoria;
  }

  function matchesSize(product, talla) {
    if (!talla) return true;
    return product.sizes.some(function (size) {
      return normalize(size) === talla;
    });
  }

  function matchesSearch(product, term) {
    if (!term) return true;

    var tokens = tokenize(term);
    if (!tokens.length) return true;

    var searchable = [
      normalize(product.name),
      normalize(product.categoryLabel),
      normalize(product.description),
      normalize(product.materials),
    ].join(" ");

    return tokens.every(function (token) {
      return searchable.indexOf(token) >= 0;
    });
  }

  function matchesPrice(product, min, max) {
    if (min !== null && product.price < min) return false;
    if (max !== null && product.price > max) return false;
    return true;
  }

  function sortProducts(list, orden, term) {
    var output = list.slice();

    if (orden === "precio-asc") {
      output.sort(function (a, b) {
        return a.price - b.price;
      });
      return output;
    }

    if (orden === "precio-desc") {
      output.sort(function (a, b) {
        return b.price - a.price;
      });
      return output;
    }

    if (orden === "novedades") {
      output.sort(function (a, b) {
        return a.id < b.id ? 1 : -1;
      });
      return output;
    }

    if (term) {
      output.sort(function (a, b) {
        return productScore(b, term) - productScore(a, term);
      });
    }

    return output;
  }

  function syncInputs(value, source) {
    if (searchDesktop && source !== searchDesktop) {
      searchDesktop.value = value;
    }

    if (searchMobile && source !== searchMobile) {
      searchMobile.value = value;
    }
  }

  function updateUrl(state) {
    var next = new URLSearchParams();

    if (state.q) next.set("q", state.q);
    if (state.categoria) next.set("categoria", state.categoria);
    if (state.talla) next.set("talla", state.talla);
    if (state.orden && state.orden !== "destacados") next.set("orden", state.orden);
    if (state.precioMin !== null) next.set("min", String(state.precioMin));
    if (state.precioMax !== null) next.set("max", String(state.precioMax));

    var nextQuery = next.toString();
    var nextUrl = window.location.pathname + (nextQuery ? "?" + nextQuery : "");
    window.history.replaceState({}, "", nextUrl);
  }

  function render() {
    var state = getState();
    var minPrice = state.precioMin;
    var maxPrice = state.precioMax;

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      var temp = minPrice;
      minPrice = maxPrice;
      maxPrice = temp;

      if (priceMinInput) priceMinInput.value = String(minPrice);
      if (priceMaxInput) priceMaxInput.value = String(maxPrice);
    }

    var filtered = products.filter(function (product) {
      return (
        matchesCategory(product, state.categoria) &&
        matchesSize(product, state.talla) &&
        matchesSearch(product, state.qNormalized) &&
        matchesPrice(product, minPrice, maxPrice)
      );
    });

    var sorted = sortProducts(filtered, state.orden, state.qNormalized);

    grid.innerHTML = sorted.map(createCard).join("");

    if (resultCount) {
      var label = sorted.length === 1 ? "resultado" : "resultados";
      resultCount.textContent = sorted.length + " " + label;
    }

    if (emptyState) {
      emptyState.hidden = sorted.length > 0;
    }

    updateUrl(state);
    renderSuggestions(buildSuggestions(getSearchTerm(), filtered));
  }

  function applyInitialState() {
    var initialQ = params.get("q") || "";
    var initialCategory = params.get("categoria") || "";
    var initialSize = params.get("talla") || "";
    var initialOrder = params.get("orden") || "destacados";
    var initialMin = params.get("min") || "";
    var initialMax = params.get("max") || "";

    if (searchDesktop) searchDesktop.value = initialQ;
    if (searchMobile) searchMobile.value = initialQ;
    if (categorySelect) categorySelect.value = initialCategory;
    if (sizeSelect) sizeSelect.value = initialSize;
    if (orderSelect) orderSelect.value = initialOrder;
    if (priceMinInput) priceMinInput.value = initialMin;
    if (priceMaxInput) priceMaxInput.value = initialMax;

    renderSuggestions(buildSuggestions(initialQ, products));
  }

  var searchDebounce = null;

  function onSearchInput(event) {
    var value = event.target.value;
    syncInputs(value, event.target);

    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    searchDebounce = setTimeout(function () {
      render();
    }, 120);
  }

  if (searchDesktop) {
    searchDesktop.setAttribute("list", datalistId);
    searchDesktop.addEventListener("input", onSearchInput);
  }

  if (searchMobile) {
    searchMobile.setAttribute("list", datalistId);
    searchMobile.addEventListener("input", onSearchInput);
  }

  [searchDesktop, searchMobile].forEach(function (input) {
    if (!input) return;
    var form = input.closest("form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      syncInputs(input.value, input);
      render();
    });
  });

  [categorySelect, sizeSelect, orderSelect, priceMinInput, priceMaxInput].forEach(function (select) {
    if (!select) return;
    select.addEventListener("change", render);
  });

  [priceMinInput, priceMaxInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener("input", render);
  });

  if (applyBtn) {
    applyBtn.addEventListener("click", render);
  }

  grid.addEventListener("click", function (event) {
    var addButton = event.target.closest("[data-add-to-cart]");
    if (!addButton) return;

    event.preventDefault();
    var productId = addButton.getAttribute("data-add-to-cart");
    addToCart(productId);

    var previousText = addButton.textContent;
    addButton.textContent = "Agregado";
    addButton.disabled = true;

    setTimeout(function () {
      addButton.textContent = previousText;
      addButton.disabled = false;
    }, 700);
  });

  applyInitialState();
  render();
})();
