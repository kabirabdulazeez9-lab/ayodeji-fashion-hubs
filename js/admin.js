// ============================================================
// AYODEJI FASHION HUBS - ADMIN DASHBOARD
// Complete Admin Management
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();
});

// ============================================================
// CONFIGURATION
// ============================================================

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

let currentEditingOrder = null;
let currentEditingOrderItems = [];

let currentOrderProductOptions = [];

// ============================================================
// INITIALIZE
// ============================================================

async function initializeAdmin() {
    supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error("Supabase client not found.");
        showFatalError(
            "Supabase could not be loaded. Please refresh the page."
        );
        return;
    }

    setupAdminUI();
    setupPasswordToggle();
    setupProductEvents();
    setupCategoryEvents();
    setupOrderEvents();

    await checkAdminSession();
}

// ============================================================
// ADMIN UI
// ============================================================

function setupAdminUI() {
    const loginForm = document.getElementById("adminLoginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleAdminLogin);
    }

    const logoutButton = document.getElementById("adminLogout");

    if (logoutButton) {
        logoutButton.addEventListener("click", handleAdminLogout);
    }

    document.querySelectorAll("[data-section]").forEach(button => {
        button.addEventListener("click", () => {
            const sectionId = button.dataset.section;
            switchAdminSection(sectionId);
        });
    });
}

function switchAdminSection(sectionId) {
    document.querySelectorAll(".admin-section").forEach(section => {
        section.style.display = "none";
    });

    const target = document.getElementById(sectionId);

    if (target) {
        target.style.display = "block";
    }

    document.querySelectorAll("[data-section]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionId
        );
    });
}

// ============================================================
// PASSWORD
// ============================================================

function setupPasswordToggle() {
    const toggle = document.getElementById("toggleAdminPassword");
    const password = document.getElementById("adminPassword");

    if (!toggle || !password) return;

    toggle.addEventListener("click", () => {
        const isPassword = password.type === "password";

        password.type = isPassword ? "text" : "password";

        toggle.textContent = isPassword ? "🙈" : "👁️";
        toggle.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });
}

// ============================================================
// ADMIN SESSION
// ============================================================

async function checkAdminSession() {
    try {
        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session || !session.user) {
            showAdminLogin();
            return;
        }

        const allowed = await verifyAdmin(session.user);

        if (!allowed) {
            await supabaseClient.auth.signOut();
            showAdminLogin();
            return;
        }

        showAdminDashboard();

        await loadInitialDashboardData();

    } catch (error) {
        console.error("Session check error:", error);
        showAdminLogin();
    }
}

async function verifyAdmin(user) {
    if (!user || !user.email) {
        return false;
    }

    if (
        user.email.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
    ) {
        return true;
    }

    try {
        const { data, error } = await supabaseClient
            .from("admin_users")
            .select("email")
            .eq("email", user.email)
            .maybeSingle();

        if (error) {
            console.warn("Admin table verification failed:", error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error("Admin verification error:", error);
        return false;
    }
}

async function handleAdminLogin(event) {
    event.preventDefault();

    const email = getValue("adminEmail");
    const password = getValue("adminPassword");

    const button = document.getElementById("adminLoginButton");
    const buttonText = document.getElementById("adminLoginButtonText");

    setAdminLoginLoading(true);

    showMessage(
        "adminLoginMessage",
        "",
        ""
    );

    try {
        if (!email || !password) {
            throw new Error("Please enter your email and password.");
        }

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

        if (!data || !data.user) {
            throw new Error("Login failed. Please try again.");
        }

        const allowed = await verifyAdmin(data.user);

        if (!allowed) {
            await supabaseClient.auth.signOut();

            throw new Error(
                "This account is not authorized to access the admin dashboard."
            );
        }

        showMessage(
            "adminLoginMessage",
            "Login successful.",
            "success"
        );

        setTimeout(async () => {
            showAdminDashboard();
            await loadInitialDashboardData();
        }, 300);

    } catch (error) {
        console.error("Admin login error:", error);

        showMessage(
            "adminLoginMessage",
            getAuthErrorMessage(error),
            "error"
        );
    } finally {
        setAdminLoginLoading(false);
    }
}

async function handleAdminLogout() {
    try {
        await supabaseClient.auth.signOut();

        showAdminLogin();

        const email = document.getElementById("adminEmail");
        const password = document.getElementById("adminPassword");

        if (email) email.value = "";
        if (password) password.value = "";

    } catch (error) {
        console.error("Logout error:", error);
    }
}

function showAdminLogin() {
    const login = document.getElementById("adminLoginView");
    const dashboard = document.getElementById("adminDashboardView");

    if (login) login.style.display = "flex";
    if (dashboard) dashboard.style.display = "none";
}

function showAdminDashboard() {
    const login = document.getElementById("adminLoginView");
    const dashboard = document.getElementById("adminDashboardView");

    if (login) login.style.display = "none";
    if (dashboard) dashboard.style.display = "block";
}

function setAdminLoginLoading(loading) {
    const button = document.getElementById("adminLoginButton");
    const text = document.getElementById("adminLoginButtonText");

    if (button) {
        button.disabled = loading;
    }

    if (text) {
        text.textContent = loading
            ? "Signing in..."
            : "Login";
    }
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

function setupOrderEvents() {
    const refreshButton = document.getElementById("refreshOrders");

    if (refreshButton) {
        refreshButton.addEventListener("click", loadOrders);
    }

    const search = document.getElementById("orderSearch");

    if (search) {
        search.addEventListener(
            "input",
            filterOrders
        );
    }

    const statusFilter = document.getElementById("statusFilter");

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            filterOrders
        );
    }
}

async function loadOrders() {
    const table = document.getElementById("ordersTable");

    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="7">Loading orders...</td>
            </tr>
        `;
    }

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

        updateOrderStats(allOrders);
        filterOrders();

    } catch (error) {
        console.error("Load orders error:", error);

        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        Unable to load orders.
                    </td>
                </tr>
            `;
        }

        showAdminToast(
            "Unable to load orders.",
            "error"
        );
    }
}

function updateOrderStats(orders) {
    setText(
        "totalOrders",
        orders.length
    );

    const pending = orders.filter(order => {
        const status = String(order.status || "").toLowerCase();

        return (
            status.includes("pending payment") ||
            status.includes("balance pending")
        );
    });

    const paid = orders.filter(order => {
        const status = String(order.status || "").toLowerCase();

        return (
            status.includes("deposit paid") ||
            status.includes("fully paid") ||
            status.includes("processing") ||
            status.includes("shipped") ||
            status.includes("delivered")
        );
    });

    const delivered = orders.filter(order =>
        String(order.status || "").toLowerCase() ===
        "delivered"
    );

    setText(
        "pendingPayment",
        pending.length
    );

    setText(
        "paidOrders",
        paid.length
    );

    setText(
        "deliveredOrders",
        delivered.length
    );
}

function filterOrders() {
    const search = (
        getValue("orderSearch") || ""
    ).toLowerCase().trim();

    const status = getValue("statusFilter");

    let filtered = [...allOrders];

    if (search) {
        filtered = filtered.filter(order => {
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

    if (status) {
        filtered = filtered.filter(order =>
            String(order.status || "") === status
        );
    }

    renderOrders(filtered);
}

function renderOrders(orders) {
    const table = document.getElementById("ordersTable");
    const grid = document.getElementById("ordersGrid");
    const empty = document.getElementById("emptyOrders");

    if (!orders.length) {
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        No orders found.
                    </td>
                </tr>
            `;
        }

        if (grid) {
            grid.innerHTML = "";
        }

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (table) {
        table.innerHTML = orders
            .map(renderOrderTableRow)
            .join("");
    }

    if (grid) {
        grid.innerHTML = orders
            .map(renderOrderMobileCard)
            .join("");
    }
}

function renderOrderTableRow(order) {
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
                <div class="order-customer-name">
                    ${escapeHtml(
                        order.customer_name || "—"
                    )}
                </div>

                <small>
                    ${escapeHtml(
                        order.customer_phone || ""
                    )}
                </small>
            </td>

            <td>
                <strong>
                    ${formatCurrency(order.total)}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    order.payment_method || "—"
                )}
            </td>

            <td>
                ${renderStatusBadge(order.status)}
            </td>

            <td>
                ${formatDate(order.created_at)}
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
                        class="admin-small-button"
                        onclick="editOrder('${escapeAttribute(order.id)}')"
                    >
                        Edit
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function renderOrderMobileCard(order) {
    return `
        <article class="admin-order-card">

            <div class="admin-order-card-top">
                <strong>
                    ${escapeHtml(
                        order.order_reference || "—"
                    )}
                </strong>

                ${renderStatusBadge(order.status)}
            </div>

            <div class="admin-order-card-info">

                <div>
                    <span>Customer</span>
                    <strong>
                        ${escapeHtml(
                            order.customer_name || "—"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total</span>
                    <strong>
                        ${formatCurrency(order.total)}
                    </strong>
                </div>

                <div>
                    <span>Payment</span>
                    <strong>
                        ${escapeHtml(
                            order.payment_method || "—"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Date</span>
                    <strong>
                        ${formatDate(order.created_at)}
                    </strong>
                </div>

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
                    class="admin-small-button"
                    onclick="editOrder('${escapeAttribute(order.id)}')"
                >
                    Edit Order
                </button>

            </div>

        </article>
    `;
}

// ============================================================
// VIEW ORDER
// ============================================================

async function viewOrder(orderId) {
    const order = allOrders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order) {
        showAdminToast(
            "Order not found.",
            "error"
        );
        return;
    }

    try {
        const {
            data: items,
            error
        } = await supabaseClient
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

        if (error) {
            throw error;
        }

        renderOrderModal(
            order,
            items || []
        );

    } catch (error) {
        console.error("View order error:", error);

        showAdminToast(
            "Unable to load order items.",
            "error"
        );
    }
}

function renderOrderModal(order, items) {
    closeDynamicOrderModal();

    const overlay = document.createElement("div");

    overlay.id = "dynamicOrderModal";
    overlay.className = "admin-modal-overlay";

    overlay.innerHTML = `
        <div class="admin-modal admin-order-details-modal">

            <div class="admin-modal-header">

                <div>
                    <h2>
                        Order
                        ${escapeHtml(
                            order.order_reference || ""
                        )}
                    </h2>

                    <p>
                        ${formatDate(order.created_at)}
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

                <div class="order-details-grid">

                    <div class="order-detail-card">
                        <h3>Customer</h3>

                        <p>
                            <strong>Name:</strong>
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
                            <strong>Email:</strong>
                            ${escapeHtml(
                                order.customer_email || "—"
                            )}
                        </p>
                    </div>

                    <div class="order-detail-card">
                        <h3>Delivery</h3>

                        <p>
                            <strong>Address:</strong>
                            ${escapeHtml(
                                order.delivery_address || "—"
                            )}
                        </p>

                        <p>
                            <strong>City:</strong>
                            ${escapeHtml(
                                order.delivery_city || "—"
                            )}
                        </p>

                        <p>
                            <strong>State:</strong>
                            ${escapeHtml(
                                order.delivery_state || "—"
                            )}
                        </p>
                    </div>

                    <div class="order-detail-card">
                        <h3>Payment</h3>

                        <p>
                            <strong>Method:</strong>
                            ${escapeHtml(
                                order.payment_method || "—"
                            )}
                        </p>

                        <p>
                            <strong>Plan:</strong>
                            ${escapeHtml(
                                order.payment_plan || "—"
                            )}
                        </p>

                        <p>
                            <strong>Payment Status:</strong>
                            ${escapeHtml(
                                order.payment_status || "—"
                            )}
                        </p>
                    </div>

                </div>

                <div class="order-detail-card">

                    <h3>Items</h3>

                    <div class="order-items-list">

                        ${
                            items.length
                                ? items.map(item => `
                                    <div class="admin-order-item">

                                        <div>
                                            <strong>
                                                ${escapeHtml(
                                                    item.product_name || "Product"
                                                )}
                                            </strong>

                                            <small>
                                                Size:
                                                ${escapeHtml(
                                                    item.size || "—"
                                                )}
                                                |
                                                Qty:
                                                ${item.quantity || 1}
                                            </small>
                                        </div>

                                        <strong>
                                            ${formatCurrency(
                                                item.subtotal ??
                                                (
                                                    Number(
                                                        item.product_price ??
                                                        item.unit_price ??
                                                        item.price ??
                                                        0
                                                    ) *
                                                    Number(
                                                        item.quantity || 1
                                                    )
                                                )
                                            )}
                                        </strong>

                                    </div>
                                `).join("")
                                : "<p>No items found.</p>"
                        }

                    </div>

                </div>

                <div class="order-total-box">

                    <div>
                        <span>Subtotal</span>
                        <strong>
                            ${formatCurrency(order.subtotal)}
                        </strong>
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>
                            ${formatCurrency(order.total)}
                        </strong>
                    </div>

                    <div>
                        <span>Paid / Pay Now</span>
                        <strong>
                            ${formatCurrency(
                                order.pay_now
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Balance</span>
                        <strong>
                            ${formatCurrency(
                                order.balance
                            )}
                        </strong>
                    </div>

                </div>

                ${
                    order.notes
                        ? `
                            <div class="order-detail-card">
                                <h3>Customer Note</h3>
                                <p>
                                    ${escapeHtml(order.notes)}
                                </p>
                            </div>
                        `
                        : ""
                }

                <div class="admin-modal-actions">

                    <a
                        href="${TRACKING_URL}?order=${encodeURIComponent(
                            order.order_reference || ""
                        )}"
                        target="_blank"
                        rel="noopener"
                        class="admin-button"
                    >
                        🔗 Tracking Page
                    </a>

                    <button
                        type="button"
                        class="admin-button"
                        onclick="editOrder('${escapeAttribute(order.id)}')"
                    >
                        ✏️ Edit Order
                    </button>

                    <button
                        type="button"
                        class="admin-button secondary"
                        onclick="closeDynamicOrderModal()"
                    >
                        Close
                    </button>

                </div>

            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add("show");
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeDynamicOrderModal();
        }
    });
}

function closeDynamicOrderModal() {
    const modal = document.getElementById(
        "dynamicOrderModal"
    );

    if (modal) {
        modal.remove();
    }
}

// ============================================================
// FULL ORDER EDITOR
// ============================================================

async function editOrder(orderId) {
    const order = allOrders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order) {
        showAdminToast(
            "Order not found.",
            "error"
        );
        return;
    }

    try {
        const {
            data: items,
            error
        } = await supabaseClient
            .from("order_items")
            .select("*")
            .eq("order_id", order.id)
            .order("id", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        currentEditingOrder = {
            ...order
        };

        currentEditingOrderItems =
            JSON.parse(
                JSON.stringify(items || [])
            );

        await loadProductOptionsForOrderEditor();

        closeDynamicOrderModal();

        renderOrderEditor();

    } catch (error) {
        console.error("Edit order error:", error);

        showAdminToast(
            "Unable to open order editor.",
            "error"
        );
    }
}

async function loadProductOptionsForOrderEditor() {
    if (allProducts.length) {
        currentOrderProductOptions = [...allProducts];
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select("*")
        .order("name", {
            ascending: true
        });

    if (error) {
        throw error;
    }

    currentOrderProductOptions = data || [];
}

function renderOrderEditor() {
    const order = currentEditingOrder;

    const overlay = document.createElement("div");

    overlay.id = "dynamicOrderEditModal";
    overlay.className = "admin-modal-overlay";

    overlay.innerHTML = `
        <div class="admin-modal admin-order-edit-modal">

            <div class="admin-modal-header">

                <div>
                    <h2>
                        Edit Order
                    </h2>

                    <p>
                        ${escapeHtml(
                            order.order_reference || ""
                        )}
                    </p>
                </div>

                <button
                    type="button"
                    class="admin-modal-close"
                    onclick="closeOrderEditor()"
                >
                    ×
                </button>

            </div>

            <div class="admin-modal-body">

                <form id="orderEditForm">

                    <input
                        type="hidden"
                        id="editOrderId"
                        value="${escapeAttribute(order.id)}"
                    >

                    <div class="admin-edit-section">

                        <h3>Customer Information</h3>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">
                                <label for="editCustomerName">
                                    Customer Name
                                </label>

                                <input
                                    type="text"
                                    id="editCustomerName"
                                    value="${escapeAttribute(
                                        order.customer_name || ""
                                    )}"
                                    required
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="editCustomerPhone">
                                    Phone
                                </label>

                                <input
                                    type="tel"
                                    id="editCustomerPhone"
                                    value="${escapeAttribute(
                                        order.customer_phone || ""
                                    )}"
                                    required
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="editCustomerEmail">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    id="editCustomerEmail"
                                    value="${escapeAttribute(
                                        order.customer_email || ""
                                    )}"
                                >
                            </div>

                        </div>

                    </div>

                    <div class="admin-edit-section">

                        <h3>Delivery Information</h3>

                        <div class="admin-form-group">

                            <label for="editDeliveryAddress">
                                Delivery Address
                            </label>

                            <textarea
                                id="editDeliveryAddress"
                                rows="3"
                            >${escapeHtml(
                                order.delivery_address || ""
                            )}</textarea>

                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">

                                <label for="editDeliveryCity">
                                    City
                                </label>

                                <input
                                    type="text"
                                    id="editDeliveryCity"
                                    value="${escapeAttribute(
                                        order.delivery_city || ""
                                    )}"
                                >

                            </div>

                            <div class="admin-form-group">

                                <label for="editDeliveryState">
                                    State
                                </label>

                                <select id="editDeliveryState">
                                    ${getNigeriaStateOptions(
                                        order.delivery_state
                                    )}
                                </select>

                            </div>

                        </div>

                    </div>

                    <div class="admin-edit-section">

                        <h3>Payment Information</h3>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">

                                <label for="editPaymentMethod">
                                    Payment Method
                                </label>

                                <select id="editPaymentMethod">

                                    <option value="OPay Bank Transfer">
                                        OPay Bank Transfer
                                    </option>

                                    <option value="Cash on Delivery">
                                        Cash on Delivery
                                    </option>

                                </select>

                            </div>

                            <div class="admin-form-group">

                                <label for="editPaymentPlan">
                                    Payment Plan
                                </label>

                                <select id="editPaymentPlan">

                                    <option value="deposit">
                                        60% Deposit
                                    </option>

                                    <option value="full">
                                        100% Full Payment
                                    </option>

                                </select>

                            </div>

                            <div class="admin-form-group">

                                <label for="editPaymentStatus">
                                    Payment Status
                                </label>

                                <select id="editPaymentStatus">
                                    ${getPaymentStatusOptions(
                                        order.payment_status
                                    )}
                                </select>

                            </div>

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

                        </div>

                    </div>

                    <div class="admin-edit-section">

                        <div class="admin-edit-section-header">

                            <div>
                                <h3>Order Items</h3>

                                <p>
                                    Add, remove or change products,
                                    sizes, quantities and prices.
                                </p>
                            </div>

                            <button
                                type="button"
                                class="admin-small-button"
                                onclick="addOrderEditorItem()"
                            >
                                ＋ Add Product
                            </button>

                        </div>

                        <div
                            id="orderEditorItems"
                            class="order-editor-items"
                        ></div>

                    </div>

                    <div class="admin-edit-section">

                        <h3>Order Totals</h3>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">

                                <label for="editOrderTotal">
                                    Total (₦)
                                </label>

                                <input
                                    type="number"
                                    id="editOrderTotal"
                                    min="0"
                                    step="0.01"
                                    readonly
                                >

                            </div>

                            <div class="admin-form-group">

                                <label for="editOrderPayNow">
                                    Pay Now (₦)
                                </label>

                                <input
                                    type="number"
                                    id="editOrderPayNow"
                                    min="0"
                                    step="0.01"
                                >

                            </div>

                            <div class="admin-form-group">

                                <label for="editOrderBalance">
                                    Balance (₦)
                                </label>

                                <input
                                    type="number"
                                    id="editOrderBalance"
                                    min="0"
                                    step="0.01"
                                    readonly
                                >

                            </div>

                        </div>

                        <div
                            id="orderEditorCalculation"
                            class="order-editor-calculation"
                        ></div>

                    </div>

                    <div class="admin-edit-section">

                        <h3>Notes</h3>

                        <div class="admin-form-group">

                            <textarea
                                id="editOrderNotes"
                                rows="4"
                                placeholder="Admin/customer order notes..."
                            >${escapeHtml(
                                order.notes || ""
                            )}</textarea>

                        </div>

                    </div>

                    <div
                        id="orderEditMessage"
                        class="admin-form-message"
                        role="alert"
                    ></div>

                    <div class="admin-modal-actions">

                        <button
                            type="button"
                            class="admin-button secondary"
                            onclick="closeOrderEditor()"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            id="saveOrderButton"
                            class="admin-button"
                        >
                            Save Order
                        </button>

                    </div>

                </form>

            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    setupOrderEditorEvents();

    renderOrderEditorItems();

    recalculateOrderEditorTotals();

    requestAnimationFrame(() => {
        overlay.classList.add("show");
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeOrderEditor();
        }
    });
}

function setupOrderEditorEvents() {
    const form = document.getElementById(
        "orderEditForm"
    );

    if (form) {
        form.addEventListener(
            "submit",
            saveEditedOrder
        );
    }

    const paymentPlan = document.getElementById(
        "editPaymentPlan"
    );

    if (paymentPlan) {
        paymentPlan.addEventListener(
            "change",
            () => {
                recalculateOrderEditorTotals();
            }
        );
    }

    const payNow = document.getElementById(
        "editOrderPayNow"
    );

    if (payNow) {
        payNow.addEventListener(
            "input",
            () => {
                recalculateOrderEditorTotals(false);
            }
        );
    }
}

function closeOrderEditor() {
    const modal = document.getElementById(
        "dynamicOrderEditModal"
    );

    if (modal) {
        modal.remove();
    }

    currentEditingOrder = null;
    currentEditingOrderItems = [];
}

// ============================================================
// ORDER ITEMS EDITOR
// ============================================================

function renderOrderEditorItems() {
    const container = document.getElementById(
        "orderEditorItems"
    );

    if (!container) return;

    if (!currentEditingOrderItems.length) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <div class="admin-empty-icon">📦</div>
                <h3>No products in this order</h3>
                <p>Use "Add Product" to add an item.</p>
            </div>
        `;

        recalculateOrderEditorTotals();
        return;
    }

    container.innerHTML =
        currentEditingOrderItems
            .map((item, index) =>
                renderOrderEditorItem(
                    item,
                    index
                )
            )
            .join("");

    currentEditingOrderItems.forEach(
        (item, index) => {
            setupOrderItemEvents(
                index
            );
        }
    );

    recalculateOrderEditorTotals();
}

function renderOrderEditorItem(item, index) {
    const productId =
        item.product_id || "";

    const product =
        currentOrderProductOptions.find(
            productItem =>
                String(productItem.id) ===
                String(productId)
        );

    const sizes =
        product && Array.isArray(product.sizes)
            ? product.sizes
            : parseSizes(item.size);

    const currentSize =
        item.size || "";

    return `
        <div
            class="order-editor-item"
            data-item-index="${index}"
        >

            <div class="order-editor-item-header">

                <strong>
                    Item ${index + 1}
                </strong>

                <button
                    type="button"
                    class="admin-danger-button"
                    onclick="removeOrderEditorItem(${index})"
                >
                    🗑 Remove
                </button>

            </div>

            <div class="admin-form-grid">

                <div class="admin-form-group">

                    <label>
                        Product
                    </label>

                    <select
                        class="order-item-product"
                        data-index="${index}"
                    >
                        <option value="">
                            Select product
                        </option>

                        ${currentOrderProductOptions
                            .map(productOption => `
                                <option
                                    value="${escapeAttribute(
                                        productOption.id
                                    )}"
                                    ${
                                        String(
                                            productOption.id
                                        ) ===
                                        String(productId)
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHtml(
                                        productOption.name
                                    )}
                                    ${
                                        Number(
                                            productOption.stock
                                        ) <= 0
                                            ? " — Out of stock"
                                            : ""
                                    }
                                </option>
                            `)
                            .join("")}

                    </select>

                </div>

                <div class="admin-form-group">

                    <label>
                        Size
                    </label>

                    <select
                        class="order-item-size"
                        data-index="${index}"
                    >

                        <option value="">
                            Select size
                        </option>

                        ${sizes
                            .map(size => `
                                <option
                                    value="${escapeAttribute(
                                        String(size)
                                    )}"
                                    ${
                                        String(size) ===
                                        String(currentSize)
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHtml(
                                        String(size)
                                    )}
                                </option>
                            `)
                            .join("")}

                    </select>

                </div>

                <div class="admin-form-group">

                    <label>
                        Quantity
                    </label>

                    <input
                        type="number"
                        class="order-item-quantity"
                        data-index="${index}"
                        min="1"
                        step="1"
                        value="${Number(
                            item.quantity || 1
                        )}"
                    >

                </div>

                <div class="admin-form-group">

                    <label>
                        Item Price (₦)
                    </label>

                    <input
                        type="number"
                        class="order-item-price"
                        data-index="${index}"
                        min="0"
                        step="0.01"
                        value="${Number(
                            item.product_price ??
                            item.unit_price ??
                            item.price ??
                            0
                        )}"
                    >

                </div>

            </div>

            <div class="order-editor-item-total">

                <span>
                    Item Subtotal
                </span>

                <strong
                    id="orderItemSubtotal-${index}"
                >
                    ${formatCurrency(
                        Number(item.subtotal || 0)
                    )}
                </strong>

            </div>

        </div>
    `;
}

function setupOrderItemEvents(index) {
    const productSelect =
        document.querySelector(
            `.order-item-product[data-index="${index}"]`
        );

    const sizeSelect =
        document.querySelector(
            `.order-item-size[data-index="${index}"]`
        );

    const quantityInput =
        document.querySelector(
            `.order-item-quantity[data-index="${index}"]`
        );

    const priceInput =
        document.querySelector(
            `.order-item-price[data-index="${index}"]`
        );

    if (productSelect) {
        productSelect.addEventListener(
            "change",
            event => {
                handleOrderItemProductChange(
                    index,
                    event.target.value
                );
            }
        );
    }

    if (sizeSelect) {
        sizeSelect.addEventListener(
            "change",
            event => {
                currentEditingOrderItems[index].size =
                    event.target.value;

                recalculateOrderEditorTotals();
            }
        );
    }

    if (quantityInput) {
        quantityInput.addEventListener(
            "input",
            event => {
                let quantity =
                    parseInt(
                        event.target.value,
                        10
                    );

                if (!Number.isFinite(quantity) || quantity < 1) {
                    quantity = 1;
                    event.target.value = 1;
                }

                currentEditingOrderItems[index].quantity =
                    quantity;

                recalculateOrderEditorTotals();
            }
        );
    }

    if (priceInput) {
        priceInput.addEventListener(
            "input",
            event => {
                let price =
                    Number(
                        event.target.value
                    );

                if (
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    price = 0;
                }

                currentEditingOrderItems[index]
                    .product_price = price;

                recalculateOrderEditorTotals();
            }
        );
    }
}

function handleOrderItemProductChange(
    index,
    productId
) {
    const item =
        currentEditingOrderItems[index];

    const product =
        currentOrderProductOptions.find(
            productItem =>
                String(productItem.id) ===
                String(productId)
        );

    if (!item) return;

    item.product_id =
        productId || null;

    if (product) {
        item.product_name =
            product.name;

        item.product_price =
            Number(product.price || 0);

        const sizes =
            Array.isArray(product.sizes)
                ? product.sizes
                : [];

        if (
            item.size &&
            !sizes.map(String).includes(
                String(item.size)
            )
        ) {
            item.size =
                sizes.length
                    ? String(sizes[0])
                    : "";
        }

        updateOrderItemSizeOptions(
            index,
            sizes,
            item.size
        );

        const priceInput =
            document.querySelector(
                `.order-item-price[data-index="${index}"]`
            );

        if (priceInput) {
            priceInput.value =
                Number(
                    product.price || 0
                );
        }
    } else {
        item.product_name = "";
        item.product_price = 0;

        updateOrderItemSizeOptions(
            index,
            [],
            ""
        );
    }

    recalculateOrderEditorTotals();
}

function updateOrderItemSizeOptions(
    index,
    sizes,
    selectedSize
) {
    const select =
        document.querySelector(
            `.order-item-size[data-index="${index}"]`
        );

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Select size
        </option>

        ${sizes.map(size => `
            <option
                value="${escapeAttribute(
                    String(size)
                )}"
                ${
                    String(size) ===
                    String(selectedSize)
                        ? "selected"
                        : ""
                }
            >
                ${escapeHtml(
                    String(size)
                )}
            </option>
        `).join("")}
    `;
}

function addOrderEditorItem() {
    currentEditingOrderItems.push({
        id: null,
        order_id: currentEditingOrder.id,
        product_id:
            currentOrderProductOptions[0]?.id ||
            null,
        product_name:
            currentOrderProductOptions[0]?.name ||
            "",
        product_price:
            Number(
                currentOrderProductOptions[0]?.price ||
                0
            ),
        quantity: 1,
        size:
            getFirstProductSize(
                currentOrderProductOptions[0]
            ),
        subtotal: 0
    });

    renderOrderEditorItems();
}

function removeOrderEditorItem(index) {
    if (
        index < 0 ||
        index >= currentEditingOrderItems.length
    ) {
        return;
    }

    currentEditingOrderItems.splice(
        index,
        1
    );

    renderOrderEditorItems();
}

function getFirstProductSize(product) {
    if (
        product &&
        Array.isArray(product.sizes) &&
        product.sizes.length
    ) {
        return String(product.sizes[0]);
    }

    return "";
}

// ============================================================
// ORDER TOTAL CALCULATION
// ============================================================

function recalculateOrderEditorTotals(
    updatePayNow = true
) {
    if (!currentEditingOrder) {
        return;
    }

    let subtotal = 0;

    currentEditingOrderItems.forEach(
        (item, index) => {
            const quantity =
                Number(
                    item.quantity || 1
                );

            const price =
                Number(
                    item.product_price ??
                    item.unit_price ??
                    item.price ??
                    0
                );

            const itemSubtotal =
                quantity * price;

            item.quantity =
                quantity > 0
                    ? quantity
                    : 1;

            item.product_price =
                price >= 0
                    ? price
                    : 0;

            item.subtotal =
                itemSubtotal;

            subtotal +=
                itemSubtotal;

            const itemSubtotalElement =
                document.getElementById(
                    `orderItemSubtotal-${index}`
                );

            if (itemSubtotalElement) {
                itemSubtotalElement.textContent =
                    formatCurrency(
                        itemSubtotal
                    );
            }
        }
    );

    const total =
        Math.max(0, subtotal);

    const totalInput =
        document.getElementById(
            "editOrderTotal"
        );

    if (totalInput) {
        totalInput.value =
            total.toFixed(2);
    }

    const payNowInput =
        document.getElementById(
            "editOrderPayNow"
        );

    let payNow =
        Number(
            payNowInput?.value || 0
        );

    const paymentPlan =
        getValue(
            "editPaymentPlan"
        );

    if (updatePayNow) {
        if (
            paymentPlan ===
            "full"
        ) {
            payNow = total;
        } else {
            payNow =
                Math.round(
                    total * 0.60 * 100
                ) / 100;
        }

        if (payNowInput) {
            payNowInput.value =
                payNow.toFixed(2);
        }
    }

    payNow =
        Math.max(
            0,
            Math.min(
                payNow,
                total
            )
        );

    const balance =
        Math.max(
            0,
            total - payNow
        );

    const balanceInput =
        document.getElementById(
            "editOrderBalance"
        );

    if (balanceInput) {
        balanceInput.value =
            balance.toFixed(2);
    }

    const calculation =
        document.getElementById(
            "orderEditorCalculation"
        );

    if (calculation) {
        calculation.innerHTML = `
            <div>
                <span>Items</span>
                <strong>
                    ${currentEditingOrderItems.length}
                </strong>
            </div>

            <div>
                <span>Subtotal</span>
                <strong>
                    ${formatCurrency(total)}
                </strong>
            </div>

            <div>
                <span>Pay Now</span>
                <strong>
                    ${formatCurrency(payNow)}
                </strong>
            </div>

            <div>
                <span>Balance</span>
                <strong>
                    ${formatCurrency(balance)}
                </strong>
            </div>
        `;
    }
}

// ============================================================
// SAVE FULL ORDER
// ============================================================

async function saveEditedOrder(event) {
    event.preventDefault();

    if (!currentEditingOrder) {
        return;
    }

    const saveButton =
        document.getElementById(
            "saveOrderButton"
        );

    const message =
        document.getElementById(
            "orderEditMessage"
        );

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent =
            "Saving Order...";
    }

    if (message) {
        message.textContent = "";
        message.className =
            "admin-form-message";
    }

    try {
        const subtotal =
            currentEditingOrderItems.reduce(
                (sum, item) =>
                    sum +
                    (
                        Number(
                            item.product_price ??
                            item.unit_price ??
                            item.price ??
                            0
                        ) *
                        Number(
                            item.quantity || 1
                        )
                    ),
                0
            );

        const total =
            Math.max(
                0,
                subtotal
            );

        let payNow =
            Number(
                getValue(
                    "editOrderPayNow"
                ) || 0
            );

        payNow =
            Math.max(
                0,
                Math.min(
                    payNow,
                    total
                )
            );

        const balance =
            Math.max(
                0,
                total - payNow
            );

        const orderUpdates = {
            customer_name:
                getValue(
                    "editCustomerName"
                ),

            customer_phone:
                getValue(
                    "editCustomerPhone"
                ),

            customer_email:
                getValue(
                    "editCustomerEmail"
                ),

            delivery_address:
                getValue(
                    "editDeliveryAddress"
                ),

            delivery_city:
                getValue(
                    "editDeliveryCity"
                ),

            delivery_state:
                getValue(
                    "editDeliveryState"
                ),

            payment_method:
                getValue(
                    "editPaymentMethod"
                ),

            payment_plan:
                getValue(
                    "editPaymentPlan"
                ),

            subtotal,
            total,
            pay_now: payNow,
            balance,

            status:
                getValue(
                    "editOrderStatus"
                ),

            payment_status:
                getValue(
                    "editPaymentStatus"
                ),

            notes:
                getValue(
                    "editOrderNotes"
                )
        };

        // ----------------------------------------------------
        // 1. UPDATE ORDER
        // ----------------------------------------------------

        const {
            error: orderError
        } = await supabaseClient
            .from("orders")
            .update(orderUpdates)
            .eq(
                "id",
                currentEditingOrder.id
            );

        if (orderError) {
            throw orderError;
        }

        // ----------------------------------------------------
        // 2. SAVE ORDER ITEMS
        // ----------------------------------------------------

        await saveOrderItems(
            currentEditingOrder.id,
            currentEditingOrderItems
        );

        showMessage(
            "orderEditMessage",
            "Order updated successfully.",
            "success"
        );

        // Refresh local data
        await loadOrders();

        // Close after a short delay
        setTimeout(() => {
            closeOrderEditor();
        }, 700);

    } catch (error) {
        console.error(
            "Save edited order error:",
            error
        );

        showMessage(
            "orderEditMessage",
            getDatabaseErrorMessage(error),
            "error"
        );
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent =
                "Save Order";
        }
    }
}

// ============================================================
// SAVE ORDER ITEMS
// ============================================================

async function saveOrderItems(
    orderId,
    items
) {
    // First get existing items
    const {
        data: existingItems,
        error: existingError
    } = await supabaseClient
        .from("order_items")
        .select("*")
        .eq(
            "order_id",
            orderId
        );

    if (existingError) {
        throw existingError;
    }

    const existing =
        existingItems || [];

    // --------------------------------------------------------
    // Delete removed items
    // --------------------------------------------------------

    const currentIds =
        items
            .filter(item => item.id)
            .map(item =>
                String(item.id)
            );

    const removedIds =
        existing
            .filter(item =>
                item.id &&
                !currentIds.includes(
                    String(item.id)
                )
            )
            .map(item => item.id);

    if (removedIds.length) {
        const {
            error
        } = await supabaseClient
            .from("order_items")
            .delete()
            .in(
                "id",
                removedIds
            );

        if (error) {
            throw error;
        }
    }

    // --------------------------------------------------------
    // Insert / update remaining items
    // --------------------------------------------------------

    for (const item of items) {
        const quantity =
            Math.max(
                1,
                Number(
                    item.quantity || 1
                )
            );

        const price =
            Math.max(
                0,
                Number(
                    item.product_price ??
                    item.unit_price ??
                    item.price ??
                    0
                )
            );

        const subtotal =
            quantity * price;

        const payload = {
            order_id: orderId,

            product_id:
                item.product_id || null,

            product_name:
                item.product_name || "",

            product_price:
                price,

            quantity,

            size:
                item.size || null,

            subtotal
        };

        if (item.id) {
            const {
                error
            } = await supabaseClient
                .from("order_items")
                .update(payload)
                .eq(
                    "id",
                    item.id
                );

            if (error) {
                throw error;
            }

        } else {
            const {
                error
            } = await supabaseClient
                .from("order_items")
                .insert(payload);

            if (error) {
                throw error;
            }
        }
    }
}

// ============================================================
// QUICK ORDER STATUS UPDATE
// ============================================================

async function updateOrderStatus(
    orderId,
    newStatus
) {
    if (!orderId || !newStatus) {
        return;
    }

    try {
        const {
            error
        } = await supabaseClient
            .from("orders")
            .update({
                status: newStatus
            })
            .eq(
                "id",
                orderId
            );

        if (error) {
            throw error;
        }

        showAdminToast(
            "Order status updated.",
            "success"
        );

        await loadOrders();

    } catch (error) {
        console.error(
            "Update order status error:",
            error
        );

        showAdminToast(
            getDatabaseErrorMessage(error),
            "error"
        );
    }
}

// ============================================================
// PRODUCTS
// ============================================================

function setupProductEvents() {
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

    const closeButton =
        document.getElementById(
            "closeProductModal"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeProductModal
        );
    }

    const cancelButton =
        document.getElementById(
            "cancelProductButton"
        );

    if (cancelButton) {
        cancelButton.addEventListener(
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
            handleProductImagePreview
        );
    }

    const search =
        document.getElementById(
            "productSearch"
        );

    if (search) {
        search.addEventListener(
            "input",
            filterProducts
        );
    }

    const categoryFilter =
        document.getElementById(
            "productCategoryFilter"
        );

    if (categoryFilter) {
        categoryFilter.addEventListener(
            "change",
            filterProducts
        );
    }

    const statusFilter =
        document.getElementById(
            "productStatusFilter"
        );

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            filterProducts
        );
    }

    const addCustom =
        document.getElementById(
            "addCustomSizeButton"
        );

    if (addCustom) {
        addCustom.addEventListener(
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

    const overlay =
        document.getElementById(
            "productModal"
        );

    if (overlay) {
        overlay.addEventListener(
            "click",
            event => {
                if (
                    event.target === overlay
                ) {
                    closeProductModal();
                }
            }
        );
    }
}

async function loadProducts() {
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

        allProducts = data || [];

        filterProducts();

    } catch (error) {
        console.error(
            "Load products error:",
            error
        );

        showAdminToast(
            "Unable to load products.",
            "error"
        );
    }
}

function filterProducts() {
    const search =
        (
            getValue(
                "productSearch"
            ) || ""
        )
            .toLowerCase()
            .trim();

    const category =
        getValue(
            "productCategoryFilter"
        );

    const status =
        getValue(
            "productStatusFilter"
        );

    let filtered =
        [...allProducts];

    if (search) {
        filtered =
            filtered.filter(product => {
                return [
                    product.name,
                    product.id,
                    product.category,
                    product.description
                ].some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );
            });
    }

    if (category) {
        filtered =
            filtered.filter(
                product =>
                    String(
                        product.category || ""
                    ) === category
            );
    }

    if (status === "active") {
        filtered =
            filtered.filter(
                product =>
                    product.is_active === true
            );
    }

    if (status === "inactive") {
        filtered =
            filtered.filter(
                product =>
                    product.is_active === false
            );
    }

    renderProducts(filtered);
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
            `${products.length} ${
                products.length === 1
                    ? "product"
                    : "products"
            }`;
    }

    if (!products.length) {
        if (grid) {
            grid.innerHTML = "";
        }

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }

    if (empty) {
        empty.style.display =
            "none";
    }

    if (grid) {
        grid.innerHTML =
            products
                .map(renderProductCard)
                .join("");
    }
}

function renderProductCard(product) {
    const image =
        product.image;

    const sizes =
        Array.isArray(product.sizes)
            ? product.sizes.join(", ")
            : "";

    return `
        <article class="admin-product-card">

            <div class="admin-product-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(
                                    image
                                )}"
                                alt="${escapeAttribute(
                                    product.name || "Product"
                                )}"
                            >
                        `
                        : `
                            <span>
                                ${escapeHtml(
                                    product.icon || "👟"
                                )}
                            </span>
                        `
                }

                ${
                    product.badge
                        ? `
                            <span class="product-badge">
                                ${escapeHtml(
                                    product.badge
                                )}
                            </span>
                        `
                        : ""
                }

            </div>

            <div class="admin-product-content">

                <div class="admin-product-top">

                    <span class="admin-product-category">
                        ${escapeHtml(
                            product.category || "Uncategorized"
                        )}
                    </span>

                    <span
                        class="${
                            product.is_active
                                ? "status-active"
                                : "status-inactive"
                        }"
                    >
                        ${
                            product.is_active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                </div>

                <h3>
                    ${escapeHtml(
                        product.name || "Unnamed Product"
                    )}
                </h3>

                <div class="admin-product-prices">

                    <strong>
                        ${formatCurrency(
                            product.price
                        )}
                    </strong>

                    ${
                        product.old_price
                            ? `
                                <del>
                                    ${formatCurrency(
                                        product.old_price
                                    )}
                                </del>
                            `
                            : ""
                    }

                </div>

                <div class="admin-product-meta">

                    <span>
                        Stock:
                        <strong>
                            ${Number(
                                product.stock || 0
                            )}
                        </strong>
                    </span>

                    <span>
                        Sizes:
                        <strong>
                            ${escapeHtml(
                                sizes || "—"
                            )}
                        </strong>
                    </span>

                </div>

                <div class="admin-product-actions">

                    <button
                        type="button"
                        class="admin-small-button"
                        onclick="editProduct('${escapeAttribute(
                            product.id
                        )}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="admin-small-button"
                        onclick="toggleProductStatus('${escapeAttribute(
                            product.id
                        )}')"
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
                        onclick="deleteProduct('${escapeAttribute(
                            product.id
                        )}')"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </article>
    `;
}

// ============================================================
// PRODUCT MODAL
// ============================================================

async function openProductModal(productId = null) {
    const modal =
        document.getElementById(
            "productModal"
        );

    const form =
        document.getElementById(
            "productForm"
        );

    if (!modal || !form) return;

    form.reset();

    setValue(
        "productId",
        ""
    );

    setValue(
        "productIcon",
        "👟"
    );

    setText(
        "productModalTitle",
        productId
            ? "Edit Product"
            : "Add Product"
    );

    setText(
        "productFormMessage",
        ""
    );

    customSizes = [];

    populateCategorySelects();

    renderCustomSizes();

    clearProductImagePreview();

    const active =
        document.getElementById(
            "productActive"
        );

    if (active) {
        active.checked = true;
    }

    if (productId) {
        const product =
            allProducts.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );

        if (!product) {
            showAdminToast(
                "Product not found.",
                "error"
            );
            return;
        }

        setValue(
            "productId",
            product.id
        );

        setValue(
            "productName",
            product.name || ""
        );

        setValue(
            "productCategory",
            product.category || ""
        );

        setValue(
            "productBadge",
            product.badge || ""
        );

        setValue(
            "productPrice",
            product.price ?? ""
        );

        setValue(
            "productOldPrice",
            product.old_price ?? ""
        );

        setValue(
            "productStock",
            product.stock ?? 0
        );

        setValue(
            "productIcon",
            product.icon || "👟"
        );

        setValue(
            "productDescription",
            product.description || ""
        );

        if (active) {
            active.checked =
                product.is_active !== false;
        }

        setSelectedSizes(
            Array.isArray(product.sizes)
                ? product.sizes
                : []
        );

        if (product.image) {
            showProductImagePreview(
                product.image
            );
        }
    }

    modal.style.display =
        "flex";

    requestAnimationFrame(() => {
        modal.classList.add("show");
    });
}

function closeProductModal() {
    const modal =
        document.getElementById(
            "productModal"
        );

    if (!modal) return;

    modal.classList.remove("show");

    setTimeout(() => {
        modal.style.display =
            "none";
    }, 150);
}

function handleProductImagePreview(event) {
    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage(
            "productFormMessage",
            "Please choose an image file.",
            "error"
        );

        event.target.value = "";
        return;
    }

    const reader =
        new FileReader();

    reader.onload = () => {
        showProductImagePreview(
            reader.result
        );
    };

    reader.readAsDataURL(file);
}

function showProductImagePreview(
    source
) {
    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (!preview) return;

    preview.innerHTML = `
        <img
            src="${escapeAttribute(source)}"
            alt="Product preview"
        >
    `;
}

function clearProductImagePreview() {
    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (!preview) return;

    preview.innerHTML =
        "<span>No image selected</span>";
}

// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(event) {
    event.preventDefault();

    const button =
        document.getElementById(
            "saveProductButton"
        );

    if (button) {
        button.disabled = true;
        button.textContent =
            "Saving...";
    }

    try {
        const productId =
            getValue("productId");

        const name =
            getValue("productName").trim();

        const category =
            getValue(
                "productCategory"
            ).trim();

        const price =
            Number(
                getValue(
                    "productPrice"
                ) || 0
            );

        const oldPriceValue =
            getValue(
                "productOldPrice"
            );

        const oldPrice =
            oldPriceValue
                ? Number(oldPriceValue)
                : null;

        const stock =
            Number(
                getValue(
                    "productStock"
                ) || 0
            );

        const badge =
            getValue(
                "productBadge"
            ).trim();

        const icon =
            getValue(
                "productIcon"
            ).trim() || "👟";

        const description =
            getValue(
                "productDescription"
            ).trim();

        const active =
            document.getElementById(
                "productActive"
            )?.checked ?? true;

        if (!name) {
            throw new Error(
                "Please enter a product name."
            );
        }

        if (!category) {
            throw new Error(
                "Please select a category."
            );
        }

        if (price < 0) {
            throw new Error(
                "Price cannot be negative."
            );
        }

        if (stock < 0) {
            throw new Error(
                "Stock cannot be negative."
            );
        }

        const sizes =
            getSelectedSizes();

        let image =
            productId
                ? (
                    allProducts.find(
                        product =>
                            String(
                                product.id
                            ) ===
                            String(productId)
                    )?.image || null
                )
                : null;

        // Upload image if selected
        const imageInput =
            document.getElementById(
                "productImage"
            );

        const file =
            imageInput?.files?.[0];

        if (file) {
            image =
                await uploadProductImage(
                    productId ||
                    createProductId(name),
                    file
                );
        }

        const payload = {
            id:
                productId ||
                createProductId(name),

            name,

            category,

            price,

            old_price:
                oldPrice,

            badge:
                badge || null,

            icon,

            image,

            description:
                description || null,

            sizes,

            stock,

            is_active:
                active,

            updated_at:
                new Date().toISOString()
        };

        const {
            error
        } = await supabaseClient
            .from("products")
            .upsert(
                payload,
                {
                    onConflict: "id"
                }
            );

        if (error) {
            throw error;
        }

        showMessage(
            "productFormMessage",
            "Product saved successfully.",
            "success"
        );

        await loadProducts();

        setTimeout(() => {
            closeProductModal();
        }, 500);

    } catch (error) {
        console.error(
            "Save product error:",
            error
        );

        showMessage(
            "productFormMessage",
            getDatabaseErrorMessage(error),
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "Save Product";
        }
    }
}

async function uploadProductImage(
    productId,
    file
) {
    const extension =
        getFileExtension(
            file.name
        );

    const path =
        `products/${productId}-${Date.now()}.${extension}`;

    const {
        error
    } = await supabaseClient
        .storage
        .from("product-images")
        .upload(
            path,
            file,
            {
                upsert: false,
                contentType: file.type
            }
        );

    if (error) {
        throw error;
    }

    const {
        data
    } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(path);

    return data?.publicUrl || null;
}

function editProduct(productId) {
    openProductModal(productId);
}

async function toggleProductStatus(
    productId
) {
    const product =
        allProducts.find(
            item =>
                String(item.id) ===
                String(productId)
        );

    if (!product) return;

    try {
        const {
            error
        } = await supabaseClient
            .from("products")
            .update({
                is_active:
                    !product.is_active,
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                product.id
            );

        if (error) {
            throw error;
        }

        showAdminToast(
            product.is_active
                ? "Product disabled."
                : "Product enabled.",
            "success"
        );

        await loadProducts();

    } catch (error) {
        console.error(
            "Toggle product error:",
            error
        );

        showAdminToast(
            getDatabaseErrorMessage(error),
            "error"
        );
    }
}

async function deleteProduct(
    productId
) {
    const product =
        allProducts.find(
            item =>
                String(item.id) ===
                String(productId)
        );

    if (!product) return;

    const confirmed =
        window.confirm(
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
                product.id
            );

        if (error) {
            throw error;
        }

        showAdminToast(
            "Product deleted.",
            "success"
        );

        await loadProducts();

    } catch (error) {
        console.error(
            "Delete product error:",
            error
        );

        showAdminToast(
            getDatabaseErrorMessage(error),
            "error"
        );
    }
}

// ============================================================
// PRODUCT SIZES
// ============================================================

function getSelectedSizes() {
    const sizes = [];

    document
        .querySelectorAll(
            'input[name="productSize"]:checked'
        )
        .forEach(input => {
            sizes.push(
                input.value
            );
        });

    customSizes.forEach(size => {
        if (!sizes.includes(size)) {
            sizes.push(size);
        }
    });

    // Compatibility with old text field
    const oldInput =
        document.getElementById(
            "productSizes"
        );

    if (
        oldInput &&
        !sizes.length
    ) {
        return parseSizes(
            oldInput.value
        );
    }

    return sizes;
}

function setSelectedSizes(
    sizes
) {
    const normalized =
        (sizes || [])
            .map(size =>
                String(size).trim()
            )
            .filter(Boolean);

    document
        .querySelectorAll(
            'input[name="productSize"]'
        )
        .forEach(input => {
            input.checked =
                normalized.includes(
                    input.value
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

function addCustomSize() {
    const input =
        document.getElementById(
            "customSizeInput"
        );

    if (!input) return;

    const size =
        input.value.trim();

    if (!size) {
        return;
    }

    if (
        customSizes.includes(size)
    ) {
        input.value = "";
        return;
    }

    customSizes.push(size);

    input.value = "";

    renderCustomSizes();
}

function renderCustomSizes() {
    const container =
        document.getElementById(
            "customSizesList"
        );

    if (!container) return;

    container.innerHTML =
        customSizes
            .map(
                (size, index) => `
                    <span class="custom-size-tag">

                        ${escapeHtml(size)}

                        <button
                            type="button"
                            onclick="removeCustomSize(${index})"
                            aria-label="Remove ${escapeAttribute(
                                size
                            )}"
                        >
                            ×
                        </button>

                    </span>
                `
            )
            .join("");
}

function removeCustomSize(index) {
    customSizes.splice(
        index,
        1
    );

    renderCustomSizes();
}

function parseSizes(value) {
    if (Array.isArray(value)) {
        return value;
    }

    return String(value || "")
        .split(",")
        .map(size =>
            size.trim()
        )
        .filter(Boolean);
}

// ============================================================
// CATEGORIES
// ============================================================

function setupCategoryEvents() {
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

    const closeButton =
        document.getElementById(
            "closeCategoryModal"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeCategoryModal
        );
    }

    const cancelButton =
        document.getElementById(
            "cancelCategoryButton"
        );

    if (cancelButton) {
        cancelButton.addEventListener(
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

    const search =
        document.getElementById(
            "categorySearch"
        );

    if (search) {
        search.addEventListener(
            "input",
            filterCategories
        );
    }

    const status =
        document.getElementById(
            "categoryStatusFilter"
        );

    if (status) {
        status.addEventListener(
            "change",
            filterCategories
        );
    }

    const overlay =
        document.getElementById(
            "categoryModal"
        );

    if (overlay) {
        overlay.addEventListener(
            "click",
            event => {
                if (
                    event.target === overlay
                ) {
                    closeCategoryModal();
                }
            }
        );
    }
}

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

        filterCategories();

    } catch (error) {
        console.error(
            "Load categories error:",
            error
        );

        allCategories = [];

        showAdminToast(
            "Unable to load categories.",
            "error"
        );
    }
}

function filterCategories() {
    const search =
        (
            getValue(
                "categorySearch"
            ) || ""
        )
            .toLowerCase()
            .trim();

    const status =
        getValue(
            "categoryStatusFilter"
        );

    let filtered =
        [...allCategories];

    if (search) {
        filtered =
            filtered.filter(category =>
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
        filtered =
            filtered.filter(
                category =>
                    category.is_active !== false
            );
    }

    if (status === "inactive") {
        filtered =
            filtered.filter(
                category =>
                    category.is_active === false
            );
    }

    renderCategories(filtered);
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
            `${categories.length} ${
                categories.length === 1
                    ? "category"
                    : "categories"
            }`;
    }

    if (!grid) return;

    grid.innerHTML =
        categories.length
            ? categories
                .map(renderCategoryCard)
                .join("")
            : `
                <div class="admin-empty-state">
                    <div class="admin-empty-icon">
                        🏷️
                    </div>

                    <h3>No categories found</h3>

                    <p>
                        Add a category to organize your products.
                    </p>
                </div>
            `;
}

function renderCategoryCard(category) {
    return `
        <article class="admin-category-card">

            <div class="admin-category-card-top">

                <div>
                    <h3>
                        ${escapeHtml(
                            category.name || "Unnamed"
                        )}
                    </h3>

                    <span>
                        ${escapeHtml(
                            category.slug || ""
                        )}
                    </span>
                </div>

                <span
                    class="${
                        category.is_active !== false
                            ? "status-active"
                            : "status-inactive"
                    }"
                >
                    ${
                        category.is_active !== false
                            ? "Active"
                            : "Inactive"
                    }
                </span>

            </div>

            <p>
                ${escapeHtml(
                    category.description || ""
                )}
            </p>

            <div class="admin-category-actions">

                <button
                    type="button"
                    class="admin-small-button"
                    onclick="editCategory('${escapeAttribute(
                        category.id
                    )}')"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="admin-small-button"
                    onclick="toggleCategoryStatus('${escapeAttribute(
                        category.id
                    )}')"
                >
                    ${
                        category.is_active !== false
                            ? "Disable"
                            : "Enable"
                    }
                </button>

                <button
                    type="button"
                    class="admin-small-button danger"
                    onclick="deleteCategory('${escapeAttribute(
                        category.id
                    )}')"
                >
                    Delete
                </button>

            </div>

        </article>
    `;
}

// ============================================================
// CATEGORY MODAL
// ============================================================

function openCategoryModal(
    categoryId = null
) {
    const modal =
        document.getElementById(
            "categoryModal"
        );

    const form =
        document.getElementById(
            "categoryForm"
        );

    if (!modal || !form) return;

    form.reset();

    setValue(
        "categoryId",
        ""
    );

    setText(
        "categoryModalTitle",
        categoryId
            ? "Edit Category"
            : "Add Category"
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

    if (categoryId) {
        const category =
            allCategories.find(
                item =>
                    String(item.id) ===
                    String(categoryId)
            );

        if (!category) {
            showAdminToast(
                "Category not found.",
                "error"
            );
            return;
        }

        setValue(
            "categoryId",
            category.id
        );

        setValue(
            "categoryName",
            category.name || ""
        );

        setValue(
            "categorySlug",
            category.slug || ""
        );

        setValue(
            "categoryDescription",
            category.description || ""
        );

        if (active) {
            active.checked =
                category.is_active !== false;
        }
    }

    modal.style.display =
        "flex";

    requestAnimationFrame(() => {
        modal.classList.add("show");
    });
}

function closeCategoryModal() {
    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (!modal) return;

    modal.classList.remove("show");

    setTimeout(() => {
        modal.style.display =
            "none";
    }, 150);
}

async function saveCategory(event) {
    event.preventDefault();

    const button =
        document.getElementById(
            "saveCategoryButton"
        );

    if (button) {
        button.disabled = true;
        button.textContent =
            "Saving...";
    }

    try {
        const id =
            getValue(
                "categoryId"
            );

        const name =
            getValue(
                "categoryName"
            ).trim();

        let slug =
            getValue(
                "categorySlug"
            ).trim();

        const description =
            getValue(
                "categoryDescription"
            ).trim();

        const active =
            document.getElementById(
                "categoryActive"
            )?.checked ?? true;

        if (!name) {
            throw new Error(
                "Please enter a category name."
            );
        }

        if (!slug) {
            slug =
                slugify(name);
        }

        const payload = {
            name,
            slug,
            description:
                description || null,
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
                .update(payload)
                .eq(
                    "id",
                    id
                );

            if (error) {
                throw error;
            }

        } else {
            const {
                error
            } = await supabaseClient
                .from("categories")
                .insert(payload);

            if (error) {
                throw error;
            }
        }

        showMessage(
            "categoryFormMessage",
            "Category saved successfully.",
            "success"
        );

        await loadCategories();

        populateCategorySelects();

        setTimeout(() => {
            closeCategoryModal();
        }, 500);

    } catch (error) {
        console.error(
            "Save category error:",
            error
        );

        showMessage(
            "categoryFormMessage",
            getDatabaseErrorMessage(error),
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "Save Category";
        }
    }
}

function editCategory(
    categoryId
) {
    openCategoryModal(
        categoryId
    );
}

async function toggleCategoryStatus(
    categoryId
) {
    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );

    if (!category) return;

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
                category.id
            );

        if (error) {
            throw error;
        }

        showAdminToast(
            category.is_active
                ? "Category disabled."
                : "Category enabled.",
            "success"
        );

        await loadCategories();

        populateCategorySelects();

    } catch (error) {
        console.error(
            "Toggle category error:",
            error
        );

        showAdminToast(
            getDatabaseErrorMessage(error),
            "error"
        );
    }
}

async function deleteCategory(
    categoryId
) {
    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );

    if (!category) return;

    const used =
        allProducts.some(
            product =>
                String(
                    product.category || ""
                ) ===
                String(
                    category.slug || ""
                )
        );

    if (used) {
        showAdminToast(
            "This category is being used by products. Change those products first.",
            "error"
        );

        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${category.name}"?`
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
                category.id
            );

        if (error) {
            throw error;
        }

        showAdminToast(
            "Category deleted.",
            "success"
        );

        await loadCategories();

        populateCategorySelects();

    } catch (error) {
        console.error(
            "Delete category error:",
            error
        );

        showAdminToast(
            getDatabaseErrorMessage(error),
            "error"
        );
    }
}

// ============================================================
// CATEGORY SELECTS
// ============================================================

function populateCategorySelects() {
    const filter =
        document.getElementById(
            "productCategoryFilter"
        );

    const select =
        document.getElementById(
            "productCategory"
        );

    if (filter) {
        const current =
            filter.value;

        filter.innerHTML = `
            <option value="">
                All Categories
            </option>

            ${allCategories
                .filter(
                    category =>
                        category.is_active !== false
                )
                .map(
                    category => `
                        <option
                            value="${escapeAttribute(
                                category.slug
                            )}"
                        >
                            ${escapeHtml(
                                category.name
                            )}
                        </option>
                    `
                )
                .join("")}
        `;

        if (
            allCategories.some(
                category =>
                    category.slug === current
            )
        ) {
            filter.value =
                current;
        }
    }

    if (select) {
        const current =
            select.value;

        select.innerHTML = `
            <option value="">
                Select category
            </option>

            ${allCategories
                .filter(
                    category =>
                        category.is_active !== false
                )
                .map(
                    category => `
                        <option
                            value="${escapeAttribute(
                                category.slug
                            )}"
                        >
                            ${escapeHtml(
                                category.name
                            )}
                        </option>
                    `
                )
                .join("")}
        `;

        if (
            allCategories.some(
                category =>
                    category.slug === current
            )
        ) {
            select.value =
                current;
        }
    }
}

// ============================================================
// HELPERS
// ============================================================

function getValue(id) {
    const element =
        document.getElementById(id);

    return element
        ? element.value || ""
        : "";
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

function showMessage(
    id,
    message,
    type
) {
    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        message || "";

    element.className =
        `admin-form-message ${type || ""}`;
}

function showAdminToast(
    message,
    type = "info"
) {
    let toast =
        document.getElementById(
            "adminToast"
        );

    if (!toast) {
        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "adminToast";

        toast.className =
            "admin-toast";

        document.body.appendChild(
            toast
        );
    }

    toast.textContent =
        message;

    toast.className =
        `admin-toast ${type}`;

    clearTimeout(
        window.adminToastTimer
    );

    window.adminToastTimer =
        setTimeout(() => {
            toast.classList.remove(
                "show"
            );
        }, 3000);

    requestAnimationFrame(() => {
        toast.classList.add(
            "show"
        );
    });
}

function showFatalError(
    message
) {
    document.body.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:24px;
            background:#000;
            color:#fff;
            font-family:Arial,sans-serif;
            text-align:center;
        ">
            <div>
                <h2>Admin Dashboard Error</h2>
                <p>
                    ${escapeHtml(message)}
                </p>
            </div>
        </div>
    `;
}

function formatCurrency(
    value
) {
    const number =
        Number(value || 0);

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
    value
) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

function renderStatusBadge(
    status
) {
    const value =
        String(
            status || "Unknown"
        );

    const normalized =
        value
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    return `
        <span
            class="admin-status-badge status-${escapeAttribute(
                normalized
            )}"
        >
            ${escapeHtml(value)}
        </span>
    `;
}

function createProductId(
    name
) {
    const base =
        slugify(name)
        .replace(
            /[^a-z0-9-]/g,
            ""
        )
        .slice(0, 40);

    return `${
        base || "product"
    }-${Date.now()}`;
}

function slugify(
    value
) {
    return String(
        value || ""
    )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );
}

function getFileExtension(
    filename
) {
    const parts =
        String(
            filename || ""
        ).split(".");

    return (
        parts.length > 1
            ? parts.pop()
            : "jpg"
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        ) || "jpg";
}

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

function escapeAttribute(
    value
) {
    return escapeHtml(
        value
    );
}

function getAuthErrorMessage(
    error
) {
    const message =
        String(
            error?.message || ""
        ).toLowerCase();

    if (
        message.includes(
            "invalid login credentials"
        )
    ) {
        return "Incorrect email or password.";
    }

    if (
        message.includes(
            "email not confirmed"
        )
    ) {
        return "Please confirm your email address before logging in.";
    }

    if (
        message.includes(
            "too many requests"
        )
    ) {
        return "Too many attempts. Please wait a while and try again.";
    }

    return (
        error?.message ||
        "Unable to complete the request."
    );
}

function getDatabaseErrorMessage(
    error
) {
    const message =
        String(
            error?.message || ""
        );

    if (
        message.toLowerCase()
            .includes(
                "row-level security"
            )
    ) {
        return (
            "Permission denied by Supabase security rules. " +
            "Check the admin RLS policies."
        );
    }

    if (
        message.toLowerCase()
            .includes(
                "duplicate"
            )
    ) {
        return (
            "This record already exists."
        );
    }

    return (
        message ||
        "Database operation failed."
    );
}

function getOrderStatusOptions(
    selected
) {
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

    return statuses
        .map(
            status => `
                <option
                    value="${escapeAttribute(
                        status
                    )}"
                    ${
                        status ===
                        selected
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
}

function getPaymentStatusOptions(
    selected
) {
    const statuses = [
        "Pending",
        "Deposit Paid",
        "Partially Paid",
        "Paid",
        "Fully Paid",
        "Cash on Delivery",
        "Refunded",
        "Cancelled"
    ];

    return statuses
        .map(
            status => `
                <option
                    value="${escapeAttribute(
                        status
                    )}"
                    ${
                        status ===
                        selected
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
}

function getNigeriaStateOptions(
    selected
) {
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

        ${states
            .map(
                state => `
                    <option
                        value="${escapeAttribute(
                            state
                        )}"
                        ${
                            String(
                                selected || ""
                            ) ===
                            state
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            state
                        )}
                    </option>
                `
            )
            .join("")}
    `;
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

window.closeOrderEditor =
    closeOrderEditor;

window.addOrderEditorItem =
    addOrderEditorItem;

window.removeOrderEditorItem =
    removeOrderEditorItem;

window.editProduct =
    editProduct;

window.openProductModal =
    openProductModal;

window.toggleProductStatus =
    toggleProductStatus;

window.deleteProduct =
    deleteProduct;

window.removeCustomSize =
    removeCustomSize;

window.editCategory =
    editCategory;

window.openCategoryModal =
    openCategoryModal;

window.toggleCategoryStatus =
    toggleCategoryStatus;

window.deleteCategory =
    deleteCategory;

window.renderOrderEditorItems =
    renderOrderEditorItems;