/* ==========================================================================
   BEAT & HOME - LÓGICA DE FUNCIONAMIENTO, CARRITO E INTERFAZ
   ========================================================================== */

// --- 0. FUENTE DE PRODUCTOS: GOOGLE SHEET PUBLICADO COMO CSV ---
// Pegá acá el link que te da Google al "Publicar en la Web" (termina en output=csv)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQW1YgRMWRiXCtQw8GvUeMDpI2-HPpDRQ6_yoBKWYbNOU0QMm0pSusf-thsDt_pjyGRy1E454sEvhxc/pub?output=csv";

// Catálogo de respaldo por si el Sheet no carga (sin internet, link mal puesto, etc.)
const FALLBACK_PRODUCTS = [
    {
        id: 1,
        title: "Auriculares Wireless Beat Pro X",
        category: "audio",
        price: 32500,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        badge: "Más Vendido",
        desc: "Cancelación activa de ruido, micrófono HD y 30hs de batería continua."
    },
    {
        id: 2,
        title: "Termo Térmico Home Steel 1.2L",
        category: "bazar",
        price: 24900,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        badge: "Línea Home",
        desc: "Acero inoxidable doble capa. Mantiene el calor durante 24 horas."
    }
];

// Estado global de la aplicación
let products = [];
let cart = JSON.parse(localStorage.getItem('bh_cart')) || [];
let currentCategory = 'todos';
let searchQuery = '';
let currentSort = 'default';

// Referencias a elementos DOM
let DOM = {};

// --- 1. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    cacheDOMElements();
    setupEventListeners();
    showCatalogLoading();
    await loadProductsFromSheet();
    renderProducts();
    updateCartUI();
});

function cacheDOMElements() {
    DOM = {
        productsGrid: document.getElementById('products-grid'),
        cartDrawer: document.getElementById('cart-drawer'),
        cartOverlay: document.getElementById('cart-overlay'),
        cartItemsContainer: document.getElementById('cart-items-container'),
        cartCountEl: document.getElementById('cart-count'),
        cartTotalPriceEl: document.getElementById('cart-total-price'),
        resultsCountEl: document.getElementById('results-count'),
        searchInput: document.getElementById('search-input'),
        sortSelect: document.getElementById('sort-select'),
        cartToggleBtn: document.getElementById('cart-toggle-btn'),
        closeCartBtn: document.getElementById('close-cart-btn'),
        mainLogo: document.getElementById('main-logo'),
        adminLoginForm: document.getElementById('admin-login-form'),
        adminPassInput: document.getElementById('admin-pass-input'),
        adminLoginModal: document.getElementById('admin-login-modal'),
        adminPanelModal: document.getElementById('admin-panel-modal'),
        productForm: document.getElementById('product-form'),
        whatsappCheckoutBtn: document.getElementById('whatsapp-checkout-btn')
    };
}

function saveCartToStorage() {
    localStorage.setItem('bh_cart', JSON.stringify(cart));
}

// --- 2. CARGA DEL CATÁLOGO DESDE GOOGLE SHEETS ---
function showCatalogLoading() {
    if (DOM.productsGrid) {
        DOM.productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 10px;"></i>
                <p>Cargando catálogo...</p>
            </div>
        `;
    }
}

async function loadProductsFromSheet() {
    if (!SHEET_CSV_URL || SHEET_CSV_URL.includes("PEGA_ACA")) {
        console.warn("SHEET_CSV_URL no está configurado. Usando catálogo de respaldo.");
        products = FALLBACK_PRODUCTS;
        return;
    }

    try {
        const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Respuesta no válida del Sheet");

        const csvText = await response.text();
        const parsed = parseCSVToProducts(csvText);

        products = parsed.length > 0 ? parsed : FALLBACK_PRODUCTS;
    } catch (err) {
        console.error("No se pudo cargar el catálogo desde Google Sheets:", err);
        products = FALLBACK_PRODUCTS;
    }
}

// Separa una línea de CSV respetando comas dentro de comillas
function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(v => v.trim());
}

function parseCSVToProducts(csvText) {
    const rows = csvText.split('\n').map(r => r.trim()).filter(r => r.length > 0);
    if (rows.length <= 1) return [];

    const headers = splitCSVLine(rows[0]).map(h => h.toLowerCase());
    const idx = {
        titulo: headers.indexOf('titulo'),
        categoria: headers.indexOf('categoria'),
        precio: headers.indexOf('precio'),
        imagen: headers.indexOf('imagen'),
        badge: headers.indexOf('badge'),
        descripcion: headers.indexOf('descripcion')
    };

    if (idx.titulo === -1 || idx.precio === -1) {
        console.error('El CSV del Sheet no tiene las columnas "titulo" y/o "precio".');
        return [];
    }

    const defaultImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
    const parsed = [];

    for (let i = 1; i < rows.length; i++) {
        const cols = splitCSVLine(rows[i]);
        const title = cols[idx.titulo];
        const priceRaw = idx.precio !== -1 ? cols[idx.precio] : '';
        const price = parseFloat(String(priceRaw).replace(/[^\d.-]/g, ''));

        if (!title || !price) continue;

        const rawCategory = (idx.categoria !== -1 ? cols[idx.categoria] : '').toLowerCase();

        parsed.push({
            id: i,
            title,
            category: (rawCategory === 'audio' || rawCategory === 'beat') ? 'audio' : 'bazar',
            price,
            image: (idx.imagen !== -1 && cols[idx.imagen]) ? cols[idx.imagen] : defaultImg,
            badge: idx.badge !== -1 ? cols[idx.badge] : '',
            desc: idx.descripcion !== -1 ? cols[idx.descripcion] : ''
        });
    }

    return parsed;
}

// --- 3. RENDERIZADO Y FILTRADO DEL CATÁLOGO ---
function renderProducts() {
    if (!DOM.productsGrid) return;

    // Filtrado
    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'todos' || 
                                (currentCategory === 'ofertas' ? Boolean(p.badge) : p.category === currentCategory);
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (p.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Ordenamiento
    if (currentSort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (currentSort === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (currentSort === 'name') filtered.sort((a, b) => a.title.localeCompare(b.title));

    if (DOM.resultsCountEl) {
        DOM.resultsCountEl.innerText = `Mostrando ${filtered.length} productos`;
    }

    // Sin resultados
    if (filtered.length === 0) {
        DOM.productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
                <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No se encontraron productos.</p>
            </div>
        `;
        return;
    }

    // Tarjetas de productos
    const defaultImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";

    DOM.productsGrid.innerHTML = filtered.map(p => {
        const cartItem = cart.find(item => item.id === p.id);
        const qtyInCart = cartItem ? cartItem.qty : 0;
        const categoryBadgeClass = p.category === 'audio' ? 'badge-beat' : 'badge-home';
        const categoryLabel = p.category === 'audio' ? 'BEAT • AUDIO' : 'HOME • BAZAR';

        return `
            <div class="product-card">
                ${p.badge ? `<span class="card-badge ${categoryBadgeClass}">${escapeHTML(p.badge)}</span>` : ''}
                <div class="product-img-wrapper">
                    <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}" onerror="this.src='${defaultImage}'">
                </div>
                <div class="product-info">
                    <span class="product-category-tag">${categoryLabel}</span>
                    <h3 class="product-title">${escapeHTML(p.title)}</h3>
                    <p class="product-desc">${escapeHTML(p.desc || '')}</p>
                    <div class="product-bottom">
                        <span class="product-price">$${p.price.toLocaleString()}</span>
                        
                        ${qtyInCart === 0 ? `
                            <button class="add-cart-btn" onclick="addToCart(${p.id})" title="Agregar al Carrito">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        ` : `
                            <div class="card-qty-selector">
                                <button class="card-qty-btn" onclick="updateCartQty(${p.id}, -1)">-</button>
                                <span class="card-qty-num">${qtyInCart}</span>
                                <button class="card-qty-btn" onclick="updateCartQty(${p.id}, 1)">+</button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === cat);
    });
    renderProducts();
}

// --- 4. GESTIÓN DEL CARRITO ---
function toggleCart() {
    if (DOM.cartDrawer && DOM.cartOverlay) {
        DOM.cartDrawer.classList.toggle('active');
        DOM.cartOverlay.classList.toggle('active');
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
}

function updateCartQty(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += change;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
}

function updateCartUI() {
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    if (DOM.cartCountEl) DOM.cartCountEl.innerText = totalQty;
    if (DOM.cartTotalPriceEl) DOM.cartTotalPriceEl.innerText = `$${totalPrice.toLocaleString()}`;

    if (!DOM.cartItemsContainer) return;

    if (cart.length === 0) {
        DOM.cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 0; color: #64748b;">
                <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
                <p>Tu carrito está vacío.</p>
            </div>
        `;
        return;
    }

    DOM.cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">
            <div class="cart-item-info">
                <div class="cart-item-title">${escapeHTML(item.title)}</div>
                <div class="cart-item-price">$${item.price.toLocaleString()} c/u</div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
                </div>
            </div>
            <strong>$${(item.price * item.qty).toLocaleString()}</strong>
        </div>
    `).join('');
}

function sendWhatsAppOrder() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }

    const phone = "5491112345678";
    let message = "Hola *Beat & Home*! 👋 Quisiera realizar el siguiente pedido:\n\n";

    cart.forEach(item => {
        message += `▪ *${item.title}* (x${item.qty}) - $${(item.price * item.qty).toLocaleString()}\n`;
    });

    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    message += `\n💵 *TOTAL: $${total.toLocaleString()}*\n\n¿Me indican los datos para pago y envío? ¡Muchas gracias!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// --- 5. PANEL ADMINISTRADOR (solo vista previa local, ver nota abajo) ---
// IMPORTANTE: como el catálogo ahora se carga desde Google Sheets, estas
// funciones del panel admin ya NO son la fuente real de la tienda. Cualquier
// cambio hecho acá solo se ve en tu propio navegador, hasta que recargues
// la página (en ese momento se vuelve a pisar con lo que diga el Sheet).
// Se dejan activas por si te sirven para previsualizar algo puntual.

function openAdminLogin() { 
    if (DOM.adminPassInput) DOM.adminPassInput.value = '';
    if (DOM.adminLoginModal) DOM.adminLoginModal.classList.add('active'); 
}

function closeAdminLogin() { 
    if (DOM.adminLoginModal) DOM.adminLoginModal.classList.remove('active'); 
}

function openAdminPanel() {
    if (DOM.adminPanelModal) {
        DOM.adminPanelModal.classList.add('active');
        renderAdminTable();
    }
}

function closeAdminPanel() { 
    if (DOM.adminPanelModal) DOM.adminPanelModal.classList.remove('active'); 
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-products-table');
    if (!tbody) return;

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${escapeHTML(p.image)}" alt=""></td>
            <td><strong>${escapeHTML(p.title)}</strong></td>
            <td><span class="card-badge ${p.category === 'audio' ? 'badge-beat' : 'badge-home'}">${p.category.toUpperCase()}</span></td>
            <td>$${p.price.toLocaleString()}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#dc2626;" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function handleProductFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const title = document.getElementById('prod-title').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const image = document.getElementById('prod-image').value;
    const badge = document.getElementById('prod-badge').value;
    const desc = document.getElementById('prod-desc').value;

    if (id) {
        const index = products.findIndex(p => p.id === parseInt(id, 10));
        if (index !== -1) {
            products[index] = { ...products[index], title, price, category, image, badge, desc };
        }
    } else {
        products.push({ id: Date.now(), title, price, category, image, badge, desc });
    }

    renderProducts();
    renderAdminTable();
    resetProductForm();
    alert('Guardado solo en tu navegador (vista previa). Para que se vea en la tienda real, cargalo en el Google Sheet.');
}

function editProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-title').value = p.title;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-image').value = p.image;
    document.getElementById('prod-badge').value = p.badge || '';
    document.getElementById('prod-desc').value = p.desc || '';

    const formTitle = document.getElementById('form-title');
    const saveBtn = document.getElementById('save-prod-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (formTitle) formTitle.innerText = 'Editar Producto';
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Actualizar Producto';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
}

function resetProductForm() {
    const form = document.getElementById('product-form');
    if (form) form.reset();

    const prodId = document.getElementById('prod-id');
    const formTitle = document.getElementById('form-title');
    const saveBtn = document.getElementById('save-prod-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (prodId) prodId.value = '';
    if (formTitle) formTitle.innerText = 'Agregar Nuevo Producto';
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Producto';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function deleteProduct(id) {
    if (confirm('¿Eliminar este producto de la vista previa local?')) {
        products = products.filter(p => p.id !== id);
        cart = cart.filter(p => p.id !== id);
        saveCartToStorage();
        renderProducts();
        renderAdminTable();
        updateCartUI();
    }
}

function deleteAllProducts() {
    if (confirm('⚠️ Esto borra la vista previa local, no el Google Sheet. ¿Continuar?')) {
        products = [];
        cart = [];
        saveCartToStorage();
        renderProducts();
        renderAdminTable();
        updateCartUI();
    }
}

function applyMassPriceChange(multiplier) {
    const percentageEl = document.getElementById('mass-percentage');
    const percentage = parseFloat(percentageEl ? percentageEl.value : 0);

    if (isNaN(percentage) || percentage <= 0) {
        alert('Ingresá un porcentaje válido.');
        return;
    }

    const factor = 1 + (multiplier * (percentage / 100));
    products = products.map(p => ({
        ...p,
        price: Math.round(p.price * factor)
    }));

    renderProducts();
    renderAdminTable();
    alert(`Vista previa actualizada un ${percentage}%. Recordá que esto no cambia el Google Sheet.`);
}

// Helper para sanear HTML y evitar inyecciones de código
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- 6. CONFIGURACIÓN DE LISTENERS ---
function setupEventListeners() {
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => filterCategory(btn.dataset.category));
    });

    if (DOM.sortSelect) {
        DOM.sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    if (DOM.cartToggleBtn) DOM.cartToggleBtn.addEventListener('click', toggleCart);
    if (DOM.closeCartBtn) DOM.closeCartBtn.addEventListener('click', toggleCart);
    if (DOM.cartOverlay) DOM.cartOverlay.addEventListener('click', toggleCart);

    // Acceso Oculto Admin (Atajo Ctrl+Shift+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            openAdminLogin();
        }
    });

    // Acceso Oculto Admin (Triple Click Logo)
    let logoClickCount = 0;
    let logoClickTimer;
    if (DOM.mainLogo) {
        DOM.mainLogo.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            clearTimeout(logoClickTimer);

            if (logoClickCount === 3) {
                openAdminLogin();
                logoClickCount = 0;
            } else {
                logoClickTimer = setTimeout(() => {
                    logoClickCount = 0;
                }, 1000);
            }
        });
    }

    // Proceso de Login Admin
    if (DOM.adminLoginForm) {
        DOM.adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pass = DOM.adminPassInput ? DOM.adminPassInput.value : '';
            if (pass === '@IvanOliviaKimi' || pass === 'adminadmin') {
                closeAdminLogin();
                openAdminPanel();
            } else {
                alert('Contraseña incorrecta. Probá con "admin".');
            }
        });
    }

    if (DOM.productForm) {
        DOM.productForm.addEventListener('submit', handleProductFormSubmit);
    }

    if (DOM.whatsappCheckoutBtn) {
        DOM.whatsappCheckoutBtn.addEventListener('click', sendWhatsAppOrder);
    }
}