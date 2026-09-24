// =========================================
// AYODEJI FASHION HUBS - ADMIN DASHBOARD
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();
});


// =========================================
// GLOBAL VARIABLES
// =========================================

let supabaseClient = null;
let currentUser = null;

let products = [];
let orders = [];

let selectedProduct = null;
let selectedOrder = null;

let selectedImageFile = null;


// =========================================
// EMAILJS CONFIGURATION
// =========================================

const EMAILJS_PUBLIC_KEY =
    "zDU17Xd3CuZ3fJztk";

const EMAILJS_SERVICE_ID =
    "service_1d6t1el";

const EMAILJS_TEMPLATE_ID =
    "template_vo44x4z";

const TRACKING_URL =
    "https://kabir015az.github.io/ayodeji-fashion-hubs/track-order.html";


// =========================================
// ORDER STATUS OPTIONS
// =========================================

const ORDER_STATUSES = [
    "Pending Payment",
    "Deposit Paid",
    "Balance Pending",
    "Fully Paid",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
];


// =========================================
// PAYMENT STATUS OPTIONS
// =========================================

const PAYMENT_STATUSES = [
    "Pending",
    "Deposit Paid",
    "Paid"
];


// =========================================
// INITIALIZE
// =========================================

async function initializeAdmin() {

    supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        return;
    }


    initializeEmailJS();


    setupPasswordToggle();
    setupLogin();
    setupLogout();
    setupTabs();
    setupProductActions();
    setupOrderActions();
    setupProductModal();
    setupImagePicker();


    await checkAdminSession();
}


// =========================================
// INITIALIZE EMAILJS
// =========================================

function initializeEmailJS() {

    if (
        typeof emailjs === "undefined"
    ) {

        console.error(
            "EmailJS SDK was not loaded."
        );

        return false;
    }


    try {

        emailjs.init({
            publicKey:
                EMAILJS_PUBLIC_KEY
        });


        console.log(
            "EmailJS initialized successfully."
        );


        return true;

    } catch (error) {

        console.error(
            "EmailJS initialization error:",
            error
        );


        return false;
    }
}


// =========================================
// SEND ORDER EMAIL
// =========================================

async function sendOrderEmail(
    order,
    newStatus
) {

    if (!order) {

        return {
            success: false,
            skipped: true,
            message: "Order not found."
        };
    }


    const customerEmail =
        String(
            order.customer_email || ""
        ).trim();


    if (!customerEmail) {

        console.log(
            "No customer email provided. Email skipped."
        );


        return {
            success: false,
            skipped: true,
            message:
                "Customer did not provide an email address."
        };
    }


    if (
        typeof emailjs === "undefined"
    ) {

        return {
            success: false,
            skipped: true,
            message:
                "EmailJS is not available."
        };
    }


    const statusMessage =
        getEmailStatusMessage(
            newStatus
        );


    const templateParams = {

        customer_name:
            order.customer_name || "Customer",

        order_reference:
            order.order_reference || "",

        order_status:
            newStatus || order.status || "",

        payment_status:
            order.payment_status || "Pending",

        order_total:
            formatMoney(order.total),

        status_message:
            statusMessage,

        tracking_link:
            TRACKING_URL
    };


    try {

        console.log(
            "Sending order email:",
            templateParams
        );


        const response =
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            );


        console.log(
            "Order email sent successfully:",
            response
        );


        return {
            success: true,
            skipped: false,
            message:
                "Customer email sent successfully."
        };


    } catch (error) {

        console.error(
            "EmailJS send error:",
            error
        );


        return {
            success: false,
            skipped: false,
            message:
                error?.text ||
                error?.message ||
                "Unable to send customer email."
        };
    }
}


// =========================================
// EMAIL STATUS MESSAGE
// =========================================

function getEmailStatusMessage(status) {

    switch (status) {

        case "Pending Payment":

            return (
                "Your order has been received and is waiting for payment."
            );


        case "Deposit Paid":

            return (
                "Your 60% deposit has been received. We will continue processing your order."
            );


        case "Balance Pending":

            return (
                "Your order is waiting for the remaining balance payment."
            );


        case "Fully Paid":

            return (
                "Your payment has been completed successfully. Thank you for your payment."
            );


        case "Processing":

            return (
                "Your order is now being prepared by Ayodeji Fashion Hubs."
            );


        case "Shipped":

            return (
                "Your order has been shipped and is now on the way to you."
            );


        case "Delivered":

            return (
                "Your order has been delivered. Thank you for shopping with Ayodeji Fashion Hubs!"
            );


        case "Cancelled":

            return (
                "Your order has been cancelled. Please contact Ayodeji Fashion Hubs if you need more information."
            );


        default:

            return (
                "Your order has been updated. Please check your tracking page for the latest information."
            );
    }
}


// =========================================
// ELEMENT HELPER
// =========================================

function getElement(id) {

    return document.getElementById(id);
}


// =========================================
// SHOW / HIDE
// =========================================

function showElement(element) {

    if (!element) return;

    element.classList.remove("hidden");

    element.style.display = "";
}


function hideElement(element) {

    if (!element) return;

    element.classList.add("hidden");

    element.style.display = "none";
}


// =========================================
// LOGIN
// =========================================

function setupLogin() {

    const form =
        getElement("adminLoginForm");


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                getElement("adminEmail")
                    ?.value
                    .trim();


            const password =
                getElement("adminPassword")
                    ?.value;


            const button =
                getElement("adminLoginButton");


            const buttonText =
                getElement("adminLoginButtonText");


            const message =
                getElement("adminLoginMessage");


            if (!email || !password) {

                showLoginMessage(
                    "Enter your email and password.",
                    true
                );


                return;
            }


            if (button) {
                button.disabled = true;
            }


            if (buttonText) {
                buttonText.textContent =
                    "Logging in...";
            }


            if (message) {
                message.textContent = "";
            }


            try {

                const { data, error } =
                    await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });


                if (error) {
                    throw error;
                }


                currentUser =
                    data.user;


                const isAdmin =
                    await checkAdminUser(
                        currentUser.id
                    );


                if (!isAdmin) {

                    await supabaseClient.auth.signOut();


                    throw new Error(
                        "This account is not registered as an admin."
                    );
                }


                showDashboard();


            } catch (error) {

                console.error(
                    "Admin login error:",
                    error
                );


                showLoginMessage(
                    error.message ||
                    "Login failed.",
                    true
                );


            } finally {

                if (button) {
                    button.disabled = false;
                }


                if (buttonText) {

                    buttonText.textContent =
                        "Login";
                }
            }
        }
    );
}


// =========================================
// PASSWORD TOGGLE
// =========================================

function setupPasswordToggle() {

    const toggle =
        getElement("toggleAdminPassword");


    const password =
        getElement("adminPassword");


    if (!toggle || !password) {
        return;
    }


    toggle.addEventListener(
        "click",
        () => {

            if (
                password.type ===
                "password"
            ) {

                password.type = "text";

                toggle.textContent =
                    "🙈";

            } else {

                password.type =
                    "password";

                toggle.textContent =
                    "👁️";
            }
        }
    );
}


// =========================================
// LOGIN MESSAGE
// =========================================

function showLoginMessage(
    message,
    error = false
) {

    const element =
        getElement("adminLoginMessage");


    if (!element) return;


    element.textContent =
        message;


    element.style.color =
        error
            ? "#c62828"
            : "#16834b";
}


// =========================================
// CHECK CURRENT SESSION
// =========================================

async function checkAdminSession() {

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();


        if (error) {
            throw error;
        }


        if (!data.session) {

            showLogin();

            return;
        }


        currentUser =
            data.session.user;


        const isAdmin =
            await checkAdminUser(
                currentUser.id
            );


        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            showLogin();


            showLoginMessage(
                "This account is not registered as an admin.",
                true
            );


            return;
        }


        showDashboard();


    } catch (error) {

        console.error(
            "Session check error:",
            error
        );


        showLogin();
    }
}


// =========================================
// CHECK ADMIN USER
// =========================================

async function checkAdminUser(userId) {

    const { data, error } =
        await supabaseClient
            .from("admin_users")
            .select("user_id,email")
            .eq("user_id", userId)
            .maybeSingle();


    if (error) {

        console.error(
            "Admin check error:",
            error
        );


        return false;
    }


    return !!data;
}


// =========================================
// SHOW LOGIN
// =========================================

function showLogin() {

    const loginView =
        getElement("adminLoginView");


    const dashboardView =
        getElement("adminDashboardView");


    showElement(loginView);

    hideElement(dashboardView);
}


// =========================================
// SHOW DASHBOARD
// =========================================

async function showDashboard() {

    const loginView =
        getElement("adminLoginView");


    const dashboardView =
        getElement("adminDashboardView");


    hideElement(loginView);

    showElement(dashboardView);


    switchSection(
        "ordersSection"
    );


    await loadOrders();

    await loadProducts();
}


// =========================================
// LOGOUT
// =========================================

function setupLogout() {

    const logoutButton =
        getElement("adminLogout");


    if (!logoutButton) return;


    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await supabaseClient.auth.signOut();


                currentUser = null;

                products = [];
                orders = [];


                showLogin();


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}


// =========================================
// TABS
// =========================================

function setupTabs() {

    const tabs =
        document.querySelectorAll(
            ".admin-tab"
        );


    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const sectionId =
                    tab.dataset.section;


                tabs.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                tab.classList.add(
                    "active"
                );


                switchSection(
                    sectionId
                );
            }
        );
    });
}


function switchSection(
    sectionId
) {

    const ordersSection =
        getElement("ordersSection");


    const productsSection =
        getElement("productsSection");


    hideElement(
        ordersSection
    );


    hideElement(
        productsSection
    );


    const selectedSection =
        getElement(sectionId);


    if (selectedSection) {

        showElement(
            selectedSection
        );
    }
}


// =========================================
// PRODUCT ACTIONS
// =========================================

function setupProductActions() {

    const addButton =
        getElement("addProductButton");


    if (addButton) {

        addButton.addEventListener(
            "click",
            () => openProductModal()
        );
    }


    const productsGrid =
        getElement(
            "productsAdminGrid"
        );


    if (productsGrid) {

        productsGrid.addEventListener(
            "click",
            handleProductClick
        );
    }


    const search =
        getElement("productSearch");


    if (search) {

        search.addEventListener(
            "input",
            filterProducts
        );
    }


    const category =
        getElement(
            "productCategoryFilter"
        );


    if (category) {

        category.addEventListener(
            "change",
            filterProducts
        );
    }


    const status =
        getElement(
            "productStatusFilter"
        );


    if (status) {

        status.addEventListener(
            "change",
            filterProducts
        );
    }
}


// =========================================
// HANDLE PRODUCT CLICK
// =========================================

function handleProductClick(event) {

    const button =
        event.target.closest(
            "button"
        );


    if (!button) return;


    event.preventDefault();


    const id =
        button.dataset.productId;


    if (!id) return;


    if (
        button.classList.contains(
            "edit-product-btn"
        )
    ) {

        editProduct(id);

        return;
    }


    if (
        button.classList.contains(
            "toggle-product-btn"
        )
    ) {

        toggleProduct(id);

        return;
    }


    if (
        button.classList.contains(
            "delete-product-btn"
        )
    ) {

        deleteProduct(id);

        return;
    }
}


// =========================================
// LOAD PRODUCTS
// =========================================

async function loadProducts() {

    const grid =
        getElement(
            "productsAdminGrid"
        );


    if (grid) {

        grid.innerHTML =
            `<div class="admin-loading">
                Loading products...
            </div>`;
    }


    const { data, error } =
        await supabaseClient
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Load products error:",
            error
        );


        if (grid) {

            grid.innerHTML =
                `<div class="empty-state">
                    <h3>
                        Unable to load products
                    </h3>

                    <p>
                        ${escapeHtml(
                            error.message
                        )}
                    </p>

                </div>`;
        }


        return;
    }


    products =
        data || [];


    renderProducts(
        products
    );
}


// =========================================
// RENDER PRODUCTS
// =========================================

function renderProducts(list) {

    const grid =
        getElement(
            "productsAdminGrid"
        );


    const empty =
        getElement(
            "emptyProducts"
        );


    const count =
        getElement(
            "productsCount"
        );


    if (!grid) return;


    if (count) {

        count.textContent =
            `${list.length} Product${
                list.length === 1
                    ? ""
                    : "s"
            }`;
    }


    if (!list.length) {

        grid.innerHTML = "";


        if (empty) {
            showElement(empty);
        }


        return;
    }


    if (empty) {
        hideElement(empty);
    }


    grid.innerHTML =
        list
            .map(product =>
                createProductCard(
                    product
                )
            )
            .join("");
}


// =========================================
// PRODUCT CARD
// =========================================

function createProductCard(
    product
) {

    const image =
        product.image
            ? `
                <img
                    src="${escapeAttribute(
                        product.image
                    )}"
                    alt="${escapeAttribute(
                        product.name
                    )}"
                >
            `
            : `
                <span class="product-admin-placeholder">
                    ${escapeHtml(
                        product.icon ||
                        "👟"
                    )}
                </span>
            `;


    const oldPrice =
        product.old_price
            ? `
                <span class="product-admin-old-price">
                    ${formatMoney(
                        product.old_price
                    )}
                </span>
            `
            : "";


    const stockClass =
        Number(product.stock) <= 3
            ? "low"
            : "";


    return `
        <article class="product-admin-card">

            <div class="product-admin-image">
                ${image}
            </div>


            <div class="product-admin-content">

                <h3>
                    ${escapeHtml(
                        product.name
                    )}
                </h3>


                <div class="product-admin-category">
                    ${escapeHtml(
                        product.category ||
                        "Uncategorized"
                    )}
                </div>


                <div class="product-admin-price">

                    <strong>
                        ${formatMoney(
                            product.price
                        )}
                    </strong>

                    ${oldPrice}

                </div>


                <div
                    class="product-admin-stock ${stockClass}"
                >

                    Stock:

                    <strong>
                        ${Number(
                            product.stock ||
                            0
                        )}
                    </strong>

                </div>


                <div>

                    <span class="status-badge ${
                        product.is_active
                            ? "status-delivered"
                            : "status-cancelled"
                    }">

                        ${
                            product.is_active
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </div>


                <div class="product-admin-actions">

                    <button
                        type="button"
                        class="edit-product-btn"
                        data-product-id="${escapeAttribute(
                            product.id
                        )}"
                    >
                        ✏️ Edit
                    </button>


                    <button
                        type="button"
                        class="toggle-product-btn"
                        data-product-id="${escapeAttribute(
                            product.id
                        )}"
                    >

                        ${
                            product.is_active
                                ? "⏸ Disable"
                                : "▶️ Enable"
                        }

                    </button>


                    <button
                        type="button"
                        class="delete-product-btn"
                        data-product-id="${escapeAttribute(
                            product.id
                        )}"
                    >
                        🗑️ Delete
                    </button>

                </div>

            </div>

        </article>
    `;
}


// =========================================
// FILTER PRODUCTS
// =========================================

function filterProducts() {

    const search =
        getElement(
            "productSearch"
        )
            ?.value
            .trim()
            .toLowerCase() || "";


    const category =
        getElement(
            "productCategoryFilter"
        )
            ?.value || "";


    const status =
        getElement(
            "productStatusFilter"
        )
            ?.value || "";


    const filtered =
        products.filter(
            product => {

                const matchesSearch =
                    !search ||
                    String(
                        product.name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search) ||
                    String(
                        product.id ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    !category ||
                    product.category ===
                    category;


                const matchesStatus =
                    !status ||
                    (
                        status ===
                        "active" &&
                        product.is_active
                    ) ||
                    (
                        status ===
                        "inactive" &&
                        !product.is_active
                    );


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStatus
                );
            }
        );


    renderProducts(
        filtered
    );
}


// =========================================
// IMAGE PICKER
// =========================================

function setupImagePicker() {

    const imageInput =
        getElement(
            "productImage"
        );


    if (!imageInput) return;


    imageInput.addEventListener(
        "change",
        handleImageSelection
    );
}


// =========================================
// IMAGE SELECTION
// =========================================

function handleImageSelection(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) return;


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showProductMessage(
            "Please select an image file.",
            true
        );


        event.target.value = "";


        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        showProductMessage(
            "Image must be 5MB or smaller.",
            true
        );


        event.target.value = "";


        return;
    }


    selectedImageFile =
        file;


    const preview =
        getElement(
            "productImagePreview"
        );


    if (!preview) return;


    const imageUrl =
        URL.createObjectURL(
            file
        );


    preview.innerHTML = `
        <img
            src="${imageUrl}"
            alt="Selected product image"
        >
    `;
}


// =========================================
// PRODUCT MODAL
// =========================================

function setupProductModal() {

    const closeButton =
        getElement(
            "closeProductModal"
        );


    const cancelButton =
        getElement(
            "cancelProductButton"
        );


    const form =
        getElement(
            "productForm"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeProductModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeProductModal
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            saveProduct
        );
    }


    const modal =
        getElement(
            "productModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeProductModal();
                }
            }
        );
    }
}


// =========================================
// OPEN PRODUCT MODAL
// =========================================

function openProductModal(
    product = null
) {

    selectedProduct =
        product;


    selectedImageFile =
        null;


    const modal =
        getElement(
            "productModal"
        );


    const title =
        getElement(
            "productModalTitle"
        );


    const form =
        getElement(
            "productForm"
        );


    const imageInput =
        getElement(
            "productImage"
        );


    const preview =
        getElement(
            "productImagePreview"
        );


    if (!modal || !form) {
        return;
    }


    form.reset();


    if (imageInput) {
        imageInput.value = "";
    }


    if (title) {

        title.textContent =
            product
                ? "Edit Product"
                : "Add Product";
    }


    if (product) {

        getElement(
            "productId"
        ).value =
            product.id || "";


        getElement(
            "productName"
        ).value =
            product.name || "";


        getElement(
            "productCategory"
        ).value =
            product.category || "";


        getElement(
            "productBadge"
        ).value =
            product.badge || "";


        getElement(
            "productPrice"
        ).value =
            product.price ?? "";


        getElement(
            "productOldPrice"
        ).value =
            product.old_price ?? "";


        getElement(
            "productStock"
        ).value =
            product.stock ?? 0;


        getElement(
            "productIcon"
        ).value =
            product.icon || "👟";


        getElement(
            "productSizes"
        ).value =
            Array.isArray(
                product.sizes
            )
                ? product.sizes.join(",")
                : "";


        getElement(
            "productDescription"
        ).value =
            product.description ||
            "";


        getElement(
            "productActive"
        ).checked =
            product.is_active !==
            false;


        if (preview) {

            if (product.image) {

                preview.innerHTML = `
                    <img
                        src="${escapeAttribute(
                            product.image
                        )}"
                        alt="${escapeAttribute(
                            product.name
                        )}"
                    >
                `;

            } else {

                preview.innerHTML = `
                    <span>
                        ${escapeHtml(
                            product.icon ||
                            "👟"
                        )}
                    </span>
                `;
            }
        }

    } else {

        getElement(
            "productId"
        ).value = "";


        getElement(
            "productIcon"
        ).value =
            "👟";


        getElement(
            "productActive"
        ).checked =
            true;


        if (preview) {

            preview.innerHTML = `
                <span>
                    👟
                </span>
            `;
        }
    }


    showProductMessage(
        "",
        false
    );


    showElement(modal);

    modal.style.display =
        "flex";
}


// =========================================
// CLOSE PRODUCT MODAL
// =========================================

function closeProductModal() {

    const modal =
        getElement(
            "productModal"
        );


    if (!modal) return;


    hideElement(modal);


    selectedProduct =
        null;


    selectedImageFile =
        null;
}


// =========================================
// SAVE PRODUCT
// =========================================

async function saveProduct(
    event
) {

    event.preventDefault();


    const saveButton =
        getElement(
            "saveProductButton"
        );


    if (saveButton) {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";
    }


    try {

        const id =
            getElement(
                "productId"
            )
                ?.value
                .trim();


        const name =
            getElement(
                "productName"
            )
                ?.value
                .trim();


        const category =
            getElement(
                "productCategory"
            )
                ?.value;


        const badge =
            getElement(
                "productBadge"
            )
                ?.value
                .trim();


        const price =
            Number(
                getElement(
                    "productPrice"
                )
                    ?.value
            );


        const oldPriceValue =
            getElement(
                "productOldPrice"
            )
                ?.value;


        const oldPrice =
            oldPriceValue === ""
                ? null
                : Number(
                    oldPriceValue
                );


        const stock =
            Number(
                getElement(
                    "productStock"
                )
                    ?.value
            );


        const icon =
            getElement(
                "productIcon"
            )
                ?.value
                .trim()
            || "👟";


        const sizesText =
            getElement(
                "productSizes"
            )
                ?.value
                .trim()
            || "";


        const sizes =
            sizesText
                .split(",")
                .map(
                    size =>
                        size.trim()
                )
                .filter(Boolean);


        const description =
            getElement(
                "productDescription"
            )
                ?.value
                .trim()
            || "";


        const isActive =
            getElement(
                "productActive"
            )
                ?.checked
            ?? true;


        if (!name) {

            throw new Error(
                "Enter the product name."
            );
        }


        if (!category) {

            throw new Error(
                "Select a product category."
            );
        }


        if (
            !Number.isFinite(
                price
            ) ||
            price < 0
        ) {

            throw new Error(
                "Enter a valid product price."
            );
        }


        if (
            !Number.isInteger(
                stock
            ) ||
            stock < 0
        ) {

            throw new Error(
                "Enter a valid stock quantity."
            );
        }


        if (
            oldPrice !== null &&
            (
                !Number.isFinite(
                    oldPrice
                ) ||
                oldPrice < 0
            )
        ) {

            throw new Error(
                "Enter a valid old price."
            );
        }


        let imageUrl =
            selectedProduct?.image ||
            null;


        const productId =
            id ||
            generateProductId();


        if (selectedImageFile) {

            imageUrl =
                await uploadProductImage(
                    selectedImageFile,
                    productId
                );
        }


        const productData = {

            id: productId,

            name,

            category,

            price,

            old_price:
                oldPrice,

            badge,

            icon,

            image:
                imageUrl,

            description,

            sizes,

            stock,

            is_active:
                isActive,

            updated_at:
                new Date()
                    .toISOString()
        };


        let result;


        if (selectedProduct) {

            result =
                await supabaseClient
                    .from("products")
                    .update(
                        productData
                    )
                    .eq(
                        "id",
                        productId
                    )
                    .select()
                    .single();

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert(
                        productData
                    )
                    .select()
                    .single();
        }


        if (result.error) {
            throw result.error;
        }


        showProductMessage(
            "Product saved successfully.",
            false
        );


        await loadProducts();


        setTimeout(
            () => {
                closeProductModal();
            },
            500
        );


    } catch (error) {

        console.error(
            "Save product error:",
            error
        );


        showProductMessage(
            error.message ||
            "Unable to save product.",
            true
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Product";
        }
    }
}


// =========================================
// UPLOAD PRODUCT IMAGE
// =========================================

async function uploadProductImage(
    file,
    productId
) {

    if (!file) {
        return null;
    }


    const extension =
        getFileExtension(
            file.name
        );


    const safeExtension =
        extension ||
        "jpg";


    const fileName =
        `${productId}-${Date.now()}.${safeExtension}`;


    const filePath =
        `products/${fileName}`;


    showProductMessage(
        "Uploading image...",
        false
    );


    const { error } =
        await supabaseClient
            .storage
            .from(
                "product-images"
            )
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        true,

                    contentType:
                        file.type
                }
            );


    if (error) {

        console.error(
            "Image upload error:",
            error
        );


        throw new Error(
            "Image upload failed: " +
            error.message
        );
    }


    const { data } =
        supabaseClient
            .storage
            .from(
                "product-images"
            )
            .getPublicUrl(
                filePath
            );


    if (!data?.publicUrl) {

        throw new Error(
            "Could not create image URL."
        );
    }


    return data.publicUrl;
}


// =========================================
// GENERATE PRODUCT ID
// =========================================

function generateProductId() {

    const numbers =
        products.map(
            product => {

                const match =
                    String(
                        product.id ||
                        ""
                    )
                        .match(
                            /^shoe-(\d+)$/
                        );


                return match
                    ? Number(
                        match[1]
                    )
                    : 0;
            }
        );


    const highest =
        numbers.length
            ? Math.max(
                ...numbers
            )
            : 0;


    return (
        "shoe-" +
        String(
            highest + 1
        ).padStart(
            3,
            "0"
        )
    );
}


// =========================================
// EDIT PRODUCT
// =========================================

function editProduct(id) {

    const product =
        products.find(
            item =>
                item.id === id
        );


    if (!product) {

        alert(
            "Product could not be found."
        );


        return;
    }


    openProductModal(
        product
    );
}


// =========================================
// TOGGLE PRODUCT
// =========================================

async function toggleProduct(
    id
) {

    const product =
        products.find(
            item =>
                item.id === id
        );


    if (!product) return;


    const newStatus =
        !product.is_active;


    const action =
        newStatus
            ? "enable"
            : "disable";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} "${product.name}"?`
        );


    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("products")
            .update({

                is_active:
                    newStatus,

                updated_at:
                    new Date()
                        .toISOString()

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Toggle product error:",
            error
        );


        alert(
            "Unable to update product: " +
            error.message
        );


        return;
    }


    await loadProducts();
}


// =========================================
// DELETE PRODUCT
// =========================================

async function deleteProduct(
    id
) {

    const product =
        products.find(
            item =>
                item.id === id
        );


    if (!product) return;


    const confirmed =
        confirm(
            `Delete "${product.name}" permanently?`
        );


    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("products")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Delete product error:",
            error
        );


        alert(
            "Unable to delete product: " +
            error.message
        );


        return;
    }


    await loadProducts();
}


// =========================================
// PRODUCT MESSAGE
// =========================================

function showProductMessage(
    message,
    error = false
) {

    const element =
        getElement(
            "productFormMessage"
        );


    if (!element) return;


    element.textContent =
        message;


    element.style.color =
        error
            ? "#c62828"
            : "#16834b";
}


// =========================================
// ORDER ACTIONS
// =========================================

function setupOrderActions() {

    const refresh =
        getElement(
            "refreshOrders"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            loadOrders
        );
    }


    const search =
        getElement(
            "orderSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            filterOrders
        );
    }


    const status =
        getElement(
            "statusFilter"
        );


    if (status) {

        status.addEventListener(
            "change",
            filterOrders
        );
    }


    const table =
        getElement(
            "ordersTable"
        );


    if (table) {

        table.addEventListener(
            "click",
            handleOrderClick
        );
    }


    const grid =
        getElement(
            "ordersGrid"
        );


    if (grid) {

        grid.addEventListener(
            "click",
            handleOrderClick
        );
    }


    const close =
        getElement(
            "closeOrderModal"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeOrderModal
        );
    }


    const modal =
        getElement(
            "orderModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeOrderModal();
                }
            }
        );
    }
}


// =========================================
// LOAD ORDERS
// =========================================

async function loadOrders() {

    const table =
        getElement(
            "ordersTable"
        );


    const grid =
        getElement(
            "ordersGrid"
        );


    if (table) {

        table.innerHTML =
            `<tr>
                <td colspan="7">
                    Loading orders...
                </td>
            </tr>`;
    }


    if (grid) {

        grid.innerHTML =
            `<div class="admin-loading">
                Loading orders...
            </div>`;
    }


    const { data, error } =
        await supabaseClient
            .from("orders")
            .select(`
                *,
                order_items (
                    id,
                    product_id,
                    product_name,
                    price,
                    quantity,
                    size,
                    category,
                    image,
                    icon
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Load orders error:",
            error
        );


        if (table) {

            table.innerHTML =
                `<tr>
                    <td colspan="7">
                        Unable to load orders.
                    </td>
                </tr>`;
        }


        if (grid) {

            grid.innerHTML =
                `<div class="empty-state">

                    <h3>
                        Unable to load orders
                    </h3>

                    <p>
                        ${escapeHtml(
                            error.message
                        )}
                    </p>

                </div>`;
        }


        return;
    }


    orders =
        data || [];


    updateOrderStats();

    renderOrders(
        orders
    );
}


// =========================================
// ORDER STATS
// =========================================

function updateOrderStats() {

    const total =
        orders.length;


    const pending =
        orders.filter(
            order =>
                order.status ===
                "Pending Payment"
        ).length;


    const paid =
        orders.filter(
            order =>
                order.payment_status ===
                    "Paid" ||
                order.status ===
                    "Fully Paid"
        ).length;


    const delivered =
        orders.filter(
            order =>
                order.status ===
                "Delivered"
        ).length;


    setText(
        "totalOrders",
        total
    );


    setText(
        "pendingPayment",
        pending
    );


    setText(
        "paidOrders",
        paid
    );


    setText(
        "deliveredOrders",
        delivered
    );
}


// =========================================
// RENDER ORDERS
// =========================================

function renderOrders(
    list
) {

    const table =
        getElement(
            "ordersTable"
        );


    const grid =
        getElement(
            "ordersGrid"
        );


    const empty =
        getElement(
            "emptyOrders"
        );


    if (!list.length) {

        if (table) {
            table.innerHTML = "";
        }


        if (grid) {
            grid.innerHTML = "";
        }


        if (empty) {
            showElement(empty);
        }


        return;
    }


    if (empty) {
        hideElement(empty);
    }


    if (table) {

        table.innerHTML =
            list
                .map(
                    order =>
                        createOrderRow(
                            order
                        )
                )
                .join("");
    }


    if (grid) {

        grid.innerHTML =
            list
                .map(
                    order =>
                        createOrderCard(
                            order
                        )
                )
                .join("");
    }
}


// =========================================
// ORDER ROW
// =========================================

function createOrderRow(
    order
) {

    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        order.order_reference
                    )}
                </strong>
            </td>


            <td>

                ${escapeHtml(
                    order.customer_name
                )}

                <br>

                <small>
                    ${escapeHtml(
                        order.customer_phone
                    )}
                </small>

            </td>


            <td>
                ${formatMoney(
                    order.total
                )}
            </td>


            <td>
                ${escapeHtml(
                    order.payment_status ||
                    "Pending"
                )}
            </td>


            <td>
                ${createStatusBadge(
                    order.status
                )}
            </td>


            <td>
                ${formatDate(
                    order.created_at
                )}
            </td>


            <td>

                <button
                    type="button"
                    class="admin-secondary-button view-order-button"
                    data-order-id="${escapeAttribute(
                        order.id
                    )}"
                >
                    View
                </button>

            </td>

        </tr>
    `;
}


// =========================================
// ORDER CARD
// =========================================

function createOrderCard(
    order
) {

    return `
        <article class="order-card">

            <div class="order-card-header">

                <div class="order-card-reference">

                    ${escapeHtml(
                        order.order_reference
                    )}

                </div>

                ${createStatusBadge(
                    order.status
                )}

            </div>


            <div class="order-card-info">

                <div>
                    <span>
                        Customer:
                    </span>

                    ${escapeHtml(
                        order.customer_name
                    )}
                </div>


                <div>
                    <span>
                        Phone:
                    </span>

                    ${escapeHtml(
                        order.customer_phone
                    )}
                </div>


                <div>
                    <span>
                        Total:
                    </span>

                    ${formatMoney(
                        order.total
                    )}
                </div>


                <div>
                    <span>
                        Payment:
                    </span>

                    ${escapeHtml(
                        order.payment_status ||
                        "Pending"
                    )}
                </div>


                <div>
                    <span>
                        Date:
                    </span>

                    ${formatDate(
                        order.created_at
                    )}
                </div>

            </div>


            <div class="order-card-actions">

                <button
                    type="button"
                    class="admin-primary-button view-order-button"
                    data-order-id="${escapeAttribute(
                        order.id
                    )}"
                >
                    View Order
                </button>

            </div>

        </article>
    `;
}


// =========================================
// ORDER CLICK
// =========================================

function handleOrderClick(
    event
) {

    const button =
        event.target.closest(
            ".view-order-button"
        );


    if (!button) return;


    const id =
        button.dataset.orderId;


    if (!id) return;


    viewOrder(id);
}


// =========================================
// FILTER ORDERS
// =========================================

function filterOrders() {

    const search =
        getElement(
            "orderSearch"
        )
            ?.value
            .trim()
            .toLowerCase() || "";


    const status =
        getElement(
            "statusFilter"
        )
            ?.value || "";


    const filtered =
        orders.filter(
            order => {

                const searchable =
                    [
                        order.order_reference,
                        order.customer_name,
                        order.customer_phone,
                        order.customer_email
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(
                        search
                    );


                const matchesStatus =
                    !status ||
                    order.status ===
                    status;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    renderOrders(
        filtered
    );
}


// =========================================
// VIEW ORDER
// =========================================

function viewOrder(id) {

    const order =
        orders.find(
            item =>
                item.id === id
        );


    if (!order) return;


    selectedOrder =
        order;


    const modal =
        getElement(
            "orderModal"
        );


    const content =
        getElement(
            "orderModalContent"
        );


    if (!modal || !content) {
        return;
    }


    const items =
        Array.isArray(
            order.order_items
        )
            ? order.order_items
            : [];


    const itemsHtml =
        items.length
            ? items
                .map(
                    item => {

                        const image =
                            item.image
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            item.image
                                        )}"
                                        alt="${escapeAttribute(
                                            item.product_name
                                        )}"
                                    >
                                `
                                : `
                                    <span>
                                        ${escapeHtml(
                                            item.icon ||
                                            "👟"
                                        )}
                                    </span>
                                `;


                        return `
                            <div class="order-item">

                                <div class="order-item-image">
                                    ${image}
                                </div>


                                <div class="order-item-info">

                                    <strong>
                                        ${escapeHtml(
                                            item.product_name
                                        )}
                                    </strong>


                                    <span>

                                        Qty:
                                        ${item.quantity}

                                        ${
                                            item.size
                                                ? `
                                                    · Size:
                                                    ${escapeHtml(
                                                        item.size
                                                    )}
                                                `
                                                : ""
                                        }

                                    </span>

                                </div>


                                <strong>
                                    ${formatMoney(
                                        Number(
                                            item.price ||
                                            0
                                        ) *
                                        Number(
                                            item.quantity ||
                                            1
                                        )
                                    )}
                                </strong>

                            </div>
                        `;

                    }
                )
                .join("")
            : "<p>No order items found.</p>";


    const statusOptions =
        ORDER_STATUSES
            .map(
                status => `
                    <option
                        value="${escapeAttribute(
                            status
                        )}"
                        ${
                            order.status ===
                            status
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            status
                        )}
                    </option>
                `
            )
            .join("");


    const paymentOptions =
        PAYMENT_STATUSES
            .map(
                status => `
                    <option
                        value="${escapeAttribute(
                            status
                        )}"
                        ${
                            order.payment_status ===
                            status
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            status
                        )}
                    </option>
                `
            )
            .join("");


    content.innerHTML = `

        <div class="order-detail-grid">

            <div class="order-detail-box">

                <small>
                    Order Reference
                </small>

                <strong>
                    ${escapeHtml(
                        order.order_reference
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Current Status
                </small>

                ${createStatusBadge(
                    order.status
                )}

            </div>


            <div class="order-detail-box">

                <small>
                    Customer
                </small>

                <strong>
                    ${escapeHtml(
                        order.customer_name
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Phone
                </small>

                <strong>
                    ${escapeHtml(
                        order.customer_phone
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Email
                </small>

                <strong>
                    ${escapeHtml(
                        order.customer_email ||
                        "Not provided"
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Payment Method
                </small>

                <strong>
                    ${escapeHtml(
                        order.payment_method
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Payment Plan
                </small>

                <strong>
                    ${escapeHtml(
                        order.payment_plan
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Payment Status
                </small>

                <strong>
                    ${escapeHtml(
                        order.payment_status ||
                        "Pending"
                    )}
                </strong>

            </div>


            <div class="order-detail-box full">

                <small>
                    Delivery Address
                </small>

                <strong>

                    ${escapeHtml(
                        order.delivery_address
                    )}

                    <br>

                    ${escapeHtml(
                        order.delivery_city
                    )},

                    ${escapeHtml(
                        order.delivery_state
                    )}

                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Total
                </small>

                <strong>
                    ${formatMoney(
                        order.total
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Pay Now
                </small>

                <strong>
                    ${formatMoney(
                        order.pay_now
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Balance
                </small>

                <strong>
                    ${formatMoney(
                        order.balance
                    )}
                </strong>

            </div>


            <div class="order-detail-box">

                <small>
                    Date
                </small>

                <strong>
                    ${formatDate(
                        order.created_at
                    )}
                </strong>

            </div>


            ${
                order.customer_note
                    ? `
                        <div class="order-detail-box full">

                            <small>
                                Customer Note
                            </small>

                            <strong>
                                ${escapeHtml(
                                    order.customer_note
                                )}
                            </strong>

                        </div>
                    `
                    : ""
            }

        </div>



        <!-- =================================
             ORDER MANAGEMENT
        ================================== -->

        <div class="order-management-panel">

            <h3>
                ⚙️ Manage Order
            </h3>


            <div class="order-management-grid">

                <div class="order-management-field">

                    <label for="adminOrderStatus">
                        Order Status
                    </label>

                    <select id="adminOrderStatus">

                        ${statusOptions}

                    </select>

                </div>


                <div class="order-management-field">

                    <label for="adminPaymentStatus">
                        Payment Status
                    </label>

                    <select id="adminPaymentStatus">

                        ${paymentOptions}

                    </select>

                </div>

            </div>


            <button
                type="button"
                id="saveOrderChanges"
                class="admin-primary-button"
            >
                💾 Save Order Changes
            </button>


            <p
                id="orderUpdateMessage"
                class="order-update-message"
            ></p>

        </div>



        <!-- =================================
             ORDER ITEMS
        ================================== -->

        <h3
            style="
                margin-top:22px;
                margin-bottom:10px;
            "
        >
            Order Items
        </h3>


        <div class="order-items-list">

            ${itemsHtml}

        </div>
    `;


    const saveButton =
        getElement(
            "saveOrderChanges"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveOrderChanges
        );
    }


    showElement(modal);

    modal.style.display =
        "flex";
}


// =========================================
// SAVE ORDER CHANGES
// =========================================

async function saveOrderChanges() {

    if (!selectedOrder) {
        return;
    }


    const saveButton =
        getElement(
            "saveOrderChanges"
        );


    const message =
        getElement(
            "orderUpdateMessage"
        );


    const status =
        getElement(
            "adminOrderStatus"
        )
            ?.value;


    const paymentStatus =
        getElement(
            "adminPaymentStatus"
        )
            ?.value;


    if (
        !status ||
        !paymentStatus
    ) {

        showOrderUpdateMessage(
            "Please select both order status and payment status.",
            true
        );


        return;
    }


    // =====================================
    // REMEMBER OLD VALUES
    // =====================================

    const oldStatus =
        selectedOrder.status ||
        "Pending Payment";


    const oldPaymentStatus =
        selectedOrder.payment_status ||
        "Pending";


    const statusChanged =
        oldStatus !== status;


    const paymentStatusChanged =
        oldPaymentStatus !==
        paymentStatus;


    if (
        !statusChanged &&
        !paymentStatusChanged
    ) {

        showOrderUpdateMessage(
            "No changes were made.",
            false
        );


        return;
    }


    if (saveButton) {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";
    }


    if (message) {

        message.textContent =
            "";
    }


    try {

        // =================================
        // UPDATE SUPABASE
        // =================================

        const updateData = {

            status,

            payment_status:
                paymentStatus,

            updated_at:
                new Date()
                    .toISOString()
        };


        const { data, error } =
            await supabaseClient
                .from("orders")
                .update(
                    updateData
                )
                .eq(
                    "id",
                    selectedOrder.id
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        // =================================
        // UPDATE LOCAL ORDER
        // =================================

        const index =
            orders.findIndex(
                order =>
                    order.id ===
                    selectedOrder.id
            );


        if (index !== -1) {

            orders[index] = {

                ...orders[index],

                ...data

            };


            selectedOrder =
                orders[index];
        }


        updateOrderStats();

        filterOrders();


        // =================================
        // SEND EMAIL
        // =================================

        let emailResult = null;


        if (
            statusChanged
        ) {

            showOrderUpdateMessage(
                "Order updated. Sending customer email...",
                false
            );


            emailResult =
                await sendOrderEmail(
                    selectedOrder,
                    status
                );
        }


        // =================================
        // RESULT MESSAGE
        // =================================

        if (
            statusChanged &&
            emailResult
        ) {

            if (
                emailResult.success
            ) {

                showOrderUpdateMessage(
                    "Order updated successfully. Customer email sent.",
                    false
                );

            } else if (
                emailResult.skipped
            ) {

                showOrderUpdateMessage(
                    "Order updated successfully. Email skipped: " +
                    emailResult.message,
                    false
                );

            } else {

                showOrderUpdateMessage(
                    "Order updated successfully, but the customer email could not be sent.",
                    true
                );
            }

        } else {

            showOrderUpdateMessage(
                "Order updated successfully.",
                false
            );
        }


        // =================================
        // REFRESH MODAL
        // =================================

        setTimeout(
            () => {

                if (selectedOrder) {

                    viewOrder(
                        selectedOrder.id
                    );
                }

            },
            1200
        );


    } catch (error) {

        console.error(
            "Save order changes error:",
            error
        );


        showOrderUpdateMessage(
            error.message ||
            "Unable to update order.",
            true
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "💾 Save Order Changes";
        }
    }
}


// =========================================
// ORDER UPDATE MESSAGE
// =========================================

function showOrderUpdateMessage(
    message,
    error = false
) {

    const element =
        getElement(
            "orderUpdateMessage"
        );


    if (!element) return;


    element.textContent =
        message;


    element.style.color =
        error
            ? "#c62828"
            : "#16834b";
}


// =========================================
// CLOSE ORDER MODAL
// =========================================

function closeOrderModal() {

    const modal =
        getElement(
            "orderModal"
        );


    if (!modal) return;


    hideElement(modal);


    selectedOrder =
        null;
}


// =========================================
// STATUS BADGE
// =========================================

function createStatusBadge(
    status
) {

    const value =
        String(
            status ||
            "Pending Payment"
        );


    let className =
        "status-pending";


    if (
        value ===
            "Fully Paid" ||
        value ===
            "Deposit Paid"
    ) {

        className =
            "status-paid";

    } else if (
        value ===
        "Processing"
    ) {

        className =
            "status-processing";

    } else if (
        value ===
        "Shipped"
    ) {

        className =
            "status-shipped";

    } else if (
        value ===
        "Delivered"
    ) {

        className =
            "status-delivered";

    } else if (
        value ===
        "Cancelled"
    ) {

        className =
            "status-cancelled";
    }


    return `
        <span
            class="status-badge ${className}"
        >
            ${escapeHtml(
                value
            )}
        </span>
    `;
}


// =========================================
// FORMAT MONEY
// =========================================

function formatMoney(
    value
) {

    const amount =
        Number(
            value || 0
        );


    return new Intl.NumberFormat(
        "en-NG",
        {
            style:
                "currency",

            currency:
                "NGN",

            maximumFractionDigits:
                0
        }
    ).format(
        amount
    );
}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";
    }


    return date.toLocaleString(
        "en-NG",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );
}


// =========================================
// SET TEXT
// =========================================

function setText(
    id,
    value
) {

    const element =
        getElement(id);


    if (element) {

        element.textContent =
            value;
    }
}


// =========================================
// FILE EXTENSION
// =========================================

function getFileExtension(
    filename
) {

    const parts =
        String(
            filename
        )
            .split(".");


    if (
        parts.length < 2
    ) {

        return "";
    }


    return parts
        .pop()
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        );
}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================================
// ESCAPE ATTRIBUTE
// =========================================

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );
}