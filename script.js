/* =========================================================
   DIH SIGNATURE
   JAVASCRIPT PRINCIPAL
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://hpvfinfjlhyvhhdgimkk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_eLw1BxG3uJDwvZKmAgzX8g_89zjt6nq";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const WHATSAPP_NUMBER = "5516996236518";

const BAG_KEY =
    "dih_signature_bag_v2";


/* =========================================================
   ESTADO
========================================================= */

let products = [];

let bag =
    JSON.parse(
        localStorage.getItem(BAG_KEY) || "[]"
    );

let activeCategory = "Todos";

let selectedProduct = null;

let currentPhotos = [];

let currentPhotoPaths = [];


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function money(value) {

    return Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function escapeHtml(value = "") {

    return String(value).replace(
        /[&<>"']/g,
        function (char) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];

        }
    );

}


function placeholder(name) {

    return "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="450"
                height="800"
            >

                <rect
                    width="100%"
                    height="100%"
                    fill="#eee7e9"
                />

                <text
                    x="50%"
                    y="48%"
                    text-anchor="middle"
                    font-family="Georgia"
                    font-size="25"
                    fill="#76548f"
                >
                    ${name}
                </text>

                <text
                    x="50%"
                    y="54%"
                    text-anchor="middle"
                    font-family="Arial"
                    font-size="11"
                    fill="#8b828b"
                >
                    ADICIONE A FOTO
                </text>

            </svg>
        `);

}


function imgOf(product) {

    if (
        product &&
        product.photos &&
        product.photos.length
    ) {

        return product.photos[0].url;

    }

    return placeholder(
        product?.nome ||
        product?.name ||
        "Produto"
    );

}


function storagePathFromUrl(url = "") {

    const marker =
        "/storage/v1/object/public/produtos/";

    const index =
        String(url).indexOf(marker);

    if (index < 0) {
        return "";
    }

    try {

        return decodeURIComponent(
            String(url).slice(
                index + marker.length
            )
        );

    } catch {

        return String(url).slice(
            index + marker.length
        );

    }

}


/* =========================================================
   SACOLA
========================================================= */

function saveBag() {

    localStorage.setItem(
        BAG_KEY,
        JSON.stringify(bag)
    );

    updateBagCount();

}


function updateBagCount() {

    const element =
        document.getElementById("bagCount");

    if (!element) {
        return;
    }

    element.textContent =
        bag.reduce(
            (total, item) =>
                total + Number(item.qty || 0),
            0
        );

}


/* =========================================================
   PRODUTOS
========================================================= */

async function loadProducts() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("produtos")
            .select("*,fotos_produtos(*)")
            .eq("ativo", true)
            .order(
                "criado_em",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                "Erro ao carregar produtos:",
                error
            );

            alert(
                "Não consegui carregar os produtos do banco. " +
                "Verifique as tabelas e permissões do Supabase."
            );

            return;

        }


        products =
            (data || []).map(
                product => ({

                    ...product,

                    photos:
                        (
                            product.fotos_produtos ||
                            []
                        ).sort(
                            (a, b) =>
                                Number(a.ordem || 0) -
                                Number(b.ordem || 0)
                        )

                })
            );


        renderProducts();

        renderAdmin();

    } catch (error) {

        console.error(
            "Erro inesperado:",
            error
        );

    }

}


/* =========================================================
   CATEGORIAS
========================================================= */

function renderCategories() {

    const categories = [
        "Todos",
        "Brincos",
        "Colares",
        "Pulseiras",
        "Anéis",
        "Conjuntos",
        "Outros"
    ];


    const container =
        document.getElementById(
            "categories"
        );

    if (!container) {
        return;
    }


    container.innerHTML =
        categories
            .map(
                category => `
                    <button
                        type="button"
                        class="${
                            activeCategory === category
                                ? "active"
                                : ""
                        }"
                        onclick="setCategory('${category}')"
                    >
                        ${category}
                    </button>
                `
            )
            .join("");

}


function setCategory(category) {

    activeCategory =
        category;

    renderProducts();

}


/* =========================================================
   RENDER PRODUTOS
========================================================= */

function renderProducts() {

    const grid =
        document.getElementById(
            "productGrid"
        );

    const count =
        document.getElementById(
            "productCount"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (!grid) {
        return;
    }


    renderCategories();


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const query =
        (
            searchInput?.value ||
            ""
        )
        .toLowerCase()
        .trim();


    const filtered =
        products.filter(
            product => {

                const categoryOK =
                    activeCategory === "Todos" ||
                    product.categoria ===
                        activeCategory;


                const searchText =
                    `${product.nome || ""} ${
                        product.categoria || ""
                    }`.toLowerCase();


                const searchOK =
                    !query ||
                    searchText.includes(
                        query
                    );


                return (
                    categoryOK &&
                    searchOK
                );

            }
        );


    if (count) {

        count.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "peça"
                    : "peças"
            }`;

    }


    grid.innerHTML =
        filtered
            .map(
                product => `

                    <article
                        class="product-card"
                        onclick="openProduct('${product.id}')"
                    >

                        <div class="product-image">

                            <img
                                src="${imgOf(product)}"
                                alt="${escapeHtml(product.nome)}"
                            >

                            ${
                                product.photos.length > 1
                                    ? `
                                        <span class="photo-badge">
                                            +${
                                                product.photos.length - 1
                                            } fotos
                                        </span>
                                    `
                                    : ""
                            }

                        </div>


                        <div class="product-info">

                            <h3>
                                ${escapeHtml(
                                    product.nome
                                )}
                            </h3>

                            <p class="product-category">
                                ${escapeHtml(
                                    product.categoria
                                )}
                            </p>

                            <div class="product-price">
                                ${money(
                                    product.preco
                                )}
                            </div>

                            <button
                                type="button"
                                class="primary-button"
                                onclick="event.stopPropagation(); openProduct('${product.id}')"
                            >
                                Ver produto
                            </button>

                        </div>

                    </article>

                `
            )
            .join("");


    if (empty) {

        empty.classList.toggle(
            "hidden",
            filtered.length > 0
        );

    }

}


/* =========================================================
   PESQUISA
========================================================= */

function toggleSearch() {

    const bar =
        document.getElementById(
            "searchBar"
        );

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!bar) {
        return;
    }


    bar.classList.toggle(
        "hidden"
    );


    if (
        !bar.classList.contains(
            "hidden"
        )
    ) {

        setTimeout(
            () => input?.focus(),
            50
        );

    }

}


/* =========================================================
   VOLTAR PARA LOJA
========================================================= */

function showStore() {

    closeAdmin();

    closeLogin();

    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================================
   PRODUTO
========================================================= */

function openProduct(id) {

    selectedProduct =
        products.find(
            product =>
                product.id === id
        );


    if (!selectedProduct) {
        return;
    }


    const modal =
        document.getElementById(
            "productModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    renderGallery(0);


    const stock =
        Number(
            selectedProduct.estoque || 0
        );


    document.getElementById(
        "modalInfo"
    ).innerHTML = `

        <p class="eyebrow">
            ${escapeHtml(
                selectedProduct.categoria
            )}
        </p>

        <h2>
            ${escapeHtml(
                selectedProduct.nome
            )}
        </h2>

        <div class="modal-price">
            ${money(
                selectedProduct.preco
            )}
        </div>

        <p class="description">
            ${escapeHtml(
                selectedProduct.descricao ||
                "Uma semijoia escolhida para você."
            )}
        </p>

        <p class="stock">

            ${
                stock > 0
                    ? `Disponível · ${stock} em estoque`
                    : "Produto esgotado"
            }

        </p>

        <button
            type="button"
            class="primary-button"
            ${
                stock < 1
                    ? "disabled"
                    : ""
            }
            onclick="addToBag('${selectedProduct.id}')"
        >
            Adicionar à sacola
        </button>

    `;

}


function renderGallery(index) {

    if (!selectedProduct) {
        return;
    }


    const photos =
        selectedProduct.photos?.length
            ? selectedProduct.photos
            : [
                {
                    url:
                        placeholder(
                            selectedProduct.nome
                        )
                }
            ];


    if (
        index < 0 ||
        index >= photos.length
    ) {
        index = 0;
    }


    const gallery =
        document.getElementById(
            "modalGallery"
        );


    if (!gallery) {
        return;
    }


    gallery.innerHTML = `

        <div class="main-photo">

            <img
                src="${photos[index].url}"
                alt="${escapeHtml(
                    selectedProduct.nome
                )}"
            >

        </div>


        <div class="thumbs">

            ${photos
                .map(
                    (photo, photoIndex) => `

                        <button
                            type="button"
                            class="${
                                photoIndex === index
                                    ? "active"
                                    : ""
                            }"
                            onclick="renderGallery(${photoIndex})"
                        >

                            <img
                                src="${photo.url}"
                                alt="Foto ${
                                    photoIndex + 1
                                }"
                            >

                        </button>

                    `
                )
                .join("")}

        </div>

    `;

}


function closeProductModal() {

    document
        .getElementById(
            "productModal"
        )
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   ADICIONAR À SACOLA
========================================================= */

function addToBag(id) {

    const product =
        products.find(
            item => item.id === id
        );


    if (
        !product ||
        Number(product.estoque || 0) < 1
    ) {
        return;
    }


    const item =
        bag.find(
            item => item.id === id
        );


    if (item) {

        if (
            item.qty <
            Number(product.estoque)
        ) {

            item.qty++;

        }

    } else {

        bag.push(
            {
                id,
                qty: 1
            }
        );

    }


    saveBag();

    closeProductModal();

    openBag();

}


/* =========================================================
   SACOLA
========================================================= */

function openBag() {

    document
        .getElementById(
            "bagModal"
        )
        ?.classList.remove(
            "hidden"
        );

    renderBag();

}


function closeBag() {

    document
        .getElementById(
            "bagModal"
        )
        ?.classList.add(
            "hidden"
        );

}


function renderBag() {

    const box =
        document.getElementById(
            "bagItems"
        );

    const totalElement =
        document.getElementById(
            "bagTotal"
        );


    if (!box) {
        return;
    }


    if (!bag.length) {

        box.innerHTML = `

            <p class="empty-bag">
                Sua sacola está vazia.
            </p>

        `;


        if (totalElement) {
            totalElement.textContent =
                money(0);
        }


        return;

    }


    let total = 0;


    box.innerHTML =
        bag
            .map(
                item => {

                    const product =
                        products.find(
                            product =>
                                product.id ===
                                item.id
                        );


                    if (!product) {
                        return "";
                    }


                    const subtotal =
                        Number(product.preco || 0) *
                        Number(item.qty || 0);


                    total += subtotal;


                    return `

                        <div class="bag-item">

                            <img
                                src="${imgOf(product)}"
                                alt="${escapeHtml(
                                    product.nome
                                )}"
                            >

                            <div>

                                <h4>
                                    ${escapeHtml(
                                        product.nome
                                    )}
                                </h4>

                                <p>
                                    ${item.qty} ×
                                    ${money(
                                        product.preco
                                    )}
                                </p>

                            </div>

                            <button
                                type="button"
                                class="remove"
                                onclick="removeBag('${product.id}')"
                            >
                                ×
                            </button>

                        </div>

                    `;

                }
            )
            .join("");


    if (totalElement) {

        totalElement.textContent =
            money(total);

    }

}


function removeBag(id) {

    bag =
        bag.filter(
            item =>
                item.id !== id
        );

    saveBag();

    renderBag();

}


/* =========================================================
   WHATSAPP
========================================================= */

function checkoutWhatsApp() {

    if (!bag.length) {

        alert(
            "Sua sacola está vazia."
        );

        return;

    }


    let message =
        "Olá! Quero fazer um pedido na Dih Signature.\n\n";


    let total = 0;


    bag.forEach(
        item => {

            const product =
                products.find(
                    product =>
                        product.id ===
                        item.id
                );


            if (!product) {
                return;
            }


            const subtotal =
                Number(product.preco || 0) *
                Number(item.qty || 0);


            total += subtotal;


            message +=
                `• ${product.nome} — ` +
                `${item.qty} un. — ` +
                `${money(subtotal)}\n`;

        }
    );


    message +=
        `\nTotal: ${money(total)}`;


    const url =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(message)}`;


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   LOGIN / ADMIN
========================================================= */

async function openAdmin() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {
            throw error;
        }


        if (data.session) {

            document
                .getElementById(
                    "adminModal"
                )
                ?.classList.remove(
                    "hidden"
                );

            renderAdmin();

        } else {

            document
                .getElementById(
                    "loginModal"
                )
                ?.classList.remove(
                    "hidden"
                );


            setTimeout(
                () => {

                    document
                        .getElementById(
                            "loginUser"
                        )
                        ?.focus();

                },
                100
            );

        }

    } catch (error) {

        console.error(
            "Erro ao abrir Admin:",
            error
        );

        alert(
            "Não foi possível verificar o acesso administrativo."
        );

    }

}


async function loginAdmin(event) {

    event.preventDefault();


    const email =
        document
            .getElementById(
                "loginUser"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "loginPass"
            )
            .value;


    const errorBox =
        document.getElementById(
            "loginError"
        );


    errorBox.textContent = "";

    errorBox.classList.add(
        "hidden"
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword(
                {
                    email,
                    password
                }
            );


    if (error) {

        console.error(
            "Supabase Auth:",
            error
        );


        let message =
            "Não foi possível entrar.";


        const errorMessage =
            String(
                error.message || ""
            ).toLowerCase();


        if (
            errorMessage.includes(
                "invalid login credentials"
            )
        ) {

            message =
                "E-mail ou senha incorretos.";

        } else if (
            errorMessage.includes(
                "email not confirmed"
            )
        ) {

            message =
                "Este e-mail ainda não foi confirmado no Supabase.";

        } else if (
            errorMessage.includes(
                "failed to fetch"
            )
        ) {

            message =
                "Não foi possível conectar ao Supabase.";

        } else {

            message =
                "Supabase: " +
                error.message;

        }


        errorBox.textContent =
            message;


        errorBox.classList.remove(
            "hidden"
        );


        return;

    }


    document
        .getElementById(
            "loginPass"
        )
        .value = "";


    document
        .getElementById(
            "loginModal"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminModal"
        )
        ?.classList.remove(
            "hidden"
        );


    renderAdmin();

}


function closeLogin() {

    document
        .getElementById(
            "loginModal"
        )
        ?.classList.add(
            "hidden"
        );

}


async function logoutAdmin() {

    await supabaseClient.auth.signOut();

    closeAdmin();

}


function closeAdmin() {

    document
        .getElementById(
            "adminModal"
        )
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   ABAS ADMIN
========================================================= */

function showAdminTab(
    tab,
    button = null
) {

    const productsTab =
        document.getElementById(
            "adminProducts"
        );

    const formTab =
        document.getElementById(
            "productForm"
        );

    const bulkTab =
        document.getElementById(
            "bulkImport"
        );


    productsTab?.classList.toggle(
        "hidden",
        tab !== "products"
    );


    formTab?.classList.toggle(
        "hidden",
        tab !== "form"
    );


    bulkTab?.classList.toggle(
        "hidden",
        tab !== "bulk"
    );


    if (button) {

        document
            .querySelectorAll(
                ".admin-tabs .tab-button"
            )
            .forEach(
                element =>
                    element.classList.remove(
                        "active"
                    )
            );


        button.classList.add(
            "active"
        );

    }


    if (tab === "products") {

        renderAdmin();

    }

}


/* =========================================================
   ADMIN PRODUTOS
========================================================= */

function renderAdmin() {

    const box =
        document.getElementById(
            "adminProductsList"
        );


    if (!box) {
        return;
    }


    if (!products.length) {

        box.innerHTML = `
            <p>
                Nenhum produto cadastrado.
            </p>
        `;

        return;

    }


    box.innerHTML =
        products
            .map(
                product => `

                    <div class="admin-row">

                        <img
                            src="${imgOf(product)}"
                            alt="${escapeHtml(
                                product.nome
                            )}"
                        >

                        <div>

                            <h4>
                                ${escapeHtml(
                                    product.nome
                                )}
                            </h4>

                            <small>
                                ${escapeHtml(
                                    product.categoria
                                )}
                                ·
                                ${money(
                                    product.preco
                                )}
                                ·
                                estoque:
                                ${product.estoque}
                            </small>

                        </div>


                        <button
                            type="button"
                            onclick="editProduct('${product.id}')"
                        >
                            Editar
                        </button>


                        <button
                            type="button"
                            onclick="deleteProduct('${product.id}')"
                        >
                            Excluir
                        </button>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   NOVO PRODUTO
========================================================= */

function newProduct() {

    document.getElementById(
        "editId"
    ).value = "";


    document.getElementById(
        "pCode"
    ).value = "";


    document.getElementById(
        "pName"
    ).value = "";


    document.getElementById(
        "pCategory"
    ).value = "Brincos";


    document.getElementById(
        "pPrice"
    ).value = "";


    document.getElementById(
        "pStock"
    ).value = "0";


    document.getElementById(
        "pDescription"
    ).value = "";


    document.getElementById(
        "pPhotos"
    ).value = "";


    currentPhotos = [];

    currentPhotoPaths = [];


    renderPhotoPreview();


    document.getElementById(
        "formTitle"
    ).textContent =
        "Novo produto";


    showAdminTab(
        "form"
    );


    const tabs =
        document.querySelectorAll(
            ".admin-tabs .tab-button"
        );


    tabs.forEach(
        tab =>
            tab.classList.remove(
                "active"
            )
    );


    if (tabs[1]) {

        tabs[1].classList.add(
            "active"
        );

    }

}


/* =========================================================
   EDITAR PRODUTO
========================================================= */

function editProduct(id) {

    const product =
        products.find(
            item =>
                item.id === id
        );


    if (!product) {
        return;
    }


    document.getElementById(
        "editId"
    ).value =
        product.id;


    document.getElementById(
        "pCode"
    ).value =
        product.codigo || "";


    document.getElementById(
        "pName"
    ).value =
        product.nome || "";


    document.getElementById(
        "pCategory"
    ).value =
        product.categoria || "Brincos";


    document.getElementById(
        "pPrice"
    ).value =
        product.preco || "";


    document.getElementById(
        "pStock"
    ).value =
        product.estoque || 0;


    document.getElementById(
        "pDescription"
    ).value =
        product.descricao || "";


    document.getElementById(
        "pPhotos"
    ).value = "";


    currentPhotos =
        (product.photos || [])
            .map(
                photo =>
                    photo.url
            );


    currentPhotoPaths =
        (product.photos || [])
            .map(
                photo =>
                    storagePathFromUrl(
                        photo.url
                    )
            );


    renderPhotoPreview();


    document.getElementById(
        "formTitle"
    ).textContent =
        "Editar produto";


    showAdminTab(
        "form"
    );


    const tabs =
        document.querySelectorAll(
            ".admin-tabs .tab-button"
        );


    tabs.forEach(
        tab =>
            tab.classList.remove(
                "active"
            )
    );


    if (tabs[1]) {

        tabs[1].classList.add(
            "active"
        );

    }

}


/* =========================================================
   EXCLUIR PRODUTO
========================================================= */

async function deleteProduct(id) {

    if (
        !confirm(
            "Excluir este produto e suas fotos?"
        )
    ) {
        return;
    }


    const product =
        products.find(
            item =>
                item.id === id
        );


    try {

        if (
            product &&
            product.photos &&
            product.photos.length
        ) {

            const paths =
                product.photos
                    .map(
                        photo =>
                            storagePathFromUrl(
                                photo.url
                            )
                    )
                    .filter(Boolean);


            if (paths.length) {

                await supabaseClient
                    .storage
                    .from("produtos")
                    .remove(paths);

            }

        }


        const {
            error
        } =
            await supabaseClient
                .from("produtos")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw error;

        }


        await loadProducts();


        alert(
            "Produto excluído com sucesso."
        );

    } catch (error) {

        console.error(
            error
        );


        alert(
            "Não foi possível excluir: " +
            error.message
        );

    }

}


/* =========================================================
   FOTOS
========================================================= */

function previewPhotos(event) {

    const files =
        [
            ...(event.target.files || [])
        ];


    files.forEach(
        file => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    currentPhotos.push(
                        reader.result
                    );


                    currentPhotoPaths.push(
                        {
                            file,
                            uploaded: false
                        }
                    );


                    renderPhotoPreview();

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


function renderPhotoPreview() {

    const container =
        document.getElementById(
            "photoPreview"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        currentPhotos
            .map(
                (photo, index) => `

                    <div class="preview-item">

                        <img
                            src="${photo}"
                            alt="Prévia da foto"
                        >

                        <button
                            type="button"
                            onclick="
                                removePreviewPhoto(${index})
                            "
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");

}


function removePreviewPhoto(index) {

    currentPhotos.splice(
        index,
        1
    );


    currentPhotoPaths.splice(
        index,
        1
    );


    renderPhotoPreview();

}


/* =========================================================
   UPLOAD FOTOS
========================================================= */

async function uploadNewPhotos(
    productId
) {

    const urls = [];

    const paths = [];


    for (
        let index = 0;
        index < currentPhotos.length;
        index++
    ) {

        const item =
            currentPhotoPaths[index];


        if (
            item &&
            item.uploaded === false &&
            item.file
        ) {

            const extension =
                (
                    item.file.name
                        .split(".")
                        .pop() ||
                    "jpg"
                )
                .toLowerCase()
                .replace(
                    /[^a-z0-9]/g,
                    ""
                );


            const path =
                `${productId}/${crypto.randomUUID()}.${extension || "jpg"}`;


            const {
                error
            } =
                await supabaseClient
                    .storage
                    .from("produtos")
                    .upload(
                        path,
                        item.file,
                        {
                            contentType:
                                item.file.type ||
                                "image/jpeg",
                            upsert:
                                false
                        }
                    );


            if (error) {

                throw error;

            }


            const {
                data
            } =
                supabaseClient
                    .storage
                    .from("produtos")
                    .getPublicUrl(
                        path
                    );


            urls.push(
                data.publicUrl
            );


            paths.push(
                path
            );

        }

    }


    return {
        urls,
        paths
    };

}


/* =========================================================
   SALVAR PRODUTO
========================================================= */

async function saveProduct(event) {

    event.preventDefault();


    const {
        data: sessionData
    } =
        await supabaseClient
            .auth
            .getSession();


    if (!sessionData.session) {

        alert(
            "Sua sessão expirou. Entre novamente."
        );

        return;

    }


    const id =
        document.getElementById(
            "editId"
        ).value ||
        crypto.randomUUID();


    const codigoInput =
        document.getElementById(
            "pCode"
        ).value.trim();


    const codigo =
        (
            codigoInput ||
            `MAN-${id.slice(0, 8)}`
        ).toUpperCase();


    const nome =
        document.getElementById(
            "pName"
        ).value.trim();


    const categoria =
        document.getElementById(
            "pCategory"
        ).value;


    const preco =
        Number(
            document.getElementById(
                "pPrice"
            ).value
        );


    const estoque =
        Number(
            document.getElementById(
                "pStock"
            ).value || 0
        );


    const descricao =
        document.getElementById(
            "pDescription"
        ).value.trim();


    if (!nome) {

        alert(
            "Informe o nome do produto."
        );

        return;

    }


    if (preco < 0) {

        alert(
            "Informe um preço válido."
        );

        return;

    }


    const payload = {

        id,

        codigo,

        nome,

        categoria,

        preco,

        estoque,

        descricao,

        ativo: true

    };


    try {

        const {
            error
        } =
            await supabaseClient
                .from("produtos")
                .upsert(
                    payload
                );


        if (error) {

            throw error;

        }


        const uploads =
            await uploadNewPhotos(
                id
            );


        if (
            uploads.urls.length
        ) {

            const rows =
                uploads.urls.map(
                    (url, index) => ({

                        produto_id:
                            id,

                        url,

                        ordem:
                            index

                    })
                );


            const {
                error:
                    photoError
            } =
                await supabaseClient
                    .from(
                        "fotos_produtos"
                    )
                    .insert(
                        rows
                    );


            if (photoError) {

                throw photoError;

            }

        }


        alert(
            "Produto salvo no banco com sucesso!"
        );


        currentPhotos = [];

        currentPhotoPaths = [];


        await loadProducts();


        showAdminTab(
            "products"
        );


        const tabs =
            document.querySelectorAll(
                ".admin-tabs .tab-button"
            );


        tabs.forEach(
            tab =>
                tab.classList.remove(
                    "active"
                )
        );


        if (tabs[0]) {

            tabs[0].classList.add(
                "active"
            );

        }

    } catch (error) {

        console.error(
            "Erro ao salvar:",
            error
        );


        alert(
            "Erro ao salvar produto: " +
            error.message
        );

    }

}


/* =========================================================
   EXPORTAR JSON
========================================================= */

function exportProducts() {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    products,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "dih-signature-backup.json";


    link.click();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   IMPORTAR JSON
========================================================= */

async function importProducts(event) {

    const file =
        event?.target?.files?.[0];


    if (!file) {
        return;
    }


    try {

        const text =
            await file.text();


        const imported =
            JSON.parse(
                text
            );


        const rows =
            (
                Array.isArray(
                    imported
                )
                    ? imported
                    : []
            )
            .map(
                product => ({

                    codigo:
                        (
                            product.codigo ||
                            `IMP-${crypto.randomUUID().slice(0, 8)}`
                        ).toUpperCase(),

                    nome:
                        product.nome ||
                        "",

                    categoria:
                        product.categoria ||
                        "Brincos",

                    preco:
                        Number(
                            product.preco ||
                            0
                        ),

                    estoque:
                        Number(
                            product.estoque ||
                            0
                        ),

                    descricao:
                        product.descricao ||
                        "",

                    ativo:
                        product.ativo !== false

                })
            )
            .filter(
                product =>
                    product.nome
            );


        if (!rows.length) {

            throw new Error(
                "O arquivo não contém produtos válidos."
            );

        }


        const {
            error
        } =
            await supabaseClient
                .from("produtos")
                .upsert(
                    rows,
                    {
                        onConflict:
                            "codigo"
                    }
                );


        if (error) {

            throw error;

        }


        alert(
            `${rows.length} produto(s) importado(s) com sucesso.`
        );


        await loadProducts();

    } catch (error) {

        console.error(
            error
        );


        alert(
            "Erro ao importar backup: " +
            error.message
        );

    }

}


/* =========================================================
   EXCEL
========================================================= */

function normalizeHeader(value) {

    return String(
        value || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            "_"
        );

}


function normalizeCategory(value) {

    const normalized =
        String(
            value || ""
        )
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim();


    const map = {

        brincos:
            "Brincos",

        brinco:
            "Brincos",

        colares:
            "Colares",

        colar:
            "Colares",

        pulseiras:
            "Pulseiras",

        pulseira:
            "Pulseiras",

        aneis:
            "Anéis",

        anel:
            "Anéis",

        conjuntos:
            "Conjuntos",

        conjunto:
            "Conjuntos",

        outros:
            "Outros"

    };


    return (
        map[normalized] ||
        "Brincos"
    );

}


function parsePrice(value) {

    if (
        typeof value ===
        "number"
    ) {

        return value;

    }


    let text =
        String(
            value || ""
        )
        .replace(
            /R\$/gi,
            ""
        )
        .replace(
            /\s/g,
            ""
        );


    if (
        text.includes(",")
    ) {

        text =
            text
                .replace(
                    /\./g,
                    ""
                )
                .replace(
                    ",",
                    "."
                );

    }


    return Number(
        text
    ) || 0;

}


function downloadExcelTemplate() {

    if (
        typeof XLSX ===
        "undefined"
    ) {

        alert(
            "A biblioteca do Excel ainda não carregou."
        );

        return;

    }


    const rows = [

        {
            codigo:
                "BR001",

            nome:
                "Brinco Lua",

            categoria:
                "Brincos",

            preco:
                89.90,

            estoque:
                10,

            descricao:
                "Brinco delicado"

        },

        {
            codigo:
                "CL001",

            nome:
                "Colar Coração",

            categoria:
                "Colares",

            preco:
                129.90,

            estoque:
                5,

            descricao:
                "Colar delicado"

        }

    ];


    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        );


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Produtos"
    );


    XLSX.writeFile(
        workbook,
        "modelo-produtos-dih-signature.xlsx"
    );

}


async function importExcel(event) {

    const file =
        event?.target?.files?.[0];


    if (!file) {
        return;
    }


    const status =
        document.getElementById(
            "bulkExcelStatus"
        );


    status.textContent =
        "Lendo planilha...";


    try {

        if (
            typeof XLSX ===
            "undefined"
        ) {

            throw new Error(
                "A biblioteca do Excel não carregou."
            );

        }


        const buffer =
            await file.arrayBuffer();


        const workbook =
            XLSX.read(
                buffer,
                {
                    type:
                        "array"
                }
            );


        const sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];


        const raw =
            XLSX.utils.sheet_to_json(
                sheet,
                {
                    defval:
                        ""
                }
            );


        if (!raw.length) {

            throw new Error(
                "A planilha está vazia."
            );

        }


        const rows =
            raw
                .map(
                    (row, index) => {

                        const normalized = {};


                        Object.keys(
                            row
                        ).forEach(
                            key => {

                                normalized[
                                    normalizeHeader(
                                        key
                                    )
                                ] =
                                    row[key];

                            }
                        );


                        const codigo =
                            String(
                                normalized.codigo ||
                                normalized.cod ||
                                normalized.sku ||
                                `IMP-${Date.now().toString(36).toUpperCase()}-${String(index + 1).padStart(3, "0")}`
                            )
                                .trim()
                                .toUpperCase();


                        return {

                            codigo,

                            nome:
                                String(
                                    normalized.nome ||
                                    normalized.produto ||
                                    normalized.name ||
                                    ""
                                ).trim(),

                            categoria:
                                normalizeCategory(
                                    normalized.categoria ||
                                    normalized.category
                                ),

                            preco:
                                parsePrice(
                                    normalized.preco ??
                                    normalized.preco_venda ??
                                    normalized.price
                                ),

                            estoque:
                                Math.max(
                                    0,
                                    parseInt(
                                        normalized.estoque ??
                                        normalized.stock,
                                        10
                                    ) || 0
                                ),

                            descricao:
                                String(
                                    normalized.descricao ||
                                    normalized.description ||
                                    ""
                                ).trim(),

                            ativo:
                                String(
                                    normalized.ativo
                                ).toLowerCase() !==
                                "false"

                        };

                    }
                )
                .filter(
                    row =>
                        row.nome
                );


        if (!rows.length) {

            throw new Error(
                "Nenhuma linha com nome de produto foi encontrada."
            );

        }


        const {
            error
        } =
            await supabaseClient
                .from("produtos")
                .upsert(
                    rows,
                    {
                        onConflict:
                            "codigo"
                    }
                );


        if (error) {

            throw error;

        }


        status.textContent =
            `✓ ${rows.length} produto(s) importado(s).`;


        await loadProducts();

    } catch (error) {

        console.error(
            error
        );


        status.textContent =
            "✕ " +
            error.message;


        alert(
            "Erro ao importar Excel: " +
            error.message
        );

    }

}


/* =========================================================
   FOTOS EM MASSA
========================================================= */

async function importBulkPhotos(event) {

    const files =
        [
            ...(event?.target?.files || [])
        ];


    if (!files.length) {
        return;
    }


    const status =
        document.getElementById(
            "bulkPhotoStatus"
        );


    status.textContent =
        "Procurando os códigos no banco...";


    try {

        const {
            data:
                dbProducts,
            error
        } =
            await supabaseClient
                .from("produtos")
                .select(
                    "id,codigo,nome"
                );


        if (error) {
            throw error;
        }


        const byCode =
            new Map(
                (
                    dbProducts || []
                )
                .filter(
                    product =>
                        product.codigo
                )
                .map(
                    product => [

                        String(
                            product.codigo
                        )
                            .trim()
                            .toUpperCase(),

                        product

                    ]
                )
            );


        let success = 0;

        let notFound = 0;

        let failed = 0;


        for (
            const file of files
        ) {

            const base =
                file.name
                    .replace(
                        /\.[^.]+$/,
                        ""
                    )
                    .trim()
                    .toUpperCase();


            const product =
                byCode.get(
                    base
                );


            if (!product) {

                notFound++;

                continue;

            }


            try {

                const extension =
                    (
                        file.name
                            .split(".")
                            .pop() ||
                        "jpg"
                    )
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9]/g,
                        ""
                    ) ||
                    "jpg";


                const path =
                    `${product.id}/${crypto.randomUUID()}.${extension}`;


                const {
                    error:
                        uploadError
                } =
                    await supabaseClient
                        .storage
                        .from("produtos")
                        .upload(
                            path,
                            file,
                            {
                                contentType:
                                    file.type ||
                                    "image/jpeg",
                                upsert:
                                    false
                            }
                        );


                if (uploadError) {
                    throw uploadError;
                }


                const {
                    data:
                        publicData
                } =
                    supabaseClient
                        .storage
                        .from("produtos")
                        .getPublicUrl(
                            path
                        );


                const {
                    data:
                        existing
                } =
                    await supabaseClient
                        .from(
                            "fotos_produtos"
                        )
                        .select(
                            "ordem"
                        )
                        .eq(
                            "produto_id",
                            product.id
                        )
                        .order(
                            "ordem",
                            {
                                ascending:
                                    false
                            }
                        )
                        .limit(1);


                const ordem =
                    (
                        existing?.[0]?.ordem ??
                        -1
                    ) + 1;


                const {
                    error:
                        dbError
                } =
                    await supabaseClient
                        .from(
                            "fotos_produtos"
                        )
                        .insert(
                            {
                                produto_id:
                                    product.id,

                                url:
                                    publicData.publicUrl,

                                ordem

                            }
                        );


                if (dbError) {
                    throw dbError;
                }


                success++;

            } catch (error) {

                console.error(
                    file.name,
                    error
                );

                failed++;

            }

        }


        status.textContent =
            `✓ ${success} foto(s) adicionada(s). ` +
            `${notFound} sem código correspondente. ` +
            `${failed} com erro.`;


        await loadProducts();

    } catch (error) {

        console.error(
            error
        );


        status.textContent =
            "✕ " +
            error.message;


        alert(
            "Erro ao importar fotos: " +
            error.message
        );

    }

}


/* =========================================================
   CONEXÃO SUPABASE
========================================================= */

async function checkSupabaseConnection() {

    const box =
        document.getElementById(
            "connectionStatus"
        );


    try {

        const {
            error
        } =
            await supabaseClient
                .from("produtos")
                .select("id")
                .limit(1);


        if (error) {
            throw error;
        }


        if (box) {

            box.textContent =
                "● Conectado ao banco";


            box.className =
                "connection-status ok";

        }

    } catch (error) {

        console.error(
            "Conexão Supabase:",
            error
        );


        if (box) {

            box.textContent =
                "● Banco não conectado";


            box.className =
                "connection-status fail";

        }

    }

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        updateBagCount();

        renderProducts();

        await checkSupabaseConnection();

        await loadProducts();

    }
);