// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER MY ORDERS
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeMyOrders
);


// =========================================
// INITIALIZE
// =========================================

async function initializeMyOrders() {

    const supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {

        showError(
            "Supabase could not be loaded."
        );

        return;
    }

    try {

        const {
            data: {
                session
            },
            error
        } =
            await supabaseClient
                .auth
                .getSession();

        if (error) {
            throw error;
        }

        if (!session) {

            showLoginRequired();

            return;
        }

        await loadCustomerOrders(
            session.user.id
        );

    } catch (error) {

        console.error(
            "My Orders initialization error:",
            error
        );

        showError(
            error.message ||
            "Unable to load your orders."
        );
    }
}


// =========================================
// LOAD CUSTOMER ORDERS
// =========================================

async function loadCustomerOrders(userId) {

    const supabaseClient =
        window.supabaseClient;

    showLoading();

    const {
        data,
        error
    } =
        await supabaseClient
            .from("orders")
            .select(`
                id,
                order_reference,
                customer_name,
                customer_phone,
                customer_email,
                delivery_address,
                delivery_city,
                delivery_state,
                payment_method,
                payment_plan,
                subtotal,
                total,
                pay_now,
                balance,
                status,
                payment_status,
                notes,
                created_at,
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
            .eq(
                "user_id",
                userId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "Customer orders query error:",
            error
        );

        throw error;
    }

    hideLoading();

    const orders =
        Array.isArray(data)
            ? data
            : [];

    if (orders.length === 0) {

        showEmptyOrders();

        return;
    }

    const content =
        document.getElementById(
            "ordersContent"
        );

    if (content) {

        content.classList.remove(
            "hidden"
        );
    }

    const countElement =
        document.getElementById(
            "ordersCount"
        );

    if (countElement) {

        countElement.textContent =
            `${orders.length} ${
                orders.length === 1
                    ? "Order"
                    : "Orders"
            }`;
    }

    renderOrders(orders);
}


// =========================================
// RENDER ORDERS
// =========================================

function renderOrders(orders) {

    const container =
        document.getElementById(
            "ordersList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    orders.forEach(
        order => {

            const card =
                createOrderCard(
                    order
                );

            container.insertAdjacentHTML(
                "beforeend",
                card
            );
        }
    );
}


// =========================================
// CREATE ORDER CARD
// =========================================

function createOrderCard(order) {

    const items =
        Array.isArray(
            order.order_items
        )
            ? order.order_items
            : [];

    const orderReference =
        order.order_reference ||
        "Order";

    const status =
        order.status ||
        "Pending Payment";

    const total =
        Number(
            order.total
        ) || 0;

    const storedBalance =
        Number(
            order.balance
        ) || 0;

    const paymentStatus =
        String(
            order.payment_status || ""
        ).toLowerCase();

    const statusText =
        String(
            status || ""
        ).toLowerCase();


    // =====================================
    // PAYMENT STATUS
    // =====================================

    const isFullyPaid =
        paymentStatus === "fully paid" ||
        paymentStatus === "paid" ||
        statusText === "fully paid" ||
        statusText === "paid";


    // =====================================
    // BALANCE
    // =====================================

    let remainingBalance =
        isFullyPaid
            ? 0
            : Math.max(
                0,
                storedBalance
            );

    if (remainingBalance > total) {
        remainingBalance = total;
    }

    const amountPaid =
        isFullyPaid
            ? total
            : Math.max(
                0,
                total - remainingBalance
            );


    // =====================================
    // ITEM COUNT
    // =====================================

    const itemCount =
        items.reduce(
            (
                totalItems,
                item
            ) => {

                return (
                    totalItems +
                    Math.max(
                        1,
                        Number(
                            item.quantity
                        ) || 1
                    )
                );

            },
            0
        );


    const paymentMethod =
        order.payment_method ||
        "Payment";


    const paymentPlan =
        getPaymentPlanText(
            order.payment_plan
        );


    const statusClass =
        getStatusClass(
            status
        );


    const date =
        formatDate(
            order.created_at
        );


    // =====================================
    // ORDER ITEMS
    // =====================================

    const itemsHTML =
        items.length > 0

            ? items
                .map(
                    item =>
                        createOrderItem(
                            item
                        )
                )
                .join("")

            : `
                <div class="no-items">
                    Order items unavailable.
                </div>
            `;


    // =====================================
    // TRACKING URL
    // =====================================

    const trackingURL =
        `track-order.html?order=${encodeURIComponent(
            orderReference
        )}`;


    // =====================================
    // BALANCE PAYMENT BUTTON
    // =====================================

    const isOPay =
        String(
            order.payment_method || ""
        )
            .toLowerCase()
            .includes("opay");


    const isDeposit =
        String(
            order.payment_plan || ""
        )
            .toLowerCase()
            .includes("deposit");


    const canPayBalance =
        isOPay &&
        isDeposit &&
        remainingBalance > 0 &&
        !isFullyPaid;


    let balanceActionHTML = "";


    if (canPayBalance) {

        const balanceURL =
            `balance-payment.html?order=${encodeURIComponent(
                order.id
            )}`;

        balanceActionHTML = `
            <a
                href="${balanceURL}"
                class="track-button balance-payment-button"
            >
                💳 Pay Remaining
                ${formatCurrency(
                    remainingBalance
                )}
            </a>
        `;
    }


    // =====================================
    // PAYMENT SUMMARY
    // =====================================

    const paymentSummaryHTML = `
        <div
            class="order-payment-summary"
            style="
                margin-top:14px;
                padding:14px;
                border-radius:12px;
                background:#f8f9fa;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:10px;
                    margin-bottom:8px;
                "
            >
                <span>
                    Total
                </span>

                <strong>
                    ${formatCurrency(total)}
                </strong>
            </div>

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:10px;
                    margin-bottom:8px;
                "
            >
                <span>
                    Amount Paid
                </span>

                <strong>
                    ${formatCurrency(amountPaid)}
                </strong>
            </div>

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:10px;
                    padding-top:8px;
                    border-top:1px solid #e5e5e5;
                "
            >
                <span>
                    Remaining Balance
                </span>

                <strong>
                    ${formatCurrency(
                        remainingBalance
                    )}
                </strong>
            </div>

        </div>
    `;


    // =====================================
    // COMPLETE ORDER CARD
    // =====================================

    return `
        <article
            class="order-card"
            data-order-id="${escapeHTML(
                order.id || ""
            )}"
        >

            <!-- ORDER HEADER -->

            <div class="order-card-header">

                <div class="order-heading">

                    <span class="order-label">
                        ORDER
                    </span>

                    <h3>
                        ${escapeHTML(
                            orderReference
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            date
                        )}
                    </p>

                </div>

                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHTML(
                        status
                    )}
                </span>

            </div>


            <!-- ORDER ITEMS -->

            <div class="order-items">

                ${itemsHTML}

            </div>


            <!-- ORDER SUMMARY -->

            <div class="order-summary">

                <div>

                    <span>
                        Items
                    </span>

                    <strong>
                        ${itemCount}
                    </strong>

                </div>

                <div>

                    <span>
                        Total
                    </span>

                    <strong>
                        ${formatCurrency(
                            total
                        )}
                    </strong>

                </div>

            </div>


            <!-- PAYMENT INFORMATION -->

            <div class="order-payment">

                <span>
                    ${escapeHTML(
                        paymentMethod
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        paymentPlan
                    )}
                </span>

            </div>


            <!-- PAYMENT SUMMARY -->

            ${paymentSummaryHTML}


            <!-- ACTIONS -->

            <div class="order-actions">

                <a
                    href="${trackingURL}"
                    class="track-button"
                >
                    📦 Track Order
                </a>

                ${balanceActionHTML}

            </div>

        </article>
    `;
}


// =========================================
// CREATE ORDER ITEM
// =========================================

function createOrderItem(item) {

    const price =
        Number(
            item.price
        ) || 0;

    const quantity =
        Math.max(
            1,
            Number(
                item.quantity
            ) || 1
        );

    const productName =
        item.product_name ||
        "Product";

    const image =
        item.image ||
        "";

    const icon =
        item.icon ||
        "👟";

    const sizeHTML =
        item.size
            ? `
                <span>
                    Size:
                    ${escapeHTML(
                        item.size
                    )}
                </span>
            `
            : "";

    const imageHTML =
        image
            ? `
                <img
                    src="${escapeAttr(
                        image
                    )}"
                    alt="${escapeAttr(
                        productName
                    )}"
                    class="order-item-image"
                    loading="lazy"
                >
            `
            : `
                <div class="order-item-icon">
                    ${escapeHTML(
                        icon
                    )}
                </div>
            `;

    return `
        <div class="order-item">

            <div class="order-item-media">
                ${imageHTML}
            </div>

            <div class="order-item-details">

                <h4>
                    ${escapeHTML(
                        productName
                    )}
                </h4>

                <div class="order-item-meta">

                    <span>
                        Qty:
                        ${quantity}
                    </span>

                    ${sizeHTML}

                </div>

            </div>

            <strong class="order-item-price">
                ${formatCurrency(
                    price * quantity
                )}
            </strong>

        </div>
    `;
}


// =========================================
// PAYMENT PLAN TEXT
// =========================================

function getPaymentPlanText(plan) {

    const value =
        String(
            plan || ""
        ).toLowerCase();

    if (
        value.includes("deposit") ||
        value.includes("60")
    ) {
        return "60% Deposit";
    }

    if (
        value.includes("full") ||
        value.includes("100")
    ) {
        return "100% Full Payment";
    }

    return plan || "Payment";
}


// =========================================
// STATUS CLASS
// =========================================

function getStatusClass(status) {

    const value =
        String(
            status || ""
        ).toLowerCase();

    if (
        value.includes("fully paid") ||
        value === "paid" ||
        value.includes("delivered")
    ) {
        return "status-success";
    }

    if (
        value.includes("deposit") ||
        value.includes("balance")
    ) {
        return "status-warning";
    }

    if (
        value.includes("cancel")
    ) {
        return "status-danger";
    }

    return "status-pending";
}


// =========================================
// FORMAT CURRENCY
// =========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(
        Number(amount) || 0
    );
}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "Date unavailable";
    }

    const date =
        new Date(
            dateValue
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Date unavailable";
    }

    return date.toLocaleDateString(
        "en-NG",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// =========================================
// SHOW LOADING
// =========================================

function showLoading() {

    const loading =
        document.getElementById(
            "loadingOrders"
        );

    const content =
        document.getElementById(
            "ordersContent"
        );

    const error =
        document.getElementById(
            "ordersError"
        );

    const empty =
        document.getElementById(
            "emptyOrders"
        );

    if (loading) {
        loading.classList.remove(
            "hidden"
        );
    }

    if (content) {
        content.classList.add(
            "hidden"
        );
    }

    if (error) {
        error.classList.add(
            "hidden"
        );
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }
}


// =========================================
// HIDE LOADING
// =========================================

function hideLoading() {

    const loading =
        document.getElementById(
            "loadingOrders"
        );

    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


// =========================================
// SHOW EMPTY ORDERS
// =========================================

function showEmptyOrders() {

    hideLoading();

    const content =
        document.getElementById(
            "ordersContent"
        );

    const empty =
        document.getElementById(
            "emptyOrders"
        );

    if (content) {
        content.classList.remove(
            "hidden"
        );
    }

    if (empty) {
        empty.classList.remove(
            "hidden"
        );
    }
}


// =========================================
// LOGIN REQUIRED
// =========================================

function showLoginRequired() {

    hideLoading();

    const loginRequired =
        document.getElementById(
            "loginRequired"
        );

    const content =
        document.getElementById(
            "ordersContent"
        );

    if (loginRequired) {
        loginRequired.classList.remove(
            "hidden"
        );
    }

    if (content) {
        content.classList.add(
            "hidden"
        );
    }
}


// =========================================
// SHOW ERROR
// =========================================

function showError(message) {

    const loading =
        document.getElementById(
            "loadingOrders"
        );

    const content =
        document.getElementById(
            "ordersContent"
        );

    const errorCard =
        document.getElementById(
            "ordersError"
        );

    const errorMessage =
        document.getElementById(
            "ordersErrorMessage"
        );

    if (loading) {
        loading.classList.add(
            "hidden"
        );
    }

    if (content) {
        content.classList.add(
            "hidden"
        );
    }

    if (errorMessage) {
        errorMessage.textContent =
            message;
    }

    if (errorCard) {
        errorCard.classList.remove(
            "hidden"
        );
    }
}


// =========================================
// RETRY BUTTON
// =========================================

document.addEventListener(
    "click",
    event => {

        if (
            event.target &&
            event.target.id ===
                "retryOrders"
        ) {

            initializeMyOrders();
        }
    }
);


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

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

function escapeAttr(value) {

    return escapeHTML(
        value
    );
}