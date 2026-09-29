// ============================================================
// AYODEJI FASHION HUBS
// ADMIN DASHBOARD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();
});


// ============================================================
// CONFIG
// ============================================================

const ADMIN_EMAIL = "kabirabdulazeez45@gmail.com";

const TRACKING_URL =
    "https://kabirabdulazeez9-lab.github.io/ayodeji-fashion-hubs/track-order.html";

const EMAILJS_SERVICE_ID = "service_1d6t1el";
const EMAILJS_TEMPLATE_ID = "template_vo44x4z";
const EMAILJS_PUBLIC_KEY = "zDU17Xd3CuZ3fJztk";

let adminUser = null;
let allOrders = [];
let allProducts = [];
let allCategories = [];
let customSizes = [];


// ============================================================
// INITIALIZE
// ============================================================

async function initializeAdmin() {

    if (!window.supabaseClient) {
        console.error("Supabase client was not loaded.");
        return;
    }

    initializeEmailJS();
    setupPasswordToggle();
    setupNavigation();
    setupLogout();
    setupOrderControls();
    setupProductControls();
    setupCategoryControls();
    setupOrderEditFormEvents();
    setupProductFormEvents();
    setupCategoryFormEvents();

    await checkAdminSession();
}


// ============================================================
// EMAILJS
// ============================================================

function initializeEmailJS() {

    if (
        typeof emailjs !== "undefined" &&
        typeof emailjs.init === "function"
    ) {
        emailjs.init({
            publicKey: EMAILJS_PUBLIC_KEY
        });
    }
}


// ============================================================
// ADMIN SESSION
// ============================================================

async function checkAdminSession() {

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        console.error("Session error:", error);
        showLoginView();
        return;
    }

    if (!data.session) {
        showLoginView();
        return;
    }

    const user = data.session.user;

    const isAdmin =
        await verifyAdmin(user);

    if (!isAdmin) {

        await supabaseClient.auth.signOut();

        showLoginMessage(
            "You are not authorized to access the admin dashboard.",
            "error"
        );

        showLoginView();

        return;
    }

    adminUser = user;

    showDashboard();

    await loadInitialDashboardData();
}


// ============================================================
// VERIFY ADMIN
// ============================================================

async function verifyAdmin(user) {

    if (!user) {
        return false;
    }

    if (
        user.email &&
        user.email.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
    ) {
        return true;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("admin_users")
                .select("id,email")
                .eq("email", user.email)
                .maybeSingle();

        if (error) {
            console.error("Admin verification error:", error);
            return false;
        }

        return !!data;

    } catch (error) {

        console.error(error);
        return false;
    }
}


// ============================================================
// LOGIN
// ============================================================

const loginForm = document.getElementById("adminLoginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        await handleAdminLogin();
    });
}


async function handleAdminLogin() {

    const email =
        getValue("adminEmail").trim();

    const password =
        getValue("adminPassword");

    const button =
        document.getElementById("adminLoginButton");

    const buttonText =
        document.getElementById("adminLoginButtonText");

    const message =
        document.getElementById("adminLoginMessage");

    if (!email || !password) {

        showLoginMessage(
            "Enter your email and password.",
            "error"
        );

        return;
    }

    if (button) {
        button.disabled = true;
    }

    if (buttonText) {
        buttonText.textContent = "Signing in...";
    }

    if (message) {
        message.textContent = "";
        message.className = "admin-message";
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

        if (!data.user) {
            throw new Error("Login failed.");
        }

        const isAdmin =
            await verifyAdmin(data.user);

        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            throw new Error(
                "This account is not authorized to access the admin dashboard."
            );
        }

        adminUser = data.user;

        showLoginMessage(
            "Login successful.",
            "success"
        );

        showDashboard();

        await loadInitialDashboardData();

    } catch (error) {

        console.error(error);

        showLoginMessage(
            getAdminErrorMessage(error),
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

        if (buttonText) {
            buttonText.textContent = "Login";
        }
    }
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutButton =
        document.getElementById("adminLogout");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        adminUser = null;

        showLoginView();
    });
}


// ============================================================
// SHOW LOGIN / DASHBOARD
// ============================================================

function showLoginView() {

    const loginView =
        document.getElementById("adminLoginView");

    const dashboardView =
        document.getElementById("adminDashboardView");

    if (loginView) {
        loginView.style.display = "";
    }

    if (dashboardView) {
        dashboardView.style.display = "none";
    }
}


function showDashboard() {

    const loginView =
        document.getElementById("adminLoginView");

    const dashboardView =
        document.getElementById("adminDashboardView");

    if (loginView) {
        loginView.style.display = "none";
    }

    if (dashboardView) {
        dashboardView.style.display = "";
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    const tabs =
        document.querySelectorAll("[data-section]");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const sectionId =
                tab.dataset.section;

            tabs.forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            document
                .querySelectorAll(".admin-section")
                .forEach(section => {

                    section.style.display = "none";
                });

            const section =
                document.getElementById(sectionId);

            if (section) {
                section.style.display = "";
            }
        });
    });
}


// ============================================================
// INITIAL DATA
// ============================================================

async function loadInitialDashboardData() {

    await loadCategories();
    await loadProducts();
    await loadOrders();

    populateCategorySelects();
}


// ============================================================
// ORDERS
// ============================================================

function setupOrderControls() {

    const refreshButton =
        document.getElementById("refreshOrders");

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadOrders
        );
    }

    const search =
        document.getElementById("orderSearch");

    if (search) {

        search.addEventListener("input", () => {
            renderFilteredOrders();
        });
    }

    const statusFilter =
        document.getElementById("statusFilter");

    if (statusFilter) {

        statusFilter.addEventListener("change", () => {
            renderFilteredOrders();
        });
    }
}


// ============================================================
// LOAD ORDERS
// ============================================================

async function loadOrders() {

    const table =
        document.getElementById("ordersTable");

    if (table) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Loading orders...
                </td>
            </tr>
        `;
    }

    try {

        const { data, error } =
            await supabaseClient
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

        renderFilteredOrders();

    } catch (error) {

        console.error("Load orders error:", error);

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        Failed to load orders.
                    </td>
                </tr>
            `;
        }
    }
}


// ============================================================
// ORDER STATS
// ============================================================

function updateOrderStats() {

    const totalOrders =
        document.getElementById("totalOrders");

    const pendingPayment =
        document.getElementById("pendingPayment");

    const paidOrders =
        document.getElementById("paidOrders");

    const deliveredOrders =
        document.getElementById("deliveredOrders");

    const orders = allOrders || [];

    if (totalOrders) {
        totalOrders.textContent =
            orders.length;
    }

    if (pendingPayment) {

        pendingPayment.textContent =
            orders.filter(order => {

                const status =
                    String(order.status || "")
                        .toLowerCase();

                const payment =
                    String(order.payment_status || "")
                        .toLowerCase();

                return (
                    status.includes("pending") ||
                    payment.includes("pending")
                );

            }).length;
    }

    if (paidOrders) {

        paidOrders.textContent =
            orders.filter(order => {

                const payment =
                    String(order.payment_status || "")
                        .toLowerCase();

                const status =
                    String(order.status || "")
                        .toLowerCase();

                return (
                    payment.includes("paid") ||
                    status.includes("paid") ||
                    status === "deposit paid"
                );

            }).length;
    }

    if (deliveredOrders) {

        deliveredOrders.textContent =
            orders.filter(order =>
                String(order.status || "")
                    .toLowerCase() === "delivered"
            ).length;
    }
}


// ============================================================
// FILTER ORDERS
// ============================================================

function renderFilteredOrders() {

    const searchInput =
        document.getElementById("orderSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "";

    let filtered =
        [...allOrders];

    if (search) {

        filtered =
            filtered.filter(order => {

                const values = [
                    order.order_reference,
                    order.customer_name,
                    order.customer_phone,
                    order.customer_email
                ];

                return values.some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );
            });
    }

    if (selectedStatus) {

        filtered =
            filtered.filter(order =>
                String(order.status || "")
                    .toLowerCase() ===
                selectedStatus.toLowerCase()
            );
    }

    renderOrders(filtered);
}


// ============================================================
// RENDER ORDERS
// ============================================================

function renderOrders(orders) {

    const table =
        document.getElementById("ordersTable");

    const grid =
        document.getElementById("ordersGrid");

    const empty =
        document.getElementById("emptyOrders");

    if (!orders.length) {

        if (table) {
            table.innerHTML = "";
        }

        if (grid) {
            grid.innerHTML = "";
        }

        if (empty) {
            empty.style.display = "";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (table) {

        table.innerHTML =
            orders.map(order => {

                const total =
                    Number(order.total || 0);

                const date =
                    formatDate(order.created_at);

                const status =
                    order.status || "Pending Payment";

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    order.order_reference || "—"
                                )}
                            </strong>
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    order.customer_name || "—"
                                )}
                            </strong>
                            <small>
                                ${escapeHtml(
                                    order.customer_phone || ""
                                )}
                            </small>
                        </td>

                        <td>
                            ${formatCurrency(total)}
                        </td>

                        <td>
                            ${escapeHtml(
                                order.payment_method || "—"
                            )}
                        </td>

                        <td>
                            <span class="status-badge ${getStatusClass(status)}">
                                ${escapeHtml(status)}
                            </span>
                        </td>

                        <td>
                            ${date}
                        </td>

                        <td>
                            <div class="admin-order-actions">

                                <button
                                    type="button"
                                    class="admin-small-button"
                                    onclick="viewOrder('${escapeAttribute(order.id)}')"
                                >
                                    View
                                </button>

                                <button
                                    type="button"
                                    class="admin-small-button edit"
                                    onclick="editOrder('${escapeAttribute(order.id)}')"
                                >
                                    Edit
                                </button>

                            </div>
                        </td>

                    </tr>
                `;

            }).join("");
    }

    if (grid) {

        grid.innerHTML =
            orders.map(order => {

                return `
                    <article class="admin-order-card">

                        <div class="admin-order-card-header">

                            <strong>
                                ${escapeHtml(
                                    order.order_reference || "—"
                                )}
                            </strong>

                            <span class="status-badge ${getStatusClass(order.status)}">
                                ${escapeHtml(
                                    order.status || "Pending Payment"
                                )}
                            </span>

                        </div>

                        <div class="admin-order-card-body">

                            <p>
                                <strong>Customer:</strong>
                                ${escapeHtml(
                                    order.customer_name || "—"
                                )}
                            </p>

                            <p>
                                <strong>Phone:</strong>
                                ${escapeHtml(
                                    order.customer_phone || "—"
                                )}
                            </p>

                            <p>
                                <strong>Total:</strong>
                                ${formatCurrency(
                                    Number(order.total || 0)
                                )}
                            </p>

                            <p>
                                <strong>Payment:</strong>
                                ${escapeHtml(
                                    order.payment_method || "—"
                                )}
                            </p>

                        </div>

                        <div class="admin-order-card-actions">

                            <button
                                type="button"
                                class="admin-small-button"
                                onclick="viewOrder('${escapeAttribute(order.id)}')"
                            >
                                View Order
                            </button>

                            <button
                                type="button"
                                class="admin-small-button edit"
                                onclick="editOrder('${escapeAttribute(order.id)}')"
                            >
                                Edit Order
                            </button>

                        </div>

                    </article>
                `;
            }).join("");
    }
}


// ============================================================
// VIEW ORDER
// ============================================================

async function viewOrder(orderId) {

    const order =
        allOrders.find(item =>
            String(item.id) === String(orderId)
        );

    if (!order) {
        alert("Order not found.");
        return;
    }

    let items = [];

    try {

        const { data, error } =
            await supabaseClient
                .from("order_items")
                .select("*")
                .eq("order_id", order.id);

        if (error) {
            console.error("Order items error:", error);
        } else {
            items = data || [];
        }

    } catch (error) {

        console.error(error);
    }

    renderOrderModal(order, items);
}


// ============================================================
// ORDER DETAILS MODAL
// ============================================================

function renderOrderModal(order, items) {

    closeDynamicOrderModal();

    const modal =
        document.createElement("div");

    modal.id = "dynamicOrderModal";
    modal.className = "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal admin-order-modal">

            <div class="admin-modal-header">

                <div>
                    <h2>Order Details</h2>

                    <p>
                        ${escapeHtml(
                            order.order_reference || "Order"
                        )}
                    </p>
                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    onclick="closeDynamicOrderModal()"
                >
                    ×
                </button>

            </div>

            <div class="admin-modal-body">

                <div class="order-detail-grid">

                    <div>
                        <span>Customer</span>
                        <strong>
                            ${escapeHtml(
                                order.customer_name || "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Phone</span>
                        <strong>
                            ${escapeHtml(
                                order.customer_phone || "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Email</span>
                        <strong>
                            ${escapeHtml(
                                order.customer_email || "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Date</span>
                        <strong>
                            ${formatDate(order.created_at)}
                        </strong>
                    </div>

                    <div>
                        <span>Payment Method</span>
                        <strong>
                            ${escapeHtml(
                                order.payment_method || "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Payment Plan</span>
                        <strong>
                            ${escapeHtml(
                                order.payment_plan || "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>
                            ${formatCurrency(
                                Number(order.total || 0)
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Amount To Pay</span>
                        <strong>
                            ${formatCurrency(
                                Number(order.pay_now || 0)
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Balance</span>
                        <strong>
                            ${formatCurrency(
                                Number(order.balance || 0)
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Payment Status</span>
                        <strong>
                            ${escapeHtml(
                                order.payment_status || "—"
                            )}
                        </strong>
                    </div>

                </div>

                <div class="order-detail-block">

                    <h3>Delivery</h3>

                    <p>
                        ${escapeHtml(
                            order.delivery_address || "—"
                        )}
                    </p>

                    <p>
                        ${escapeHtml(
                            order.delivery_city || "—"
                        )},
                        ${escapeHtml(
                            order.delivery_state || "—"
                        )}
                    </p>

                </div>

                <div class="order-detail-block">

                    <h3>Items</h3>

                    ${
                        items.length
                            ? `
                                <div class="admin-order-items">

                                    ${items.map(item => {

                                        const price =
                                            Number(
                                                item.product_price ??
                                                item.unit_price ??
                                                item.price ??
                                                0
                                            );

                                        const quantity =
                                            Number(
                                                item.quantity || 1
                                            );

                                        const subtotal =
                                            Number(
                                                item.subtotal ??
                                                price * quantity
                                            );

                                        return `
                                            <div class="admin-order-item">

                                                <div>

                                                    <strong>
                                                        ${escapeHtml(
                                                            item.product_name ||
                                                            "Product"
                                                        )}
                                                    </strong>

                                                    <small>
                                                        Size:
                                                        ${escapeHtml(
                                                            item.size || "—"
                                                        )}
                                                    </small>

                                                    <small>
                                                        Qty:
                                                        ${quantity}
                                                    </small>

                                                </div>

                                                <strong>
                                                    ${formatCurrency(subtotal)}
                                                </strong>

                                            </div>
                                        `;

                                    }).join("")}

                                </div>
                            `
                            : `
                                <p>No order items found.</p>
                            `
                    }

                </div>

                <div class="order-detail-block">

                    <h3>Notes</h3>

                    <p>
                        ${escapeHtml(
                            order.notes || "No notes."
                        )}
                    </p>

                </div>

                <div class="admin-order-modal-actions">

                    <button
                        type="button"
                        class="admin-button edit"
                        onclick="closeDynamicOrderModal(); editOrder('${escapeAttribute(order.id)}')"
                    >
                        ✏️ Edit Order
                    </button>

                    <a
                        class="admin-button"
                        href="${TRACKING_URL}?order=${encodeURIComponent(
                            order.order_reference || ""
                        )}"
                        target="_blank"
                        rel="noopener"
                    >
                        🔎 Track Order
                    </a>

                    <button
                        type="button"
                        class="admin-button"
                        onclick="updateOrderStatus('${escapeAttribute(order.id)}','Processing')"
                    >
                        Processing
                    </button>

                    <button
                        type="button"
                        class="admin-button"
                        onclick="updateOrderStatus('${escapeAttribute(order.id)}','Shipped')"
                    >
                        Shipped
                    </button>

                    <button
                        type="button"
                        class="admin-button"
                        onclick="updateOrderStatus('${escapeAttribute(order.id)}','Delivered')"
                    >
                        Delivered
                    </button>

                    <button
                        type="button"
                        class="admin-button danger"
                        onclick="updateOrderStatus('${escapeAttribute(order.id)}','Cancelled')"
                    >
                        Cancelled
                    </button>

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeDynamicOrderModal();
        }
    });
}


function closeDynamicOrderModal() {

    const modal =
        document.getElementById(
            "dynamicOrderModal"
        );

    if (modal) {
        modal.remove();
    }
}


// ============================================================
// EDIT ORDER
// ============================================================

async function editOrder(orderId) {

    const order =
        allOrders.find(item =>
            String(item.id) === String(orderId)
        );

    if (!order) {
        alert("Order not found.");
        return;
    }

    closeDynamicOrderModal();

    const modal =
        document.createElement("div");

    modal.id = "editOrderModal";
    modal.className = "admin-modal-overlay";

    modal.innerHTML = `

        <div class="admin-modal admin-edit-order-modal">

            <div class="admin-modal-header">

                <div>
                    <h2>Edit Order</h2>

                    <p>
                        ${escapeHtml(
                            order.order_reference || "Order"
                        )}
                    </p>
                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    id="closeEditOrderModal"
                >
                    ×
                </button>

            </div>

            <div class="admin-modal-body">

                <form id="editOrderForm">

                    <input
                        type="hidden"
                        id="editOrderId"
                        value="${escapeAttribute(order.id)}"
                    >

                    <div class="order-edit-readonly">

                        <strong>Order Reference</strong>

                        <span>
                            ${escapeHtml(
                                order.order_reference || "—"
                            )}
                        </span>

                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">

                            <label for="editOrderCustomerName">
                                Customer Name
                            </label>

                            <input
                                type="text"
                                id="editOrderCustomerName"
                                value="${escapeAttribute(
                                    order.customer_name || ""
                                )}"
                                required
                            >

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderPhone">
                                Phone
                            </label>

                            <input
                                type="tel"
                                id="editOrderPhone"
                                value="${escapeAttribute(
                                    order.customer_phone || ""
                                )}"
                            >

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderEmail">
                                Email
                            </label>

                            <input
                                type="email"
                                id="editOrderEmail"
                                value="${escapeAttribute(
                                    order.customer_email || ""
                                )}"
                            >

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderCity">
                                Delivery City
                            </label>

                            <input
                                type="text"
                                id="editOrderCity"
                                value="${escapeAttribute(
                                    order.delivery_city || ""
                                )}"
                            >

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderState">
                                Delivery State
                            </label>

                            <select id="editOrderState">

                                ${getNigeriaStateOptions(
                                    order.delivery_state || ""
                                )}

                            </select>

                        </div>

                    </div>

                    <div class="admin-form-group">

                        <label for="editOrderAddress">
                            Delivery Address
                        </label>

                        <textarea
                            id="editOrderAddress"
                            rows="3"
                        >${escapeHtml(
                            order.delivery_address || ""
                        )}</textarea>

                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">

                            <label for="editOrderPaymentMethod">
                                Payment Method
                            </label>

                            <select id="editOrderPaymentMethod">

                                <option value="OPay Bank Transfer"
                                    ${
                                        order.payment_method ===
                                        "OPay Bank Transfer"
                                            ? "selected"
                                            : ""
                                    }>
                                    OPay Bank Transfer
                                </option>

                                <option value="Cash on Delivery"
                                    ${
                                        order.payment_method ===
                                        "Cash on Delivery"
                                            ? "selected"
                                            : ""
                                    }>
                                    Cash on Delivery
                                </option>

                            </select>

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderPaymentPlan">
                                Payment Plan
                            </label>

                            <select id="editOrderPaymentPlan">

                                <option value="deposit"
                                    ${
                                        order.payment_plan === "deposit"
                                            ? "selected"
                                            : ""
                                    }>
                                    60% Deposit
                                </option>

                                <option value="full"
                                    ${
                                        order.payment_plan === "full"
                                            ? "selected"
                                            : ""
                                    }>
                                    100% Full Payment
                                </option>

                            </select>

                        </div>

                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">

                            <label for="editOrderTotal">
                                Total
                            </label>

                            <input
                                type="number"
                                id="editOrderTotal"
                                min="0"
                                step="0.01"
                                value="${Number(
                                    order.total || 0
                                )}"
                            >

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderPayNow">
                                Amount To Pay
                            </label>

                            <input
                                type="number"
                                id="editOrderPayNow"
                                min="0"
                                step="0.01"
                                value="${Number(
                                    order.pay_now || 0
                                )}"
                            >

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderBalance">
                                Balance
                            </label>

                            <input
                                type="number"
                                id="editOrderBalance"
                                min="0"
                                step="0.01"
                                value="${Number(
                                    order.balance || 0
                                )}"
                            >

                        </div>

                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">

                            <label for="editOrderStatus">
                                Order Status
                            </label>

                            <select id="editOrderStatus">

                                ${getOrderStatusOptions(
                                    order.status
                                )}

                            </select>

                        </div>

                        <div class="admin-form-group">

                            <label for="editOrderPaymentStatus">
                                Payment Status
                            </label>

                            <select id="editOrderPaymentStatus">

                                ${getPaymentStatusOptions(
                                    order.payment_status
                                )}

                            </select>

                        </div>

                    </div>

                    <div class="admin-form-group">

                        <label for="editOrderNotes">
                            Order Notes
                        </label>

                        <textarea
                            id="editOrderNotes"
                            rows="4"
                            placeholder="Add order notes..."
                        >${escapeHtml(
                            order.notes || ""
                        )}</textarea>

                    </div>

                    <div
                        id="editOrderFormMessage"
                        class="admin-form-message"
                    ></div>

                    <div class="admin-modal-actions">

                        <button
                            type="button"
                            class="admin-button secondary"
                            id="cancelEditOrderButton"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="admin-button"
                            id="saveEditOrderButton"
                        >
                            <span id="saveEditOrderButtonText">
                                Save Changes
                            </span>

                            <span
                                id="saveEditOrderSpinner"
                                style="display:none;"
                            >
                                Saving...
                            </span>

                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("closeEditOrderModal")
        ?.addEventListener(
            "click",
            closeEditOrderModal
        );

    document
        .getElementById("cancelEditOrderButton")
        ?.addEventListener(
            "click",
            closeEditOrderModal
        );

    document
        .getElementById("editOrderForm")
        ?.addEventListener(
            "submit",
            handleEditOrderSubmit
        );

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeEditOrderModal();
        }
    });
}


function closeEditOrderModal() {

    const modal =
        document.getElementById(
            "editOrderModal"
        );

    if (modal) {
        modal.remove();
    }
}


// ============================================================
// SAVE EDITED ORDER
// ============================================================

async function handleEditOrderSubmit(event) {

    event.preventDefault();

    const orderId =
        getValue("editOrderId");

    if (!orderId) {
        return;
    }

    const button =
        document.getElementById(
            "saveEditOrderButton"
        );

    const buttonText =
        document.getElementById(
            "saveEditOrderButtonText"
        );

    const spinner =
        document.getElementById(
            "saveEditOrderSpinner"
        );

    const message =
        document.getElementById(
            "editOrderFormMessage"
        );

    const total =
        Number(
            getValue("editOrderTotal") || 0
        );

    const payNow =
        Number(
            getValue("editOrderPayNow") || 0
        );

    let balance =
        Number(
            getValue("editOrderBalance") || 0
        );

    if (total < 0 || payNow < 0) {

        showEditOrderMessage(
            "Amounts cannot be negative.",
            "error"
        );

        return;
    }

    // Automatically calculate balance.
    balance =
        Math.max(
            total - payNow,
            0
        );

    setValue(
        "editOrderBalance",
        balance.toFixed(2)
    );

    if (button) {
        button.disabled = true;
    }

    if (buttonText) {
        buttonText.style.display = "none";
    }

    if (spinner) {
        spinner.style.display = "inline";
    }

    if (message) {
        message.textContent = "";
    }

    const updates = {

        customer_name:
            getValue("editOrderCustomerName").trim(),

        customer_phone:
            getValue("editOrderPhone").trim(),

        customer_email:
            getValue("editOrderEmail").trim(),

        delivery_address:
            getValue("editOrderAddress").trim(),

        delivery_city:
            getValue("editOrderCity").trim(),

        delivery_state:
            getValue("editOrderState"),

        payment_method:
            getValue("editOrderPaymentMethod"),

        payment_plan:
            getValue("editOrderPaymentPlan"),

        total:
            total,

        pay_now:
            payNow,

        balance:
            balance,

        status:
            getValue("editOrderStatus"),

        payment_status:
            getValue("editOrderPaymentStatus"),

        notes:
            getValue("editOrderNotes").trim(),

        updated_at:
            new Date().toISOString()
    };

    try {

        const { error } =
            await supabaseClient
                .from("orders")
                .update(updates)
                .eq("id", orderId);

        if (error) {
            throw error;
        }

        const orderIndex =
            allOrders.findIndex(
                order =>
                    String(order.id) ===
                    String(orderId)
            );

        if (orderIndex !== -1) {

            allOrders[orderIndex] = {
                ...allOrders[orderIndex],
                ...updates
            };
        }

        updateOrderStats();
        renderFilteredOrders();

        showEditOrderMessage(
            "Order updated successfully.",
            "success"
        );

        setTimeout(() => {
            closeEditOrderModal();
        }, 800);

    } catch (error) {

        console.error(
            "Update order error:",
            error
        );

        showEditOrderMessage(
            getAdminErrorMessage(error),
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

        if (buttonText) {
            buttonText.style.display = "inline";
        }

        if (spinner) {
            spinner.style.display = "none";
        }
    }
}


function showEditOrderMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "editOrderFormMessage"
        );

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className =
        `admin-form-message ${type}`;
}


// ============================================================
// QUICK STATUS UPDATE
// ============================================================

async function updateOrderStatus(
    orderId,
    newStatus
) {

    if (!orderId || !newStatus) {
        return;
    }

    const confirmed =
        confirm(
            `Change order status to "${newStatus}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const { error } =
            await supabaseClient
                .from("orders")
                .update({
                    status: newStatus,
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", orderId);

        if (error) {
            throw error;
        }

        const order =
            allOrders.find(item =>
                String(item.id) ===
                String(orderId)
            );

        if (order) {
            order.status = newStatus;
            order.updated_at =
                new Date().toISOString();
        }

        updateOrderStats();
        renderFilteredOrders();

        closeDynamicOrderModal();

        alert(
            `Order status changed to ${newStatus}.`
        );

    } catch (error) {

        console.error(error);

        alert(
            getAdminErrorMessage(error)
        );
    }
}


// ============================================================
// PRODUCTS
// ============================================================

function setupProductControls() {

    const addButton =
        document.getElementById(
            "addProductButton"
        );

    if (addButton) {

        addButton.addEventListener(
            "click",
            () => openProductModal()
        );
    }

    const search =
        document.getElementById(
            "productSearch"
        );

    const category =
        document.getElementById(
            "productCategoryFilter"
        );

    const status =
        document.getElementById(
            "productStatusFilter"
        );

    if (search) {
        search.addEventListener(
            "input",
            renderFilteredProducts
        );
    }

    if (category) {
        category.addEventListener(
            "change",
            renderFilteredProducts
        );
    }

    if (status) {
        status.addEventListener(
            "change",
            renderFilteredProducts
        );
    }
}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    try {

        const { data, error } =
            await supabaseClient
                .from("products")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        allProducts = data || [];

        renderFilteredProducts();

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

        allProducts = [];

        renderFilteredProducts();
    }
}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderFilteredProducts() {

    const search =
        getValue("productSearch")
            .trim()
            .toLowerCase();

    const category =
        getValue("productCategoryFilter");

    const status =
        getValue("productStatusFilter");

    let products =
        [...allProducts];

    if (search) {

        products =
            products.filter(product =>
                [
                    product.name,
                    product.id,
                    product.category,
                    product.description
                ].some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                )
            );
    }

    if (category) {

        products =
            products.filter(product =>
                product.category === category
            );
    }

    if (status === "active") {

        products =
            products.filter(product =>
                product.is_active === true
            );
    }

    if (status === "inactive") {

        products =
            products.filter(product =>
                product.is_active === false
            );
    }

    renderProducts(products);
}


function renderProducts(products) {

    const grid =
        document.getElementById(
            "productsAdminGrid"
        );

    const empty =
        document.getElementById(
            "emptyProducts"
        );

    const count =
        document.getElementById(
            "productsCount"
        );

    if (count) {
        count.textContent =
            `${products.length} product${products.length === 1 ? "" : "s"}`;
    }

    if (!products.length) {

        if (grid) {
            grid.innerHTML = "";
        }

        if (empty) {
            empty.style.display = "";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (!grid) {
        return;
    }

    grid.innerHTML =
        products.map(product => {

            const image =
                product.image
                    ? `<img src="${escapeAttribute(product.image)}" alt="${escapeAttribute(product.name)}">`
                    : `<div class="product-admin-icon">
                            ${escapeHtml(product.icon || "👟")}
                       </div>`;

            const sizes =
                Array.isArray(product.sizes)
                    ? product.sizes.join(", ")
                    : "";

            return `
                <article class="admin-product-card">

                    <div class="admin-product-image">
                        ${image}
                    </div>

                    <div class="admin-product-content">

                        ${
                            product.badge
                                ? `
                                    <span class="product-badge">
                                        ${escapeHtml(product.badge)}
                                    </span>
                                `
                                : ""
                        }

                        <h3>
                            ${escapeHtml(product.name)}
                        </h3>

                        <p>
                            ${escapeHtml(
                                product.category || "Uncategorized"
                            )}
                        </p>

                        <div class="admin-product-price">

                            <strong>
                                ${formatCurrency(
                                    Number(product.price || 0)
                                )}
                            </strong>

                            ${
                                product.old_price
                                    ? `
                                        <del>
                                            ${formatCurrency(
                                                Number(product.old_price)
                                            )}
                                        </del>
                                    `
                                    : ""
                            }

                        </div>

                        <p>
                            Stock:
                            <strong>
                                ${Number(product.stock || 0)}
                            </strong>
                        </p>

                        <p>
                            Sizes:
                            ${escapeHtml(sizes || "None")}
                        </p>

                        <div class="admin-product-status">

                            <span class="status-badge ${
                                product.is_active
                                    ? "status-success"
                                    : "status-danger"
                            }">
                                ${
                                    product.is_active
                                        ? "Active"
                                        : "Inactive"
                                }
                            </span>

                        </div>

                        <div class="admin-product-actions">

                            <button
                                type="button"
                                class="admin-small-button"
                                onclick="editProduct('${escapeAttribute(product.id)}')"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="admin-small-button"
                                onclick="toggleProductStatus('${escapeAttribute(product.id)}')"
                            >
                                ${
                                    product.is_active
                                        ? "Disable"
                                        : "Enable"
                                }
                            </button>

                            <button
                                type="button"
                                class="admin-small-button danger"
                                onclick="deleteProduct('${escapeAttribute(product.id)}')"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </article>
            `;

        }).join("");
}


// ============================================================
// PRODUCT MODAL
// ============================================================

function setupProductFormEvents() {

    const close =
        document.getElementById(
            "closeProductModal"
        );

    const cancel =
        document.getElementById(
            "cancelProductButton"
        );

    if (close) {
        close.addEventListener(
            "click",
            closeProductModal
        );
    }

    if (cancel) {
        cancel.addEventListener(
            "click",
            closeProductModal
        );
    }

    const form =
        document.getElementById(
            "productForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            saveProduct
        );
    }

    const image =
        document.getElementById(
            "productImage"
        );

    if (image) {

        image.addEventListener(
            "change",
            previewProductImage
        );
    }

    const addSize =
        document.getElementById(
            "addCustomSizeButton"
        );

    if (addSize) {

        addSize.addEventListener(
            "click",
            addCustomSize
        );
    }

    const customInput =
        document.getElementById(
            "customSizeInput"
        );

    if (customInput) {

        customInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    addCustomSize();
                }
            }
        );
    }
}


function openProductModal(product = null) {

    const modal =
        document.getElementById(
            "productModal"
        );

    if (!modal) {
        return;
    }

    customSizes = [];

    const title =
        document.getElementById(
            "productModalTitle"
        );

    const form =
        document.getElementById(
            "productForm"
        );

    if (form) {
        form.reset();
    }

    setValue(
        "productId",
        product ? product.id : ""
    );

    setValue(
        "productName",
        product ? product.name : ""
    );

    setValue(
        "productBadge",
        product ? product.badge : ""
    );

    setValue(
        "productPrice",
        product ? product.price : ""
    );

    setValue(
        "productOldPrice",
        product ? product.old_price || "" : ""
    );

    setValue(
        "productStock",
        product ? product.stock : 0
    );

    setValue(
        "productIcon",
        product ? product.icon || "👟" : "👟"
    );

    setValue(
        "productDescription",
        product ? product.description || "" : ""
    );

    setValue(
        "productCategory",
        product ? product.category || "" : ""
    );

    const active =
        document.getElementById(
            "productActive"
        );

    if (active) {
        active.checked =
            product
                ? product.is_active !== false
                : true;
    }

    setSelectedSizes(
        product && Array.isArray(product.sizes)
            ? product.sizes
            : []
    );

    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (preview) {

        if (product && product.image) {

            preview.innerHTML = `
                <img
                    src="${escapeAttribute(product.image)}"
                    alt="Product image"
                >
            `;

        } else {

            preview.innerHTML = `
                <span>
                    No image selected
                </span>
            `;
        }
    }

    if (title) {

        title.textContent =
            product
                ? "Edit Product"
                : "Add Product";
    }

    modal.style.display = "";
}


function closeProductModal() {

    const modal =
        document.getElementById(
            "productModal"
        );

    if (modal) {
        modal.style.display = "none";
    }
}


// ============================================================
// PRODUCT IMAGE PREVIEW
// ============================================================

function previewProductImage(event) {

    const file =
        event.target.files &&
        event.target.files[0];

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
            alt="Selected product image"
        >
    `;
}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(event) {

    event.preventDefault();

    const productId =
        getValue("productId").trim();

    const name =
        getValue("productName").trim();

    const category =
        getValue("productCategory");

    const price =
        Number(
            getValue("productPrice") || 0
        );

    const oldPrice =
        getValue("productOldPrice");

    const stock =
        Number(
            getValue("productStock") || 0
        );

    const badge =
        getValue("productBadge").trim();

    const icon =
        getValue("productIcon").trim() || "👟";

    const description =
        getValue("productDescription").trim();

    const activeElement =
        document.getElementById(
            "productActive"
        );

    const isActive =
        activeElement
            ? activeElement.checked
            : true;

    if (!name) {

        showProductMessage(
            "Enter a product name.",
            "error"
        );

        return;
    }

    if (!category) {

        showProductMessage(
            "Select a product category.",
            "error"
        );

        return;
    }

    if (price < 0) {

        showProductMessage(
            "Price cannot be negative.",
            "error"
        );

        return;
    }

    const sizes =
        getSelectedSizes();

    const fileInput =
        document.getElementById(
            "productImage"
        );

    const file =
        fileInput &&
        fileInput.files &&
        fileInput.files[0];

    const saveButton =
        document.getElementById(
            "saveProductButton"
        );

    if (saveButton) {
        saveButton.disabled = true;
    }

    try {

        let finalId =
            productId ||
            createProductId(name);

        let imageUrl =
            productId
                ? (
                    allProducts.find(
                        product =>
                            product.id === productId
                    )?.image || null
                )
                : null;

        if (file) {

            imageUrl =
                await uploadProductImage(
                    file,
                    finalId
                );
        }

        const productData = {

            id: finalId,

            name,

            category,

            price,

            old_price:
                oldPrice
                    ? Number(oldPrice)
                    : null,

            badge:
                badge || null,

            icon,

            image:
                imageUrl,

            description:
                description || null,

            sizes,

            stock,

            is_active:
                isActive,

            updated_at:
                new Date().toISOString()
        };

        if (!productId) {

            productData.created_at =
                new Date().toISOString();

            const { error } =
                await supabaseClient
                    .from("products")
                    .insert(productData);

            if (error) {
                throw error;
            }

        } else {

            const { error } =
                await supabaseClient
                    .from("products")
                    .update(productData)
                    .eq("id", productId);

            if (error) {
                throw error;
            }
        }

        closeProductModal();

        await loadProducts();

    } catch (error) {

        console.error(
            "Save product error:",
            error
        );

        showProductMessage(
            getAdminErrorMessage(error),
            "error"
        );

    } finally {

        if (saveButton) {
            saveButton.disabled = false;
        }
    }
}


// ============================================================
// UPLOAD PRODUCT IMAGE
// ============================================================

async function uploadProductImage(
    file,
    productId
) {

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const filePath =
        `products/${productId}-${Date.now()}.${extension}`;

    const { error } =
        await supabaseClient
            .storage
            .from("product-images")
            .upload(
                filePath,
                file,
                {
                    upsert: true,
                    contentType: file.type
                }
            );

    if (error) {
        throw error;
    }

    const { data } =
        supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(filePath);

    return data.publicUrl;
}


// ============================================================
// PRODUCT STATUS
// ============================================================

async function toggleProductStatus(productId) {

    const product =
        allProducts.find(item =>
            item.id === productId
        );

    if (!product) {
        return;
    }

    const newStatus =
        !product.is_active;

    try {

        const { error } =
            await supabaseClient
                .from("products")
                .update({
                    is_active: newStatus,
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", productId);

        if (error) {
            throw error;
        }

        product.is_active =
            newStatus;

        renderFilteredProducts();

    } catch (error) {

        console.error(error);

        alert(
            getAdminErrorMessage(error)
        );
    }
}


// ============================================================
// EDIT PRODUCT
// ============================================================

function editProduct(productId) {

    const product =
        allProducts.find(item =>
            item.id === productId
        );

    if (!product) {
        alert("Product not found.");
        return;
    }

    openProductModal(product);
}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(productId) {

    const product =
        allProducts.find(item =>
            item.id === productId
        );

    if (!product) {
        return;
    }

    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const { error } =
            await supabaseClient
                .from("products")
                .delete()
                .eq("id", productId);

        if (error) {
            throw error;
        }

        await loadProducts();

    } catch (error) {

        console.error(error);

        alert(
            getAdminErrorMessage(error)
        );
    }
}


// ============================================================
// SIZES
// ============================================================

function getSelectedSizes() {

    const checked =
        document.querySelectorAll(
            'input[name="productSize"]:checked'
        );

    const sizes =
        Array.from(checked)
            .map(input => input.value);

    return [
        ...sizes,
        ...customSizes
    ];
}


function setSelectedSizes(sizes) {

    const values =
        Array.isArray(sizes)
            ? sizes.map(String)
            : [];

    document
        .querySelectorAll(
            'input[name="productSize"]'
        )
        .forEach(input => {

            input.checked =
                values.includes(
                    String(input.value)
                );
        });

    customSizes =
        values.filter(size => {

            return ![
                "39",
                "40",
                "41",
                "42",
                "43",
                "44",
                "45"
            ].includes(size);

        });

    renderCustomSizes();
}


function addCustomSize() {

    const input =
        document.getElementById(
            "customSizeInput"
        );

    if (!input) {
        return;
    }

    const value =
        input.value.trim();

    if (!value) {
        return;
    }

    if (!customSizes.includes(value)) {

        customSizes.push(value);
    }

    input.value = "";

    renderCustomSizes();
}


function renderCustomSizes() {

    const list =
        document.getElementById(
            "customSizesList"
        );

    if (!list) {
        return;
    }

    list.innerHTML =
        customSizes.map(size => {

            return `
                <span class="custom-size-tag">

                    ${escapeHtml(size)}

                    <button
                        type="button"
                        onclick="removeCustomSize('${escapeAttribute(size)}')"
                    >
                        ×
                    </button>

                </span>
            `;

        }).join("");
}


function removeCustomSize(size) {

    customSizes =
        customSizes.filter(
            item => item !== size
        );

    renderCustomSizes();
}


// ============================================================
// CATEGORIES
// ============================================================

function setupCategoryControls() {

    const addButton =
        document.getElementById(
            "addCategoryButton"
        );

    if (addButton) {

        addButton.addEventListener(
            "click",
            () => openCategoryModal()
        );
    }

    const search =
        document.getElementById(
            "categorySearch"
        );

    const status =
        document.getElementById(
            "categoryStatusFilter"
        );

    if (search) {

        search.addEventListener(
            "input",
            renderFilteredCategories
        );
    }

    if (status) {

        status.addEventListener(
            "change",
            renderFilteredCategories
        );
    }
}


async function loadCategories() {

    try {

        const { data, error } =
            await supabaseClient
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

        renderFilteredCategories();

    } catch (error) {

        console.error(
            "Load categories error:",
            error
        );

        allCategories = [];

        renderFilteredCategories();
    }
}


function renderFilteredCategories() {

    const search =
        getValue("categorySearch")
            .trim()
            .toLowerCase();

    const status =
        getValue("categoryStatusFilter");

    let categories =
        [...allCategories];

    if (search) {

        categories =
            categories.filter(category =>
                [
                    category.name,
                    category.slug,
                    category.description
                ].some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                )
            );
    }

    if (status === "active") {

        categories =
            categories.filter(
                category =>
                    category.is_active === true
            );
    }

    if (status === "inactive") {

        categories =
            categories.filter(
                category =>
                    category.is_active === false
            );
    }

    renderCategories(categories);
}


function renderCategories(categories) {

    const grid =
        document.getElementById(
            "categoriesAdminGrid"
        );

    const count =
        document.getElementById(
            "categoriesCount"
        );

    if (count) {

        count.textContent =
            `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`;
    }

    if (!grid) {
        return;
    }

    if (!categories.length) {

        grid.innerHTML = `
            <div class="admin-empty-state">
                No categories found.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        categories.map(category => {

            return `
                <article class="admin-category-card">

                    <div>

                        <h3>
                            ${escapeHtml(
                                category.name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                category.slug || ""
                            )}
                        </p>

                        ${
                            category.description
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            category.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                    <span class="status-badge ${
                        category.is_active
                            ? "status-success"
                            : "status-danger"
                    }">

                        ${
                            category.is_active
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                    <div class="admin-category-actions">

                        <button
                            type="button"
                            class="admin-small-button"
                            onclick="editCategory('${escapeAttribute(category.id)}')"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="admin-small-button"
                            onclick="toggleCategoryStatus('${escapeAttribute(category.id)}')"
                        >
                            ${
                                category.is_active
                                    ? "Disable"
                                    : "Enable"
                            }
                        </button>

                        <button
                            type="button"
                            class="admin-small-button danger"
                            onclick="deleteCategory('${escapeAttribute(category.id)}')"
                        >
                            Delete
                        </button>

                    </div>

                </article>
            `;

        }).join("");
}


// ============================================================
// CATEGORY MODAL
// ============================================================

function setupCategoryFormEvents() {

    const close =
        document.getElementById(
            "closeCategoryModal"
        );

    const cancel =
        document.getElementById(
            "cancelCategoryButton"
        );

    if (close) {
        close.addEventListener(
            "click",
            closeCategoryModal
        );
    }

    if (cancel) {
        cancel.addEventListener(
            "click",
            closeCategoryModal
        );
    }

    const form =
        document.getElementById(
            "categoryForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            saveCategory
        );
    }
}


function openCategoryModal(category = null) {

    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (!modal) {
        return;
    }

    const title =
        document.getElementById(
            "categoryModalTitle"
        );

    const form =
        document.getElementById(
            "categoryForm"
        );

    if (form) {
        form.reset();
    }

    setValue(
        "categoryId",
        category ? category.id : ""
    );

    setValue(
        "categoryName",
        category ? category.name : ""
    );

    setValue(
        "categorySlug",
        category ? category.slug : ""
    );

    setValue(
        "categoryDescription",
        category ? category.description || "" : ""
    );

    const active =
        document.getElementById(
            "categoryActive"
        );

    if (active) {

        active.checked =
            category
                ? category.is_active !== false
                : true;
    }

    if (title) {

        title.textContent =
            category
                ? "Edit Category"
                : "Add Category";
    }

    modal.style.display = "";
}


function closeCategoryModal() {

    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (modal) {
        modal.style.display = "none";
    }
}


// ============================================================
// SAVE CATEGORY
// ============================================================

async function saveCategory(event) {

    event.preventDefault();

    const categoryId =
        getValue("categoryId").trim();

    const name =
        getValue("categoryName").trim();

    let slug =
        getValue("categorySlug").trim();

    const description =
        getValue("categoryDescription").trim();

    const active =
        document.getElementById(
            "categoryActive"
        );

    const isActive =
        active
            ? active.checked
            : true;

    if (!name) {

        showCategoryMessage(
            "Enter a category name.",
            "error"
        );

        return;
    }

    if (!slug) {
        slug = slugify(name);
    }

    const data = {

        name,

        slug,

        description:
            description || null,

        is_active:
            isActive,

        updated_at:
            new Date().toISOString()
    };

    try {

        if (categoryId) {

            const { error } =
                await supabaseClient
                    .from("categories")
                    .update(data)
                    .eq("id", categoryId);

            if (error) {
                throw error;
            }

        } else {

            const { error } =
                await supabaseClient
                    .from("categories")
                    .insert(data);

            if (error) {
                throw error;
            }
        }

        closeCategoryModal();

        await loadCategories();

        populateCategorySelects();

    } catch (error) {

        console.error(error);

        showCategoryMessage(
            getAdminErrorMessage(error),
            "error"
        );
    }
}


// ============================================================
// CATEGORY ACTIONS
// ============================================================

function editCategory(categoryId) {

    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );

    if (!category) {
        return;
    }

    openCategoryModal(category);
}


async function toggleCategoryStatus(categoryId) {

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

        const { error } =
            await supabaseClient
                .from("categories")
                .update({
                    is_active:
                        !category.is_active,
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", categoryId);

        if (error) {
            throw error;
        }

        category.is_active =
            !category.is_active;

        renderFilteredCategories();

        populateCategorySelects();

    } catch (error) {

        console.error(error);

        alert(
            getAdminErrorMessage(error)
        );
    }
}


async function deleteCategory(categoryId) {

    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );

    if (!category) {
        return;
    }

    const used =
        allProducts.some(
            product =>
                product.category ===
                category.slug
        );

    if (used) {

        alert(
            "This category cannot be deleted because products are using it. Change those products to another category first."
        );

        return;
    }

    if (
        !confirm(
            `Delete "${category.name}"?`
        )
    ) {
        return;
    }

    try {

        const { error } =
            await supabaseClient
                .from("categories")
                .delete()
                .eq("id", categoryId);

        if (error) {
            throw error;
        }

        await loadCategories();

        populateCategorySelects();

    } catch (error) {

        console.error(error);

        alert(
            getAdminErrorMessage(error)
        );
    }
}


// ============================================================
// POPULATE CATEGORY SELECTS
// ============================================================

function populateCategorySelects() {

    const productCategory =
        document.getElementById(
            "productCategory"
        );

    const filter =
        document.getElementById(
            "productCategoryFilter"
        );

    const activeCategories =
        allCategories.filter(
            category =>
                category.is_active !== false
        );

    if (productCategory) {

        const current =
            productCategory.value;

        productCategory.innerHTML = `
            <option value="">
                Select category
            </option>

            ${
                activeCategories.map(category => `
                    <option
                        value="${escapeAttribute(category.slug)}"
                    >
                        ${escapeHtml(category.name)}
                    </option>
                `).join("")
            }
        `;

        productCategory.value =
            current;
    }

    if (filter) {

        const current =
            filter.value;

        filter.innerHTML = `
            <option value="">
                All Categories
            </option>

            ${
                allCategories.map(category => `
                    <option
                        value="${escapeAttribute(category.slug)}"
                    >
                        ${escapeHtml(category.name)}
                    </option>
                `).join("")
            }
        `;

        filter.value =
            current;
    }
}


// ============================================================
// ORDER EDIT FORM SETUP
// ============================================================

function setupOrderEditFormEvents() {

    // The order edit form is created dynamically,
    // so its submit listener is attached inside editOrder().
}


// ============================================================
// STATUS OPTIONS
// ============================================================

function getOrderStatusOptions(current) {

    const statuses = [
        "Pending Payment",
        "Deposit Paid",
        "Balance Pending",
        "Fully Paid",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];

    return statuses.map(status => {

        return `
            <option
                value="${escapeAttribute(status)}"
                ${status === current ? "selected" : ""}
            >
                ${escapeHtml(status)}
            </option>
        `;

    }).join("");
}


function getPaymentStatusOptions(current) {

    const statuses = [
        "Pending",
        "Paid",
        "Partially Paid",
        "Cash on Delivery",
        "Failed",
        "Refunded"
    ];

    return statuses.map(status => {

        return `
            <option
                value="${escapeAttribute(status)}"
                ${status === current ? "selected" : ""}
            >
                ${escapeHtml(status)}
            </option>
        `;

    }).join("");
}


// ============================================================
// NIGERIA STATES
// ============================================================

function getNigeriaStateOptions(selected) {

    const states = [
        "Abia",
        "Adamawa",
        "Akwa Ibom",
        "Anambra",
        "Bauchi",
        "Bayelsa",
        "Benue",
        "Borno",
        "Cross River",
        "Delta",
        "Ebonyi",
        "Edo",
        "Ekiti",
        "Enugu",
        "Gombe",
        "Imo",
        "Jigawa",
        "Kaduna",
        "Kano",
        "Katsina",
        "Kebbi",
        "Kogi",
        "Kwara",
        "Lagos",
        "Nasarawa",
        "Niger",
        "Ogun",
        "Ondo",
        "Osun",
        "Oyo",
        "Plateau",
        "Rivers",
        "Sokoto",
        "Taraba",
        "Yobe",
        "Zamfara",
        "Federal Capital Territory"
    ];

    return `
        <option value="">
            Select state
        </option>

        ${
            states.map(state => `
                <option
                    value="${escapeAttribute(state)}"
                    ${
                        String(state).toLowerCase() ===
                        String(selected || "").toLowerCase()
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHtml(state)}
                </option>
            `).join("")
        }
    `;
}


// ============================================================
// HELPERS
// ============================================================

function getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value || "";
}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.value =
        value ?? "";
}


function showLoginMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "adminLoginMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `admin-message ${type}`;
}


function showProductMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "productFormMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `admin-form-message ${type}`;
}


function showCategoryMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "categoryFormMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `admin-form-message ${type}`;
}


function formatCurrency(amount) {

    const value =
        Number(amount || 0);

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(value);
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    try {

        return new Date(date)
            .toLocaleString(
                "en-NG",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

    } catch {
        return "—";
    }
}


function getStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase();

    if (value === "delivered") {
        return "status-success";
    }

    if (
        value === "cancelled" ||
        value === "failed"
    ) {
        return "status-danger";
    }

    if (
        value.includes("paid") ||
        value === "processing"
    ) {
        return "status-info";
    }

    if (
        value === "shipped"
    ) {
        return "status-purple";
    }

    return "status-warning";
}


function createProductId(name) {

    return (
        slugify(name) +
        "-" +
        Date.now()
    );
}


function slugify(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHtml(value)
        .replace(/\\/g, "&#92;");
}


function getAdminErrorMessage(error) {

    if (!error) {
        return "Something went wrong.";
    }

    const message =
        String(
            error.message ||
            error.error_description ||
            error
        );

    if (
        message.toLowerCase().includes(
            "row-level security"
        )
    ) {
        return "Permission denied. Check the Supabase admin policies.";
    }

    if (
        message.toLowerCase().includes(
            "duplicate"
        )
    ) {
        return "This record already exists.";
    }

    return message;
}


// ============================================================
// PASSWORD TOGGLE
// ============================================================

function setupPasswordToggle() {

    const button =
        document.getElementById(
            "toggleAdminPassword"
        );

    const input =
        document.getElementById(
            "adminPassword"
        );

    if (!button || !input) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const visible =
                input.type === "text";

            input.type =
                visible
                    ? "password"
                    : "text";

            button.textContent =
                visible
                    ? "👁️"
                    : "🙈";
        }
    );
}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.viewOrder =
    viewOrder;

window.closeDynamicOrderModal =
    closeDynamicOrderModal;

window.updateOrderStatus =
    updateOrderStatus;

window.editOrder =
    editOrder;

window.closeEditOrderModal =
    closeEditOrderModal;

window.editProduct =
    editProduct;

window.openProductModal =
    openProductModal;

window.closeProductModal =
    closeProductModal;

window.toggleProductStatus =
    toggleProductStatus;

window.deleteProduct =
    deleteProduct;

window.removeCustomSize =
    removeCustomSize;

window.openCategoryModal =
    openCategoryModal;

window.closeCategoryModal =
    closeCategoryModal;

window.editCategory =
    editCategory;

window.toggleCategoryStatus =
    toggleCategoryStatus;

window.deleteCategory =
    deleteCategory;