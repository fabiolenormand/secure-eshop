const API = '';
let products = [];
let cart = [];

function getCategoryEmoji(cat) {
  if (!cat) return '🥤';
  const c = cat.toLowerCase();
  if (c.includes('bière') || c.includes('biere') || c.includes('beer')) return '🍺';
  if (c.includes('gazeuse') || c.includes('soda') || c.includes('cola')) return '🥤';
  if (c.includes('énergi') || c.includes('energi')) return '⚡';
  if (c.includes('eau') || c.includes('water')) return '💧';
  if (c.includes('jus') || c.includes('juice') || c.includes('fruit')) return '🍊';
  return '🛍';
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
  const grid = document.getElementById('productsGrid');
  if (!products.length) { grid.innerHTML = '<p>No products available.</p>'; return; }
  grid.innerHTML = products.map(p => {
    const img = p.image
      ? '<img src="' + p.image + '" alt="' + p.name + '" style="width:100%;height:150px;object-fit:cover" />'
      : '<div style="width:100%;height:150px;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;font-size:3.5rem">' + getCategoryEmoji(p.category) + '</div>';
    const disabled = p.stock < 1 ? 'disabled style="opacity:0.5"' : '';
    const btnText = p.stock < 1 ? 'Out of Stock' : 'Add to Cart';
    return '<div class="product-card">' +
      img +
      '<div class="product-info">' +
        '<h3>' + p.name + '</h3>' +
        '<div class="category">' + p.category + '</div>' +
        '<div class="desc">' + p.description + '</div>' +
        '<div class="product-footer">' +
          '<div><span class="price">$' + parseFloat(p.price).toFixed(2) + '</span><br/><span class="stock">Stock: ' + p.stock + '</span></div>' +
          '<button class="add-btn" onclick="addToCart(\'' + p.id + '\')" ' + disabled + '>' + btnText + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(c => c.id === id);
  existing ? existing.qty++ : cart.push({ ...product, qty: 1 });
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById('cartCount').textContent = cart.reduce((s, c) => s + c.qty, 0);
  const itemsDiv = document.getElementById('cartItems');
  const totalDiv = document.getElementById('cartTotal');
  const formDiv = document.getElementById('orderForm');
  if (!cart.length) {
    itemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    totalDiv.textContent = '';
    formDiv.style.display = 'none';
    return;
  }
  itemsDiv.innerHTML = cart.map(c =>
    '<div class="cart-item">' +
      '<div><div class="cart-item-name">' + c.name + '</div><div class="cart-item-sub">$' + c.price.toFixed(2) + ' x ' + c.qty + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span class="cart-item-price">$' + (c.price * c.qty).toFixed(2) + '</span>' +
        '<button class="remove-btn" onclick="removeFromCart(\'' + c.id + '\')">X</button>' +
      '</div>' +
    '</div>'
  ).join('');
  totalDiv.textContent = 'Total: $' + total.toFixed(2);
  formDiv.style.display = 'block';
}

function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('open');
  document.getElementById('cartSidebar').classList.toggle('open');
}

async function placeOrder() {
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const msgDiv = document.getElementById('orderMsg');
  msgDiv.style.display = 'none';
  if (!name || !email) { msgDiv.textContent = 'Please fill in all fields.'; msgDiv.className = 'msg error'; return; }
  if (!cart.length) { msgDiv.textContent = 'Cart is empty.'; msgDiv.className = 'msg error'; return; }
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  try {
    const res = await fetch(API + '/api/order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: name, customerEmail: email, items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })), total })
    });
    const data = await res.json();
    if (res.ok) {
      msgDiv.textContent = 'Order #' + data.order.id + ' placed! Thank you, ' + name + '.';
      msgDiv.className = 'msg success';
      cart = []; updateCartUI();
      document.getElementById('custName').value = '';
      document.getElementById('custEmail').value = '';
    } else { msgDiv.textContent = data.error || 'Order failed.'; msgDiv.className = 'msg error'; }
  } catch (e) { msgDiv.textContent = 'Connection error.'; msgDiv.className = 'msg error'; }
}

loadProducts();
