// =====================================================
// AYODEJI FASHION HUBS
// ADMIN DASHBOARD
// =====================================================

"use strict";

let currentOrder = null;
let orders = [];
let products = [];
let categories = [];


// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("Admin JS loaded.");

    if (!window.supabaseClient) {
        console.error("Supabase client is missing.");

        showLoginMessage(
            "Supabase could not be loaded. Check js/supabase.js.",
            "error"
        );

        return;
    }

    setupLogin();
    setupPasswordToggle();
    setupLogout();
    setupNavigation();
    setupOrderControls();
    setupProductControls();
    setupCategoryControls();

    checkAdminSession();

});


// =====================================================
// LOGIN
// =====================================================

function setupLogin() {

    const form =
        document.getElementById("adminLoginForm");

    if (!form) {
        console.error("adminLoginForm not found.");
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("ADMIN LOGIN BUTTON CLICKED");

        await adminLogin();

    });

}


// =====================================================
// ADMIN LOGIN
// =====================================================

async function adminLogin() {

    const emailInput =
        document.getElementById("adminEmail");

    const passwordInput =
        document.getElementById("adminPassword");

    const button =
        document.getElementById("adminLoginButton");

    const buttonText =
        document.getElementById("adminLoginButtonText");

    const spinner =
        document.getElementById("adminLoginSpinner");


    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;


    if (!email || !password) {

        showLoginMessage(
            "Enter your email and password.",
            "error"
        );

        return;
    }


    button.disabled = true;

    buttonText.textContent =
        "Logging in...";

    spinner.classList.remove("hidden");


    try {

        console.log("Signing in:", email);


        // Clear any old session first.
        await window.supabaseClient.auth.signOut();


        const {
            data,
            error
        } =
            await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {

            console.error(
                "Supabase login error:",
                error
            );

            showLoginMessage(
                getAuthErrorMessage(error),
                "error"
            );

            return;
        }


        if (!data || !data.user) {

            showLoginMessage(
                "Login failed. No user session was returned.",
                "error"
            );

            return;
        }


        console.log(
            "Logged-in user:",
            data.user.id
        );


        // Verify admin account.
        const isAdmin =
            await verifyAdmin(data.user);


        if (!isAdmin) {

            await window.supabaseClient.auth.signOut();

            showLoginMessage(
                "This account is not registered as an admin.",
                "error"
            );

            return;
        }


        showLoginMessage(
            "Login successful.",
            "success"
        );


        await showDashboard();

    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        showLoginMessage(
            "Something went wrong while logging in.",
            "error"
        );

    } finally {

        button.disabled = false;

        buttonText.textContent =
            "Login";

        spinner.classList.add("hidden");

    }

}


// =====================================================
// VERIFY ADMIN
// =====================================================

async function verifyAdmin(user) {

    if (!user) {
        return false;
    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("admin_users")
                .select("user_id, email")
                .eq("user_id", user.id)
                .maybeSingle();


        if (error) {

            console.error(
                "Admin verification error:",
                error
            );

            return false;
        }


        console.log(
            "Admin record:",
            data
        );


        return !!data;

    } catch (error) {

        console.error(
            "Admin verification failed:",
            error
        );

        return false;
    }

}


// =====================================================
// SESSION CHECK
// =====================================================

async function checkAdminSession() {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient.auth.getSession();


        if (error) {
            console.error(error);
            return;
        }


        const session =
            data?.session;


        if (!session?.user) {

            showLoginView();

            return;
        }


        const isAdmin =
            await verifyAdmin(session.user);


        if (!isAdmin) {

            await window.supabaseClient.auth.signOut();

            showLoginView();

            return;
        }


        await showDashboard();

    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

        showLoginView();

    }

}


// =====================================================
// SHOW LOGIN
// =====================================================

function showLoginView() {

    document
        .getElementById("adminLoginView")
        ?.classList.remove("hidden");

    document
        .getElementById("adminDashboardView")
        ?.classList.add("hidden");

}


// =====================================================
// SHOW DASHBOARD
// =====================================================

async function showDashboard() {

    document
        .getElementById("adminLoginView")
        ?.classList.add("hidden");

    document
        .getElementById("adminDashboardView")
        ?.classList.remove("hidden");


    await loadDashboard();

}


// =====================================================
// DASHBOARD LOAD
// =====================================================

async function loadDashboard() {

    await loadOrders();
    await loadProducts();
    await loadCategories();

}


// =====================================================
// PASSWORD TOGGLE
// =====================================================

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


    button.addEventListener("click", () => {

        if (input.type === "password") {

            input.type = "text";

            button.textContent = "🙈";

        } else {

            input.type = "password";

            button.textContent = "👁";

        }

    });

}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    const button =
        document.getElementById("adminLogout");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            await window.supabaseClient.auth.signOut();

            showLoginView();

            showLoginMessage(
                "You have been logged out.",
                "success"
            );

        }
    );

}


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".admin-nav-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionId =
                    button.dataset.section;


                buttons.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".admin-section"
                    )
                    .forEach(section => {

                        section.classList.add(
                            "hidden"
                        );

                    });


                document
                    .getElementById(sectionId)
                    ?.classList.remove(
                        "hidden"
                    );


                document
                    .getElementById(
                        "adminSidebar"
                    )
                    ?.classList.remove(
                        "open"
                    );

            }
        );

    });


    const menuButton =
        document.getElementById(
            "adminMenuButton"
        );


    menuButton?.addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "adminSidebar"
                )
                ?.classList.toggle("open");

        }
    );

}


// =====================================================
// ORDERS
// =====================================================

function setupOrderControls() {

    document
        .getElementById("refreshOrders")
        ?.addEventListener(
            "click",
            loadOrders
        );


    document
        .getElementById("orderSearch")
        ?.addEventListener(
            "input",
            renderOrders
        );


    document
        .getElementById("statusFilter")
        ?.addEventListener(
            "change",
            renderOrders
        );


    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-view-order]"
                );


            if (!button) {
                return;
            }


            const id =
                button.dataset.viewOrder;


            openOrderModal(id);

        }
    );

}


// =====================================================
// LOAD ORDERS
// =====================================================

async function loadOrders() {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("orders")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Orders error:",
                error
            );

            orders = [];

            renderOrders();

            return;
        }


        orders = data || [];


        updateOrderStats();

        renderOrders();

    } catch (error) {

        console.error(
            "Load orders failed:",
            error
        );

    }

}


// =====================================================
// ORDER STATS
// =====================================================

function updateOrderStats() {

    const total =
        orders.length;


    const pending =
        orders.filter(order =>
            order.payment_status ===
                "Pending"
            ||
            order.payment_status ===
                "Pending Payment"
            ||
            order.status ===
                "Pending Payment"
        ).length;


    const paid =
        orders.filter(order =>
            [
                "Paid",
                "Deposit Paid",
                "Fully Paid"
            ].includes(
                order.payment_status
            )
            ||
            [
                "Deposit Paid",
                "Fully Paid"
            ].includes(
                order.status
            )
        ).length;


    const delivered =
        orders.filter(order =>
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


// =====================================================
// FILTER ORDERS
// =====================================================

function getFilteredOrders() {

    const search =
        document
            .getElementById(
                "orderSearch"
            )
            ?.value
            .trim()
            .toLowerCase()
            || "";


    const status =
        document
            .getElementById(
                "statusFilter"
            )
            ?.value
            || "";


    return orders.filter(order => {

        const searchable = [

            order.order_reference,

            order.customer_name,

            order.customer_email,

            order.customer_phone,

            order.delivery_address,

            order.delivery_city,

            order.delivery_state

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        const matchesSearch =
            !search ||
            searchable.includes(search);


        const matchesStatus =
            !status ||
            order.status === status;


        return (
            matchesSearch &&
            matchesStatus
        );

    });

}


// =====================================================
// RENDER ORDERS
// =====================================================

function renderOrders() {

    const filtered =
        getFilteredOrders();


    const table =
        document.getElementById(
            "ordersTable"
        );


    const grid =
        document.getElementById(
            "ordersGrid"
        );


    const empty =
        document.getElementById(
            "emptyOrders"
        );


    if (table) {

        table.innerHTML =
            filtered.map(order => {

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    order.order_reference || order.id
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                order.customer_name || "-"
                            )}
                            <br>
                            <small>
                                ${escapeHtml(
                                    order.customer_phone || ""
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
                                order.payment_status || "-"
                            )}
                        </td>

                        <td>
                            <span class="status-badge">
                                ${escapeHtml(
                                    order.status || "-"
                                )}
                            </span>
                        </td>

                        <td>
                            ${formatDate(
                                order.created_at
                            )}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="small-action-button"
                                data-view-order="${escapeAttr(
                                    order.id
                                )}"
                            >
                                View
                            </button>
                        </td>

                    </tr>
                `;

            }).join("");

    }


    if (grid) {

        grid.innerHTML =
            filtered.map(order => {

                return `
                    <article class="order-card">

                        <div class="order-card-top">

                            <strong>
                                ${escapeHtml(
                                    order.order_reference || order.id
                                )}
                            </strong>

                            <span class="status-badge">
                                ${escapeHtml(
                                    order.status || "-"
                                )}
                            </span>

                        </div>

                        <p>
                            <strong>Customer:</strong>
                            ${escapeHtml(
                                order.customer_name || "-"
                            )}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHtml(
                                order.customer_phone || "-"
                            )}
                        </p>

                        <p>
                            <strong>Total:</strong>
                            ${formatMoney(
                                order.total
                            )}
                        </p>

                        <p>
                            <strong>Payment:</strong>
                            ${escapeHtml(
                                order.payment_status || "-"
                            )}
                        </p>

                        <button
                            type="button"
                            class="small-action-button"
                            data-view-order="${escapeAttr(
                                order.id
                            )}"
                        >
                            View Order
                        </button>

                    </article>
                `;

            }).join("");

    }


    if (empty) {

        empty.classList.toggle(
            "hidden",
            filtered.length !== 0
        );

    }

}


// =====================================================
// ORDER MODAL
// =====================================================

function openOrderModal(orderId) {

    const order =
        orders.find(
            item => String(item.id) ===
                String(orderId)
        );


    if (!order) {

        alert("Order not found.");

        return;
    }


    currentOrder = order;


    setText(
        "adminOrderReference",
        order.order_reference ||
        order.id
    );


    const content =
        document.getElementById(
            "adminOrderContent"
        );


    content.innerHTML = `

        <div class="customer-information">

            <h3>Customer Information</h3>

            <div class="readonly-grid">

                <div>
                    <span>Name</span>
                    <strong>
                        ${escapeHtml(
                            order.customer_name || "-"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Email</span>
                    <strong>
                        ${escapeHtml(
                            order.customer_email || "-"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Phone</span>
                    <strong>
                        ${escapeHtml(
                            order.customer_phone || "-"
                        )}
                    </strong>
                </div>

            </div>

        </div>


        <div class="order-items-section">

            <h3>Order Items</h3>

            <div class="order-items-list">
                Loading items...
            </div>

        </div>


        <form
            id="adminOrderUpdateForm"
            onsubmit="saveOrderChanges(event)"
        >

            <h3>Manage Order</h3>

            <div class="form-row">

                <div class="form-group">

                    <label>
                        Payment Status
                    </label>

                    <select id="adminPaymentStatus">

                        ${statusOption(
                            order.payment_status,
                            "Pending Payment"
                        )}

                        ${statusOption(
                            order.payment_status,
                            "Deposit Paid"
                        )}

                        ${statusOption(
                            order.payment_status,
                            "Balance Pending"
                        )}

                        ${statusOption(
                            order.payment_status,
                            "Fully Paid"
                        )}

                        ${statusOption(
                            order.payment_status,
                            "Paid"
                        )}

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Order Status
                    </label>

                    <select id="adminOrderStatus">

                        ${orderStatusOption(
                            order.status,
                            "Pending Payment"
                        )}

                        ${orderStatusOption(
                            order.status,
                            "Deposit Paid"
                        )}

                        ${orderStatusOption(
                            order.status,
                            "Balance Pending"
                        )}

                        ${orderStatusOption(
                            order.status,
                            "Fully Paid"
                        )}

                        ${orderStatusOption(
                            order.status,
                            "Processing"
                        )}

                        ${orderStatusOption(
                            order.status,
                            "Shipped"
                        )}

                        ${orderStatusOption(
                            order.status,
                            "Delivered"
                        )}

                        ${orderStatusOption(
                            order.status,
                            "Cancelled"
                        )}

                    </select>

                </div>

            </div>


            <div class="form-group">

                <label>
                    Delivery Address
                </label>

                <input
                    type="text"
                    id="adminDeliveryAddress"
                    value="${escapeAttr(
                        order.delivery_address || ""
                    )}"
                >

            </div>


            <div class="form-row">

                <div class="form-group">

                    <label>
                        City
                    </label>

                    <input
                        type="text"
                        id="adminDeliveryCity"
                        value="${escapeAttr(
                            order.delivery_city || ""
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        State
                    </label>

                    <input
                        type="text"
                        id="adminDeliveryState"
                        value="${escapeAttr(
                            order.delivery_state || ""
                        )}"
                    >

                </div>

            </div>


            <div class="form-group">

                <label>
                    Order Notes
                </label>

                <textarea
                    id="adminOrderNotes"
                    rows="4"
                >${escapeHtml(
                    order.notes || ""
                )}</textarea>

            </div>


            <div
                id="adminOrderUpdateMessage"
                class="admin-message"
            ></div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="admin-secondary-button"
                    onclick="closeOrderModal()"
                >
                    Close
                </button>

                <button
                    type="submit"
                    id="saveOrderChangesButton"
                    class="admin-primary-button"
                >
                    💾 Save Changes
                </button>

            </div>

        </form>

    `;


    document
        .getElementById(
            "orderModal"
        )
        .classList.remove(
            "hidden"
        );


    loadOrderItems(order.id);

}


// =====================================================
// LOAD ORDER ITEMS
// =====================================================

async function loadOrderItems(orderId) {

    const container =
        document.querySelector(
            ".order-items-list"
        );


    if (!container) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("order_items")
                .select("*")
                .eq(
                    "order_id",
                    orderId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Order items error:",
                error
            );

            container.innerHTML =
                `<p>Unable to load order items.</p>`;

            return;
        }


        if (!data || data.length === 0) {

            container.innerHTML =
                `<p>No order items found.</p>`;

            return;
        }


        container.innerHTML =
            data.map(item => {

                return `

                    <div class="order-item">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    item.product_name || "-"
                                )}
                            </strong>

                            <p>
                                Size:
                                ${escapeHtml(
                                    item.size || "-"
                                )}
                                · Quantity:
                                ${item.quantity || 0}
                            </p>

                        </div>

                        <strong>
                            ${formatMoney(
                                item.price
                            )}
                        </strong>

                    </div>

                `;

            }).join("");

    } catch (error) {

        console.error(
            "Order items failed:",
            error
        );

    }

}


// =====================================================
// CLOSE ORDER
// =====================================================

function closeOrderModal() {

    currentOrder = null;

    document
        .getElementById(
            "orderModal"
        )
        ?.classList.add(
            "hidden"
        );

}


// Make available to inline onclick.
window.closeOrderModal =
    closeOrderModal;


// =====================================================
// SAVE ORDER CHANGES
// =====================================================

window.saveOrderChanges =
    async function (event) {

        if (event) {
            event.preventDefault();
        }


        console.log(
            "SAVE ORDER CHANGES CLICKED"
        );


        if (!currentOrder) {

            alert(
                "No order is selected."
            );

            return;
        }


        const button =
            document.getElementById(
                "saveOrderChangesButton"
            );


        const message =
            document.getElementById(
                "adminOrderUpdateMessage"
            );


        const paymentStatus =
            document.getElementById(
                "adminPaymentStatus"
            )?.value;


        const orderStatus =
            document.getElementById(
                "adminOrderStatus"
            )?.value;


        const deliveryAddress =
            document.getElementById(
                "adminDeliveryAddress"
            )?.value
            .trim();


        const deliveryCity =
            document.getElementById(
                "adminDeliveryCity"
            )?.value
            .trim();


        const deliveryState =
            document.getElementById(
                "adminDeliveryState"
            )?.value
            .trim();


        const notes =
            document.getElementById(
                "adminOrderNotes"
            )?.value
            .trim();


        const updates = {

            payment_status:
                paymentStatus,

            status:
                orderStatus,

            delivery_address:
                deliveryAddress,

            delivery_city:
                deliveryCity,

            delivery_state:
                deliveryState,

            notes:
                notes

        };


        console.log(
            "Order updates:",
            updates
        );


        if (button) {
            button.disabled = true;
            button.textContent =
                "Saving...";
        }


        if (message) {

            message.className =
                "admin-message";

            message.textContent =
                "Saving changes...";

        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("orders")
                    .update(updates)
                    .eq(
                        "id",
                        currentOrder.id
                    )
                    .select()
                    .single();


            if (error) {

                console.error(
                    "SAVE ORDER ERROR:",
                    error
                );


                if (message) {

                    message.className =
                        "admin-message error";

                    message.textContent =
                        error.message ||
                        "Unable to save changes.";

                }

                return;
            }


            console.log(
                "ORDER UPDATED:",
                data
            );


            currentOrder =
                data;


            const index =
                orders.findIndex(
                    order =>
                        String(order.id) ===
                        String(data.id)
                );


            if (index !== -1) {

                orders[index] =
                    data;

            }


            updateOrderStats();

            renderOrders();


            if (message) {

                message.className =
                    "admin-message success";

                message.textContent =
                    "✓ Changes saved successfully.";

            }


        } catch (error) {

            console.error(
                "Unexpected save error:",
                error
            );


            if (message) {

                message.className =
                    "admin-message error";

                message.textContent =
                    error.message ||
                    "Something went wrong.";

            }

        } finally {

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "💾 Save Changes";

            }

        }

    };


// =====================================================
// PRODUCTS
// =====================================================

function setupProductControls() {

    document
        .getElementById(
            "addProductButton"
        )
        ?.addEventListener(
            "click",
            () => openProductModal()
        );


    document
        .getElementById(
            "closeProductModal"
        )
        ?.addEventListener(
            "click",
            closeProductModal
        );


    document
        .getElementById(
            "cancelProductButton"
        )
        ?.addEventListener(
            "click",
            closeProductModal
        );


    document
        .getElementById(
            "productForm"
        )
        ?.addEventListener(
            "submit",
            saveProduct
        );


    document
        .getElementById(
            "productSearch"
        )
        ?.addEventListener(
            "input",
            renderProducts
        );


    document
        .getElementById(
            "productCategoryFilter"
        )
        ?.addEventListener(
            "change",
            renderProducts
        );


    document
        .getElementById(
            "productStatusFilter"
        )
        ?.addEventListener(
            "change",
            renderProducts
        );

}


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
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
                "Products error:",
                error
            );

            products = [];

            renderProducts();

            return;
        }


        products =
            data || [];


        renderProducts();

    } catch (error) {

        console.error(
            "Load products failed:",
            error
        );

    }

}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

    const grid =
        document.getElementById(
            "productsAdminGrid"
        );


    const count =
        document.getElementById(
            "productsCount"
        );


    if (!grid) {
        return;
    }


    const search =
        document
            .getElementById(
                "productSearch"
            )
            ?.value
            .trim()
            .toLowerCase()
            || "";


    const category =
        document
            .getElementById(
                "productCategoryFilter"
            )
            ?.value
            || "";


    const status =
        document
            .getElementById(
                "productStatusFilter"
            )
            ?.value
            || "";


    const filtered =
        products.filter(product => {

            const matchesSearch =
                !search ||
                `${product.name} ${product.category}`
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                !category ||
                product.category === category;


            const matchesStatus =
                !status ||
                (
                    status === "active" &&
                    product.is_active
                )
                ||
                (
                    status === "inactive" &&
                    !product.is_active
                );


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });


    if (count) {
        count.textContent =
            filtered.length;
    }


    grid.innerHTML =
        filtered.map(product => {

            return `

                <article class="product-admin-card">

                    <div class="product-admin-image">

                        ${
                            product.image
                            ?
                            `<img
                                src="${escapeAttr(product.image)}"
                                alt="${escapeAttr(product.name)}"
                            >`
                            :
                            `<span>
                                ${escapeHtml(
                                    product.icon || "👟"
                                )}
                            </span>`
                        }

                    </div>


                    <div class="product-admin-info">

                        <h3>
                            ${escapeHtml(
                                product.name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                product.category
                            )}
                        </p>

                        <strong>
                            ${formatMoney(
                                product.price
                            )}
                        </strong>

                        <small>
                            Stock:
                            ${product.stock ?? 0}
                        </small>

                    </div>


                    <div class="product-admin-actions">

                        <button
                            type="button"
                            class="small-action-button"
                            onclick="editProduct('${escapeAttr(product.id)}')"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="small-danger-button"
                            onclick="toggleProduct('${escapeAttr(product.id)}')"
                        >
                            ${
                                product.is_active
                                ? "Disable"
                                : "Enable"
                            }
                        </button>

                    </div>

                </article>

            `;

        }).join("");


    document
        .getElementById(
            "emptyProducts"
        )
        ?.classList.toggle(
            "hidden",
            filtered.length !== 0
        );

}


// =====================================================
// OPEN PRODUCT
// =====================================================

function openProductModal(product = null) {

    document
        .getElementById(
            "productModal"
        )
        ?.classList.remove(
            "hidden"
        );


    setText(
        "productModalTitle",
        product
            ? "Edit Product"
            : "Add Product"
    );


    document
        .getElementById(
            "productForm"
        )
        ?.reset();


    document
        .getElementById(
            "productId"
        )
        .value =
        product?.id || "";


    if (!product) {

        document
            .getElementById(
                "productActive"
            )
            .checked = true;

        return;
    }


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
        "productImage",
        product.image
    );

    setValue(
        "productDescription",
        product.description
    );


    setValue(
        "productSizes",
        Array.isArray(product.sizes)
            ? product.sizes.join(", ")
            : product.sizes || ""
    );


    document
        .getElementById(
            "productActive"
        )
        .checked =
        product.is_active !== false;

}


// =====================================================
// EDIT PRODUCT
// =====================================================

window.editProduct =
    function (productId) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );


        if (product) {
            openProductModal(product);
        }

    };


// =====================================================
// SAVE PRODUCT
// =====================================================

async function saveProduct(event) {

    event.preventDefault();


    const id =
        document
            .getElementById(
                "productId"
            )
            .value
            .trim();


    const sizesText =
        document
            .getElementById(
                "productSizes"
            )
            .value
            .trim();


    const product = {

        name:
            document.getElementById(
                "productName"
            ).value.trim(),

        category:
            document.getElementById(
                "productCategory"
            ).value,

        badge:
            document.getElementById(
                "productBadge"
            ).value.trim() || null,

        price:
            Number(
                document.getElementById(
                    "productPrice"
                ).value
            ),

        old_price:
            Number(
                document.getElementById(
                    "productOldPrice"
                ).value
            ) || null,

        stock:
            Number(
                document.getElementById(
                    "productStock"
                ).value
            ),

        icon:
            document.getElementById(
                "productIcon"
            ).value.trim() || "👟",

        image:
            document.getElementById(
                "productImage"
            ).value.trim() || null,

        description:
            document.getElementById(
                "productDescription"
            ).value.trim() || null,

        sizes:
            sizesText
                ? sizesText
                    .split(",")
                    .map(size => size.trim())
                    .filter(Boolean)
                : [],

        is_active:
            document.getElementById(
                "productActive"
            ).checked,

        updated_at:
            new Date().toISOString()

    };


    try {

        let result;


        if (id) {

            result =
                await window.supabaseClient
                    .from("products")
                    .update(product)
                    .eq("id", id);

        } else {

            product.id =
                `shoe-${Date.now()}`;

            result =
                await window.supabaseClient
                    .from("products")
                    .insert(product);

        }


        if (result.error) {

            console.error(
                result.error
            );

            showProductMessage(
                result.error.message,
                "error"
            );

            return;
        }


        showProductMessage(
            "Product saved successfully.",
            "success"
        );


        await loadProducts();


        setTimeout(
            closeProductModal,
            700
        );

    } catch (error) {

        console.error(error);

        showProductMessage(
            "Unable to save product.",
            "error"
        );

    }

}


// =====================================================
// TOGGLE PRODUCT
// =====================================================

window.toggleProduct =
    async function (productId) {

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );


        if (!product) {
            return;
        }


        const {
            error
        } =
            await window.supabaseClient
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

            alert(
                error.message
            );

            return;
        }


        await loadProducts();

    };


// =====================================================
// CLOSE PRODUCT
// =====================================================

function closeProductModal() {

    document
        .getElementById(
            "productModal"
        )
        ?.classList.add(
            "hidden"
        );

}


// =====================================================
// CATEGORIES
// =====================================================

function setupCategoryControls() {

    document
        .getElementById(
            "addCategoryButton"
        )
        ?.addEventListener(
            "click",
            () => openCategoryModal()
        );


    document
        .getElementById(
            "closeCategoryModal"
        )
        ?.addEventListener(
            "click",
            closeCategoryModal
        );


    document
        .getElementById(
            "cancelCategoryButton"
        )
        ?.addEventListener(
            "click",
            closeCategoryModal
        );


    document
        .getElementById(
            "categoryForm"
        )
        ?.addEventListener(
            "submit",
            saveCategory
        );


    document
        .getElementById(
            "categorySearch"
        )
        ?.addEventListener(
            "input",
            renderCategories
        );


    document
        .getElementById(
            "categoryStatusFilter"
        )
        ?.addEventListener(
            "change",
            renderCategories
        );

}


// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("categories")
                .select("*")
                .order(
                    "name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.warn(
                "Categories table:",
                error.message
            );

            categories = [];

            renderCategories();

            return;
        }


        categories =
            data || [];


        renderCategories();

    } catch (error) {

        console.error(
            "Load categories failed:",
            error
        );

    }

}


// =====================================================
// RENDER CATEGORIES
// =====================================================

function renderCategories() {

    const grid =
        document.getElementById(
            "categoriesAdminGrid"
        );


    if (!grid) {
        return;
    }


    const search =
        document
            .getElementById(
                "categorySearch"
            )
            ?.value
            .trim()
            .toLowerCase()
            || "";


    const status =
        document
            .getElementById(
                "categoryStatusFilter"
            )
            ?.value
            || "";


    const filtered =
        categories.filter(category => {

            const matchesSearch =
                !search ||
                `${category.name} ${category.slug}`
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                !status ||
                (
                    status === "active" &&
                    category.is_active !== false
                )
                ||
                (
                    status === "inactive" &&
                    category.is_active === false
                );


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    setText(
        "categoriesCount",
        filtered.length
    );


    grid.innerHTML =
        filtered.map(category => {

            return `

                <article class="category-admin-card">

                    <div>

                        <h3>
                            ${escapeHtml(
                                category.name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                category.slug
                            )}
                        </p>

                        <small>
                            ${
                                category.is_active === false
                                ? "Inactive"
                                : "Active"
                            }
                        </small>

                    </div>

                    <button
                        type="button"
                        class="small-action-button"
                        onclick="editCategory('${escapeAttr(category.id)}')"
                    >
                        Edit
                    </button>

                </article>

            `;

        }).join("");

}


// =====================================================
// CATEGORY MODAL
// =====================================================

function openCategoryModal(category = null) {

    document
        .getElementById(
            "categoryModal"
        )
        ?.classList.remove(
            "hidden"
        );


    setText(
        "categoryModalTitle",
        category
            ? "Edit Category"
            : "Add Category"
    );


    document
        .getElementById(
            "categoryForm"
        )
        ?.reset();


    setValue(
        "categoryId",
        category?.id || ""
    );


    if (category) {

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

        document
            .getElementById(
                "categoryActive"
            )
            .checked =
            category.is_active !== false;

    } else {

        document
            .getElementById(
                "categoryActive"
            )
            .checked = true;

    }

}


// =====================================================
// EDIT CATEGORY
// =====================================================

window.editCategory =
    function (categoryId) {

        const category =
            categories.find(
                item =>
                    String(item.id) ===
                    String(categoryId)
            );


        if (category) {
            openCategoryModal(category);
        }

    };


// =====================================================
// SAVE CATEGORY
// =====================================================

async function saveCategory(event) {

    event.preventDefault();


    const id =
        document
            .getElementById(
                "categoryId"
            )
            .value
            .trim();


    const category = {

        name:
            document.getElementById(
                "categoryName"
            ).value.trim(),

        slug:
            document.getElementById(
                "categorySlug"
            ).value.trim().toLowerCase(),

        description:
            document.getElementById(
                "categoryDescription"
            ).value.trim() || null,

        is_active:
            document.getElementById(
                "categoryActive"
            ).checked

    };


    try {

        let result;


        if (id) {

            result =
                await window.supabaseClient
                    .from("categories")
                    .update(category)
                    .eq("id", id);

        } else {

            result =
                await window.supabaseClient
                    .from("categories")
                    .insert(category);

        }


        if (result.error) {

            showCategoryMessage(
                result.error.message,
                "error"
            );

            return;
        }


        showCategoryMessage(
            "Category saved successfully.",
            "success"
        );


        await loadCategories();


        setTimeout(
            closeCategoryModal,
            700
        );

    } catch (error) {

        console.error(error);

        showCategoryMessage(
            "Unable to save category.",
            "error"
        );

    }

}


// =====================================================
// CLOSE CATEGORY
// =====================================================

function closeCategoryModal() {

    document
        .getElementById(
            "categoryModal"
        )
        ?.classList.add(
            "hidden"
        );

}


// =====================================================
// MESSAGES
// =====================================================

function showLoginMessage(
    message,
    type = ""
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
    type = ""
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
        `admin-message ${type}`;

}


function showCategoryMessage(
    message,
    type = ""
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
        `admin-message ${type}`;

}


// =====================================================
// AUTH ERROR
// =====================================================

function getAuthErrorMessage(error) {

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

        return "Your email address has not been confirmed.";

    }


    if (
        message.includes(
            "too many requests"
        )
    ) {

        return "Too many login attempts. Try again later.";

    }


    return (
        error?.message ||
        "Login failed."
    );

}


// =====================================================
// HELPERS
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent =
            value ?? "";
    }

}


function setValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {
        element.value =
            value ?? "";
    }

}


function formatMoney(value) {

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


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


function statusOption(
    current,
    value
) {

    return `
        <option
            value="${escapeAttr(value)}"
            ${current === value ? "selected" : ""}
        >
            ${escapeHtml(value)}
        </option>
    `;

}


function orderStatusOption(
    current,
    value
) {

    return statusOption(
        current,
        value
    );

}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttr(value) {

    return escapeHtml(value);

}