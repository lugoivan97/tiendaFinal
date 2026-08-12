/* ==========================================================================
   BEAT & HOME - LÓGICA DE FUNCIONAMIENTO, CARRITO E INTERFAZ
   ========================================================================== */

// --- 1. PRODUCTOS POR DEFECTO Y ESTADO GLOBAL ---
const DEFAULT_PRODUCTS = [
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
    },
    {
        id: 3,
        title: "Auriculares In-Ear Bluetooth Sport",
        category: "audio",
        price: 18200,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
        badge: "15% OFF",
        desc: "Resistentes al agua IPX7, ideales para entrenamiento y running."
    },
    {
        id: 4,
        title: "Set x3 Organizadores de Cocina Minimal",
        category: "bazar",
        price: 14500,
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        badge: "Novedad",
        desc: "Frascos herméticos de vidrio con tapa de bambú natural."
    },
    {
        id: 5,
        title: "Parlante Portátil Waterproof Beat Bass",
        category: "audio",
        price: 41000,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80",
        badge: "Destacado",
        desc: "Potencia 20W, luces RGB sincronizadas y conexión Bluetooth 5.3."
    },
    {
        id: 6,
        title: "Prensa Francesa Cafetera 800ml",
        category: "bazar",
        price: 19800,
        image: "https://images.unsplash.com/photo-1572119865084-43c285814d63?auto=format&fit=crop&w=600&q=80",
        badge: "Favorito",
        desc: "Cristal borosilicato resistente al fuego directo y filtro de acero."
    }
];

// Estado global de la aplicación
let products = JSON.parse(localStorage.getItem('bh_products')) || DEFAULT_PRODUCTS;
let cart = JSON.parse(localStorage.getItem('bh_cart')) || [];
let currentCategory = 'todos';
let searchQuery = '';
let currentSort = 'default';

// Referencias a elementos DOM
let DOM = {};

// --- 2. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    saveProductsToStorage();
    renderProducts();
    updateCartUI();
    setupEventListeners();
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

// Persistencia en LocalStorage
function saveProductsToStorage() {
    localStorage.setItem('bh_products', JSON.stringify(products));
}

function saveCartToStorage() {
    localStorage.setItem('bh_cart', JSON.stringify(cart));
}

// --- 3. RENDERIZADO Y FILTRADO DEL CATÁLOGO ---
function renderProducts() {
    if (!DOM.productsGrid) return;

    // Filtrado
    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'todos' || 
                                (currentCategory === 'ofertas' ? Boolean(p.badge) : p.category === currentCategory);
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.desc.toLowerCase().includes(searchQuery.toLowerCase());
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

// --- 5. PANEL ADMINISTRADOR ---
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

    saveProductsToStorage();
    renderProducts();
    renderAdminTable();
    resetProductForm();
    alert('Producto guardado con éxito.');
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
    if (confirm('¿Eliminar este producto del catálogo?')) {
        products = products.filter(p => p.id !== id);
        cart = cart.filter(p => p.id !== id);
        saveCartToStorage();
        saveProductsToStorage();
        renderProducts();
        renderAdminTable();
        updateCartUI();
    }
}

function deleteAllProducts() {
    if (confirm('⚠️ ¿Estás seguro de que querés borrar TODO el catálogo de productos? Esta acción no se puede deshacer.')) {
        products = [];
        cart = [];
        saveCartToStorage();
        saveProductsToStorage();
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

    saveProductsToStorage();
    renderProducts();
    renderAdminTable();
    alert(`Precios actualizados un ${percentage}% correctamente.`);
}

// --- 6. IMPORTACIÓN Y EXPORTACIÓN CSV ---
function processCSVImport() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput ? fileInput.files[0] : null;

    if (!file) {
        alert('Por favor seleccioná un archivo .csv primero.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);

        if (rows.length <= 1) {
            alert('El archivo CSV está vacío o no tiene el formato correcto.');
            return;
        }

        const modeEl = document.querySelector('input[name="csv-mode"]:checked');
        const mode = modeEl ? modeEl.value : 'append';
        const newProducts = [];
        const defaultImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(/,|;/).map(col => col.replace(/^"(.*)"$/, '$1').trim());

            if (columns.length >= 3) {
                const title = columns[0];
                const category = (columns[1] || 'bazar').toLowerCase();
                const price = parseFloat(columns[2]) || 0;
                const image = columns[3] || defaultImg;
                const badge = columns[4] || '';
                const desc = columns[5] || '';

                if (title && price > 0) {
                    newProducts.push({
                        id: Date.now() + i,
                        title,
                        category: (category === 'audio' || category === 'beat') ? 'audio' : 'bazar',
                        price,
                        image,
                        badge,
                        desc
                    });
                }
            }
        }

        if (newProducts.length === 0) {
            alert('No se pudieron procesar productos válidos. Verificá la plantilla.');
            return;
        }

        if (mode === 'replace') {
            products = newProducts;
            cart = [];
            saveCartToStorage();
            updateCartUI();
        } else {
            products = [...products, ...newProducts];
        }

        saveProductsToStorage();
        renderProducts();
        renderAdminTable();
        fileInput.value = '';

        alert(`¡Carga exitosa! Se importaron ${newProducts.length} productos correctamente.`);
    };

    reader.readAsText(file);
}

function downloadCSVTemplate() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "titulo,categoria,precio,imagen,badge,descripcion\n"
        + "Parlante RGB Mini,audio,18500,https://images.unsplash.com/photo-1608043152269-423dbba4e7e1,Oferta,Parlante bluetooth con luces led\n"
        + "Molinillo de Café Manual,bazar,12400,https://images.unsplash.com/photo-1572119865084-43c285814d63,Home,Molinillo cerámico regulable";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_beat_and_home.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

// --- 7. CONFIGURACIÓN DE LISTENERS ---
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
            if (pass === '1234' || pass === 'admin') {
                closeAdminLogin();
                openAdminPanel();
            } else {
                alert('Contraseña incorrecta. Probá con "1234".');
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