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


        // Customer must be logged in
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

async function loadCustomerOrders(
    userId
) {

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


    // No orders
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
// CREATE ONE ORDER CARD
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


    // -------------------------------------
    // ORDER ITEMS
    // -------------------------------------

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


    // -------------------------------------
    // TRACKING URL
    // -------------------------------------

    const trackingURL =
        `track-order.html?order=${encodeURIComponent(
            orderReference
        )}`;


    // -------------------------------------
    // COMPLETE ORDER CARD
    // -------------------------------------

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


            <!-- ONE TRACK ORDER BUTTON -->

            <div class="order-actions">

                <a
                    href="${trackingURL}"
                    class="track-button"
                >
                    📦 Track Order
                </a>

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
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(
                        productName
                    )}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.parentElement
                            .querySelector('.fallback-icon')
                            .style.display='flex';
                    "
                >

                <span
                    class="fallback-icon"
                    style="display:none;"
                >
                    ${escapeHTML(icon)}
                </span>
            `

            : `
                <span class="fallback-icon">
                    ${escapeHTML(icon)}
                </span>
            `;


    return `
        <div class="order-item">

            <div class="item-image">

                ${imageHTML}

            </div>


            <div class="item-info">

                <strong>
                    ${escapeHTML(
                        productName
                    )}
                </strong>

                <small>

                    <span>
                        Qty:
                        ${quantity}
                    </span>

                    ${sizeHTML}

                </small>

            </div>


            <div class="item-price">

                ${formatCurrency(
                    price * quantity
                )}

            </div>

        </div>
    `;
}


// =========================================
// PAYMENT PLAN
// =========================================

function getPaymentPlanText(
    paymentPlan
) {

    const value =
        String(
            paymentPlan || ""
        ).toLowerCase();


    if (
        value === "deposit"
    ) {

        return "60% Deposit";
    }


    if (
        value === "full"
    ) {

        return "Full Payment";
    }


    if (
        value.includes("60")
    ) {

        return "60% Deposit";
    }


    if (
        value.includes("100")
    ) {

        return "Full Payment";
    }


    return paymentPlan || "";
}


// =========================================
// STATUS CLASS
// =========================================

function getStatusClass(
    status
) {

    const value =
        String(
            status || ""
        )
            .toLowerCase();


    if (
        value.includes(
            "cancel"
        )
    ) {

        return "status-cancelled";
    }


    if (
        value.includes(
            "delivered"
        )
    ) {

        return "status-delivered";
    }


    if (
        value.includes(
            "shipped"
        )
    ) {

        return "status-shipped";
    }


    if (
        value.includes(
            "processing"
        )
    ) {

        return "status-processing";
    }


    if (
        value.includes(
            "paid"
        )
    ) {

        return "status-paid";
    }


    if (
        value.includes(
            "deposit"
        )
    ) {

        return "status-paid";
    }


    return "status-pending";
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


    if (loginRequired) {

        loginRequired.classList.remove(
            "hidden"
        );
    }
}


// =========================================
// EMPTY ORDERS
// =========================================

function showEmptyOrders() {

    hideLoading();


    const content =
        document.getElementById(
            "ordersContent"
        );


    if (content) {

        content.classList.remove(
            "hidden"
        );
    }


    const empty =
        document.getElementById(
            "emptyOrders"
        );


    if (empty) {

        empty.classList.remove(
            "hidden"
        );
    }
}


// =========================================
// LOADING
// =========================================

function showLoading() {

    const loading =
        document.getElementById(
            "loadingOrders"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }


    const content =
        document.getElementById(
            "ordersContent"
        );


    if (content) {

        content.classList.add(
            "hidden"
        );
    }


    const error =
        document.getElementById(
            "ordersError"
        );


    if (error) {

        error.classList.add(
            "hidden"
        );
    }
}


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
// ERROR
// =========================================

function showError(
    message
) {

    hideLoading();


    const error =
        document.getElementById(
            "ordersError"
        );


    if (error) {

        error.classList.remove(
            "hidden"
        );
    }


    const messageElement =
        document.getElementById(
            "ordersErrorMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            message ||
            "Unable to load your orders.";
    }


    const retry =
        document.getElementById(
            "retryOrders"
        );


    if (retry) {

        retry.onclick =
            function () {

                location.reload();

            };
    }
}


// =========================================
// FORMAT CURRENCY
// =========================================

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
        Number(amount) || 0
    );
}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
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


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(
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