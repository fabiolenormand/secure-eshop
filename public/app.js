const API = '';
let products = [];
let cart = [];

function getPlaceholder(cat) {
  var c = (cat || '').toLowerCase();
  if (c.indexOf('biere') >= 0 || c.indexOf('beer') >= 0) return {bg:'#f6a623',label:'Biere'};
  if (c.indexOf('gazeuse') >= 0 || c.indexOf('cola') >= 0) return {bg:'#e94560',label:'Soda'};
  if (c.indexOf('energi') >= 0) return {bg:'#2d2d2d',label:'Energy'};
  if (c.indexOf('eau') >= 0 || c.indexOf('water') >= 0) return {bg:'#00bcd4',label:'Eau'};
  if (c.indexOf('jus') >= 0 || c.indexOf('fruit') >= 0) return {bg:'#ff9800',label:'Jus'};
  return {bg:'#1a1a2e',label:'Boisson'};
}

async function loadProducts() {
  try {
    const res = await fetch(API + '/api/products');
    products = await res.json();
    renderProducts();
  } catch (e) {
    document.getElementById('productsGrid').innerHTML = '<p style="color:red">Error loading products.</p>';
  }
}

function renderProducts() {
  var grid = document.getElementById('productsGrid');
  if (!products.length) { grid.innerHTML = '<p>No products available.</p>'; return; }
  var html = '';
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var ph = getPlaceholder(p.category);
    var imgHtml = p.image
      ? '<img src="' + p.image + '" alt="' + p.name + '" style="width:100%;height:150px;object-fit:cover" />'
      : '<div style="width:100%;height:150px;background:' + ph.bg + ';display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:white;font-weight:bold;letter-spacing:1px;">' + ph.label + '</div>';
    html += '<div class="product-card">' + imgHtml +
      '<div class="product-info">' +
        '<h3>' + p.name + '</h3>' +
        '<div class="category">' + p.category + '</div>' +
        '<div class="desc">' + p.description + '</div>' +
        '<div class="product-footer">' +
          '<span class="price">$' + parseFloat(p.price).toFixed(2) + '</span>' +
          '<button class="add-btn" data-id="' + p.id + '">Add to Cart</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  grid.innerHTML = html;
}

document.addEventListener('click', function(e) {
  var addBtn = e.target.closest('.add-btn');
  if (addBtn) { addToCart(addBtn.getAttribute('data-id')); return; }
  var rmBtn = e.target.closest('.remove-btn');
  if (rmBtn) { removeFromCart(rmBtn.getAttribute('data-id')); }
});

function addToCart(id) {
  var product = null;
  for (var i = 0; i < products.length; i++) { if (products[i].id === id) { product = products[i]; break; } }
  if (!product) return;
  var existing = null;
  for (var j = 0; j < cart.length; j++) { if (cart[j].id === id) { existing = cart[j]; break; } }
  if (existing) { existing.qty++; } else { cart.push({id:product.id,name:product.name,price:product.price,qty:1}); }
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(function(c) { return c.id !== id; });
  updateCartUI();
}

function updateCartUI() {
  var total = 0;
  var count = 0;
  for (var i = 0; i < cart.length; i++) { total += cart[i].price * cart[i].qty; count += cart[i].qty; }
  document.getElementById('cartCount').textContent = count;
  var itemsDiv = document.getElementById('cartItems');
  var totalDiv = document.getElementById('cartTotal');
  var formDiv = document.getElementById('orderForm');
  if (!cart.length) {
    itemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    totalDiv.textContent = '';
    formDiv.style.display = 'none';
    return;
  }
  var html = '';
  for (var j = 0; j < cart.length; j++) {
    var c = cart[j];
    html += '<div class="cart-item">' +
      '<div><div class="cart-item-name">' + c.name + '</div>' +
      '<div class="cart-item-sub">$' + c.price.toFixed(2) + ' x ' + c.qty + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span class="cart-item-price">$' + (c.price * c.qty).toFixed(2) + '</span>' +
        '<button class="remove-btn" data-id="' + c.id + '">X</button>' +
      '</div></div>';
  }
  itemsDiv.innerHTML = html;
  totalDiv.textContent = 'Total: $' + total.toFixed(2);
  formDiv.style.display = 'block';
}

function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('open');
  document.getElementById('cartSidebar').classList.toggle('open');
}

async function placeOrder() {
  var name = document.getElementById('custName').value.trim();
  var email = document.getElementById('custEmail').value.trim();
  var msgDiv = document.getElementById('orderMsg');
  msgDiv.style.display = 'none';
  if (!name || !email) { msgDiv.textContent = 'Please fill in all fields.'; msgDiv.className = 'msg error'; return; }
  if (!cart.length) { msgDiv.textContent = 'Cart is empty.'; msgDiv.className = 'msg error'; return; }
  var total = cart.reduce(function(s,c){ return s + c.price * c.qty; }, 0);
  try {
    var items = cart.map(function(c){ return {id:c.id,name:c.name,price:c.price,qty:c.qty}; });
    var res = await fetch(API + '/api/order', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({customerName:name, customerEmail:email, items:items, total:total})
    });
    var data = await res.json();
    if (res.ok) {
      msgDiv.textContent = 'Order placed! Thank you, ' + name + '.';
      msgDiv.className = 'msg success';
      cart = []; updateCartUI();
      document.getElementById('custName').value = '';
      document.getElementById('custEmail').value = '';
    } else {
      msgDiv.textContent = data.error || 'Order failed.';
      msgDiv.className = 'msg error';
    }
  } catch(e) {
    msgDiv.textContent = 'Connection error.';
    msgDiv.className = 'msg error';
  }
}

loadProducts();
