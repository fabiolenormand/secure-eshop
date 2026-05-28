const API = '';
let token = localStorage.getItem('adminToken') || '';
let chartInstance = null;

window.addEventListener('load', () => { if (token) showAdmin(); });

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errDiv = document.getElementById('loginErr');
  errDiv.textContent = '';
  try {
    const res = await fetch(API + '/api/admin/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password}) });
    const data = await res.json();
    if (res.ok) { token = data.token; localStorage.setItem('adminToken', token); showAdmin(); }
    else errDiv.textContent = data.error || 'Login failed.';
  } catch { errDiv.textContent = 'Server connection error.'; }
}

function showAdmin() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadDashboard();
}

function logout() { token = ''; localStorage.removeItem('adminToken'); location.reload(); }

function showTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (el) el.classList.add('active');
  if (name === 'dashboard') loadDashboard();
  if (name === 'products') loadProductsTable();
  if (name === 'orders') loadOrdersTable();
  if (name === 'addProduct') resetProductForm();
}

function authHeaders() { return {'Content-Type':'application/json','Authorization': 'Bearer ' + token}; }

async function loadDashboard() {
  const [pRes, oRes] = await Promise.all([fetch(API+'/api/products'), fetch(API+'/api/orders',{headers:authHeaders()})]);
  const products = await pRes.json();
  const orders = await oRes.json().catch(()=>[]);
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statRevenue').textContent = orders.reduce((s,o)=>s+(o.total||0),0).toFixed(2);
  document.getElementById('statPending').textContent = orders.filter(o=>o.status==='pending').length;
  renderChart(orders);
}

function renderChart(orders) {
  const counts = {pending:0,completed:0,cancelled:0};
  orders.forEach(o=>{if(counts[o.status]!==undefined)counts[o.status]++;});
  if (chartInstance) chartInstance.destroy();
  const ctx = document.getElementById('ordersChart').getContext('2d');
  chartInstance = new Chart(ctx,{type:'doughnut',data:{labels:['Pending','Completed','Cancelled'],datasets:[{data:[counts.pending,counts.completed,counts.cancelled],backgroundColor:['#ffc107','#28a745','#e94560']}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
}

async function loadProductsTable() {
  const products = await fetch(API+'/api/products').then(r=>r.json());
  document.getElementById('productsTable').innerHTML = products.map(p=>`
    <tr><td>${p.id}</td><td><strong>${p.name}</strong></td><td>${parseFloat(p.price).toFixed(0)} Kc</td><td>${p.category}</td><td>${p.stock}</td>
    <td><button class="btn btn-edit" onclick="editProduct('${p.id}')">Edit</button> <button class="btn btn-del" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center">No products</td></tr>';
}

async function editProduct(id) {
  const p = await fetch(API+'/api/products/'+id).then(r=>r.json());
  document.getElementById('editProductId').value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pStock').value = p.stock;
  document.getElementById('pDesc').value = p.description;
  document.getElementById('pImage').value = p.image;
  document.getElementById('productFormTitle').textContent = 'Edit Product';
  showTab('addProduct', null);
  document.querySelector('.sidebar a:nth-child(3)').classList.add('active');
}

function resetProductForm() {
  ['editProductId','pName','pPrice','pCategory','pStock','pDesc','pImage'].forEach(id => document.getElementById(id).value='');
  document.getElementById('productFormTitle').textContent = 'Add Product';
  document.getElementById('productMsg').style.display = 'none';
}

async function saveProduct() {
  const id = document.getElementById('editProductId').value;
  const msgDiv = document.getElementById('productMsg');
  const body = { name:document.getElementById('pName').value.trim(), price:parseFloat(document.getElementById('pPrice').value), category:document.getElementById('pCategory').value.trim()||'General', stock:parseInt(document.getElementById('pStock').value)||0, description:document.getElementById('pDesc').value.trim(), image:document.getElementById('pImage').value.trim() };
  if (!body.name||isNaN(body.price)) { showMsg(msgDiv,'Name and price required.',false); return; }
  const res = await fetch(API+'/api/products'+(id?'/'+id:''), {method:id?'PUT':'POST',headers:authHeaders(),body:JSON.stringify(body)});
  const data = await res.json();
  res.ok ? showMsg(msgDiv,'Product '+(id?'updated':'created')+'!',true) : showMsg(msgDiv,data.error||'Error.',false);
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  const res = await fetch(API+'/api/products/'+id,{method:'DELETE',headers:authHeaders()});
  res.ok ? loadProductsTable() : alert('Failed.');
}

async function loadOrdersTable() {
  const orders = await fetch(API+'/api/orders',{headers:authHeaders()}).then(r=>r.json()).catch(()=>[]);
  document.getElementById('ordersTable').innerHTML = orders.map(o=>`
    <tr><td>${o.id}</td><td>${o.customerName}</td><td>${o.customerEmail}</td><td>${parseFloat(o.total).toFixed(0)} Kc</td>
    <td><select onchange="updateOrderStatus('${o.id}',this.value)">
      <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
      <option value="completed" ${o.status==='completed'?'selected':''}>Completed</option>
      <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
    </select></td>
    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
    <td><button class="btn btn-del" onclick="deleteOrder('${o.id}')">Delete</button></td></tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center">No orders yet</td></tr>';
}

async function updateOrderStatus(id, status) {
  await fetch(API+'/api/orders/'+id,{method:'PUT',headers:authHeaders(),body:JSON.stringify({status})});
}

async function deleteOrder(id) {
  if (!confirm('Delete this order?')) return;
  const res = await fetch(API+'/api/orders/'+id,{method:'DELETE',headers:authHeaders()});
  res.ok ? loadOrdersTable() : alert('Failed.');
}

async function exportCSV(type) {
  const res = await fetch(API+'/api/export/'+type,{headers:authHeaders()});
  if (!res.ok) { alert('Export failed.'); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=type+'.csv'; a.click(); URL.revokeObjectURL(url);
}

function showMsg(el,text,ok) { el.textContent=text; el.className='msg '+(ok?'ok':'err'); el.style.display='block'; }
