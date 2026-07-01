document.addEventListener('DOMContentLoaded', () => {
    // Inicializar todo el ecosistema de datos cruzados
    loadClients();
    loadInventory();
    loadOrders();
    updateClientDropdown();
    updatePartsDropdown();
    calculateFinancials();

    // Enlazar los disparadores de eventos de envío de formularios
    document.getElementById('clientForm').addEventListener('submit', handleClientSubmit);
    document.getElementById('inventoryForm').addEventListener('submit', handleInventorySubmit);
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
});

// Arquitectura de pestañas limpia y robusta
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    
    if(tabId === 'reparaciones') document.getElementById('btn-reparaciones').classList.add('active');
    if(tabId === 'inventario') document.getElementById('btn-inventario').classList.add('active');
    if(tabId === 'clientes') document.getElementById('btn-clientes').classList.add('active');
}

// ==========================================
// CONTROLADOR LOGICO: BASE DE CLIENTES
// ==========================================
function handleClientSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim() || 'No registrada';

    const newClient = {
        id: 'CLI-' + Math.floor(100000 + Math.random() * 900000),
        name,
        phone,
        address
    };

    let clients = JSON.parse(localStorage.getItem('sf_clients')) || [];
    clients.push(newClient);
    localStorage.setItem('sf_clients', JSON.stringify(clients));

    document.getElementById('clientForm').reset();
    loadClients();
    updateClientDropdown();
    alert('Cliente añadido al sistema.');
}

function loadClients() {
    const tableBody = document.getElementById('clientsTableBody');
    if(!tableBody) return;
    tableBody.innerHTML = '';

    const clients = JSON.parse(localStorage.getItem('sf_clients')) || [];
    if(clients.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888;">No hay clientes en la base de datos.</td></tr>`;
        return;
    }

    clients.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:var(--accent-color);">${c.id}</strong></td>
            <td><strong>${c.name}</strong></td>
            <td>${c.phone}</td>
            <td>${c.address}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateClientDropdown() {
    const select = document.getElementById('orderClientSelect');
    if(!select) return;
    select.innerHTML = '<option value="">-- Elige un Cliente Registrado --</option>';

    const clients = JSON.parse(localStorage.getItem('sf_clients')) || [];
    clients.forEach(c => {
        const opt = document.createElement('option');
        opt.value = `${c.name} (${c.phone})`;
        opt.textContent = `${c.name} [${c.id}]`;
        select.appendChild(opt);
    });
}

// ==========================================
// CONTROLADOR LOGICO: INVENTARIO DE REPUESTOS
// ==========================================
function handleInventorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('partName').value.trim();
    const cost = parseFloat(document.getElementById('partCost').value);
    const qty = parseInt(document.getElementById('partQty').value);

    const partId = 'PART-' + Date.now().toString().slice(-5);

    const newPart = { id: partId, name, cost, qty };

    let inventory = JSON.parse(localStorage.getItem('sf_inventory')) || [];
    inventory.push(newPart);
    localStorage.setItem('sf_inventory', JSON.stringify(inventory));

    document.getElementById('inventoryForm').reset();
    loadInventory();
    updatePartsDropdown();
    alert('Repuesto inyectado en el stock.');
}

function loadInventory() {
    const tableBody = document.getElementById('inventoryTableBody');
    if(!tableBody) return;
    tableBody.innerHTML = '';

    const inventory = JSON.parse(localStorage.getItem('sf_inventory')) || [];
    if(inventory.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888;">Inventario vacío. Agrega repuestos primero.</td></tr>`;
        return;
    }

    inventory.forEach(p => {
        const tr = document.createElement('tr');
        const stockStatus = p.qty > 0 ? `<span class="status-badge status-listo">${p.qty} disponibles</span>` : `<span class="status-badge status-recibido" style="background-color:#f8d7da; color:#721c24;">Agotado</span>`;
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td class="price-text">RD$ ${p.cost.toLocaleString('es-DO', {minimumFractionDigits: 2})}</td>
            <td>${p.qty} unidades</td>
            <td>${stockStatus}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function updatePartsDropdown() {
    const select = document.getElementById('partSelect');
    if(!select) return;
    select.innerHTML = '<option value="ninguno">Ninguno (Solo Mano de Obra / Limpieza)</option>';

    const inventory = JSON.parse(localStorage.getItem('sf_inventory')) || [];
    inventory.forEach(p => {
        if(p.qty > 0) {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (Costo: RD$ ${p.cost})`;
            select.appendChild(opt);
        }
    });
}

// ==========================================
// CONTROLADOR LOGICO: FINANZAS & REPARACIONES
// ==========================================
function handleOrderSubmit(e) {
    e.preventDefault();
    const clientInfo = document.getElementById('orderClientSelect').value;
    const brand = document.getElementById('deviceBrand').value;
    const model = document.getElementById('deviceModel').value.trim();
    const imei = document.getElementById('deviceImei').value.trim() || 'N/A';
    const partId = document.getElementById('partSelect').value;
    const labor = parseFloat(document.getElementById('laborCost').value);
    const status = document.getElementById('repairStatus').value;

    if(!clientInfo) {
        alert('Error: Tienes que asignar un cliente válido.');
        return;
    }

    let partName = 'Ninguno';
    let partCost = 0;

    // Si se usó una pieza del inventario, descontar stock
    if(partId !== 'ninguno') {
        let inventory = JSON.parse(localStorage.getItem('sf_inventory')) || [];
        const partIndex = inventory.findIndex(p => p.id === partId);
        
        if(partIndex !== -1 && inventory[partIndex].qty > 0) {
            inventory[partIndex].qty -= 1; // Descontar stock real
            partName = inventory[partIndex].name;
            partCost = inventory[partIndex].cost;
            localStorage.setItem('sf_inventory', JSON.stringify(inventory));
        } else {
            alert('Esta pieza ya no cuenta con existencias físicas.');
            return;
        }
    }

    const totalCost = partCost + labor;

    const newOrder = {
        id: Date.now(),
        clientInfo,
        brand,
        model,
        imei,
        partName,
        partCost,
        labor,
        totalCost,
        status
    };

    let orders = JSON.parse(localStorage.getItem('sf_orders')) || [];
    orders.push(newOrder);
    localStorage.setItem('sf_orders', JSON.stringify(orders));

    document.getElementById('orderForm').reset();
    
    // Sincronizar toda la aplicación de inmediato
    loadOrders();
    loadInventory();
    updatePartsDropdown();
    calculateFinancials();
    alert('Orden procesada y registrada financieramente.');
}

function loadOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    if(!tableBody) return;
    tableBody.innerHTML = '';

    const orders = JSON.parse(localStorage.getItem('sf_orders')) || [];
    if(orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">No hay órdenes asignadas en este momento.</td></tr>`;
        return;
    }

    orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'order-row-item';
        
        let sClass = 'status-recibido', sText = 'Recibido';
        if(o.status === 'reparacion') { sClass = 'status-reparacion'; sText = 'En Reparación'; }
        if(o.status === 'listo') { sClass = 'status-listo'; sText = 'Listo'; }

        tr.innerHTML = `
            <td><strong>${o.clientInfo}</strong></td>
            <td>${o.brand} ${o.model}</td>
            <td><code style="background:#e9ecef; padding:2px 4px; border-radius:3px;">${o.imei}</code></td>
            <td><small>${o.partName}</small></td>
            <td class="price-text" style="color:var(--primary-color);">RD$ ${o.totalCost.toLocaleString('es-DO')}</td>
            <td><span class="status-badge ${sClass}">${sText}</span></td>
        `;
        tableBody.appendChild(tr);
    });
}

function calculateFinancials() {
    const orders = JSON.parse(localStorage.getItem('sf_orders')) || [];
    
    let totalLabor = 0;
    let totalPartsCost = 0;
    
    orders.forEach(o => {
        totalLabor += o.labor;
        totalPartsCost += o.partCost;
    });

    // La ganancia neta en reparaciones es el cobro de la mano de obra limpia
    const netProfit = totalLabor; 

    document.getElementById('m-mano-obra').textContent = `RD$ ${totalLabor.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
    document.getElementById('m-repuestos').textContent = `RD$ ${totalPartsCost.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
    document.getElementById('m-ganancias').textContent = `RD$ ${netProfit.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
}

// FILTRADO INTELIGENTE EN TIEMPO REAL
function filterOrders() {
    const query = document.getElementById('searchOrder').value.toLowerCase();
    const rows = document.querySelectorAll('.order-row-item');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if(text.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}