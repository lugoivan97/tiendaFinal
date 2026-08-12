/* ==========================================================================
   BEAT & HOME - LÓGICA DE FUNCIONAMIENTO, CARRITO E INTERFAZ
   ========================================================================== */

const defaultProducts = [
    {
        id: 1,
        title: "Auriculares Wireless Beat Pro X",
        category: "audio",
        price: 32500,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        badge: "Más Vendido",
        desc: "Cancelación activa de ruido, microfono HD y 30hs de batería continua."
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
let products = JSON.parse(localStorage.getItem('bh_products')) || defaultProducts;
let cart = JSON.parse(localStorage.getItem('bh_cart')) || [];
let currentCategory = 'todos';
let searchQuery = '';
let currentSort = 'default';

// Elementos DOM
const productsGrid = document.getElementById('products-grid');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCountEl = document.getElementById('cart-count');
const cartTotalPriceEl = document.getElementById('cart-total-price');
const resultsCountEl = document.getElementById('results-count');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    saveProductsToStorage();
    renderProducts();
    updateCartUI();
    setupEventListeners();
});

function saveProductsToStorage() {
    localStorage.setItem('bh_products', JSON.stringify(products));
}

function saveCartToStorage() {
    localStorage.setItem('bh_cart', JSON.stringify(cart));
}

// Renderizado del Catálogo
function renderProducts() {
    let filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'todos' || 
                                (currentCategory === 'ofertas' ? p.badge : p.category === currentCategory);
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (currentSort === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (currentSort === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (currentSort === 'name') filtered.sort((a, b) => a.title.localeCompare(b.title));

    resultsCountEl.innerText = `Mostrando ${filtered.length} productos`;

    if (filtered.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
                <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No se encontraron productos.</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = filtered.map(p => {
        // Buscar si el producto ya está en el carrito
        const cartItem = cart.find(item => item.id === p.id);
        const qtyInCart = cartItem ? cartItem.qty : 0;

        return `
            <div class="product-card">
                ${p.badge ? `<span class="card-badge ${p.category === 'audio' ? 'badge-beat' : 'badge-home'}">${p.badge}</span>` : ''}
                <div class="product-img-wrapper">
                    <img src="${p.image}" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'">
                </div>
                <div class="product-info">
                    <span class="product-category-tag">${p.category === 'audio' ? 'BEAT • AUDIO' : 'HOME • BAZAR'}</span>
                    <h3 class="product-title">${p.title}</h3>
                    <p class="product-desc">${p.desc}</p>
                    <div class="product-bottom">
                        <span class="product-price">$${p.price.toLocaleString()}</span>
                        
                        <!-- Si no está en el carrito: Botón Naranja. Si está: Selector de Cantidad + / - -->
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

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => filterCategory(btn.dataset.category));
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
    });

    document.getElementById('cart-toggle-btn').addEventListener('click', toggleCart);
    document.getElementById('close-cart-btn').addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    // ACCESO OCULTO ADMIN (Atajo + Triple Click Logo)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            openAdminLogin();
        }
    });

    let logoClickCount = 0;
    let logoClickTimer;
    const mainLogo = document.getElementById('main-logo');
    if (mainLogo) {
        mainLogo.addEventListener('click', (e) => {
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
    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = document.getElementById('admin-pass-input').value;
        if (pass === '1234' || pass === 'admin') {
            closeAdminLogin();
            openAdminPanel();
        } else {
            alert('Contraseña incorrecta. Probá con "1234".');
        }
    });

    document.getElementById('product-form').addEventListener('submit', handleProductFormSubmit);
    document.getElementById('whatsapp-checkout-btn').addEventListener('click', sendWhatsAppOrder);
}

// Carrito
function toggleCart() {
    cartDrawer.classList.toggle('active');
    cartOverlay.classList.toggle('active');
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
    renderProducts(); // Re-renderiza para mostrar los botones (+ / -) en la tarjeta
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
    renderProducts(); // Actualiza tanto la tarjeta de producto como la vista general
}

function updateCartUI() {
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    cartCountEl.innerText = totalQty;
    cartTotalPriceEl.innerText = `$${totalPrice.toLocaleString()}`;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 0; color: #64748b;">
                <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
                <p>Tu carrito está vacío.</p>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
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

// Envío a WhatsApp
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

// Funciones Administrador
function openAdminLogin() { 
    document.getElementById('admin-pass-input').value = '';
    document.getElementById('admin-login-modal').classList.add('active'); 
}
function closeAdminLogin() { document.getElementById('admin-login-modal').classList.remove('active'); }
function openAdminPanel() {
    document.getElementById('admin-panel-modal').classList.add('active');
    renderAdminTable();
}
function closeAdminPanel() { document.getElementById('admin-panel-modal').classList.remove('active'); }

function renderAdminTable() {
    const tbody = document.getElementById('admin-products-table');
    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image}" alt=""></td>
            <td><strong>${p.title}</strong></td>
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
        const index = products.findIndex(p => p.id === parseInt(id));
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

    document.getElementById('form-title').innerText = 'Editar Producto';
    document.getElementById('save-prod-btn').innerHTML = '<i class="fa-solid fa-rotate"></i> Actualizar Producto';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
}

function resetProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('form-title').innerText = 'Agregar Nuevo Producto';
    document.getElementById('save-prod-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Producto';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

function deleteProduct(id) {
    if (confirm('¿Eliminar este producto del catálogo?')) {
        products = products.filter(p => p.id !== id);
        // Si estaba en el carrito, también lo borramos
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
    const percentage = parseFloat(document.getElementById('mass-percentage').value);
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

// Carga Masiva CSV
function processCSVImport() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput.files[0];

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

        const mode = document.querySelector('input[name="csv-mode"]:checked').value;
        const newProducts = [];

        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(/,|;/).map(col => col.replace(/^"(.*)"$/, '$1').trim());

            if (columns.length >= 3) {
                const title = columns[0];
                const category = (columns[1] || 'bazar').toLowerCase();
                const price = parseFloat(columns[2]) || 0;
                const image = columns[3] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
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