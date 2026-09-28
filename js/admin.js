/* ============================================================
   AYODEJI FASHION HUBS
   ADMIN DASHBOARD
   FINAL ADMIN.JS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();
});


/* ============================================================
   CONFIG
   ============================================================ */

const ADMIN_EMAIL = "kabirabdulazeez45@gmail.com";

const TRACKING_URL =
    "https://kabirabdulazeez9-lab.github.io/ayodeji-fashion-hubs/track-order.html";

const EMAILJS_SERVICE_ID = "service_1d6t1el";
const EMAILJS_TEMPLATE_ID = "template_vo44x4z";
const EMAILJS_PUBLIC_KEY = "zDU17Xd3CuZ3fJztk";

let supabaseClient = null;

let allOrders = [];
let allProducts = [];
let allCategories = [];

let customSizes = [];

let currentUser = null;


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeAdmin() {

    supabaseClient = window.supabaseClient;

    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        showLoginMessage(
            "Supabase failed to load. Refresh the page."
        );

        return;
    }


    initializeEmailJS();

    setupEventListeners();

    await checkAdminSession();
}


/* ============================================================
   EMAILJS
   ============================================================ */

function initializeEmailJS() {

    if (
        typeof emailjs !== "undefined" &&
        emailjs.init
    ) {

        emailjs.init({
            publicKey: EMAILJS_PUBLIC_KEY
        });

    }
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function setupEventListeners() {

    const loginForm =
        document.getElementById("adminLoginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleAdminLogin
        );

    }


    const logoutButton =
        document.getElementById("adminLogout");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            handleAdminLogout
        );

    }


    const togglePassword =
        document.getElementById("toggleAdminPassword");

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            toggleAdminPassword
        );

    }


    document
        .querySelectorAll("[data-section]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    switchSection(
                        button.dataset.section
                    );

                }
            );

        });


    const refreshOrders =
        document.getElementById("refreshOrders");

    if (refreshOrders) {

        refreshOrders.addEventListener(
            "click",
            loadOrders
        );

    }


    const orderSearch =
        document.getElementById("orderSearch");

    if (orderSearch) {

        orderSearch.addEventListener(
            "input",
            filterOrders
        );

    }


    const statusFilter =
        document.getElementById("statusFilter");

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterOrders
        );

    }


    const addProductButton =
        document.getElementById("addProductButton");

    if (addProductButton) {

        addProductButton.addEventListener(
            "click",
            () => openProductModal()
        );

    }


    const closeProductModal =
        document.getElementById("closeProductModal");

    if (closeProductModal) {

        closeProductModal.addEventListener(
            "click",
            closeProductModalWindow
        );

    }


    const cancelProductButton =
        document.getElementById("cancelProductButton");

    if (cancelProductButton) {

        cancelProductButton.addEventListener(
            "click",
            closeProductModalWindow
        );

    }


    const productForm =
        document.getElementById("productForm");

    if (productForm) {

        productForm.addEventListener(
            "submit",
            saveProduct
        );

    }


    const productImage =
        document.getElementById("productImage");

    if (productImage) {

        productImage.addEventListener(
            "change",
            previewProductImage
        );

    }


    const productSearch =
        document.getElementById("productSearch");

    if (productSearch) {

        productSearch.addEventListener(
            "input",
            filterProducts
        );

    }


    const productCategoryFilter =
        document.getElementById("productCategoryFilter");

    if (productCategoryFilter) {

        productCategoryFilter.addEventListener(
            "change",
            filterProducts
        );

    }


    const productStatusFilter =
        document.getElementById("productStatusFilter");

    if (productStatusFilter) {

        productStatusFilter.addEventListener(
            "change",
            filterProducts
        );

    }


    const addCategoryButton =
        document.getElementById("addCategoryButton");

    if (addCategoryButton) {

        addCategoryButton.addEventListener(
            "click",
            () => openCategoryModal()
        );

    }


    const closeCategoryModal =
        document.getElementById("closeCategoryModal");

    if (closeCategoryModal) {

        closeCategoryModal.addEventListener(
            "click",
            closeCategoryModalWindow
        );

    }


    const cancelCategoryButton =
        document.getElementById("cancelCategoryButton");

    if (cancelCategoryButton) {

        cancelCategoryButton.addEventListener(
            "click",
            closeCategoryModalWindow
        );

    }


    const categoryForm =
        document.getElementById("categoryForm");

    if (categoryForm) {

        categoryForm.addEventListener(
            "submit",
            saveCategory
        );

    }


    const categorySearch =
        document.getElementById("categorySearch");

    if (categorySearch) {

        categorySearch.addEventListener(
            "input",
            filterCategories
        );

    }


    const categoryStatusFilter =
        document.getElementById("categoryStatusFilter");

    if (categoryStatusFilter) {

        categoryStatusFilter.addEventListener(
            "change",
            filterCategories
        );

    }


    const categoryName =
        document.getElementById("categoryName");

    if (categoryName) {

        categoryName.addEventListener(
            "input",
            () => {

                const slug =
                    document.getElementById("categorySlug");

                if (
                    slug &&
                    !document.getElementById("categoryId").value
                ) {

                    slug.value =
                        slugify(categoryName.value);

                }

            }
        );

    }


    const addCustomSizeButton =
        document.getElementById("addCustomSizeButton");

    if (addCustomSizeButton) {

        addCustomSizeButton.addEventListener(
            "click",
            addCustomSize
        );

    }


    const customSizeInput =
        document.getElementById("customSizeInput");

    if (customSizeInput) {

        customSizeInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    addCustomSize();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            closeProductModalWindow();

            closeCategoryModalWindow();

            closeDynamicOrderModal();

        }
    );
}


/* ============================================================
   SESSION
   ============================================================ */

async function checkAdminSession() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(error);

            showLoginMessage(
                "Unable to check admin session."
            );

            showLoginView();

            return;
        }


        currentUser =
            data?.session?.user || null;


        if (!currentUser) {

            showLoginView();

            return;
        }


        const isAdmin =
            await verifyAdmin(currentUser);


        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            showLoginView();

            showLoginMessage(
                "This account does not have admin access."
            );

            return;
        }


        showDashboard();

        await loadInitialDashboardData();

    } catch (error) {

        console.error(
            "Session error:",
            error
        );

        showLoginView();

    }
}


/* ============================================================
   VERIFY ADMIN
   ============================================================ */

async function verifyAdmin(user) {

    if (!user) {
        return false;
    }


    const email =
        String(user.email || "").toLowerCase();


    if (email === ADMIN_EMAIL.toLowerCase()) {
        return true;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("admin_users")
            .select("email")
            .eq("email", email)
            .maybeSingle();


        if (error) {

            console.error(
                "Admin verification:",
                error
            );

            return false;
        }


        return !!data;

    } catch (error) {

        console.error(error);

        return false;
    }
}


/* ============================================================
   LOGIN
   ============================================================ */

async function handleAdminLogin(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("adminEmail")
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("adminPassword")
            .value;


    const button =
        document.getElementById("adminLoginButton");

    const buttonText =
        document.getElementById("adminLoginButtonText");


    if (!email || !password) {

        showLoginMessage(
            "Enter your email and password."
        );

        return;
    }


    button.disabled = true;

    buttonText.textContent =
        "Logging in...";


    showLoginMessage("");


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });


        if (error) {
            throw error;
        }


        const user =
            data?.user;


        if (!user) {

            throw new Error(
                "Login failed."
            );

        }


        const isAdmin =
            await verifyAdmin(user);


        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            throw new Error(
                "This account is not authorized as an admin."
            );

        }


        currentUser = user;


        showDashboard();


        await loadInitialDashboardData();

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        showLoginMessage(
            error.message ||
            "Login failed. Check your details."
        );

    } finally {

        button.disabled = false;

        buttonText.textContent =
            "Login";

    }
}


/* ============================================================
   LOGOUT
   ============================================================ */

async function handleAdminLogout() {

    try {

        await supabaseClient.auth.signOut();

    } catch (error) {

        console.error(error);

    }


    currentUser = null;

    showLoginView();
}


/* ============================================================
   SHOW / HIDE VIEWS
   ============================================================ */

function showLoginView() {

    document
        .getElementById("adminLoginView")
        ?.classList.remove("hidden");

    document
        .getElementById("adminDashboardView")
        ?.classList.add("hidden");
}


function showDashboard() {

    document
        .getElementById("adminLoginView")
        ?.classList.add("hidden");

    document
        .getElementById("adminDashboardView")
        ?.classList.remove("hidden");
}


/* ============================================================
   LOGIN MESSAGE
   ============================================================ */

function showLoginMessage(message) {

    const element =
        document.getElementById("adminLoginMessage");

    if (element) {
        element.textContent = message;
    }
}


/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */

function toggleAdminPassword() {

    const password =
        document.getElementById("adminPassword");

    const button =
        document.getElementById("toggleAdminPassword");


    if (!password) {
        return;
    }


    if (password.type === "password") {

        password.type = "text";

        if (button) {
            button.textContent = "🙈";
        }

    } else {

        password.type = "password";

        if (button) {
            button.textContent = "👁️";
        }
    }
}


/* ============================================================
   SECTIONS
   ============================================================ */

function switchSection(sectionId) {

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.add("hidden");

        });


    const section =
        document.getElementById(sectionId);


    if (section) {
        section.classList.remove("hidden");
    }


    document
        .querySelectorAll("[data-section]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });


    if (sectionId === "ordersSection") {
        loadOrders();
    }

    if (sectionId === "productsSection") {
        loadProducts();
    }

    if (sectionId === "categoriesSection") {
        loadCategories();
    }
}


/* ============================================================
   INITIAL DASHBOARD DATA
   ============================================================ */

async function loadInitialDashboardData() {

    await loadCategories();

    await loadProducts();

    await loadOrders();

    populateCategorySelects();
}


/* ============================================================
   ORDERS
   ============================================================ */

async function loadOrders() {

    const table =
        document.getElementById("ordersTable");


    if (!table) {
        return;
    }


    table.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="admin-loading">
                    <span class="admin-spinner"></span>
                    Loading orders...
                </div>
            </td>
        </tr>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("orders")
            .select("*")
            .order("created_at", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        allOrders = data || [];


        updateOrderStats();

        filterOrders();

    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );


        allOrders = [];


        table.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="admin-error-state">
                        Unable to load orders.
                        <br>
                        <small>
                            ${escapeHtml(error.message)}
                        </small>
                    </div>
                </td>
            </tr>
        `;

    }
}


/* ============================================================
   ORDER STATS
   ============================================================ */

function updateOrderStats() {

    const total =
        allOrders.length;


    const pending =
        allOrders.filter(order =>
            String(order.status || "")
                .toLowerCase()
                .includes("pending")
        ).length;


    const paid =
        allOrders.filter(order => {

            const status =
                String(order.status || "")
                    .toLowerCase();

            return (
                status.includes("paid") ||
                status === "processing" ||
                status === "shipped" ||
                status === "delivered"
            );

        }).length;


    const delivered =
        allOrders.filter(order =>
            String(order.status || "")
                .toLowerCase() === "delivered"
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


/* ============================================================
   FILTER ORDERS
   ============================================================ */

function filterOrders() {

    const search =
        (
            document
                .getElementById("orderSearch")
                ?.value || ""
        )
        .trim()
        .toLowerCase();


    const status =
        document
            .getElementById("statusFilter")
            ?.value || "";


    const filtered =
        allOrders.filter(order => {

            const searchable = [
                order.order_reference,
                order.customer_name,
                order.customer_phone,
                order.phone,
                order.email
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(search);


            const matchesStatus =
                !status ||
                String(order.status || "") === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderOrders(filtered);
}


/* ============================================================
   RENDER ORDERS
   ============================================================ */

function renderOrders(orders) {

    const table =
        document.getElementById("ordersTable");

    const empty =
        document.getElementById("emptyOrders");


    if (!table) {
        return;
    }


    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="admin-empty-state">
                        No orders found.
                    </div>
                </td>
            </tr>
        `;

        empty?.classList.remove("hidden");

        return;
    }


    empty?.classList.add("hidden");


    table.innerHTML =
        orders
            .map(order =>
                createOrderRow(order)
            )
            .join("");
}


/* ============================================================
   ORDER ROW
   ============================================================ */

function createOrderRow(order) {

    const reference =
        order.order_reference ||
        order.reference ||
        order.id ||
        "N/A";


    const customer =
        order.customer_name ||
        "Customer";


    const phone =
        order.customer_phone ||
        order.phone ||
        "";


    const total =
        Number(
            order.total ||
            0
        );


    const status =
        order.status ||
        "Pending Payment";


    const payment =
        order.payment_method ||
        order.payment_status ||
        "—";


    const date =
        formatDate(
            order.created_at
        );


    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(reference)}
                </strong>
            </td>

            <td>

                <div class="order-customer">

                    <strong>
                        ${escapeHtml(customer)}
                    </strong>

                    <small>
                        ${escapeHtml(phone)}
                    </small>

                </div>

            </td>

            <td>
                <strong>
                    ${formatCurrency(total)}
                </strong>
            </td>

            <td>
                ${escapeHtml(payment)}
            </td>

            <td>
                ${statusBadge(status)}
            </td>

            <td>
                ${escapeHtml(date)}
            </td>

            <td>

                <button
                    type="button"
                    class="admin-action-button"
                    onclick="viewOrder('${escapeAttribute(reference)}')"
                >
                    View
                </button>

            </td>

        </tr>
    `;
}


/* ============================================================
   ORDER STATUS BADGE
   ============================================================ */

function statusBadge(status) {

    const normalized =
        String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");


    const className =
        normalized || "pending-payment";


    return `
        <span class="status-badge ${className}">
            ${escapeHtml(status || "Pending Payment")}
        </span>
    `;
}


/* ============================================================
   VIEW ORDER
   ============================================================ */

async function viewOrder(reference) {

    const order =
        allOrders.find(item =>
            String(
                item.order_reference ||
                item.reference ||
                item.id
            ) === String(reference)
        );


    if (!order) {

        alert(
            "Order could not be found."
        );

        return;
    }


    let items = [];


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("order_items")
            .select("*")
            .eq(
                "order_id",
                order.id
            );


        if (!error) {
            items = data || [];
        }

    } catch (error) {

        console.error(
            "Order items error:",
            error
        );

    }


    renderOrderModal(
        order,
        items
    );
}


/* ============================================================
   ORDER MODAL
   ============================================================ */

function renderOrderModal(
    order,
    items
) {

    closeDynamicOrderModal();


    const reference =
        order.order_reference ||
        order.reference ||
        order.id ||
        "N/A";


    const customer =
        order.customer_name ||
        "Customer";


    const phone =
        order.customer_phone ||
        order.phone ||
        "—";


    const email =
        order.customer_email ||
        order.email ||
        "—";


    const address =
        order.delivery_address ||
        order.address ||
        "—";


    const city =
        order.delivery_city ||
        order.city ||
        "—";


    const state =
        order.delivery_state ||
        order.state ||
        "—";


    const total =
        Number(order.total || 0);


    const subtotal =
        Number(order.subtotal || 0);


    const payNow =
        Number(
            order.pay_now ||
            order.amount_paid ||
            0
        );


    const balance =
        Number(
            order.balance ||
            Math.max(total - payNow, 0)
        );


    const status =
        order.status ||
        "Pending Payment";


    const notes =
        order.notes ||
        "No notes";


    const itemsHtml =
        items.length
            ? items.map(item => {

                const name =
                    item.product_name ||
                    item.name ||
                    "Product";

                const quantity =
                    Number(
                        item.quantity || 1
                    );

                const price =
                    Number(
                        item.price ||
                        item.unit_price ||
                        0
                    );

                const size =
                    item.size ||
                    item.selected_size ||
                    "";


                return `
                    <div class="admin-order-item">

                        <div>

                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <small>
                                Qty: ${quantity}
                                ${
                                    size
                                        ? ` • Size: ${escapeHtml(size)}`
                                        : ""
                                }
                            </small>

                        </div>

                        <strong>
                            ${formatCurrency(
                                price * quantity
                            )}
                        </strong>

                    </div>
                `;

            }).join("")
            : `
                <p>
                    No order items found.
                </p>
            `;


    const modal =
        document.createElement("div");


    modal.id =
        "dynamicOrderModal";

    modal.className =
        "admin-order-modal";


    modal.innerHTML = `

        <div
            class="admin-order-modal-backdrop"
            onclick="closeDynamicOrderModal()"
        ></div>


        <div class="admin-order-modal-content">

            <div class="admin-order-modal-header">

                <div>

                    <span>
                        Order Reference
                    </span>

                    <h2>
                        ${escapeHtml(reference)}
                    </h2>

                </div>


                <button
                    type="button"
                    onclick="closeDynamicOrderModal()"
                >
                    ×
                </button>

            </div>


            <div class="admin-order-details-grid">

                <div>

                    <span>
                        Customer
                    </span>

                    <strong>
                        ${escapeHtml(customer)}
                    </strong>

                </div>


                <div>

                    <span>
                        Phone
                    </span>

                    <strong>
                        ${escapeHtml(phone)}
                    </strong>

                </div>


                <div>

                    <span>
                        Email
                    </span>

                    <strong>
                        ${escapeHtml(email)}
                    </strong>

                </div>


                <div>

                    <span>
                        Status
                    </span>

                    <strong>
                        ${statusBadge(status)}
                    </strong>

                </div>


                <div>

                    <span>
                        Subtotal
                    </span>

                    <strong>
                        ${formatCurrency(subtotal)}
                    </strong>

                </div>


                <div>

                    <span>
                        Total
                    </span>

                    <strong>
                        ${formatCurrency(total)}
                    </strong>

                </div>


                <div>

                    <span>
                        Paid
                    </span>

                    <strong>
                        ${formatCurrency(payNow)}
                    </strong>

                </div>


                <div>

                    <span>
                        Balance
                    </span>

                    <strong>
                        ${formatCurrency(balance)}
                    </strong>

                </div>

            </div>


            <div class="admin-order-section">

                <h3>
                    Delivery Information
                </h3>

                <p>
                    <strong>
                        Address:
                    </strong>
                    ${escapeHtml(address)}
                </p>

                <p>
                    <strong>
                        City:
                    </strong>
                    ${escapeHtml(city)}
                </p>

                <p>
                    <strong>
                        State:
                    </strong>
                    ${escapeHtml(state)}
                </p>

            </div>


            <div class="admin-order-section">

                <h3>
                    Order Items
                </h3>

                <div class="admin-order-items">

                    ${itemsHtml}

                </div>

            </div>


            <div class="admin-order-section">

                <h3>
                    Notes
                </h3>

                <p>
                    ${escapeHtml(notes)}
                </p>


                <div class="admin-order-actions">

                    <button
                        type="button"
                        class="admin-secondary-button"
                        onclick="updateOrderStatus('${escapeAttribute(reference)}','Processing')"
                    >
                        Processing
                    </button>


                    <button
                        type="button"
                        class="admin-secondary-button"
                        onclick="updateOrderStatus('${escapeAttribute(reference)}','Shipped')"
                    >
                        Shipped
                    </button>


                    <button
                        type="button"
                        class="admin-secondary-button"
                        onclick="updateOrderStatus('${escapeAttribute(reference)}','Delivered')"
                    >
                        Delivered
                    </button>


                    <button
                        type="button"
                        class="admin-secondary-button"
                        onclick="updateOrderStatus('${escapeAttribute(reference)}','Cancelled')"
                    >
                        Cancel
                    </button>


                    <a
                        href="${TRACKING_URL}?order=${encodeURIComponent(reference)}"
                        target="_blank"
                        class="admin-primary-button"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                        "
                    >
                        View Tracking
                    </a>

                </div>

            </div>

        </div>
    `;


    document.body.appendChild(modal);


    document.body.style.overflow =
        "hidden";
}


/* ============================================================
   UPDATE ORDER STATUS
   ============================================================ */

async function updateOrderStatus(
    reference,
    newStatus
) {

    const order =
        allOrders.find(item =>
            String(
                item.order_reference ||
                item.reference ||
                item.id
            ) === String(reference)
        );


    if (!order) {

        alert(
            "Order not found."
        );

        return;
    }


    const confirmed =
        confirm(
            `Change order ${reference} status to "${newStatus}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient
            .from("orders")
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq(
                "id",
                order.id
            );


        if (error) {
            throw error;
        }


        order.status =
            newStatus;


        closeDynamicOrderModal();

        updateOrderStats();

        filterOrders();


        alert(
            "Order status updated."
        );

    } catch (error) {

        console.error(
            "Update order status error:",
            error
        );


        alert(
            error.message ||
            "Unable to update order."
        );
    }
}


/* ============================================================
   CLOSE ORDER MODAL
   ============================================================ */

function closeDynamicOrderModal() {

    const modal =
        document.getElementById(
            "dynamicOrderModal"
        );


    if (modal) {

        modal.remove();

        document.body.style.overflow =
            "";

    }
}


/* ============================================================
   PRODUCTS
   ============================================================ */

async function loadProducts() {

    const grid =
        document.getElementById(
            "productsAdminGrid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = `
        <div class="admin-loading">
            <span class="admin-spinner"></span>
            Loading products...
        </div>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select("*")
            .order("created_at", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        allProducts =
            data || [];


        renderProducts(
            allProducts
        );

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );


        grid.innerHTML = `
            <div class="admin-error-state">
                Unable to load products.
                <br>
                <small>
                    ${escapeHtml(error.message)}
                </small>
            </div>
        `;

    }
}


/* ============================================================
   FILTER PRODUCTS
   ============================================================ */

function filterProducts() {

    const search =
        (
            document
                .getElementById("productSearch")
                ?.value || ""
        )
        .trim()
        .toLowerCase();


    const category =
        document
            .getElementById("productCategoryFilter")
            ?.value || "";


    const status =
        document
            .getElementById("productStatusFilter")
            ?.value || "";


    const filtered =
        allProducts.filter(product => {

            const searchable = [
                product.name,
                product.id,
                product.category,
                product.description
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(search);


            const matchesCategory =
                !category ||
                product.category === category;


            const matchesStatus =
                !status ||
                (
                    status === "active"
                        ? product.is_active === true
                        : product.is_active === false
                );


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });


    renderProducts(filtered);
}


/* ============================================================
   RENDER PRODUCTS
   ============================================================ */

function renderProducts(products) {

    const grid =
        document.getElementById(
            "productsAdminGrid"
        );

    const empty =
        document.getElementById(
            "emptyProducts"
        );


    if (!grid) {
        return;
    }


    setText(
        "productsCount",
        `${products.length} product${products.length === 1 ? "" : "s"}`
    );


    if (!products.length) {

        grid.innerHTML = "";

        empty?.classList.remove(
            "hidden"
        );

        return;
    }


    empty?.classList.add(
        "hidden"
    );


    grid.innerHTML =
        products
            .map(product =>
                createProductCard(product)
            )
            .join("");
}


/* ============================================================
   PRODUCT CARD
   ============================================================ */

function createProductCard(product) {

    const image =
        product.image;


    const icon =
        product.icon ||
        "👟";


    const sizes =
        Array.isArray(product.sizes)
            ? product.sizes
            : parseSizes(product.sizes);


    const sizesText =
        sizes.length
            ? sizes.join(", ")
            : "No sizes";


    return `

        <article class="admin-product-card">

            <div class="admin-product-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="${escapeAttribute(product.name || "Product")}"
                            >
                        `
                        : `
                            <div class="admin-product-placeholder">
                                ${escapeHtml(icon)}
                            </div>
                        `
                }


                ${
                    product.badge
                        ? `
                            <span class="product-admin-badge">
                                ${escapeHtml(product.badge)}
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="admin-product-info">

                <div class="admin-product-top">

                    <span class="admin-product-category">
                        ${escapeHtml(product.category || "Uncategorized")}
                    </span>


                    ${
                        product.is_active
                            ? `
                                <span class="admin-active">
                                    Active
                                </span>
                            `
                            : `
                                <span class="admin-inactive">
                                    Inactive
                                </span>
                            `
                    }

                </div>


                <h3>
                    ${escapeHtml(product.name || "Unnamed Product")}
                </h3>


                <div class="admin-product-price">

                    ${formatCurrency(product.price)}

                    ${
                        product.old_price
                            ? `
                                <del>
                                    ${formatCurrency(product.old_price)}
                                </del>
                            `
                            : ""
                    }

                </div>


                <div class="admin-product-stock">

                    Stock:
                    <strong>
                        ${Number(product.stock || 0)}
                    </strong>

                    <br>

                    Sizes:
                    <strong>
                        ${escapeHtml(sizesText)}
                    </strong>

                </div>


                <div class="admin-product-actions">

                    <button
                        type="button"
                        onclick="editProduct('${escapeAttribute(product.id)}')"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        onclick="toggleProductStatus('${escapeAttribute(product.id)}')"
                    >
                        ${
                            product.is_active
                                ? "Disable"
                                : "Activate"
                        }
                    </button>


                    <button
                        type="button"
                        class="danger"
                        onclick="deleteProduct('${escapeAttribute(product.id)}')"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </article>
    `;
}


/* ============================================================
   PRODUCT MODAL
   ============================================================ */

function openProductModal(product = null) {

    const modal =
        document.getElementById(
            "productModal"
        );


    if (!modal) {
        return;
    }


    resetProductForm();


    if (product) {

        setText(
            "productModalTitle",
            "Edit Product"
        );


        setValue(
            "productId",
            product.id
        );


        setValue(
            "productName",
            product.name
        );


        setValue(
            "productCategory",
            product.category
        );


        setValue(
            "productBadge",
            product.badge
        );


        setValue(
            "productPrice",
            product.price
        );


        setValue(
            "productOldPrice",
            product.old_price
        );


        setValue(
            "productStock",
            product.stock
        );


        setValue(
            "productIcon",
            product.icon || "👟"
        );


        setValue(
            "productDescription",
            product.description
        );


        const active =
            document.getElementById(
                "productActive"
            );


        if (active) {
            active.checked =
                product.is_active !== false;
        }


        showExistingProductImage(
            product.image
        );


        const sizes =
            Array.isArray(product.sizes)
                ? product.sizes
                : parseSizes(product.sizes);


        setSelectedSizes(
            sizes
        );

    } else {

        setText(
            "productModalTitle",
            "Add Product"
        );

        setSelectedSizes([]);

    }


    modal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";
}


/* ============================================================
   RESET PRODUCT FORM
   ============================================================ */

function resetProductForm() {

    const form =
        document.getElementById(
            "productForm"
        );


    if (form) {
        form.reset();
    }


    setValue(
        "productId",
        ""
    );


    setValue(
        "productIcon",
        "👟"
    );


    const active =
        document.getElementById(
            "productActive"
        );


    if (active) {
        active.checked = true;
    }


    customSizes = [];


    renderCustomSizes();


    setText(
        "productFormMessage",
        ""
    );


    const preview =
        document.getElementById(
            "productImagePreview"
        );


    if (preview) {

        preview.innerHTML = `
            <span>
                No image selected
            </span>
        `;

    }
}


/* ============================================================
   CLOSE PRODUCT MODAL
   ============================================================ */

function closeProductModalWindow() {

    const modal =
        document.getElementById(
            "productModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    document.body.style.overflow =
        "";
}


/* ============================================================
   IMAGE PREVIEW
   ============================================================ */

function previewProductImage(event) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    const preview =
        document.getElementById(
            "productImagePreview"
        );


    if (!preview) {
        return;
    }


    const url =
        URL.createObjectURL(file);


    preview.innerHTML = `
        <img
            src="${url}"
            alt="Product preview"
        >
    `;
}


/* ============================================================
   EXISTING IMAGE
   ============================================================ */

function showExistingProductImage(
    image
) {

    const preview =
        document.getElementById(
            "productImagePreview"
        );


    if (!preview) {
        return;
    }


    if (!image) {

        preview.innerHTML = `
            <span>
                No image selected
            </span>
        `;

        return;
    }


    preview.innerHTML = `
        <img
            src="${escapeAttribute(image)}"
            alt="Product image"
        >
    `;
}


/* ============================================================
   SIZE MANAGEMENT
   ============================================================ */

/*
    Built-in sizes:
    39, 40, 41, 42, 43, 44, 45

    Additional sizes:
    Stored in customSizes[]
*/

function setSelectedSizes(
    sizes
) {

    const normalized =
        sizes
            .map(size =>
                String(size).trim()
            )
            .filter(Boolean);


    document
        .querySelectorAll(
            'input[name="productSize"]'
        )
        .forEach(checkbox => {

            checkbox.checked =
                normalized.includes(
                    checkbox.value
                );

        });


    customSizes =
        normalized.filter(
            size =>
                ![
                    "39",
                    "40",
                    "41",
                    "42",
                    "43",
                    "44",
                    "45"
                ].includes(size)
        );


    renderCustomSizes();
}


/* ============================================================
   GET SELECTED SIZES
   ============================================================ */

function getSelectedSizes() {

    const sizes = [];


    document
        .querySelectorAll(
            'input[name="productSize"]:checked'
        )
        .forEach(checkbox => {

            sizes.push(
                checkbox.value
            );

        });


    customSizes.forEach(size => {

        if (!sizes.includes(size)) {

            sizes.push(size);

        }

    });


    return sizes;
}


/* ============================================================
   ADD CUSTOM SIZE
   ============================================================ */

function addCustomSize() {

    const input =
        document.getElementById(
            "customSizeInput"
        );


    if (!input) {
        return;
    }


    const size =
        input.value.trim();


    if (!size) {

        alert(
            "Enter a size first."
        );

        input.focus();

        return;
    }


    const normalized =
        size.toUpperCase();


    const existingSizes =
        getSelectedSizes()
            .map(value =>
                String(value).toUpperCase()
            );


    if (
        existingSizes.includes(
            normalized
        )
    ) {

        alert(
            "This size has already been added."
        );

        input.select();

        return;
    }


    customSizes.push(
        size
    );


    input.value = "";


    renderCustomSizes();


    input.focus();
}


/* ============================================================
   RENDER CUSTOM SIZES
   ============================================================ */

function renderCustomSizes() {

    const container =
        document.getElementById(
            "customSizesList"
        );


    if (!container) {
        return;
    }


    if (!customSizes.length) {

        container.innerHTML = "";

        return;
    }


    container.innerHTML =
        customSizes
            .map((size, index) => `

                <span
                    style="
                        display:inline-flex;
                        align-items:center;
                        gap:6px;
                        padding:6px 9px;
                        border:1px solid rgba(212,175,55,.35);
                        border-radius:999px;
                        background:rgba(212,175,55,.08);
                        color:#e8cc67;
                        font-size:11px;
                        font-weight:700;
                    "
                >

                    ${escapeHtml(size)}

                    <button
                        type="button"
                        onclick="removeCustomSize(${index})"
                        style="
                            width:20px;
                            height:20px;
                            padding:0;
                            border:0;
                            border-radius:50%;
                            background:rgba(255,98,98,.12);
                            color:#ff6262;
                            cursor:pointer;
                            line-height:1;
                        "
                        aria-label="Remove size"
                    >
                        ×
                    </button>

                </span>

            `)
            .join("");
}


/* ============================================================
   REMOVE CUSTOM SIZE
   ============================================================ */

function removeCustomSize(index) {

    customSizes.splice(
        index,
        1
    );


    renderCustomSizes();
}


/* ============================================================
   SAVE PRODUCT
   ============================================================ */

async function saveProduct(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "productFormMessage"
        );


    const saveButton =
        document.getElementById(
            "saveProductButton"
        );


    const productId =
        document
            .getElementById("productId")
            ?.value
            .trim();


    const name =
        document
            .getElementById("productName")
            ?.value
            .trim();


    const category =
        document
            .getElementById("productCategory")
            ?.value
            .trim();


    const badge =
        document
            .getElementById("productBadge")
            ?.value
            .trim();


    const price =
        Number(
            document
                .getElementById("productPrice")
                ?.value || 0
        );


    const oldPriceValue =
        document
            .getElementById("productOldPrice")
            ?.value;


    const oldPrice =
        oldPriceValue
            ? Number(oldPriceValue)
            : null;


    const stock =
        Number(
            document
                .getElementById("productStock")
                ?.value || 0
        );


    const icon =
        document
            .getElementById("productIcon")
            ?.value
            .trim() ||
        "👟";


    const description =
        document
            .getElementById("productDescription")
            ?.value
            .trim() ||
        "";


    const active =
        document
            .getElementById("productActive")
            ?.checked !== false;


    const imageFile =
        document
            .getElementById("productImage")
            ?.files?.[0];


    const sizes =
        getSelectedSizes();


    if (!name) {

        setText(
            "productFormMessage",
            "Enter the product name."
        );

        return;
    }


    if (!category) {

        setText(
            "productFormMessage",
            "Select a category."
        );

        return;
    }


    if (price < 0) {

        setText(
            "productFormMessage",
            "Price cannot be negative."
        );

        return;
    }


    if (stock < 0) {

        setText(
            "productFormMessage",
            "Stock cannot be negative."
        );

        return;
    }


    saveButton.disabled = true;

    saveButton.textContent =
        "Saving...";


    setText(
        "productFormMessage",
        ""
    );


    try {

        /*
         * Generate ID for new product.
         */

        let finalProductId =
            productId;


        if (!finalProductId) {

            finalProductId =
                createProductId(
                    name
                );

        }


        /*
         * Upload image if one was selected.
         */

        let imageUrl = null;


        if (imageFile) {

            imageUrl =
                await uploadProductImage(
                    finalProductId,
                    imageFile
                );

        }


        /*
         * Keep existing image
         * when editing without
         * selecting a new image.
         */

        if (
            !imageUrl &&
            productId
        ) {

            const existing =
                allProducts.find(
                    product =>
                        String(product.id) ===
                        String(productId)
                );


            imageUrl =
                existing?.image ||
                null;

        }


        const productData = {

            id: finalProductId,

            name,

            category,

            price,

            old_price:
                oldPrice,

            badge:
                badge || null,

            icon,

            image:
                imageUrl,

            description,

            sizes,

            stock,

            is_active:
                active,

            updated_at:
                new Date().toISOString()

        };


        /*
         * New product
         */

        if (!productId) {

            productData.created_at =
                new Date().toISOString();


            const {
                error
            } = await supabaseClient
                .from("products")
                .insert(productData);


            if (error) {
                throw error;
            }


            alert(
                "Product added successfully."
            );

        } else {

            /*
             * Edit product
             */

            const {
                error
            } = await supabaseClient
                .from("products")
                .update(productData)
                .eq(
                    "id",
                    productId
                );


            if (error) {
                throw error;
            }


            alert(
                "Product updated successfully."
            );
        }


        closeProductModalWindow();

        await loadProducts();

    } catch (error) {

        console.error(
            "Save product error:",
            error
        );


        setText(
            "productFormMessage",
            error.message ||
            "Unable to save product."
        );

    } finally {

        saveButton.disabled = false;

        saveButton.textContent =
            "Save Product";

    }
}


/* ============================================================
   UPLOAD PRODUCT IMAGE
   ============================================================ */

async function uploadProductImage(
    productId,
    file
) {

    if (!file) {
        return null;
    }


    const extension =
        (
            file.name.split(".").pop() ||
            "jpg"
        )
        .toLowerCase();


    const filePath =
        `products/${productId}-${Date.now()}.${extension}`;


    const {
        error
    } = await supabaseClient
        .storage
        .from("product-images")
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false
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


    const {
        data
    } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(
            filePath
        );


    return data?.publicUrl || null;
}


/* ============================================================
   EDIT PRODUCT
   ============================================================ */

function editProduct(productId) {

    const product =
        allProducts.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        alert(
            "Product not found."
        );

        return;
    }


    openProductModal(
        product
    );
}


/* ============================================================
   TOGGLE PRODUCT
   ============================================================ */

async function toggleProductStatus(
    productId
) {

    const product =
        allProducts.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {
        return;
    }


    const newStatus =
        !product.is_active;


    try {

        const {
            error
        } = await supabaseClient
            .from("products")
            .update({
                is_active: newStatus,
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                productId
            );


        if (error) {
            throw error;
        }


        await loadProducts();

    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message ||
            "Unable to update product."
        );
    }
}


/* ============================================================
   DELETE PRODUCT
   ============================================================ */

async function deleteProduct(
    productId
) {

    const product =
        allProducts.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${product.name}"? This cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient
            .from("products")
            .delete()
            .eq(
                "id",
                productId
            );


        if (error) {
            throw error;
        }


        alert(
            "Product deleted."
        );


        await loadProducts();

    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete product."
        );
    }
}


/* ============================================================
   CATEGORIES
   ============================================================ */

async function loadCategories() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("categories")
            .select("*")
            .order("name", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        allCategories =
            data || [];


        populateCategorySelects();

        renderCategories(
            allCategories
        );

    } catch (error) {

        console.error(
            "Load categories error:",
            error
        );


        allCategories = [];


        renderCategories([]);

    }
}


/* ============================================================
   CATEGORY SELECTS
   ============================================================ */

function populateCategorySelects() {

    const productCategory =
        document.getElementById(
            "productCategory"
        );


    const productFilter =
        document.getElementById(
            "productCategoryFilter"
        );


    if (productCategory) {

        const current =
            productCategory.value;


        productCategory.innerHTML = `
            <option value="">
                Select category
            </option>
        `;


        allCategories
            .filter(category =>
                category.is_active !== false
            )
            .forEach(category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.slug;

                option.textContent =
                    category.name;


                productCategory.appendChild(
                    option
                );

            });


        if (current) {

            productCategory.value =
                current;

        }
    }


    if (productFilter) {

        const current =
            productFilter.value;


        productFilter.innerHTML = `
            <option value="">
                All categories
            </option>
        `;


        allCategories
            .forEach(category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.slug;

                option.textContent =
                    category.name;


                productFilter.appendChild(
                    option
                );

            });


        if (current) {

            productFilter.value =
                current;

        }
    }
}


/* ============================================================
   FILTER CATEGORIES
   ============================================================ */

function filterCategories() {

    const search =
        (
            document
                .getElementById("categorySearch")
                ?.value || ""
        )
        .trim()
        .toLowerCase();


    const status =
        document
            .getElementById(
                "categoryStatusFilter"
            )
            ?.value || "";


    const filtered =
        allCategories.filter(
            category => {

                const searchable = [
                    category.name,
                    category.slug,
                    category.description
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(search);


                const matchesStatus =
                    !status ||
                    (
                        status === "active"
                            ? category.is_active === true
                            : category.is_active === false
                    );


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderCategories(
        filtered
    );
}


/* ============================================================
   RENDER CATEGORIES
   ============================================================ */

function renderCategories(
    categories
) {

    const grid =
        document.getElementById(
            "categoriesAdminGrid"
        );


    const empty =
        document.getElementById(
            "emptyCategories"
        );


    if (!grid) {
        return;
    }


    setText(
        "categoriesCount",
        `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`
    );


    if (!categories.length) {

        grid.innerHTML = "";

        empty?.classList.remove(
            "hidden"
        );

        return;
    }


    empty?.classList.add(
        "hidden"
    );


    grid.innerHTML =
        categories
            .map(category =>
                createCategoryCard(
                    category
                )
            )
            .join("");
}


/* ============================================================
   CATEGORY CARD
   ============================================================ */

function createCategoryCard(
    category
) {

    return `

        <article class="admin-category-card">

            <div class="admin-category-info">

                <div class="admin-category-heading">

                    <h3>
                        ${escapeHtml(
                            category.name
                        )}
                    </h3>


                    ${
                        category.is_active
                            ? `
                                <span class="admin-active">
                                    Active
                                </span>
                            `
                            : `
                                <span class="admin-inactive">
                                    Inactive
                                </span>
                            `
                    }

                </div>


                <p class="admin-category-slug">
                    /${escapeHtml(
                        category.slug
                    )}
                </p>


                <p>
                    ${escapeHtml(
                        category.description ||
                        "No description."
                    )}
                </p>

            </div>


            <div class="admin-category-actions">

                <button
                    type="button"
                    onclick="editCategory('${escapeAttribute(category.id)}')"
                >
                    Edit
                </button>


                <button
                    type="button"
                    onclick="toggleCategoryStatus('${escapeAttribute(category.id)}')"
                >
                    ${
                        category.is_active
                            ? "Disable"
                            : "Activate"
                    }
                </button>


                <button
                    type="button"
                    class="danger"
                    onclick="deleteCategory('${escapeAttribute(category.id)}')"
                >
                    Delete
                </button>

            </div>

        </article>
    `;
}


/* ============================================================
   OPEN CATEGORY MODAL
   ============================================================ */

function openCategoryModal(
    category = null
) {

    const modal =
        document.getElementById(
            "categoryModal"
        );


    const form =
        document.getElementById(
            "categoryForm"
        );


    if (!modal || !form) {
        return;
    }


    form.reset();


    setValue(
        "categoryId",
        ""
    );


    setText(
        "categoryFormMessage",
        ""
    );


    const active =
        document.getElementById(
            "categoryActive"
        );


    if (active) {
        active.checked = true;
    }


    if (category) {

        setText(
            "categoryModalTitle",
            "Edit Category"
        );


        setValue(
            "categoryId",
            category.id
        );


        setValue(
            "categoryName",
            category.name
        );


        setValue(
            "categorySlug",
            category.slug
        );


        setValue(
            "categoryDescription",
            category.description
        );


        if (active) {
            active.checked =
                category.is_active !== false;
        }

    } else {

        setText(
            "categoryModalTitle",
            "Add Category"
        );

    }


    modal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";
}


/* ============================================================
   CLOSE CATEGORY MODAL
   ============================================================ */

function closeCategoryModalWindow() {

    const modal =
        document.getElementById(
            "categoryModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    document.body.style.overflow =
        "";
}


/* ============================================================
   SAVE CATEGORY
   ============================================================ */

async function saveCategory(event) {

    event.preventDefault();


    const id =
        document
            .getElementById("categoryId")
            ?.value
            .trim();


    const name =
        document
            .getElementById("categoryName")
            ?.value
            .trim();


    const slug =
        slugify(
            document
                .getElementById("categorySlug")
                ?.value
        );


    const description =
        document
            .getElementById("categoryDescription")
            ?.value
            .trim() ||
        "";


    const active =
        document
            .getElementById("categoryActive")
            ?.checked !== false;


    const message =
        document.getElementById(
            "categoryFormMessage"
        );


    const button =
        document.getElementById(
            "saveCategoryButton"
        );


    if (!name) {

        setText(
            "categoryFormMessage",
            "Enter the category name."
        );

        return;
    }


    if (!slug) {

        setText(
            "categoryFormMessage",
            "Enter a valid category slug."
        );

        return;
    }


    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        const categoryData = {

            name,

            slug,

            description,

            is_active:
                active,

            updated_at:
                new Date().toISOString()

        };


        if (id) {

            const {
                error
            } = await supabaseClient
                .from("categories")
                .update(categoryData)
                .eq(
                    "id",
                    id
                );


            if (error) {
                throw error;
            }


            alert(
                "Category updated successfully."
            );

        } else {

            const {
                error
            } = await supabaseClient
                .from("categories")
                .insert({
                    ...categoryData,
                    created_at:
                        new Date().toISOString()
                });


            if (error) {
                throw error;
            }


            alert(
                "Category added successfully."
            );
        }


        closeCategoryModalWindow();

        await loadCategories();

        populateCategorySelects();

        await loadProducts();

    } catch (error) {

        console.error(
            "Save category error:",
            error
        );


        setText(
            "categoryFormMessage",
            error.message ||
            "Unable to save category."
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Save Category";

    }
}


/* ============================================================
   EDIT CATEGORY
   ============================================================ */

function editCategory(
    categoryId
) {

    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );


    if (!category) {

        alert(
            "Category not found."
        );

        return;
    }


    openCategoryModal(
        category
    );
}


/* ============================================================
   TOGGLE CATEGORY
   ============================================================ */

async function toggleCategoryStatus(
    categoryId
) {

    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );


    if (!category) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient
            .from("categories")
            .update({
                is_active:
                    !category.is_active,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                categoryId
            );


        if (error) {
            throw error;
        }


        await loadCategories();

        populateCategorySelects();

    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message ||
            "Unable to update category."
        );
    }
}


/* ============================================================
   DELETE CATEGORY
   ============================================================ */

async function deleteCategory(
    categoryId
) {

    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );


    if (!category) {
        return;
    }


    const usedByProducts =
        allProducts.some(
            product =>
                product.category ===
                category.slug
        );


    if (usedByProducts) {

        alert(
            "This category is being used by one or more products. Disable it instead of deleting it."
        );

        return;
    }


    const confirmed =
        confirm(
            `Delete category "${category.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient
            .from("categories")
            .delete()
            .eq(
                "id",
                categoryId
            );


        if (error) {
            throw error;
        }


        alert(
            "Category deleted."
        );


        await loadCategories();

        populateCategorySelects();

    } catch (error) {

        console.error(
            "Delete category error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete category."
        );
    }
}


/* ============================================================
   HELPERS
   ============================================================ */

function createProductId(
    name
) {

    const base =
        slugify(name)
            .replace(/-/g, "-")
            .slice(0, 35);


    const random =
        Math.random()
            .toString(36)
            .slice(2, 7);


    return `${base}-${random}`;
}


function slugify(
    value = ""
) {

    return String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}


function parseSizes(
    value
) {

    if (Array.isArray(value)) {
        return value;
    }


    if (!value) {
        return [];
    }


    return String(value)
        .split(",")
        .map(size =>
            size.trim()
        )
        .filter(Boolean);
}


function formatCurrency(
    amount
) {

    const number =
        Number(amount || 0);


    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(number);
}


function formatDate(
    date
) {

    if (!date) {
        return "—";
    }


    try {

        return new Intl.DateTimeFormat(
            "en-NG",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(
            new Date(date)
        );

    } catch {

        return String(date);

    }
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent =
            value ?? "";
    }
}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.value =
            value ?? "";
    }
}


function escapeHtml(
    value
) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(
    value
) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.viewOrder =
    viewOrder;

window.closeDynamicOrderModal =
    closeDynamicOrderModal;

window.updateOrderStatus =
    updateOrderStatus;

window.editProduct =
    editProduct;

window.toggleProductStatus =
    toggleProductStatus;

window.deleteProduct =
    deleteProduct;

window.editCategory =
    editCategory;

window.toggleCategoryStatus =
    toggleCategoryStatus;

window.deleteCategory =
    deleteCategory;

window.removeCustomSize =
    removeCustomSize;

window.openProductModal =
    openProductModal;

window.openCategoryModal =
    openCategoryModal;