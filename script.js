/* ============================================================
   DIH SIGNATURE — APP.JS
   Interações modernas + Supabase
   ============================================================ */

const SUPABASE_URL = "https://hpvfinfjlhyvhhdgimkk.supabase.co";
const SUPABASE_KEY = "sb_publishable_eLw1BxG3uJDwvZKmAgzX8g_89zjt6nq";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const BAG_KEY = "dih_signature_bag_v2";

let products = [];
let bag = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
let currentCategory = "Todos";
let editingProductId = null;
let currentSession = null;
let isSaving = false;


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    injectExtraStyles();

    updateBagCount();

    setupKeyboard();

    setupSearch();

    await checkConnection();

    await loadProducts();

    listenAuth();

    animatePage();

});


/* ============================================================
   ESTILOS EXTRAS GERADOS PELO JS
   ============================================================ */

function injectExtraStyles() {

    if (document.getElementById("dih-js-styles")) return;

    const style = document.createElement("style");

    style.id = "dih-js-styles";

    style.textContent = `

        /* TOAST */

        #dihToastContainer {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 99999;

            display: flex;
            flex-direction: column;
            gap: 10px;

            pointer-events: none;
        }

        .dih-toast {
            min-width: 280px;
            max-width: 390px;

            padding: 14px 17px;

            border-radius: 14px;

            background: rgba(255,255,255,.97);

            border: 1px solid #e9e1e5;

            box-shadow: 0 15px 40px rgba(30,20,28,.16);

            display: flex;
            align-items: center;
            gap: 12px;

            color: #2b2529;

            font-size: 13px;
            font-weight: 600;

            animation: dihToastIn .3s ease;
        }

        .dih-toast.success {
            border-left: 4px solid #4c946d;
        }

        .dih-toast.error {
            border-left: 4px solid #c95858;
        }

        .dih-toast.info {
            border-left: 4px solid #8b5d7e;
        }

        .dih-toast-icon {
            width: 30px;
            height: 30px;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #f1e7ef;

            color: #8b5d7e;

            flex-shrink: 0;
        }

        .dih-toast svg {
            width: 17px;
            height: 17px;
        }

        .dih-toast.hide {
            animation: dihToastOut .25s ease forwards;
        }


        /* LOADING */

        .dih-loading {
            min-height: 180px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-direction: column;

            gap: 12px;

            color: #777078;
        }

        .dih-spinner {
            width: 32px;
            height: 32px;

            border: 3px solid #eee5ea;
            border-top-color: #8b5d7e;

            border-radius: 50%;

            animation: dihSpin .7s linear infinite;
        }


        /* BOTÃO COM LOADING */

        button.dih-loading-button {
            pointer-events: none;
            opacity: .75;
        }

        button.dih-loading-button::after {
            content: "";

            width: 15px;
            height: 15px;

            display: inline-block;

            margin-left: 8px;

            border: 2px solid rgba(255,255,255,.45);
            border-top-color: white;

            border-radius: 50%;

            vertical-align: -3px;

            animation: dihSpin .7s linear infinite;
        }


        /* CARD ENTRADA */

        .product-card.dih-enter {
            opacity: 0;
            transform: translateY(15px);
        }

        .product-card.dih-visible {
            opacity: 1;
            transform: translateY(0);

            transition:
                opacity .35s ease,
                transform .35s ease;
        }


        /* BOTÃO FAVORITO */

        .dih-favorite {
            position: absolute;

            top: 12px;
            right: 12px;

            width: 38px;
            height: 38px;

            border: 0;

            border-radius: 50%;

            background: rgba(255,255,255,.92);

            color: #8b5d7e;

            display: flex;
            align-items: center;
            justify-content: center;

            box-shadow: 0 6px 16px rgba(0,0,0,.08);

            transition: .2s ease;

            z-index: 4;
        }

        .dih-favorite:hover {
            transform: scale(1.08);
        }

        .dih-favorite.active {
            background: #8b5d7e;
            color: white;
        }

        .dih-favorite svg {
            width: 18px;
            height: 18px;
        }


        /* AÇÃO RÁPIDA */

        .dih-card-actions {
            display: grid;
            grid-template-columns: 1fr 42px;

            gap: 8px;

            margin-top: 10px;
        }

        .dih-cart-button {
            border: 0;

            border-radius: 11px;

            min-height: 42px;

            background: #8b5d7e;
            color: white;

            font-size: 12px;
            font-weight: 700;

            transition: .2s ease;
        }

        .dih-cart-button:hover {
            background: #68435e;
            transform: translateY(-2px);
        }

        .dih-cart-button:active {
            transform: scale(.97);
        }

        .dih-view-button {
            border: 1px solid #e9e1e5;

            border-radius: 11px;

            background: white;

            color: #68435e;

            display: flex;
            align-items: center;
            justify-content: center;

            transition: .2s ease;
        }

        .dih-view-button:hover {
            background: #f1e7ef;
        }


        /* SACOLA */

        .dih-qty {
            display: flex;
            align-items: center;
            gap: 7px;

            margin-top: 7px;
        }

        .dih-qty button {
            width: 27px;
            height: 27px;

            border: 1px solid #e9e1e5;

            border-radius: 8px;

            background: white;

            color: #68435e;

            font-weight: 700;
        }

        .dih-qty button:hover {
            background: #f1e7ef;
        }

        .dih-qty span {
            min-width: 20px;
            text-align: center;

            font-size: 13px;
            font-weight: 700;
        }


        /* ADMIN LIST */

        .dih-admin-item {
            display: grid;

            grid-template-columns: 70px 1fr auto;

            align-items: center;

            gap: 15px;

            padding: 13px;

            margin-bottom: 10px;

            background: white;

            border: 1px solid #e9e1e5;

            border-radius: 14px;

            transition: .2s ease;
        }

        .dih-admin-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(30,20,28,.07);
        }

        .dih-admin-image {
            width: 70px;
            height: 70px;

            object-fit: cover;

            border-radius: 10px;

            background: #f7f3f5;
        }

        .dih-admin-name {
            font-weight: 700;
            margin-bottom: 3px;
        }

        .dih-admin-meta {
            color: #777078;
            font-size: 12px;
        }

        .dih-admin-actions {
            display: flex;
            gap: 7px;
        }

        .dih-admin-actions button {
            width: 36px;
            height: 36px;

            border: 1px solid #e9e1e5;

            border-radius: 9px;

            background: white;

            display: flex;
            align-items: center;
            justify-content: center;
        }

        .dih-admin-actions button:hover {
            background: #f1e7ef;
        }

        .dih-admin-actions .delete:hover {
            color: #c95858;
            background: #fff0f0;
        }


        @keyframes dihSpin {
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes dihToastIn {
            from {
                opacity: 0;
                transform: translateX(30px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes dihToastOut {
            to {
                opacity: 0;
                transform: translateX(30px);
            }
        }


        @media(max-width:600px) {

            #dihToastContainer {
                left: 15px;
                right: 15px;
                bottom: 15px;
            }

            .dih-toast {
                min-width: 0;
                width: 100%;
            }

            .dih-admin-item {
                grid-template-columns: 55px 1fr;
            }

            .dih-admin-image {
                width: 55px;
                height: 55px;
            }

            .dih-admin-actions {
                grid-column: 1 / -1;
                justify-content: flex-end;
            }

        }
    `;

    document.head.appendChild(style);


    const toastContainer = document.createElement("div");

    toastContainer.id = "dihToastContainer";

    document.body.appendChild(toastContainer);
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(message, type = "success") {

    const container = document.getElementById("dihToastContainer");

    if (!container) return;

    const toast = document.createElement("div");

    toast.className = `dih-toast ${type}`;

    const icon = type === "success"
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="m5 12 4 4L19 6"/>
           </svg>`
        : type === "error"
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M12 8v5"/>
             <path d="M12 16h.01"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="9"/>
             <path d="M12 8v4l2 2"/>
           </svg>`;

    toast.innerHTML = `
        <div class="dih-toast-icon">${icon}</div>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("hide");

        setTimeout(() => toast.remove(), 250);

    }, 3200);
}


/* ============================================================
   SEGURANÇA HTML
   ============================================================ */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   CONEXÃO
   ============================================================ */

async function checkConnection() {

    const status = document.getElementById("connectionStatus");

    if (!status) return;

    status.textContent = "Verificando conexão...";

    try {

        const { error } = await supabaseClient
            .from("products")
            .select("id")
            .limit(1);

        if (error) throw error;

        status.textContent = "● Conectado ao sistema";
        status.style.color = "#4c946d";

    } catch (error) {

        console.error(error);

        status.textContent = "● Não foi possível conectar";
        status.style.color = "#c95858";
    }
}


/* ============================================================
   PRODUTOS
   ============================================================ */

async function loadProducts() {

    const grid = document.getElementById("productGrid");

    if (grid) {

        grid.innerHTML = `
            <div class="dih-loading" style="grid-column:1/-1">
                <div class="dih-spinner"></div>
                <span>Carregando coleção...</span>
            </div>
        `;
    }

    try {

        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        products = data || [];

        renderCategories();

        renderProducts();

        renderAdminProducts();

    } catch (error) {

        console.error(error);

        if (grid) {

            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <div class="empty-icon">!</div>
                    <h3>Não foi possível carregar</h3>
                    <p>Verifique sua conexão com o Supabase.</p>
                </div>
            `;
        }

        showToast("Erro ao carregar produtos.", "error");
    }
}


/* ============================================================
   CATEGORIAS
   ============================================================ */

function renderCategories() {

    const container = document.getElementById("categories");

    if (!container) return;

    const categories = [
        "Todos",
        ...new Set(
            products
                .map(p => p.category)
                .filter(Boolean)
        )
    ];

    container.innerHTML = categories.map(category => `

        <button
            class="${currentCategory === category ? "active" : ""}"
            onclick="filterCategory('${escapeAttribute(category)}')"
        >
            ${escapeHTML(category)}
        </button>

    `).join("");
}


function filterCategory(category) {

    currentCategory = category;

    renderCategories();

    renderProducts();

    document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* ============================================================
   PESQUISA
   ============================================================ */

function setupSearch() {

    const input = document.getElementById("searchInput");

    if (!input) return;

    input.addEventListener("input", () => {

        renderProducts();

    });
}


function toggleSearch() {

    const bar = document.getElementById("searchBar");

    if (!bar) return;

    bar.classList.toggle("hidden");

    if (!bar.classList.contains("hidden")) {

        setTimeout(() => {

            document.getElementById("searchInput")?.focus();

        }, 100);
    }
}


/* ============================================================
   RENDER PRODUTOS
   ============================================================ */

function renderProducts() {

    const grid = document.getElementById("productGrid");
    const empty = document.getElementById("emptyState");
    const count = document.getElementById("productCount");

    if (!grid) return;

    const search =
        document.getElementById("searchInput")?.value
            ?.trim()
            .toLowerCase() || "";

    let filtered = products.filter(product => {

        const categoryOK =
            currentCategory === "Todos" ||
            product.category === currentCategory;

        const text = `
            ${product.name}
            ${product.code || ""}
            ${product.category || ""}
            ${product.description || ""}
        `.toLowerCase();

        const searchOK =
            !search || text.includes(search);

        return categoryOK && searchOK;
    });


    if (count) {

        count.textContent =
            `${filtered.length} ${
                filtered.length === 1 ? "produto" : "produtos"
            }`;
    }


    if (!filtered.length) {

        grid.innerHTML = "";

        empty?.classList.remove("hidden");

        return;
    }

    empty?.classList.add("hidden");


    grid.innerHTML = filtered.map((product, index) => {

        const image =
            Array.isArray(product.images) &&
            product.images.length
                ? product.images[0]
                : "https://placehold.co/700x700/f7f3f5/8b5d7e?text=Dih+Signature";


        const favorite =
            getFavorites().includes(String(product.id));


        return `

            <article
                class="product-card dih-enter"
                data-id="${product.id}"
                style="transition-delay:${Math.min(index * 40, 300)}ms"
            >

                <div class="product-image">

                    <img
                        src="${escapeAttribute(image)}"
                        alt="${escapeAttribute(product.name)}"
                        loading="lazy"
                        onerror="this.src='https://placehold.co/700x700/f7f3f5/8b5d7e?text=Dih+Signature'"
                    >

                    <button
                        class="dih-favorite ${favorite ? "active" : ""}"
                        onclick="toggleFavorite('${product.id}', event)"
                        aria-label="Favoritar"
                    >
                        ${heartIcon()}
                    </button>

                </div>

                <div class="product-info">

                    <div class="product-category">
                        ${escapeHTML(product.category || "Semijoia")}
                    </div>

                    <h3>
                        ${escapeHTML(product.name)}
                    </h3>

                    <div class="product-price">
                        ${formatBRL(product.price)}
                    </div>

                    <div class="dih-card-actions">

                        <button
                            class="dih-cart-button"
                            onclick="addToBag('${product.id}')"
                        >
                            Adicionar à sacola
                        </button>

                        <button
                            class="dih-view-button"
                            onclick="openProduct('${product.id}')"
                            aria-label="Ver produto"
                        >
                            ${eyeIcon()}
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");


    requestAnimationFrame(() => {

        document
            .querySelectorAll(".product-card.dih-enter")
            .forEach(card => {

                card.classList.add("dih-visible");

            });
    });
}


/* ============================================================
   ÍCONES
   ============================================================ */

function heartIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M20.8 8.7c0 5.4-8.8 10.2-8.8 10.2S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z"/>
        </svg>
    `;
}


function eyeIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="18"
            height="18"
        >
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
            <circle cx="12" cy="12" r="2.5"/>
        </svg>
    `;
}


/* ============================================================
   FAVORITOS
   ============================================================ */

function getFavorites() {

    return JSON.parse(
        localStorage.getItem("dih_signature_favorites") || "[]"
    );
}


function toggleFavorite(id, event) {

    event?.stopPropagation();

    let favorites = getFavorites();

    id = String(id);

    if (favorites.includes(id)) {

        favorites = favorites.filter(item => item !== id);

        showToast("Removido dos favoritos.", "info");

    } else {

        favorites.push(id);

        showToast("Adicionado aos favoritos.", "success");
    }

    localStorage.setItem(
        "dih_signature_favorites",
        JSON.stringify(favorites)
    );

    renderProducts();
}


/* ============================================================
   PRODUTO / MODAL
   ============================================================ */

function openProduct(id) {

    const product = products.find(
        p => String(p.id) === String(id)
    );

    if (!product) return;

    const modal = document.getElementById("productModal");

    if (!modal) return;

    const images =
        Array.isArray(product.images) &&
        product.images.length
            ? product.images
            : [
                "https://placehold.co/800x800/f7f3f5/8b5d7e?text=Dih+Signature"
            ];


    const gallery = document.getElementById("modalGallery");

    const info = document.getElementById("modalInfo");


    if (gallery) {

        gallery.innerHTML = `

            <div style="
                padding:25px;
                display:grid;
                grid-template-columns:
                    repeat(auto-fit,minmax(250px,1fr));
                gap:12px;
            ">

                ${images.map(img => `

                    <img
                        src="${escapeAttribute(img)}"
                        alt="${escapeAttribute(product.name)}"
                        style="
                            width:100%;
                            aspect-ratio:1;
                            object-fit:cover;
                            border-radius:16px;
                            background:#f7f3f5;
                        "
                    >

                `).join("")}

            </div>

        `;
    }


    if (info) {

        info.innerHTML = `

            <div style="padding:0 28px 30px">

                <div class="eyebrow">
                    ${escapeHTML(product.category || "SEMIJOIA")}
                </div>

                <h2 style="
                    font-family:'Playfair Display',serif;
                    font-size:34px;
                    margin-bottom:10px;
                ">
                    ${escapeHTML(product.name)}
                </h2>

                <div style="
                    color:#68435e;
                    font-size:23px;
                    font-weight:700;
                    margin-bottom:15px;
                ">
                    ${formatBRL(product.price)}
                </div>

                <p style="
                    color:#777078;
                    margin-bottom:20px;
                ">
                    ${escapeHTML(
                        product.description ||
                        "Uma peça especial da coleção Dih Signature."
                    )}
                </p>

                <button
                    class="primary-button"
                    style="width:100%"
                    onclick="addToBag('${product.id}'); closeProductModal();"
                >
                    Adicionar à sacola
                </button>

            </div>

        `;
    }


    modal.classList.remove("hidden");

    document.body.style.overflow = "hidden";
}


function closeProductModal() {

    document
        .getElementById("productModal")
        ?.classList.add("hidden");

    restoreBodyScroll();
}


/* ============================================================
   SACOLA
   ============================================================ */

function saveBag() {

    localStorage.setItem(
        BAG_KEY,
        JSON.stringify(bag)
    );
}


function addToBag(id) {

    const product = products.find(
        p => String(p.id) === String(id)
    );

    if (!product) return;

    const existing = bag.find(
        item => String(item.id) === String(id)
    );

    if (existing) {

        existing.quantity += 1;

    } else {

        bag.push({
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            quantity: 1,
            image:
                Array.isArray(product.images) &&
                product.images.length
                    ? product.images[0]
                    : ""
        });
    }


    saveBag();

    updateBagCount();

    showToast(
        `${product.name} foi adicionada à sacola.`,
        "success"
    );

    animateBagButton();
}


function removeFromBag(id) {

    bag = bag.filter(
        item => String(item.id) !== String(id)
    );

    saveBag();

    updateBagCount();

    renderBag();

    showToast("Produto removido da sacola.", "info");
}


function changeBagQuantity(id, change) {

    const item = bag.find(
        item => String(item.id) === String(id)
    );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {

        removeFromBag(id);

        return;
    }

    saveBag();

    updateBagCount();

    renderBag();
}


function updateBagCount() {

    const count = bag.reduce(
        (total, item) =>
            total + Number(item.quantity || 0),
        0
    );

    const element =
        document.getElementById("bagCount");

    if (!element) return;

    element.textContent = count;

    element.animate(
        [
            { transform: "scale(1)" },
            { transform: "scale(1.35)" },
            { transform: "scale(1)" }
        ],
        {
            duration: 300
        }
    );
}


function animateBagButton() {

    const button =
        document.querySelector(
            '.top-actions button[onclick*="openBag"]'
        );

    if (!button) return;

    button.animate(
        [
            { transform: "scale(1)" },
            { transform: "scale(1.12)" },
            { transform: "scale(1)" }
        ],
        {
            duration: 350
        }
    );
}


function openBag() {

    renderBag();

    document
        .getElementById("bagModal")
        ?.classList.remove("hidden");

    document.body.style.overflow = "hidden";
}


function closeBag() {

    document
        .getElementById("bagModal")
        ?.classList.add("hidden");

    restoreBodyScroll();
}


function renderBag() {

    const container =
        document.getElementById("bagItems");

    const totalElement =
        document.getElementById("bagTotal");

    if (!container) return;


    if (!bag.length) {

        container.innerHTML = `

            <div style="
                text-align:center;
                padding:45px 15px;
                color:#777078;
            ">

                <div style="
                    font-size:42px;
                    color:#8b5d7e;
                    margin-bottom:10px;
                ">
                    ♡
                </div>

                <h3 style="
                    font-family:'Playfair Display',serif;
                    color:#2b2529;
                    margin-bottom:5px;
                ">
                    Sua sacola está vazia
                </h3>

                <p>
                    Escolha uma peça especial para começar.
                </p>

            </div>
        `;

        if (totalElement) {
            totalElement.textContent = "R$ 0,00";
        }

        return;
    }


    container.innerHTML = bag.map(item => `

        <div class="bag-item">

            <img
                src="${escapeAttribute(
                    item.image ||
                    "https://placehold.co/100x100/f7f3f5/8b5d7e?text=Dih"
                )}"
                alt="${escapeAttribute(item.name)}"
            >

            <div>

                <h4>
                    ${escapeHTML(item.name)}
                </h4>

                <p>
                    ${formatBRL(item.price)}
                </p>

                <div class="dih-qty">

                    <button
                        onclick="changeBagQuantity('${item.id}', -1)"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        onclick="changeBagQuantity('${item.id}', 1)"
                    >
                        +
                    </button>

                </div>

            </div>

            <button
                class="close-button"
                style="
                    position:static;
                    width:34px;
                    height:34px;
                "
                onclick="removeFromBag('${item.id}')"
                aria-label="Remover"
            >
                ×
            </button>

        </div>

    `).join("");


    const total = bag.reduce(
        (sum, item) =>
            sum +
            Number(item.price || 0) *
            Number(item.quantity || 0),
        0
    );

    if (totalElement) {

        totalElement.textContent =
            formatBRL(total);
    }
}


/* ============================================================
   WHATSAPP
   ============================================================ */

function checkoutWhatsApp() {

    if (!bag.length) {

        showToast(
            "Adicione pelo menos um produto à sacola.",
            "info"
        );

        return;
    }


    /*
      TROQUE PELO SEU NÚMERO DO WHATSAPP.

      Exemplo:
      5516999999999
    */

    const whatsapp = "5516999999999";


    const lines = bag.map(item => {

        const subtotal =
            Number(item.price || 0) *
            Number(item.quantity || 0);

        return `• ${item.name} x${item.quantity} — ${formatBRL(subtotal)}`;

    });


    const total = bag.reduce(
        (sum, item) =>
            sum +
            Number(item.price || 0) *
            Number(item.quantity || 0),
        0
    );


    const message = `
Olá! Gostaria de fazer um pedido na Dih Signature.

${lines.join("\n")}

Total: ${formatBRL(total)}

Gostaria de confirmar a disponibilidade dos produtos.
    `.trim();


    const url =
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
}


/* ============================================================
   LOGIN ADMIN
   ============================================================ */

function openAdmin() {

    if (currentSession) {

        document
            .getElementById("adminModal")
            ?.classList.remove("hidden");

        document.body.style.overflow = "hidden";

        renderAdminProducts();

        return;
    }

    document
        .getElementById("loginModal")
        ?.classList.remove("hidden");

    document.body.style.overflow = "hidden";

    setTimeout(() => {

        document.getElementById("loginUser")?.focus();

    }, 150);
}


function closeAdmin() {

    document
        .getElementById("loginModal")
        ?.classList.add("hidden");

    document
        .getElementById("adminModal")
        ?.classList.add("hidden");

    restoreBodyScroll();
}


async function loginAdmin(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginUser")?.value.trim();

    const password =
        document.getElementById("loginPass")?.value;

    const errorBox =
        document.getElementById("loginError");

    const button =
        event.target.querySelector('button[type="submit"]');


    if (errorBox) {
        errorBox.textContent = "";
    }


    if (!email || !password) {

        if (errorBox) {
            errorBox.textContent =
                "Informe e-mail e senha.";
        }

        return;
    }


    setButtonLoading(button, true, "Entrando");


    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) throw error;

        currentSession = data.session;

        closeAdmin();

        document
            .getElementById("adminModal")
            ?.classList.remove("hidden");

        document.body.style.overflow = "hidden";

        showToast(
            "Login realizado com sucesso.",
            "success"
        );

        await renderAdminProducts();

    } catch (error) {

        console.error(error);

        if (errorBox) {

            errorBox.textContent =
                "E-mail ou senha incorretos.";
        }

        showToast(
            "Não foi possível entrar.",
            "error"
        );

    } finally {

        setButtonLoading(button, false, "Entrar");
    }
}


async function logoutAdmin() {

    await supabaseClient.auth.signOut();

    currentSession = null;

    closeAdmin();

    showToast(
        "Você saiu do painel administrativo.",
        "info"
    );
}


function listenAuth() {

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            currentSession = session;

        }
    );
}


/* ============================================================
   ADMIN TABS
   ============================================================ */

function showAdminTab(tab, button) {

    const sections = {
        products: document.getElementById("adminProducts"),
        form: document.getElementById("productForm"),
        bulk: document.getElementById("bulkImport")
    };


    Object.values(sections).forEach(section => {

        section?.classList.add("hidden");

    });


    sections[tab]?.classList.remove("hidden");


    document
        .querySelectorAll(".tab-button")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");

    } else {

        const matching =
            [...document.querySelectorAll(".tab-button")]
                .find(btn =>
                    btn.textContent
                        .trim()
                        .toLowerCase()
                        .includes(tab === "products"
                            ? "produto"
                            : tab === "form"
                                ? "novo"
                                : "importar")
                );

        matching?.classList.add("active");
    }


    if (tab === "products") {

        renderAdminProducts();

    }
}


/* ============================================================
   ADMIN — LISTA
   ============================================================ */

async function renderAdminProducts() {

    const container =
        document.getElementById("adminProductsList");

    if (!container) return;


    if (!products.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum produto cadastrado</h3>
                <p>Comece adicionando sua primeira semijoia.</p>
            </div>
        `;

        return;
    }


    container.innerHTML = products.map(product => {

        const image =
            Array.isArray(product.images) &&
            product.images.length
                ? product.images[0]
                : "https://placehold.co/100x100/f7f3f5/8b5d7e?text=Dih";


        return `

            <div class="dih-admin-item">

                <img
                    class="dih-admin-image"
                    src="${escapeAttribute(image)}"
                    alt=""
                >

                <div>

                    <div class="dih-admin-name">
                        ${escapeHTML(product.name)}
                    </div>

                    <div class="dih-admin-meta">
                        ${escapeHTML(product.category || "Outros")}
                        ·
                        ${formatBRL(product.price)}
                        ·
                        Estoque: ${Number(product.stock || 0)}
                    </div>

                </div>

                <div class="dih-admin-actions">

                    <button
                        onclick="editProduct('${product.id}')"
                        title="Editar"
                    >
                        ${editIcon()}
                    </button>

                    <button
                        class="delete"
                        onclick="deleteProduct('${product.id}')"
                        title="Excluir"
                    >
                        ${trashIcon()}
                    </button>

                </div>

            </div>

        `;

    }).join("");
}


function editIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            width="17"
            height="17"
        >
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>
        </svg>
    `;
}


function trashIcon() {

    return `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            width="17"
            height="17"
        >
            <path d="M4 7h16"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M6 7l1 14h10l1-14"/>
            <path d="M9 7V4h6v3"/>
        </svg>
    `;
}


/* ============================================================
   NOVO PRODUTO
   ============================================================ */

function newProduct() {

    editingProductId = null;

    clearProductForm();

    document.getElementById("formTitle").textContent =
        "Novo produto";

    showAdminTab("form");

}


function clearProductForm() {

    [
        "editId",
        "pCode",
        "pName",
        "pDescription"
    ].forEach(id => {

        const el = document.getElementById(id);

        if (el) el.value = "";

    });


    const price =
        document.getElementById("pPrice");

    if (price) price.value = "";


    const stock =
        document.getElementById("pStock");

    if (stock) stock.value = "0";


    const photos =
        document.getElementById("pPhotos");

    if (photos) photos.value = "";


    const preview =
        document.getElementById("photoPreview");

    if (preview) preview.innerHTML = "";
}


/* ============================================================
   EDITAR PRODUTO
   ============================================================ */

function editProduct(id) {

    const product = products.find(
        p => String(p.id) === String(id)
    );

    if (!product) return;


    editingProductId = product.id;


    document.getElementById("editId").value =
        product.id;

    document.getElementById("pCode").value =
        product.code || "";

    document.getElementById("pName").value =
        product.name || "";

    document.getElementById("pCategory").value =
        product.category || "Outros";

    document.getElementById("pPrice").value =
        product.price || 0;

    document.getElementById("pStock").value =
        product.stock || 0;

    document.getElementById("pDescription").value =
        product.description || "";


    document.getElementById("formTitle").textContent =
        "Editar produto";


    const preview =
        document.getElementById("photoPreview");


    if (preview) {

        preview.innerHTML =
            (product.images || []).map(img => `

                <img
                    src="${escapeAttribute(img)}"
                    alt=""
                >

            `).join("");
    }


    showAdminTab("form");

}


/* ============================================================
   SALVAR PRODUTO
   ============================================================ */

async function saveProduct(event) {

    event.preventDefault();

    if (isSaving) return;

    isSaving = true;


    const button =
        event.target.querySelector(
            'button[type="submit"]'
        );


    setButtonLoading(
        button,
        true,
        "Salvando"
    );


    try {

        const id =
            document.getElementById("editId").value || null;

        const code =
            document.getElementById("pCode").value.trim() || null;

        const name =
            document.getElementById("pName").value.trim();

        const category =
            document.getElementById("pCategory").value;

        const price =
            parseNumberBR(
                document.getElementById("pPrice").value
            );

        const stock =
            Number(
                document.getElementById("pStock").value || 0
            );

        const description =
            document.getElementById("pDescription").value.trim();


        if (!name) {

            showToast(
                "Informe o nome do produto.",
                "error"
            );

            return;
        }


        let existingImages = [];


        if (id) {

            const existing =
                products.find(
                    p => String(p.id) === String(id)
                );

            existingImages =
                existing?.images || [];
        }


        const files =
            document.getElementById("pPhotos")?.files;


        let uploadedImages =
            existingImages.slice();


        if (files?.length) {

            const uploaded =
                await uploadImages(files);

            uploadedImages =
                uploadedImages.concat(uploaded);
        }


        const payload = {

            code,
            name,
            category,
            price,
            stock,
            description,
            images: uploadedImages
        };


        let result;


        if (id) {

            result =
                await supabaseClient
                    .from("products")
                    .update(payload)
                    .eq("id", id)
                    .select()
                    .single();

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert(payload)
                    .select()
                    .single();
        }


        if (result.error) {

            if (
                result.error.code === "23505"
            ) {

                throw new Error(
                    "Esse código de produto já existe."
                );
            }

            throw result.error;
        }


        showToast(
            id
                ? "Produto atualizado com sucesso!"
                : "Produto cadastrado com sucesso!",
            "success"
        );


        clearProductForm();


        await loadProducts();


        showAdminTab("products");


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Não foi possível salvar o produto.",
            "error"
        );

    } finally {

        isSaving = false;

        setButtonLoading(
            button,
            false,
            "Salvar produto"
        );
    }
}


/* ============================================================
   UPLOAD FOTOS
   ============================================================ */

async function uploadImages(files) {

    const urls = [];

    for (const file of files) {

        const extension =
            file.name.split(".").pop();

        const filename =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.${extension}`;

        const path =
            `products/${filename}`;


        const { error } =
            await supabaseClient
                .storage
                .from("product-images")
                .upload(path, file, {
                    cacheControl: "3600",
                    upsert: false
                });


        if (error) throw error;


        const { data } =
            supabaseClient
                .storage
                .from("product-images")
                .getPublicUrl(path);


        urls.push(data.publicUrl);
    }


    return urls;
}


/* ============================================================
   PREVIEW FOTOS
   ============================================================ */

function previewPhotos(event) {

    const files =
        event.target.files;

    const preview =
        document.getElementById("photoPreview");

    if (!preview) return;


    preview.innerHTML = "";


    [...files].forEach(file => {

        const reader =
            new FileReader();


        reader.onload = event => {

            const img =
                document.createElement("img");

            img.src =
                event.target.result;

            preview.appendChild(img);
        };


        reader.readAsDataURL(file);

    });
}


/* ============================================================
   EXCLUIR
   ============================================================ */

async function deleteProduct(id) {

    const product =
        products.find(
            p => String(p.id) === String(id)
        );

    if (!product) return;


    const confirmed =
        confirm(
            `Excluir "${product.name}"?\n\nEssa ação não poderá ser desfeita.`
        );


    if (!confirmed) return;


    try {

        const { error } =
            await supabaseClient
                .from("products")
                .delete()
                .eq("id", id);


        if (error) throw error;


        showToast(
            "Produto excluído.",
            "success"
        );


        await loadProducts();

    } catch (error) {

        console.error(error);

        showToast(
            "Não foi possível excluir o produto.",
            "error"
        );
    }
}


/* ============================================================
   EXCEL
   ============================================================ */

function parseNumberBR(value) {

    if (typeof value === "number") {

        return value;
    }


    const text =
        String(value ?? "").trim();


    if (!text) return 0;


    if (text.includes(",")) {

        return Number(
            text
                .replace(/\./g, "")
                .replace(",", ".")
        ) || 0;
    }


    return Number(text) || 0;
}


function downloadExcelTemplate() {

    if (typeof XLSX === "undefined") {

        showToast(
            "Biblioteca Excel não carregada.",
            "error"
        );

        return;
    }


    const rows = [

        {
            Código: "BR001",
            Nome: "Brinco Exemplo",
            Categoria: "Brincos",
            Preço: 99.90,
            Estoque: 10,
            Descrição: "Descrição do produto"
        }

    ];


    const worksheet =
        XLSX.utils.json_to_sheet(rows);

    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Produtos"
    );


    XLSX.writeFile(
        workbook,
        "modelo-dih-signature.xlsx"
    );


    showToast(
        "Modelo Excel baixado.",
        "success"
    );
}


async function importExcel(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;


    if (typeof XLSX === "undefined") {

        showToast(
            "Biblioteca Excel não carregada.",
            "error"
        );

        return;
    }


    try {

        const buffer =
            await file.arrayBuffer();

        const workbook =
            XLSX.read(buffer, {
                type: "array"
            });


        const sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];


        const rows =
            XLSX.utils.sheet_to_json(sheet);


        if (!rows.length) {

            showToast(
                "A planilha está vazia.",
                "error"
            );

            return;
        }


        const data =
            rows.map(row => ({

                code:
                    row["Código"] ||
                    row["Codigo"] ||
                    null,

                name:
                    row["Nome"] ||
                    row["Nome do produto"] ||
                    "",

                category:
                    row["Categoria"] ||
                    "Outros",

                price:
                    parseNumberBR(
                        row["Preço"] ??
                        row["Preco"] ??
                        0
                    ),

                stock:
                    Number(
                        row["Estoque"] || 0
                    ),

                description:
                    row["Descrição"] ||
                    row["Descricao"] ||
                    "",

                images: []
            }));


        const valid =
            data.filter(item => item.name);


        if (!valid.length) {

            showToast(
                "Nenhum produto válido encontrado.",
                "error"
            );

            return;
        }


        const { error } =
            await supabaseClient
                .from("products")
                .upsert(
                    valid,
                    {
                        onConflict: "code"
                    }
                );


        if (error) throw error;


        showToast(
            `${valid.length} produto(s) importado(s).`,
            "success"
        );


        await loadProducts();


    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao importar Excel.",
            "error"
        );
    }
}


/* ============================================================
   EXPORTAR PRODUTOS
   ============================================================ */

function exportProducts() {

    if (!products.length) {

        showToast(
            "Não existem produtos para exportar.",
            "info"
        );

        return;
    }


    const data =
        products.map(product => ({

            Código: product.code || "",

            Nome: product.name,

            Categoria:
                product.category || "",

            Preço:
                Number(product.price || 0),

            Estoque:
                Number(product.stock || 0),

            Descrição:
                product.description || "",

            Fotos:
                Array.isArray(product.images)
                    ? product.images.join(" | ")
                    : ""
        }));


    if (typeof XLSX === "undefined") {

        showToast(
            "Biblioteca Excel não carregada.",
            "error"
        );

        return;
    }


    const worksheet =
        XLSX.utils.json_to_sheet(data);

    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Produtos"
    );


    XLSX.writeFile(
        workbook,
        "dih-signature-produtos.xlsx"
    );


    showToast(
        "Produtos exportados com sucesso.",
        "success"
    );
}


/* ============================================================
   IMPORTAÇÃO DE FOTOS EM MASSA
   ============================================================ */

async function importBulkPhotos(event) {

    const files =
        event.target.files;

    if (!files?.length) return;


    try {

        const urls =
            await uploadImages(files);


        const status =
            document.getElementById("bulkPhotoStatus");


        if (status) {

            status.innerHTML = `
                <p style="color:#4c946d;margin-top:10px">
                    ${urls.length} foto(s) enviada(s) com sucesso.
                </p>
            `;
        }


        showToast(
            `${urls.length} foto(s) enviada(s).`,
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao enviar fotos.",
            "error"
        );
    }
}


/* ============================================================
   JSON BACKUP
   ============================================================ */

function importProducts(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;


    const reader =
        new FileReader();


    reader.onload = async e => {

        try {

            const data =
                JSON.parse(e.target.result);


            if (!Array.isArray(data)) {

                throw new Error(
                    "Formato inválido."
                );
            }


            const productsToImport =
                data.map(product => ({

                    code:
                        product.code || null,

                    name:
                        product.name || "",

                    category:
                        product.category || "Outros",

                    price:
                        Number(product.price || 0),

                    stock:
                        Number(product.stock || 0),

                    description:
                        product.description || "",

                    images:
                        Array.isArray(product.images)
                            ? product.images
                            : []
                }))
                .filter(p => p.name);


            const { error } =
                await supabaseClient
                    .from("products")
                    .upsert(
                        productsToImport,
                        {
                            onConflict: "code"
                        }
                    );


            if (error) throw error;


            showToast(
                "Backup restaurado com sucesso.",
                "success"
            );


            await loadProducts();


        } catch (error) {

            console.error(error);

            showToast(
                "Não foi possível importar o backup.",
                "error"
            );
        }

    };


    reader.readAsText(file);
}


/* ============================================================
   UTILIDADES
   ============================================================ */

function formatBRL(value) {

    return Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) return;


    if (loading) {

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            text;

        button.classList.add(
            "dih-loading-button"
        );

        button.disabled = true;

    } else {

        button.textContent =
            button.dataset.originalText ||
            text;

        button.classList.remove(
            "dih-loading-button"
        );

        button.disabled = false;
    }
}


/* ============================================================
   TECLADO
   ============================================================ */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") return;


            closeProductModal();

            closeBag();

            closeAdmin();

        }
    );
}


/* ============================================================
   BODY SCROLL
   ============================================================ */

function restoreBodyScroll() {

    const openModal =
        document.querySelector(
            ".modal:not(.hidden)"
        );

    if (!openModal) {

        document.body.style.overflow = "";
    }
}


/* ============================================================
   CLIQUE NO FUNDO DOS MODAIS
   ============================================================ */

document.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {

            closeProductModal();

            closeBag();

            closeAdmin();
        }

    }
);


/* ============================================================
   STORE
   ============================================================ */

function showStore() {

    closeAdmin();

    closeBag();

    closeProductModal();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ============================================================
   ANIMAÇÃO INICIAL
   ============================================================ */

function animatePage() {

    const hero =
        document.querySelector(".hero-content");

    if (!hero) return;


    hero.animate(
        [
            {
                opacity: 0,
                transform: "translateY(20px)"
            },
            {
                opacity: 1,
                transform: "translateY(0)"
            }
        ],
        {
            duration: 700,
            easing: "cubic-bezier(.2,.8,.2,1)"
        }
    );
}


/* ============================================================
   EXPORTAR FUNÇÕES PARA O HTML
   ============================================================ */

window.showStore = showStore;

window.toggleSearch = toggleSearch;

window.openBag = openBag;
window.closeBag = closeBag;

window.openAdmin = openAdmin;
window.closeAdmin = closeAdmin;

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;

window.renderProducts = renderProducts;

window.filterCategory = filterCategory;

window.openProduct = openProduct;
window.closeProductModal = closeProductModal;

window.addToBag = addToBag;
window.removeFromBag = removeFromBag;
window.changeBagQuantity = changeBagQuantity;

window.checkoutWhatsApp = checkoutWhatsApp;

window.toggleFavorite = toggleFavorite;

window.showAdminTab = showAdminTab;

window.renderAdminProducts = renderAdminProducts;

window.newProduct = newProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

window.saveProduct = saveProduct;

window.previewPhotos = previewPhotos;

window.downloadExcelTemplate = downloadExcelTemplate;
window.importExcel = importExcel;
window.importBulkPhotos = importBulkPhotos;
window.importProducts = importProducts;

window.exportProducts = exportProducts;