// Catalog from products.json. Cart in localStorage only. No checkout yet.
(function () {
  var CART_KEY = "dropship_cart_v1";
  var CHECKOUT_ENABLED = false; // flip to true only after payments are approved

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { return []; }
  }
  function writeCart(c) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) { /* storage blocked: cart stays in memory */ }
  }
  function cartCount() { return readCart().reduce(function (n, i) { return n + i.qty; }, 0); }
  function updateCount() {
    var el = document.getElementById("cart-count");
    if (el) el.textContent = "Cart (" + cartCount() + ")";
  }
  function money(n) { return "$" + Number(n).toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function addToCart(id) {
    var c = readCart(), hit = c.find(function (i) { return i.id === id; });
    if (hit) hit.qty += 1; else c.push({ id: id, qty: 1 });
    writeCart(c); updateCount();
  }

  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());
  updateCount();

  fetch("products.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (data) {
    var products = data.products || [];
    var page = location.pathname.split("/").pop();

    var tiles = document.getElementById("categories");
    if (tiles && data.categories) {
      tiles.innerHTML = data.categories.map(function (c) {
        return '<a class="tile" href="index.html?cat=' + encodeURIComponent(c.id) + '#shop">' + esc(c.name) + "</a>";
      }).join("");
    }

    if (page === "product.html") {
      var id = new URLSearchParams(location.search).get("id");
      var p = products.find(function (x) { return x.id === id; });
      var box = document.getElementById("product");
      if (!p) { box.innerHTML = '<p class="empty">Product not found.</p>'; return; }
      box.innerHTML =
        '<div><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '"></div>' +
        "<div><h1>" + esc(p.title) + '</h1><p class="price">' + money(p.price) + "</p>" +
        "<p>" + esc(p.description) + "</p>" +
        '<p class="todo">Shipping: ' + esc(p.shipping_note || "see Shipping &amp; Returns") + "</p>" +
        '<button id="add">Add to cart</button></div>';
      document.getElementById("add").onclick = function () { addToCart(p.id); this.textContent = "Added"; };
      return;
    }

    if (page !== "index.html" && page !== "") return;
    var cat = new URLSearchParams(location.search).get("cat");
    var list = cat ? products.filter(function (p) { return p.category === cat; }) : products;
    var grid = document.getElementById("grid");
    if (!list.length) { document.getElementById("empty").hidden = false; return; }
    grid.innerHTML = list.map(function (p) {
      return '<article class="card"><a href="product.html?id=' + encodeURIComponent(p.id) + '">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy"></a>' +
        '<div class="card-body">' + (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") +
        "<h3>" + esc(p.title) + '</h3><p class="price">' + money(p.price) + "</p>" +
        '<button data-id="' + esc(p.id) + '">Add to cart</button></div></article>';
    }).join("");
    grid.addEventListener("click", function (e) {
      if (e.target.matches("button[data-id]")) { addToCart(e.target.dataset.id); e.target.textContent = "Added"; }
    });
  }).catch(function () {
    var e = document.getElementById("empty"); if (e) { e.hidden = false; e.textContent = "Catalog could not load."; }
  });
})();
