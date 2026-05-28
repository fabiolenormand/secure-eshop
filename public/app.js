const API = '';
let products = [];
let cart = [];

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
    html += '<div class="product-card">' +
      '<div class="product-info">' +
        '<h3>' + p.name + '</h3>' +
        '<div class="category">' + p.category + '</div>' +
        '<div class="desc">' + p.description + '</div>' +
        '<div class="product-footer">' +
          '<span class="price">' + parseFloat(p.price).toFixed(0) + ' Kc</span>' +
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
      '<div class="cart-item-sub">' + parseFloat(c.price).toFixed(0) + ' Kc x ' + c.qty + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span class="cart-item-price">' + (c.price * c.qty).toFixed(0) + ' Kc</span>' +
        '<button class="remove-btn" data-id="' + c.id + '">X</button>' +
      '</div></div>';
  }
  itemsDiv.innerHTML = html;
  totalDiv.textContent = 'Total: ' + total.toFixed(0) + ' Kc';
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
      cart = []; updateCartUI(); showOrderSuccess(name);
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

function showOrderSuccess(name) {
  var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
      overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:40px;text-align:center;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">'
          + '<div style="font-size:3rem;margin-bottom:16px;">✅</div>'
              + '<h2 style="color:#1a1a2e;margin-bottom:12px;">Order Confirmed!</h2>'
                  + '<p style="color:#555;font-size:1rem;">Thank you, <strong>' + name + '</strong>!<br>Your order has been placed successfully.</p>'
                      + '<button onclick="this.closest(\'[data-ov]\').remove()" style="margin-top:24px;background:#e94560;color:white;border:none;padding:12px 32px;border-radius:10px;font-size:1rem;cursor:pointer;">OK</button>'
                          + '</div>';
                            overlay.setAttribute('data-ov', '1');
                              document.body.appendChild(overlay);
                                setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 5000);
                                }