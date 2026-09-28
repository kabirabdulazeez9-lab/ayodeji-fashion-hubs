// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER MY ORDERS
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeMyOrders
);


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
            "My Orders error:",
            error
        );

        showError(
            error.message ||
            "Unable to load your orders."
        );
    }
}


// =========================================
// LOAD ORDERS
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
            "Orders query error:",
            error
        );

        throw error;
    }


    hideLoading();


    if (
        !data ||
        data.length === 0
    ) {

        showEmptyOrders();

        return;
    }


    document
        .getElementById("ordersContent")
        ?.classList
        .remove("hidden");


    const countElement =
        document.getElementById(
            "ordersCount"
        );


    if (countElement) {

        countElement.textContent =
            `${data.length} ${
                data.length === 1
                    ? "Order"
                    : "Orders"
            }`;
    }


    renderOrders(data);
}


// =========================================
// RENDER ORDERS
// =========================================

function renderOrders(orders) {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!container) return;


    container.innerHTML =
        orders
            .map(
                order =>
                    createOrderCard(
                        order
                    )
            )
            .join("");
}


// =========================================
// ORDER CARD
// =========================================

function createOrderCard(order) {

    const items =
        Array.isArray(
            order.order_items
        )
            ? order.order_items
            : [];


    const date =
        formatDate(
            order.created_at
        );


    const status =
        order.status ||
        "Pending Payment";


    const statusClass =
        getStatusClass(status);


    const total =
        Number(
            order.total
        ) || 0;


    const itemCount =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    Number(
                        item.quantity
                    ) || 1
                ),
            0
        );


    const itemsHTML =
        items
            .map(
                item => {

                    const price =
                        Number(
                            item.price
                        ) || 0;


                    const quantity =
                        Number(
                            item.quantity
                        ) || 1;


                    const image =
                        item.image;


                    return `
                        <div class="order-item">

                            <div class="item-image">

                                ${
                                    image
                                        ? `
                                            <img
                                                src="${escapeHTML(image)}"
                                                alt="${escapeHTML(
                                                    item.product_name ||
                                                    "Product"
                                                )}"
                                            >
                                        `
                                        : `
                                            <span>
                                                ${escapeHTML(
                                                    item.icon ||
                                                    "👟"
                                                )}
                                            </span>
                                        `
                                }

                            </div>


                            <div class="item-info">

                                <strong>
                                    ${escapeHTML(
                                        item.product_name ||
                                        "Product"
                                    )}
                                </strong>

                                <small>
                                    Qty: ${quantity}
                                    ${
                                        item.size
                                            ? ` · Size: ${escapeHTML(item.size)}`
                                            : ""
                                    }
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
            )
            .join("");


    return `
        <article class="order-card">

            <div class="order-card-header">

                <div>

                    <span class="order-label">
                        ORDER
                    </span>

                    <h3>
                        ${escapeHTML(
                            order.order_reference ||
                            "Order"
                        )}
                    </h3>

                    <p>
                        ${date}
                    </p>

                </div>


                <span class="status-badge ${statusClass}">
                    ${escapeHTML(status)}
                </span>

            </div>


            <div class="order-items">

                ${
                    itemsHTML ||
                    `
                        <p class="no-items">
                            Order items unavailable.
                        </p>
                    `
                }

            </div>


            <div class="order-summary">

                <div>
                    <span>Items</span>
                    <strong>
                        ${itemCount}
                    </strong>
                </div>


                <div>
                    <span>Total</span>
                    <strong>
                        ${formatCurrency(total)}
                    </strong>
                </div>

            </div>


            <div class="order-payment">

                <span>
                    ${escapeHTML(
                        order.payment_method ||
                        "Payment"
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        order.payment_plan === "deposit"
                            ? "60% Deposit"
                            : order.payment_plan === "full"
                                ? "Full Payment"
                                : order.payment_plan ||
                                  ""
                    )}
                </span>

            </div>


            <div class="order-actions">

                <a
                    href="track-order.html?order=${encodeURIComponent(
                        order.order_reference || ""
                    )}"
                    class="track-button"
                >
                    Track Order
                </a>

            </div>

        </article>
    `;
}


// =========================================
// STATUS CLASS
// =========================================

function getStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase();


    if (
        value.includes("delivered")
    ) {
        return "status-delivered";
    }


    if (
        value.includes("shipped")
    ) {
        return "status-shipped";
    }


    if (
        value.includes("processing")
    ) {
        return "status-processing";
    }


    if (
        value.includes("paid")
    ) {
        return "status-paid";
    }


    if (
        value.includes("cancel")
    ) {
        return "status-cancelled";
    }


    return "status-pending";
}


// =========================================
// UI
// =========================================

function showLoginRequired() {

    hideLoading();


    document
        .getElementById("loginRequired")
        ?.classList
        .remove("hidden");
}


function showEmptyOrders() {

    hideLoading();


    document
        .getElementById("ordersContent")
        ?.classList
        .remove("hidden");


    document
        .getElementById("emptyOrders")
        ?.classList
        .remove("hidden");
}


function showLoading() {

    document
        .getElementById("loadingOrders")
        ?.classList
        .remove("hidden");


    document
        .getElementById("ordersContent")
        ?.classList
        .add("hidden");


    document
        .getElementById("ordersError")
        ?.classList
        .add("hidden");
}


function hideLoading() {

    document
        .getElementById("loadingOrders")
        ?.classList
        .add("hidden");
}


function showError(message) {

    hideLoading();


    document
        .getElementById("ordersError")
        ?.classList
        .remove("hidden");


    const messageElement =
        document.getElementById(
            "ordersErrorMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    const retryButton =
        document.getElementById(
            "retryOrders"
        );


    if (retryButton) {

        retryButton.onclick =
            () => {

                location.reload();

            };
    }
}


// =========================================
// HELPERS
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


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


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