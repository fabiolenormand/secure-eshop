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
