// =========================================
// AYODEJI FASHION HUBS
// SECURE CUSTOMER ORDER TRACKING
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error("Supabase client was not loaded.");
        return;
    }

    // -----------------------------------------
    // ELEMENTS
    // -----------------------------------------

    const trackOrderForm =
        document.getElementById("trackOrderForm");

    const orderReferenceInput =
        document.getElementById("orderReference");

    const customerPhoneInput =
        document.getElementById("customerPhone");

    const trackOrderButton =
        document.getElementById("trackOrderButton");

    const trackButtonText =
        document.getElementById("trackButtonText");

    const trackOrderMessage =
        document.getElementById("trackOrderMessage");

    const orderResult =
        document.getElementById("orderResult");

    const notificationSection =
        document.getElementById("notificationSection");

    const notificationCount =
        document.getElementById("notificationCount");

    const notificationList =
        document.getElementById("notificationList");

    const currentYear =
        document.getElementById("currentYear");


    // -----------------------------------------
    // YEAR
    // -----------------------------------------

    if (currentYear) {
        currentYear.textContent =
            new Date().getFullYear();
    }


    // -----------------------------------------
    // CART COUNT
    // -----------------------------------------

    updateCartCount();


    // -----------------------------------------
    // TRACK ORDER
    // -----------------------------------------

    if (trackOrderForm) {

        trackOrderForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                hideMessage();

                const orderReference =
                    orderReferenceInput.value.trim();

                const customerPhone =
                    customerPhoneInput.value.trim();


                if (!orderReference) {
                    showMessage(
                        "Please enter your order reference.",
                        "error"
                    );
                    return;
                }


                if (!customerPhone) {
                    showMessage(
                        "Please enter the phone number used for the order.",
                        "error"
                    );
                    return;
                }


                setLoading(true);

                if (orderResult) {
                    orderResult.hidden = true;
                }

                if (notificationSection) {
                    notificationSection.hidden = true;
                }


                try {

                    const {
                        data,
                        error
                    } = await supabaseClient.rpc(
                        "get_secure_order_tracking",
                        {
                            p_order_reference:
                                orderReference,

                            p_customer_phone:
                                customerPhone
                        }
                    );


                    if (error) {

                        console.error(
                            "Secure tracking error:",
                            error
                        );

                        throw new Error(
                            "Unable to track this order right now."
                        );
                    }


                    if (!data || data.success !== true) {

                        showMessage(
                            "We could not find an order with that reference and phone number.",
                            "error"
                        );

                        return;
                    }


                    const order =
                        data.order;

                    const items =
                        Array.isArray(data.items)
                            ? data.items
                            : [];

                    const notifications =
                        Array.isArray(data.notifications)
                            ? data.notifications
                            : [];


                    renderOrder(
                        order,
                        items
                    );


                    renderNotifications(
                        notifications
                    );


                    if (orderResult) {
                        orderResult.hidden = false;
                    }


                } catch (error) {

                    console.error(
                        "Track order error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Something went wrong while tracking your order.",
                        "error"
                    );

                } finally {

                    setLoading(false);

                }

            }
        );

    }


    // =========================================
    // RENDER ORDER
    // =========================================

    function renderOrder(order, items) {

        const orderReference =
            document.getElementById("resultOrderReference");

        const orderStatus =
            document.getElementById("resultOrderStatus");

        const statusIcon =
            document.getElementById("resultStatusIcon");

        const statusTitle =
            document.getElementById("resultStatusTitle");

        const statusMessage =
            document.getElementById("resultStatusMessage");

        const customerName =
            document.getElementById("resultCustomerName");

        const deliveryAddress =
            document.getElementById("resultDeliveryAddress");

        const deliveryLocation =
            document.getElementById("resultDeliveryLocation");

        const paymentMethod =
            document.getElementById("resultPaymentMethod");

        const paymentPlan =
            document.getElementById("resultPaymentPlan");

        const paymentStatus =
            document.getElementById("resultPaymentStatus");

        const subtotal =
            document.getElementById("resultSubtotal");

        const total =
            document.getElementById("resultTotal");

        const payNow =
            document.getElementById("resultPayNow");

        const balance =
            document.getElementById("resultBalance");

        const orderDate =
            document.getElementById("resultOrderDate");

        const customerNote =
            document.getElementById("resultCustomerNote");

        const noteSection =
            document.getElementById("resultNoteSection");

        const orderItems =
            document.getElementById("resultOrderItems");


        if (orderReference) {
            orderReference.textContent =
                order.order_reference;
        }


        if (orderStatus) {
            orderStatus.textContent =
                order.status;
            orderStatus.className =
                `status-badge ${getStatusClass(order.status)}`;
        }


        if (statusIcon) {
            statusIcon.textContent =
                getStatusIcon(order.status);
        }


        if (statusTitle) {
            statusTitle.textContent =
                getStatusTitle(order.status);
        }


        if (statusMessage) {
            statusMessage.textContent =
                getStatusMessage(order.status);
        }


        if (customerName) {
            customerName.textContent =
                order.customer_name || "Customer";
        }


        if (deliveryAddress) {
            deliveryAddress.textContent =
                order.delivery_address || "—";
        }


        if (deliveryLocation) {
            deliveryLocation.textContent =
                `${order.delivery_city || ""}, ${order.delivery_state || ""}`
                    .replace(/^,\s*|\s*,\s*$/g, "") ||
                "—";
        }


        if (paymentMethod) {
            paymentMethod.textContent =
                formatPaymentMethod(
                    order.payment_method
                );
        }


        if (paymentPlan) {
            paymentPlan.textContent =
                formatPaymentPlan(
                    order.payment_plan
                );
        }


        if (paymentStatus) {
            paymentStatus.textContent =
                order.payment_status || "Pending";
        }


        if (subtotal) {
            subtotal.textContent =
                formatMoney(order.subtotal);
        }


        if (total) {
            total.textContent =
                formatMoney(order.total);
        }


        if (payNow) {
            payNow.textContent =
                formatMoney(order.pay_now);
        }


        if (balance) {
            balance.textContent =
                formatMoney(order.balance);
        }


        if (orderDate) {
            orderDate.textContent =
                formatDate(order.created_at);
        }


        if (customerNote) {
            customerNote.textContent =
                order.customer_note || "";
        }


        if (noteSection) {
            noteSection.hidden =
                !order.customer_note;
        }


        if (orderItems) {

            orderItems.innerHTML =
                items.length
                    ? items.map(renderOrderItem).join("")
                    : `
                        <div class="empty-order-items">
                            No items found for this order.
                        </div>
                    `;
        }


        renderTimeline(order.status);
    }


    // =========================================
    // TIMELINE
    // =========================================

    function renderTimeline(status) {

        const timelineSteps = [
            "Order Placed",
            "Payment",
            "Processing",
            "Shipped",
            "Delivered"
        ];

        const currentStep =
            getCurrentStep(status);


        timelineSteps.forEach(
            (step, index) => {

                const number =
                    index + 1;

                const stepElement =
                    document.querySelector(
                        `[data-step="${number}"]`
                    );

                if (!stepElement) {
                    return;
                }


                stepElement.classList.remove(
                    "completed",
                    "active",
                    "pending"
                );


                if (status === "Cancelled") {

                    stepElement.classList.add(
                        "pending"
                    );

                    return;
                }


                if (number < currentStep) {

                    stepElement.classList.add(
                        "completed"
                    );

                } else if (number === currentStep) {

                    stepElement.classList.add(
                        "active"
                    );

                } else {

                    stepElement.classList.add(
                        "pending"
                    );
                }

            }
        );
    }


    function getCurrentStep(status) {

        switch (status) {

            case "Pending Payment":
                return 1;

            case "Deposit Paid":
            case "Balance Pending":
            case "Fully Paid":
                return 2;

            case "Processing":
                return 3;

            case "Shipped":
                return 4;

            case "Delivered":
                return 5;

            case "Cancelled":
                return 0;

            default:
                return 1;
        }
    }


    // =========================================
    // STATUS TEXT
    // =========================================

    function getStatusTitle(status) {

        switch (status) {

            case "Pending Payment":
                return "Payment Pending";

            case "Deposit Paid":
                return "Deposit Received";

            case "Balance Pending":
                return "Balance Pending";

            case "Fully Paid":
                return "Payment Completed";

            case "Processing":
                return "Order Processing";

            case "Shipped":
                return "Order Shipped";

            case "Delivered":
                return "Order Delivered";

            case "Cancelled":
                return "Order Cancelled";

            default:
                return "Order Updated";
        }
    }


    function getStatusMessage(status) {

        switch (status) {

            case "Pending Payment":
                return "Your order has been received and is waiting for payment.";

            case "Deposit Paid":
                return "Your 60% deposit has been received.";

            case "Balance Pending":
                return "Your order is waiting for the remaining balance payment.";

            case "Fully Paid":
                return "Your payment has been completed successfully.";

            case "Processing":
                return "Your order is now being prepared.";

            case "Shipped":
                return "Your order has been shipped and is on the way.";

            case "Delivered":
                return "Your order has been delivered. Thank you for shopping with us!";

            case "Cancelled":
                return "This order has been cancelled.";

            default:
                return "Your order status has been updated.";
        }
    }


    function getStatusClass(status) {

        switch (status) {

            case "Pending Payment":
                return "status-pending";

            case "Deposit Paid":
            case "Balance Pending":
                return "status-partial";

            case "Fully Paid":
                return "status-paid";

            case "Processing":
                return "status-processing";

            case "Shipped":
                return "status-shipped";

            case "Delivered":
                return "status-delivered";

            case "Cancelled":
                return "status-cancelled";

            default:
                return "status-pending";
        }
    }


    function getStatusIcon(status) {

        switch (status) {

            case "Pending Payment":
                return "💳";

            case "Deposit Paid":
                return "💰";

            case "Balance Pending":
                return "⏳";

            case "Fully Paid":
                return "✅";

            case "Processing":
                return "📦";

            case "Shipped":
                return "🚚";

            case "Delivered":
                return "🎉";

            case "Cancelled":
                return "❌";

            default:
                return "📦";
        }
    }


    // =========================================
    // ORDER ITEM
    // =========================================

    function renderOrderItem(item) {

        const image = item.image
            ? `
                <img
                    src="${escapeAttribute(item.image)}"
                    alt="${escapeAttribute(item.product_name)}"
                >
            `
            : `
                <div class="order-item-icon">
                    ${escapeHtml(item.icon || "👟")}
                </div>
            `;

        return `
            <div class="order-item">

                <div class="order-item-image">
                    ${image}
                </div>

                <div class="order-item-details">

                    <h4>
                        ${escapeHtml(item.product_name)}
                    </h4>

                    <p>
                        Qty: ${Number(item.quantity) || 1}
                    </p>

                    ${
                        item.size
                            ? `<p>Size: ${escapeHtml(item.size)}</p>`
                            : ""
                    }

                </div>

                <div class="order-item-price">
                    ${formatMoney(
                        Number(item.price || 0) *
                        Number(item.quantity || 1)
                    )}
                </div>

            </div>
        `;
    }


    // =========================================
    // NOTIFICATIONS
    // =========================================

    function renderNotifications(notifications) {

        if (!notificationSection ||
            !notificationList) {
            return;
        }


        if (!notifications.length) {

            notificationSection.hidden = false;

            if (notificationCount) {
                notificationCount.textContent = "0";
            }

            notificationList.innerHTML = `
                <div class="notification-empty">
                    No order notifications yet.
                </div>
            `;

            return;
        }


        const unreadCount =
            notifications.filter(
                notification =>
                    !notification.is_read
            ).length;


        if (notificationCount) {
            notificationCount.textContent =
                String(unreadCount);
        }


        notificationList.innerHTML =
            notifications
                .map(renderNotification)
                .join("");


        notificationSection.hidden = false;
    }


    function renderNotification(notification) {

        return `
            <article
                class="notification-item ${
                    notification.is_read
                        ? ""
                        : "unread"
                }"
            >

                <div class="notification-icon">
                    ${getNotificationIcon(
                        notification.notification_type,
                        notification.title
                    )}
                </div>

                <div class="notification-content">

                    <h4>
                        ${escapeHtml(
                            notification.title
                        )}
                    </h4>

                    <p>
                        ${escapeHtml(
                            notification.message
                        )}
                    </p>

                    <span class="notification-time">
                        ${formatNotificationDate(
                            notification.created_at
                        )}
                    </span>

                </div>

            </article>
        `;
    }


    function getNotificationIcon(
        type,
        title
    ) {

        const text =
            `${type || ""} ${title || ""}`
                .toLowerCase();


        if (
            text.includes("ship") ||
            text.includes("truck")
        ) {
            return "🚚";
        }


        if (
            text.includes("deliver")
        ) {
            return "🎉";
        }


        if (
            text.includes("payment") ||
            text.includes("deposit") ||
            text.includes("balance")
        ) {
            return "💳";
        }


        if (
            text.includes("cancel")
        ) {
            return "❌";
        }


        if (
            text.includes("process")
        ) {
            return "📦";
        }


        return "🔔";
    }


    // =========================================
    // PAYMENT
    // =========================================

    function formatPaymentMethod(method) {

        if (!method) {
            return "—";
        }

        switch (
            method.toLowerCase()
        ) {

            case "bank_transfer":
            case "bank transfer":
                return "OPay Bank Transfer";

            case "cash_on_delivery":
            case "cash on delivery":
                return "Cash on Delivery";

            default:
                return method;
        }
    }


    function formatPaymentPlan(plan) {

        if (!plan) {
            return "—";
        }

        switch (
            plan.toLowerCase()
        ) {

            case "60":
            case "60%":
            case "deposit":
                return "60% Deposit";

            case "100":
            case "100%":
            case "full":
                return "100% Full Payment";

            default:
                return plan;
        }
    }


    // =========================================
    // MONEY
    // =========================================

    function formatMoney(value) {

        const amount =
            Number(value || 0);

        return new Intl.NumberFormat(
            "en-NG",
            {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 0
            }
        ).format(amount);
    }


    // =========================================
    // DATE
    // =========================================

    function formatDate(value) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
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


    function formatNotificationDate(value) {
        return formatDate(value);
    }


    // =========================================
    // MESSAGE
    // =========================================

    function showMessage(
        message,
        type = "error"
    ) {

        if (!trackOrderMessage) {
            return;
        }

        trackOrderMessage.textContent =
            message;

        trackOrderMessage.className =
            `track-message ${type}`;

        trackOrderMessage.hidden =
            false;
    }


    function hideMessage() {

        if (!trackOrderMessage) {
            return;
        }

        trackOrderMessage.hidden =
            true;

        trackOrderMessage.textContent = "";
    }


    // =========================================
    // LOADING
    // =========================================

    function setLoading(isLoading) {

        if (!trackOrderButton) {
            return;
        }


        trackOrderButton.disabled =
            isLoading;


        if (trackButtonText) {

            trackButtonText.textContent =
                isLoading
                    ? "Verifying..."
                    : "Track Order";
        }
    }


    // =========================================
    // CART COUNT
    // =========================================

    function updateCartCount() {

        const cartCount =
            document.getElementById("cartCount");

        const mobileCartCount =
            document.getElementById(
                "mobileCartCount"
            );


        let count = 0;

        try {

            const cart =
                JSON.parse(
                    localStorage.getItem(
                        "ayodejiCart"
                    ) || "[]"
                );

            count =
                cart.reduce(
                    (total, item) =>
                        total +
                        Number(item.quantity || 0),
                    0
                );

        } catch (error) {

            console.error(
                "Cart count error:",
                error
            );
        }


        if (cartCount) {
            cartCount.textContent =
                count;
        }


        if (mobileCartCount) {
            mobileCartCount.textContent =
                count;
        }
    }


    // =========================================
    // HTML SAFETY
    // =========================================

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escapeAttribute(value) {

        return escapeHtml(value);
    }

});