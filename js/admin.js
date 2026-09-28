// ============================================================
// AYODEJI FASHION HUBS — ADMIN DASHBOARD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();
});


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentAdmin = null;
let allOrders = [];
let allProducts = [];
let allCategories = [];
let currentEditingProduct = null;
let currentEditingCategory = null;

const EMAILJS_SERVICE_ID = "service_1d6t1el";
const EMAILJS_TEMPLATE_ID = "template_vo44x4z";
const EMAILJS_PUBLIC_KEY = "zDU17Xd3CuZ3fJztk";

const TRACKING_URL =
    "https://kabirabdulazeez9-lab.github.io/ayodeji-fashion-hubs/track-order.html";


// ============================================================
// SUPABASE CHECK
// ============================================================

function getSupabase() {
    if (!window.supabaseClient) {
        console.error("Supabase client is not available.");
        alert("Supabase is not connected. Please refresh the page.");
        return null;
    }

    return window.supabaseClient;
}


// ============================================================
// INITIALIZE
// ============================================================

async function initializeAdmin() {
    const supabase = getSupabase();

    if (!supabase) return;

    setupAdminPasswordToggle();
    setupNavigation();
    setupOrdersControls();
    setupProductsControls();
    setupCategoriesControls();
    setupProductModal();
    setupCategoryModal();
    setupLogout();

    await checkAdminSession();
}


// ============================================================
// ADMIN SESSION
// ============================================================

async function checkAdminSession() {
    const supabase = getSupabase();

    if (!supabase) return;

    try {
        const {
            data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
            showAdminLogin();
            return;
        }

        const email = session.user.email;

        const { data: admin, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.error("Admin check error:", error);
            showAdminLogin();
            return;
        }

        if (!admin) {
            showAdminLogin();

            const message =
                document.getElementById("adminLoginMessage");

            if (message) {
                message.textContent =
                    "This account does not have admin access.";
            }

            await supabase.auth.signOut();
            return;
        }

        currentAdmin = admin;

        showAdminDashboard();

        await loadDashboard();

    } catch (error) {
        console.error("Session error:", error);
        showAdminLogin();
    }
}


// ============================================================
// SHOW LOGIN
// ============================================================

function showAdminLogin() {
    const loginView =
        document.getElementById("adminLoginView");

    const dashboardView =
        document.getElementById("adminDashboardView");

    if (loginView) {
        loginView.classList.remove("hidden");
        loginView.style.display = "";
    }

    if (dashboardView) {
        dashboardView.classList.add("hidden");
        dashboardView.style.display = "none";
    }
}


// ============================================================
// SHOW DASHBOARD
// ============================================================

function showAdminDashboard() {
    const loginView =
        document.getElementById("adminLoginView");

    const dashboardView =
        document.getElementById("adminDashboardView");

    if (loginView) {
        loginView.classList.add("hidden");
        loginView.style.display = "none";
    }

    if (dashboardView) {
        dashboardView.classList.remove("hidden");
        dashboardView.style.display = "";
    }
}


// ============================================================
// LOGIN
// ============================================================

async function handleAdminLogin(event) {
    event.preventDefault();

    const supabase = getSupabase();

    if (!supabase) return;

    const emailInput =
        document.getElementById("adminEmail");

    const passwordInput =
        document.getElementById("adminPassword");

    const button =
        document.getElementById("adminLoginButton");

    const buttonText =
        document.getElementById("adminLoginButtonText");

    const message =
        document.getElementById("adminLoginMessage");

    const email =
        emailInput?.value.trim();

    const password =
        passwordInput?.value;

    if (!email || !password) {
        if (message) {
            message.textContent =
                "Please enter your email and password.";
        }

        return;
    }

    if (button) button.disabled = true;

    if (buttonText) {
        buttonText.textContent = "Signing in...";
    }

    if (message) {
        message.textContent = "";
    }

    try {
        const { data, error } =
            await supabase.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }

        const user = data.user;

        const { data: admin, error: adminError } =
            await supabase
                .from("admin_users")
                .select("*")
                .eq("email", user.email)
                .maybeSingle();

        if (adminError) {
            throw adminError;
        }

        if (!admin) {
            await supabase.auth.signOut();

            throw new Error(
                "This account does not have admin access."
            );
        }

        currentAdmin = admin;

        showAdminDashboard();

        await loadDashboard();

    } catch (error) {
        console.error("Admin login error:", error);

        if (message) {
            message.textContent =
                error.message ||
                "Login failed. Please check your details.";
        }

    } finally {
        if (button) button.disabled = false;

        if (buttonText) {
            buttonText.textContent = "Login";
        }
    }
}


// ============================================================
// PASSWORD TOGGLE
// ============================================================

function setupAdminPasswordToggle() {
    const toggle =
        document.getElementById("toggleAdminPassword");

    const password =
        document.getElementById("adminPassword");

    if (!toggle || !password) return;

    toggle.addEventListener("click", () => {
        if (password.type === "password") {
            password.type = "text";
            toggle.textContent = "🙈";
        } else {
            password.type = "password";
            toggle.textContent = "👁️";
        }
    });
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

            if (!sectionId) return;

            tabs.forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

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

            if (sectionId === "ordersSection") {
                loadOrders();
            }

            if (sectionId === "productsSection") {
                loadProducts();
            }

            if (sectionId === "categoriesSection") {
                loadCategories();
            }
        });
    });
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {
    const button =
        document.getElementById("adminLogout");

    if (!button) return;

    button.addEventListener("click", async () => {
        const supabase = getSupabase();

        if (!supabase) return;

        button.disabled = true;

        try {
            await supabase.auth.signOut();

            currentAdmin = null;

            showAdminLogin();

        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            button.disabled = false;
        }
    });
}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
    await Promise.all([
        loadOrders(),
        loadProducts(),
        loadCategories()
    ]);
}


// ============================================================
// ORDERS
// ============================================================

function setupOrdersControls() {
    const refreshButton =
        document.getElementById("refreshOrders");

    const searchInput =
        document.getElementById("orderSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            async () => {
                refreshButton.disabled = true;

                await loadOrders();

                refreshButton.disabled = false;
            }
        );
    }

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderOrders
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            renderOrders
        );
    }
}


// ============================================================
// LOAD ORDERS
// ============================================================

async function loadOrders() {
    const supabase = getSupabase();

    if (!supabase) return;

    const tbody =
        document.getElementById("ordersTable");

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Loading orders...
                </td>
            </tr>
        `;
    }

    try {
        const { data, error } =
            await supabase
                .from("orders")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        allOrders = data || [];

        updateOrderStatistics();

        renderOrders();

    } catch (error) {
        console.error("Load orders error:", error);

        if (tbody) {
            tbody.innerHTML = `
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
// ORDER STATISTICS
// ============================================================

function updateOrderStatistics() {
    const total =
        allOrders.length;

    const pending =
        allOrders.filter(order =>
            normalize(order.status) ===
            "pending payment"
        ).length;

    const paid =
        allOrders.filter(order =>
            [
                "deposit paid",
                "fully paid",
                "processing",
                "shipped",
                "delivered"
            ].includes(
                normalize(order.status)
            )
        ).length;

    const delivered =
        allOrders.filter(order =>
            normalize(order.status) ===
            "delivered"
        ).length;

    setText("totalOrders", total);
    setText("pendingPayment", pending);
    setText("paidOrders", paid);
    setText("deliveredOrders", delivered);
}


// ============================================================
// RENDER ORDERS
// ============================================================

function renderOrders() {
    const tbody =
        document.getElementById("ordersTable");

    if (!tbody) return;

    const search =
        document
            .getElementById("orderSearch")
            ?.value
            .trim()
            .toLowerCase() || "";

    const status =
        document
            .getElementById("statusFilter")
            ?.value || "";

    let orders =
        [...allOrders];

    if (search) {
        orders = orders.filter(order => {
            return [
                order.order_reference,
                order.customer_name,
                order.customer_phone,
                order.customer_email,
                order.status,
                order.payment_status
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search);
        });
    }

    if (status) {
        orders = orders.filter(order =>
            normalize(order.status) ===
            normalize(status)
        );
    }

    if (!orders.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    No orders found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        orders.map(order =>
            createOrderRow(order)
        ).join("");
}


// ============================================================
// ORDER ROW
// ============================================================

function createOrderRow(order) {
    const reference =
        order.order_reference ||
        order.reference ||
        order.id ||
        "N/A";

    const customer =
        order.customer_name ||
        "Customer";

    const total =
        Number(order.total || 0);

    const payment =
        order.payment_status ||
        "Pending";

    const status =
        order.status ||
        "Pending Payment";

    const date =
        formatDate(order.created_at);

    return `
        <tr>
            <td>
                <strong>${escapeHtml(reference)}</strong>
            </td>

            <td>
                <div class="order-customer">
                    <strong>
                        ${escapeHtml(customer)}
                    </strong>

                    ${
                        order.customer_phone
                            ? `<small>${escapeHtml(
                                order.customer_phone
                            )}</small>`
                            : ""
                    }
                </div>
            </td>

            <td>
                ${formatCurrency(total)}
            </td>

            <td>
                ${escapeHtml(payment)}
            </td>

            <td>
                <span class="status-badge ${statusClass(status)}">
                    ${escapeHtml(status)}
                </span>
            </td>

            <td>
                ${date}
            </td>

            <td>
                <button
                    type="button"
                    class="admin-action-button"
                    onclick="openOrderDetails('${escapeJs(
                        reference
                    )}')"
                >
                    View
                </button>
            </td>
        </tr>
    `;
}


// ============================================================
// ORDER DETAILS
// ============================================================

async function openOrderDetails(reference) {
    const order =
        allOrders.find(item =>
            String(
                item.order_reference ||
                item.reference ||
                item.id
            ) === String(reference)
        );

    if (!order) {
        alert("Order could not be found.");
        return;
    }

    let items = [];

    const supabase = getSupabase();

    try {
        const { data, error } =
            await supabase
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
        console.warn(
            "Could not load order items:",
            error
        );
    }

    showOrderModal(order, items);
}


// ============================================================
// ORDER MODAL
// ============================================================

function showOrderModal(order, items) {
    closeExistingOrderModal();

    const modal =
        document.createElement("div");

    modal.id = "adminOrderDetailsModal";

    modal.className =
        "admin-order-modal";

    const total =
        Number(order.total || 0);

    const payNow =
        Number(
            order.pay_now ||
            order.deposit_amount ||
            0
        );

    const balance =
        Number(
            order.balance ||
            0
        );

    const itemHtml =
        items.length
            ? items.map(item => `
                <div class="admin-order-item">
                    <div>
                        <strong>
                            ${escapeHtml(
                                item.product_name ||
                                item.name ||
                                "Product"
                            )}
                        </strong>

                        <small>
                            Qty:
                            ${escapeHtml(
                                String(
                                    item.quantity || 1
                                )
                            )}
                        </small>
                    </div>

                    <strong>
                        ${formatCurrency(
                            Number(
                                item.total ||
                                item.price ||
                                0
                            )
                        )}
                    </strong>
                </div>
            `).join("")
            : `
                <p>
                    Order item details unavailable.
                </p>
            `;

    modal.innerHTML = `
        <div class="admin-order-modal-backdrop"
             onclick="closeExistingOrderModal()">
        </div>

        <div class="admin-order-modal-content">

            <div class="admin-order-modal-header">
                <div>
                    <span>Order</span>
                    <h2>
                        ${escapeHtml(
                            order.order_reference ||
                            order.reference ||
                            order.id
                        )}
                    </h2>
                </div>

                <button
                    type="button"
                    onclick="closeExistingOrderModal()"
                >
                    ✕
                </button>
            </div>

            <div class="admin-order-details-grid">

                <div>
                    <span>Customer</span>
                    <strong>
                        ${escapeHtml(
                            order.customer_name ||
                            "N/A"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Phone</span>
                    <strong>
                        ${escapeHtml(
                            order.customer_phone ||
                            "N/A"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Email</span>
                    <strong>
                        ${escapeHtml(
                            order.customer_email ||
                            "N/A"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Payment</span>
                    <strong>
                        ${escapeHtml(
                            order.payment_status ||
                            "Pending"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Status</span>
                    <strong>
                        ${escapeHtml(
                            order.status ||
                            "Pending Payment"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total</span>
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

            </div>

            <div class="admin-order-section">
                <h3>Delivery</h3>

                <p>
                    ${escapeHtml(
                        order.delivery_address ||
                        "No delivery address"
                    )}
                </p>

                <p>
                    ${escapeHtml(
                        [
                            order.delivery_city,
                            order.delivery_state
                        ]
                            .filter(Boolean)
                            .join(", ")
                    )}
                </p>
            </div>

            <div class="admin-order-section">
                <h3>Items</h3>

                <div class="admin-order-items">
                    ${itemHtml}
                </div>
            </div>

            <div class="admin-order-section">
                <h3>Update Order</h3>

                <label>
                    Order Status
                </label>

                <select id="modalOrderStatus">
                    ${getOrderStatusOptions(
                        order.status
                    )}
                </select>

                <label>
                    Payment Status
                </label>

                <select id="modalPaymentStatus">
                    ${getPaymentStatusOptions(
                        order.payment_status
                    )}
                </select>

                <label>
                    Admin Note
                </label>

                <textarea
                    id="modalOrderNote"
                    rows="3"
                    placeholder="Optional note..."
                >${escapeHtml(
                    order.notes || ""
                )}</textarea>

                <div class="admin-order-actions">

                    <button
                        type="button"
                        class="admin-primary-button"
                        id="saveOrderChanges"
                    >
                        Save Changes
                    </button>

                    <button
                        type="button"
                        class="admin-secondary-button"
                        id="resendOrderEmail"
                    >
                        Resend Email
                    </button>

                </div>

                <p
                    id="orderUpdateMessage"
                    class="admin-form-message"
                ></p>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("saveOrderChanges")
        ?.addEventListener(
            "click",
            () => updateOrderFromModal(order)
        );

    document
        .getElementById("resendOrderEmail")
        ?.addEventListener(
            "click",
            () => resendOrderEmail(order)
        );
}


// ============================================================
// UPDATE ORDER
// ============================================================

async function updateOrderFromModal(order) {
    const supabase = getSupabase();

    if (!supabase) return;

    const status =
        document
            .getElementById("modalOrderStatus")
            ?.value;

    const paymentStatus =
        document
            .getElementById("modalPaymentStatus")
            ?.value;

    const note =
        document
            .getElementById("modalOrderNote")
            ?.value
            .trim();

    const message =
        document
            .getElementById("orderUpdateMessage");

    const button =
        document
            .getElementById("saveOrderChanges");

    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
    }

    if (message) {
        message.textContent = "";
    }

    const oldStatus =
        order.status || "";

    const oldPaymentStatus =
        order.payment_status || "";

    try {
        const updateData = {
            status,
            payment_status: paymentStatus,
            notes: note,
            updated_at: new Date().toISOString()
        };

        const { error } =
            await supabase
                .from("orders")
                .update(updateData)
                .eq("id", order.id);

        if (error) {
            throw error;
        }

        order.status = status;
        order.payment_status =
            paymentStatus;
        order.notes = note;

        if (
            oldStatus !== status ||
            oldPaymentStatus !== paymentStatus
        ) {
            await sendOrderStatusEmail(
                order,
                oldStatus
            );
        }

        if (message) {
            message.textContent =
                "Order updated successfully.";
        }

        await loadOrders();

        setTimeout(() => {
            closeExistingOrderModal();
        }, 800);

    } catch (error) {
        console.error(
            "Update order error:",
            error
        );

        if (message) {
            message.textContent =
                error.message ||
                "Failed to update order.";
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "Save Changes";
        }
    }
}


// ============================================================
// RESEND ORDER EMAIL
// ============================================================

async function resendOrderEmail(order) {
    const message =
        document
            .getElementById("orderUpdateMessage");

    try {
        await sendOrderStatusEmail(
            order,
            order.status || ""
        );

        if (message) {
            message.textContent =
                "Email sent successfully.";
        }

    } catch (error) {
        console.error(
            "Resend email error:",
            error
        );

        if (message) {
            message.textContent =
                error.message ||
                "Failed to send email.";
        }
    }
}


// ============================================================
// EMAILJS
// ============================================================

async function sendOrderStatusEmail(
    order,
    oldStatus = ""
) {
    if (
        typeof emailjs === "undefined"
    ) {
        console.warn(
            "EmailJS is not loaded."
        );

        return;
    }

    const email =
        order.customer_email;

    if (!email) {
        console.warn(
            "Order has no customer email."
        );

        return;
    }

    try {
        emailjs.init({
            publicKey: EMAILJS_PUBLIC_KEY
        });

        const currentStatus =
            order.status ||
            "Pending Payment";

        const paymentStatus =
            order.payment_status ||
            "Pending";

        const reference =
            order.order_reference ||
            order.reference ||
            order.id;

        const total =
            Number(order.total || 0);

        const statusMessage =
            getStatusMessage(
                currentStatus
            );

        const templateParams = {
            customer_name:
                order.customer_name ||
                "Customer",

            customer_email:
                email,

            to_email:
                email,

            order_reference:
                reference,

            order_status:
                currentStatus,

            payment_status:
                paymentStatus,

            order_total:
                formatCurrency(total),

            status_message:
                statusMessage,

            tracking_link:
                `${TRACKING_URL}?order=${encodeURIComponent(
                    reference
                )}`,

            old_status:
                oldStatus || "Not specified",

            time:
                new Date().toLocaleString(
                    "en-NG"
                ),

            name:
                order.customer_name ||
                "Customer",

            message:
                statusMessage
        };

        const response =
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            );

        console.log(
            "Order email sent:",
            response
        );

        return response;

    } catch (error) {
        console.error(
            "EmailJS error:",
            error
        );

        throw new Error(
            "Order was updated, but the email could not be sent."
        );
    }
}


// ============================================================
// PRODUCTS
// ============================================================

function setupProductsControls() {
    const addButton =
        document.getElementById(
            "addProductButton"
        );

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

    if (addButton) {
        addButton.addEventListener(
            "click",
            () => openProductModal()
        );
    }

    if (search) {
        search.addEventListener(
            "input",
            renderProducts
        );
    }

    if (category) {
        category.addEventListener(
            "change",
            renderProducts
        );
    }

    if (status) {
        status.addEventListener(
            "change",
            renderProducts
        );
    }
}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {
    const supabase = getSupabase();

    if (!supabase) return;

    try {
        const { data, error } =
            await supabase
                .from("products")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        allProducts = data || [];

        await populateProductCategorySelects();

        renderProducts();

    } catch (error) {
        console.error(
            "Load products error:",
            error
        );

        showProductsError(
            error.message
        );
    }
}


// ============================================================
// PRODUCT CATEGORY SELECTS
// ============================================================

async function populateProductCategorySelects() {
    const supabase = getSupabase();

    if (!supabase) return;

    const categoryFilter =
        document.getElementById(
            "productCategoryFilter"
        );

    const categorySelect =
        document.getElementById(
            "productCategory"
        );

    const categories =
        allCategories.length
            ? allCategories
            : [];

    const activeCategories =
        categories.filter(
            category =>
                category.is_active !== false
        );

    if (categoryFilter) {
        const current =
            categoryFilter.value;

        categoryFilter.innerHTML = `
            <option value="">
                All Categories
            </option>

            ${activeCategories.map(category => `
                <option value="${escapeHtml(
                    category.slug
                )}">
                    ${escapeHtml(
                        category.name
                    )}
                </option>
            `).join("")}
        `;

        if (
            [...categoryFilter.options]
                .some(option =>
                    option.value === current
                )
        ) {
            categoryFilter.value = current;
        }
    }

    if (categorySelect) {
        const current =
            categorySelect.value;

        categorySelect.innerHTML = `
            <option value="">
                Select category
            </option>

            ${activeCategories.map(category => `
                <option value="${escapeHtml(
                    category.slug
                )}">
                    ${escapeHtml(
                        category.name
                    )}
                </option>
            `).join("")}
        `;

        if (
            [...categorySelect.options]
                .some(option =>
                    option.value === current
                )
        ) {
            categorySelect.value = current;
        }
    }
}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts() {
    const grid =
        document.getElementById(
            "productsAdminGrid"
        );

    if (!grid) return;

    const search =
        document
            .getElementById(
                "productSearch"
            )
            ?.value
            .trim()
            .toLowerCase() || "";

    const category =
        document
            .getElementById(
                "productCategoryFilter"
            )
            ?.value || "";

    const status =
        document
            .getElementById(
                "productStatusFilter"
            )
            ?.value || "";

    let products =
        [...allProducts];

    if (search) {
        products = products.filter(product =>
            [
                product.name,
                product.id,
                product.category,
                product.description,
                product.badge
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }

    if (category) {
        products =
            products.filter(product =>
                normalize(product.category) ===
                normalize(category)
            );
    }

    if (status === "active") {
        products =
            products.filter(
                product =>
                    product.is_active === true
            );
    }

    if (status === "inactive") {
        products =
            products.filter(
                product =>
                    product.is_active !== true
            );
    }

    setText(
        "productsCount",
        products.length
    );

    const empty =
        document.getElementById(
            "emptyProducts"
        );

    if (!products.length) {
        grid.innerHTML = "";
        empty?.classList.remove("hidden");
        return;
    }

    empty?.classList.add("hidden");

    grid.innerHTML =
        products.map(
            product =>
                createProductCard(product)
        ).join("");
}


// ============================================================
// PRODUCT CARD
// ============================================================

function createProductCard(product) {
    const image =
        product.image ||
        "";

    const stock =
        Number(product.stock || 0);

    const active =
        product.is_active === true;

    return `
        <article class="admin-product-card">

            <div class="admin-product-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeHtml(
                                    image
                                )}"
                                alt="${escapeHtml(
                                    product.name
                                )}"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="admin-product-placeholder">
                                ${escapeHtml(
                                    product.icon ||
                                    "👟"
                                )}
                            </div>
                        `
                }

                ${
                    product.badge
                        ? `
                            <span class="product-admin-badge">
                                ${escapeHtml(
                                    product.badge
                                )}
                            </span>
                        `
                        : ""
                }

            </div>

            <div class="admin-product-info">

                <div class="admin-product-top">

                    <span class="admin-product-category">
                        ${escapeHtml(
                            product.category ||
                            "Uncategorized"
                        )}
                    </span>

                    <span class="
                        ${active
                            ? "admin-active"
                            : "admin-inactive"}
                    ">
                        ${
                            active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                </div>

                <h3>
                    ${escapeHtml(
                        product.name ||
                        "Unnamed Product"
                    )}
                </h3>

                <div class="admin-product-price">
                    ${formatCurrency(
                        Number(
                            product.price || 0
                        )
                    )}

                    ${
                        product.old_price
                            ? `
                                <del>
                                    ${formatCurrency(
                                        Number(
                                            product.old_price
                                        )
                                    )}
                                </del>
                            `
                            : ""
                    }
                </div>

                <p class="admin-product-stock">
                    Stock:
                    <strong>
                        ${stock}
                    </strong>
                </p>

                <div class="admin-product-actions">

                    <button
                        type="button"
                        onclick="openProductModal('${escapeJs(
                            product.id
                        )}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        onclick="toggleProductStatus('${escapeJs(
                            product.id
                        )}')"
                    >
                        ${
                            active
                                ? "Disable"
                                : "Activate"
                        }
                    </button>

                    <button
                        type="button"
                        class="danger"
                        onclick="deleteProduct('${escapeJs(
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

function setupProductModal() {
    const close =
        document.getElementById(
            "closeProductModal"
        );

    const cancel =
        document.getElementById(
            "cancelProductButton"
        );

    const form =
        document.getElementById(
            "productForm"
        );

    const imageInput =
        document.getElementById(
            "productImage"
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

    if (form) {
        form.addEventListener(
            "submit",
            saveProduct
        );
    }

    if (imageInput) {
        imageInput.addEventListener(
            "change",
            previewProductImage
        );
    }
}


// ============================================================
// OPEN PRODUCT MODAL
// ============================================================

function openProductModal(productId = null) {
    const modal =
        document.getElementById(
            "productModal"
        );

    const form =
        document.getElementById(
            "productForm"
        );

    if (!modal || !form) return;

    currentEditingProduct =
        productId
            ? allProducts.find(
                product =>
                    String(product.id) ===
                    String(productId)
            )
            : null;

    form.reset();

    setText(
        "productFormMessage",
        ""
    );

    const title =
        document.getElementById(
            "productModalTitle"
        );

    if (currentEditingProduct) {
        if (title) {
            title.textContent =
                "Edit Product";
        }

        fillProductForm(
            currentEditingProduct
        );
    } else {
        if (title) {
            title.textContent =
                "Add Product";
        }

        setValue(
            "productActive",
            true
        );

        setText(
            "productImagePreview",
            "No image selected"
        );
    }

    modal.classList.remove("hidden");
    modal.style.display = "";
}


// ============================================================
// CLOSE PRODUCT MODAL
// ============================================================

function closeProductModal() {
    const modal =
        document.getElementById(
            "productModal"
        );

    if (!modal) return;

    modal.classList.add("hidden");
    modal.style.display = "none";

    currentEditingProduct = null;
}


// ============================================================
// FILL PRODUCT FORM
// ============================================================

function fillProductForm(product) {
    setValue(
        "productId",
        product.id || ""
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
        product.price || ""
    );

    setValue(
        "productOldPrice",
        product.old_price || ""
    );

    setValue(
        "productStock",
        product.stock || 0
    );

    setValue(
        "productIcon",
        product.icon || "👟"
    );

    setValue(
        "productSizes",
        Array.isArray(product.sizes)
            ? product.sizes.join(", ")
            : product.sizes || ""
    );

    setValue(
        "productDescription",
        product.description || ""
    );

    const active =
        document.getElementById(
            "productActive"
        );

    if (active) {
        active.checked =
            product.is_active !== false;
    }

    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (preview) {
        if (product.image) {
            preview.innerHTML = `
                <img
                    src="${escapeHtml(
                        product.image
                    )}"
                    alt="Product preview"
                >
            `;
        } else {
            preview.textContent =
                "No image selected";
        }
    }
}


// ============================================================
// IMAGE PREVIEW
// ============================================================

function previewProductImage(event) {
    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (!preview || !file) return;

    const reader =
        new FileReader();

    reader.onload = () => {
        preview.innerHTML = `
            <img
                src="${reader.result}"
                alt="Product preview"
            >
        `;
    };

    reader.readAsDataURL(file);
}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(event) {
    event.preventDefault();

    const supabase = getSupabase();

    if (!supabase) return;

    const message =
        document.getElementById(
            "productFormMessage"
        );

    const button =
        document.getElementById(
            "saveProductButton"
        );

    if (button) {
        button.disabled = true;
        button.textContent =
            "Saving...";
    }

    if (message) {
        message.textContent = "";
    }

    try {
        const productId =
            document
                .getElementById(
                    "productId"
                )
                ?.value
                .trim();

        const name =
            document
                .getElementById(
                    "productName"
                )
                ?.value
                .trim();

        const category =
            document
                .getElementById(
                    "productCategory"
                )
                ?.value
                .trim();

        const badge =
            document
                .getElementById(
                    "productBadge"
                )
                ?.value
                .trim();

        const price =
            Number(
                document.getElementById(
                    "productPrice"
                )?.value || 0
            );

        const oldPriceValue =
            document.getElementById(
                "productOldPrice"
            )?.value;

        const oldPrice =
            oldPriceValue
                ? Number(oldPriceValue)
                : null;

        const stock =
            Number(
                document.getElementById(
                    "productStock"
                )?.value || 0
            );

        const icon =
            document
                .getElementById(
                    "productIcon"
                )
                ?.value
                .trim() || "👟";

        const sizesText =
            document
                .getElementById(
                    "productSizes"
                )
                ?.value
                .trim() || "";

        const description =
            document
                .getElementById(
                    "productDescription"
                )
                ?.value
                .trim() || "";

        const active =
            document.getElementById(
                "productActive"
            )?.checked ?? true;

        if (!name) {
            throw new Error(
                "Product name is required."
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

        let finalProductId =
            productId;

        if (!finalProductId) {
            finalProductId =
                createProductId(name);
        }

        let imageUrl =
            currentEditingProduct?.image ||
            null;

        const imageInput =
            document.getElementById(
                "productImage"
            );

        const imageFile =
            imageInput?.files?.[0];

        if (imageFile) {
            imageUrl =
                await uploadProductImage(
                    finalProductId,
                    imageFile
                );
        }

        const sizes =
            sizesText
                ? sizesText
                    .split(",")
                    .map(size =>
                        size.trim()
                    )
                    .filter(Boolean)
                : [];

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
            description:
                description || null,
            sizes,
            stock,
            is_active:
                active,
            updated_at:
                new Date().toISOString()
        };

        let result;

        if (currentEditingProduct) {
            result =
                await supabase
                    .from("products")
                    .update(productData)
                    .eq(
                        "id",
                        finalProductId
                    );
        } else {
            result =
                await supabase
                    .from("products")
                    .insert({
                        ...productData,
                        created_at:
                            new Date().toISOString()
                    });
        }

        if (result.error) {
            throw result.error;
        }

        if (message) {
            message.textContent =
                "Product saved successfully.";
        }

        await loadProducts();

        setTimeout(
            closeProductModal,
            700
        );

    } catch (error) {
        console.error(
            "Save product error:",
            error
        );

        if (message) {
            message.textContent =
                error.message ||
                "Failed to save product.";
        }

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "Save Product";
        }
    }
}


// ============================================================
// UPLOAD PRODUCT IMAGE
// ============================================================

async function uploadProductImage(
    productId,
    file
) {
    const supabase = getSupabase();

    if (!supabase) {
        throw new Error(
            "Supabase is not connected."
        );
    }

    if (!file.type.startsWith("image/")) {
        throw new Error(
            "Please select a valid image."
        );
    }

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    const safeId =
        productId
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            );

    const filePath =
        `products/${safeId}-${Date.now()}.${extension}`;

    const {
        error: uploadError
    } =
        await supabase
            .storage
            .from("product-images")
            .upload(
                filePath,
                file,
                {
                    upsert: true,
                    contentType:
                        file.type
                }
            );

    if (uploadError) {
        throw uploadError;
    }

    const {
        data
    } =
        supabase
            .storage
            .from("product-images")
            .getPublicUrl(
                filePath
            );

    return data.publicUrl;
}


// ============================================================
// TOGGLE PRODUCT STATUS
// ============================================================

async function toggleProductStatus(
    productId
) {
    const supabase = getSupabase();

    if (!supabase) return;

    const product =
        allProducts.find(
            item =>
                String(item.id) ===
                String(productId)
        );

    if (!product) return;

    const newStatus =
        !product.is_active;

    const confirmed =
        confirm(
            `${newStatus ? "Activate" : "Disable"} "${product.name}"?`
        );

    if (!confirmed) return;

    try {
        const { error } =
            await supabase
                .from("products")
                .update({
                    is_active:
                        newStatus,
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
            "Toggle product error:",
            error
        );

        alert(
            error.message ||
            "Failed to update product."
        );
    }
}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(
    productId
) {
    const supabase = getSupabase();

    if (!supabase) return;

    const product =
        allProducts.find(
            item =>
                String(item.id) ===
                String(productId)
        );

    if (!product) return;

    const confirmed =
        confirm(
            `Delete "${product.name}"?\n\nThis action cannot be undone.`
        );

    if (!confirmed) return;

    try {
        const { error } =
            await supabase
                .from("products")
                .delete()
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
            "Delete product error:",
            error
        );

        alert(
            error.message ||
            "Failed to delete product."
        );
    }
}


// ============================================================
// CATEGORIES
// ============================================================

function setupCategoriesControls() {
    const addButton =
        document.getElementById(
            "addCategoryButton"
        );

    const search =
        document.getElementById(
            "categorySearch"
        );

    const status =
        document.getElementById(
            "categoryStatusFilter"
        );

    if (addButton) {
        addButton.addEventListener(
            "click",
            () => openCategoryModal()
        );
    }

    if (search) {
        search.addEventListener(
            "input",
            renderCategories
        );
    }

    if (status) {
        status.addEventListener(
            "change",
            renderCategories
        );
    }
}


// ============================================================
// LOAD CATEGORIES
// ============================================================

async function loadCategories() {
    const supabase = getSupabase();

    if (!supabase) return;

    try {
        const { data, error } =
            await supabase
                .from("categories")
                .select("*")
                .order("name", {
                    ascending: true
                });

        if (error) {
            console.warn(
                "Categories table may not exist:",
                error.message
            );

            allCategories = [];

            renderCategoriesError(
                error.message
            );

            return;
        }

        allCategories =
            data || [];

        renderCategories();

        await populateProductCategorySelects();

    } catch (error) {
        console.error(
            "Load categories error:",
            error
        );

        allCategories = [];

        renderCategoriesError(
            error.message
        );
    }
}


// ============================================================
// RENDER CATEGORIES
// ============================================================

function renderCategories() {
    const grid =
        document.getElementById(
            "categoriesAdminGrid"
        );

    if (!grid) return;

    const search =
        document
            .getElementById(
                "categorySearch"
            )
            ?.value
            .trim()
            .toLowerCase() || "";

    const status =
        document
            .getElementById(
                "categoryStatusFilter"
            )
            ?.value || "";

    let categories =
        [...allCategories];

    if (search) {
        categories =
            categories.filter(category =>
                [
                    category.name,
                    category.slug,
                    category.description
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(search)
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
                    category.is_active !== true
            );
    }

    setText(
        "categoriesCount",
        categories.length
    );

    const empty =
        document.getElementById(
            "emptyCategories"
        );

    if (!categories.length) {
        grid.innerHTML = "";
        empty?.classList.remove("hidden");
        return;
    }

    empty?.classList.add("hidden");

    grid.innerHTML =
        categories.map(
            category =>
                createCategoryCard(
                    category
                )
        ).join("");
}


// ============================================================
// CATEGORY CARD
// ============================================================

function createCategoryCard(
    category
) {
    const active =
        category.is_active !== false;

    return `
        <article class="admin-category-card">

            <div class="admin-category-info">

                <div class="admin-category-heading">

                    <h3>
                        ${escapeHtml(
                            category.name
                        )}
                    </h3>

                    <span class="
                        ${active
                            ? "admin-active"
                            : "admin-inactive"}
                    ">
                        ${
                            active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                </div>

                <p class="admin-category-slug">
                    /${escapeHtml(
                        category.slug || ""
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
                    onclick="openCategoryModal('${escapeJs(
                        category.id
                    )}')"
                >
                    Edit
                </button>

                <button
                    type="button"
                    onclick="toggleCategoryStatus('${escapeJs(
                        category.id
                    )}')"
                >
                    ${
                        active
                            ? "Disable"
                            : "Activate"
                    }
                </button>

                <button
                    type="button"
                    class="danger"
                    onclick="deleteCategory('${escapeJs(
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

function setupCategoryModal() {
    const close =
        document.getElementById(
            "closeCategoryModal"
        );

    const cancel =
        document.getElementById(
            "cancelCategoryButton"
        );

    const form =
        document.getElementById(
            "categoryForm"
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

    if (form) {
        form.addEventListener(
            "submit",
            saveCategory
        );
    }
}


// ============================================================
// OPEN CATEGORY MODAL
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

    currentEditingCategory =
        categoryId
            ? allCategories.find(
                category =>
                    String(category.id) ===
                    String(categoryId)
            )
            : null;

    form.reset();

    setText(
        "categoryFormMessage",
        ""
    );

    const title =
        document.getElementById(
            "categoryModalTitle"
        );

    if (currentEditingCategory) {
        if (title) {
            title.textContent =
                "Edit Category";
        }

        setValue(
            "categoryId",
            currentEditingCategory.id
        );

        setValue(
            "categoryName",
            currentEditingCategory.name
        );

        setValue(
            "categorySlug",
            currentEditingCategory.slug
        );

        setValue(
            "categoryDescription",
            currentEditingCategory.description ||
            ""
        );

        const active =
            document.getElementById(
                "categoryActive"
            );

        if (active) {
            active.checked =
                currentEditingCategory.is_active !==
                false;
        }

    } else {
        if (title) {
            title.textContent =
                "Add Category";
        }

        const active =
            document.getElementById(
                "categoryActive"
            );

        if (active) {
            active.checked = true;
        }
    }

    modal.classList.remove("hidden");
    modal.style.display = "";
}


// ============================================================
// CLOSE CATEGORY MODAL
// ============================================================

function closeCategoryModal() {
    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (!modal) return;

    modal.classList.add("hidden");
    modal.style.display = "none";

    currentEditingCategory = null;
}


// ============================================================
// SAVE CATEGORY
// ============================================================

async function saveCategory(event) {
    event.preventDefault();

    const supabase = getSupabase();

    if (!supabase) return;

    const message =
        document.getElementById(
            "categoryFormMessage"
        );

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
            document
                .getElementById(
                    "categoryId"
                )
                ?.value
                .trim();

        const name =
            document
                .getElementById(
                    "categoryName"
                )
                ?.value
                .trim();

        let slug =
            document
                .getElementById(
                    "categorySlug"
                )
                ?.value
                .trim();

        const description =
            document
                .getElementById(
                    "categoryDescription"
                )
                ?.value
                .trim();

        const active =
            document.getElementById(
                "categoryActive"
            )?.checked ?? true;

        if (!name) {
            throw new Error(
                "Category name is required."
            );
        }

        if (!slug) {
            slug =
                slugify(name);
        }

        const categoryData = {
            name,
            slug,
            description:
                description || null,
            is_active:
                active,
            updated_at:
                new Date().toISOString()
        };

        let result;

        if (id) {
            result =
                await supabase
                    .from("categories")
                    .update(
                        categoryData
                    )
                    .eq("id", id);
        } else {
            result =
                await supabase
                    .from("categories")
                    .insert(
                        categoryData
                    );
        }

        if (result.error) {
            throw result.error;
        }

        if (message) {
            message.textContent =
                "Category saved successfully.";
        }

        await loadCategories();
        await loadProducts();

        setTimeout(
            closeCategoryModal,
            700
        );

    } catch (error) {
        console.error(
            "Save category error:",
            error
        );

        if (message) {
            message.textContent =
                error.message ||
                "Failed to save category.";
        }

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "Save Category";
        }
    }
}


// ============================================================
// TOGGLE CATEGORY
// ============================================================

async function toggleCategoryStatus(
    categoryId
) {
    const supabase = getSupabase();

    if (!supabase) return;

    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );

    if (!category) return;

    const newStatus =
        !category.is_active;

    if (
        !confirm(
            `${newStatus ? "Activate" : "Disable"} "${category.name}"?`
        )
    ) {
        return;
    }

    try {
        const { error } =
            await supabase
                .from("categories")
                .update({
                    is_active:
                        newStatus,
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
        await loadProducts();

    } catch (error) {
        console.error(
            "Toggle category error:",
            error
        );

        alert(
            error.message ||
            "Failed to update category."
        );
    }
}


// ============================================================
// DELETE CATEGORY
// ============================================================

async function deleteCategory(
    categoryId
) {
    const supabase = getSupabase();

    if (!supabase) return;

    const category =
        allCategories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );

    if (!category) return;

    const productsUsingCategory =
        allProducts.filter(
            product =>
                normalize(
                    product.category
                ) ===
                normalize(
                    category.slug
                )
        );

    if (
        productsUsingCategory.length
    ) {
        alert(
            `This category is being used by ${productsUsingCategory.length} product(s).\n\nChange those products to another category before deleting it.`
        );

        return;
    }

    if (
        !confirm(
            `Delete category "${category.name}"?`
        )
    ) {
        return;
    }

    try {
        const { error } =
            await supabase
                .from("categories")
                .delete()
                .eq(
                    "id",
                    categoryId
                );

        if (error) {
            throw error;
        }

        await loadCategories();

        await loadProducts();

    } catch (error) {
        console.error(
            "Delete category error:",
            error
        );

        alert(
            error.message ||
            "Failed to delete category."
        );
    }
}


// ============================================================
// EMPTY / ERROR STATES
// ============================================================

function showProductsError(
    message
) {
    const grid =
        document.getElementById(
            "productsAdminGrid"
        );

    if (!grid) return;

    grid.innerHTML = `
        <div class="admin-error-state">
            Failed to load products.
            <br>
            <small>
                ${escapeHtml(
                    message || ""
                )}
            </small>
        </div>
    `;
}


function renderCategoriesError(
    message
) {
    const grid =
        document.getElementById(
            "categoriesAdminGrid"
        );

    const empty =
        document.getElementById(
            "emptyCategories"
        );

    if (grid) {
        grid.innerHTML = `
            <div class="admin-error-state">
                Categories could not be loaded.
                <br>
                <small>
                    ${
                        message
                            ? escapeHtml(
                                message
                            )
                            : "Make sure the categories table exists."
                    }
                </small>
            </div>
        `;
    }

    empty?.classList.add("hidden");
}


// ============================================================
// CLOSE ORDER MODAL
// ============================================================

function closeExistingOrderModal() {
    const modal =
        document.getElementById(
            "adminOrderDetailsModal"
        );

    if (modal) {
        modal.remove();
    }
}


// ============================================================
// STATUS OPTIONS
// ============================================================

function getOrderStatusOptions(
    current
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

    return statuses.map(status => `
        <option
            value="${escapeHtml(status)}"
            ${
                normalize(status) ===
                normalize(current)
                    ? "selected"
                    : ""
            }
        >
            ${escapeHtml(status)}
        </option>
    `).join("");
}


function getPaymentStatusOptions(
    current
) {
    const statuses = [
        "Pending",
        "Partially Paid",
        "Paid",
        "Failed",
        "Refunded"
    ];

    return statuses.map(status => `
        <option
            value="${escapeHtml(status)}"
            ${
                normalize(status) ===
                normalize(current)
                    ? "selected"
                    : ""
            }
        >
            ${escapeHtml(status)}
        </option>
    `).join("");
}


// ============================================================
// STATUS MESSAGE
// ============================================================

function getStatusMessage(
    status
) {
    switch (
        normalize(status)
    ) {
        case "pending payment":
            return "Your order is awaiting payment.";

        case "deposit paid":
            return "Your deposit has been received. Your order is being prepared.";

        case "balance pending":
            return "Your order has an outstanding balance.";

        case "fully paid":
            return "Your order has been fully paid.";

        case "processing":
            return "Your order is currently being processed.";

        case "shipped":
            return "Your order has been shipped.";

        case "delivered":
            return "Your order has been delivered.";

        case "cancelled":
            return "Your order has been cancelled.";

        default:
            return "Your order status has been updated.";
    }
}


// ============================================================
// HELPERS
// ============================================================

function setText(
    id,
    value
) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}


function setValue(
    id,
    value
) {
    const element =
        document.getElementById(id);

    if (!element) return;

    if (
        element.type ===
        "checkbox"
    ) {
        element.checked =
            Boolean(value);
    } else {
        element.value =
            value ?? "";
    }
}


function normalize(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}


function formatCurrency(
    amount
) {
    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(
        Number(amount || 0)
    );
}


function formatDate(
    date
) {
    if (!date) return "N/A";

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return "N/A";
    }

    return parsed.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function statusClass(
    status
) {
    return normalize(status)
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        );
}


function createProductId(
    name
) {
    const base =
        slugify(name) ||
        "product";

    return `${base}-${Date.now()}`;
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
            "");
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


function escapeJs(
    value
) {
    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /\r/g,
            "\\r"
        )
        .replace(
            /\n/g,
            "\\n"
        );
}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.openProductModal =
    openProductModal;

window.closeProductModal =
    closeProductModal;

window.toggleProductStatus =
    toggleProductStatus;

window.deleteProduct =
    deleteProduct;

window.openCategoryModal =
    openCategoryModal;

window.closeCategoryModal =
    closeCategoryModal;

window.toggleCategoryStatus =
    toggleCategoryStatus;

window.deleteCategory =
    deleteCategory;

window.openOrderDetails =
    openOrderDetails;

window.closeExistingOrderModal =
    closeExistingOrderModal;

window.sendOrderStatusEmail =
    sendOrderStatusEmail;