"use strict";

// =========================================
// AYODEJI FASHION HUBS
// REMAINING BALANCE PAYMENT
// =========================================

document.addEventListener("DOMContentLoaded", async () => {
    const supabaseClient = window.supabaseClient;

    const loadingBalance = document.getElementById("loadingBalance");
    const balanceContent = document.getElementById("balanceContent");
    const balanceError = document.getElementById("balanceError");
    const balanceErrorMessage = document.getElementById("balanceErrorMessage");

    const orderReference = document.getElementById("orderReference");
    const orderStatus = document.getElementById("orderStatus");
    const remainingAmount = document.getElementById("remainingAmount");
    const transferAmount = document.getElementById("transferAmount");

    const copyAccountNumber = document.getElementById("copyAccountNumber");
    const accountNumber = document.getElementById("accountNumber");

    if (!supabaseClient) {
        showError("Payment system could not be loaded. Please refresh the page.");
        return;
    }

    try {
        // -----------------------------------------
        // CHECK LOGIN
        // -----------------------------------------

        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!session || !session.user) {
            const currentUrl =
                window.location.pathname +
                window.location.search;

            window.location.href =
                "login.html?redirect=" +
                encodeURIComponent(currentUrl);

            return;
        }

        // -----------------------------------------
        // GET ORDER ID FROM URL
        // -----------------------------------------

        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("order");

        if (!orderId) {
            showError("No order was specified.");
            return;
        }

        // -----------------------------------------
        // LOAD ONLY THE CUSTOMER'S ORDER
        // -----------------------------------------

        const {
            data: order,
            error: orderError
        } = await supabaseClient
            .from("orders")
            .select(`
                id,
                user_id,
                order_reference,
                customer_name,
                payment_method,
                payment_plan,
                subtotal,
                total,
                pay_now,
                balance,
                status,
                payment_status,
                created_at
            `)
            .eq("id", orderId)
            .eq("user_id", session.user.id)
            .single();

        if (orderError) {
            throw orderError;
        }

        if (!order) {
            showError("Order not found or you do not have permission to view it.");
            return;
        }

        // -----------------------------------------
        // CHECK PAYMENT METHOD
        // -----------------------------------------

        if (
            order.payment_method &&
            order.payment_method !== "OPay Bank Transfer"
        ) {
            showError(
                "This order does not use OPay Bank Transfer."
            );
            return;
        }

        // -----------------------------------------
        // CALCULATE REMAINING BALANCE
        // -----------------------------------------

        const total = Number(order.total || 0);

        let balance = Number(order.balance || 0);

        const paymentStatus =
            String(order.payment_status || "").toLowerCase();

        const status =
            String(order.status || "").toLowerCase();

        // If already fully paid, there is nothing left to pay.
        if (
            paymentStatus === "fully paid" ||
            paymentStatus === "paid" ||
            status === "fully paid"
        ) {
            balance = 0;
        }

        // Protect against invalid negative values.
        if (balance < 0) {
            balance = 0;
        }

        // Never allow balance to be greater than total.
        if (balance > total) {
            balance = total;
        }

        // -----------------------------------------
        // ALREADY FULLY PAID
        // -----------------------------------------

        if (balance <= 0) {
            showAlreadyPaid(order);
            return;
        }

        // -----------------------------------------
        // DISPLAY ORDER DETAILS
        // -----------------------------------------

        orderReference.textContent =
            order.order_reference || "Order";

        orderStatus.textContent =
            formatStatus(
                order.payment_status || order.status || "Pending Payment"
            );

        remainingAmount.textContent =
            formatMoney(balance);

        transferAmount.textContent =
            formatMoney(balance);

        // -----------------------------------------
        // COPY ACCOUNT NUMBER
        // -----------------------------------------

        if (copyAccountNumber && accountNumber) {
            copyAccountNumber.addEventListener("click", async () => {
                const number =
                    accountNumber.textContent.trim();

                try {
                    await navigator.clipboard.writeText(number);

                    const originalText =
                        copyAccountNumber.textContent;

                    copyAccountNumber.textContent =
                        "Copied!";

                    setTimeout(() => {
                        copyAccountNumber.textContent =
                            originalText;
                    }, 2000);

                } catch (error) {
                    // Fallback for browsers where clipboard API
                    // is unavailable.
                    copyTextFallback(number);
                }
            });
        }

        // -----------------------------------------
        // SHOW PAGE
        // -----------------------------------------

        hide(loadingBalance);
        hide(balanceError);
        show(balanceContent);

    } catch (error) {
        console.error(
            "Balance payment error:",
            error
        );

        showError(
            "We could not load your payment details. Please try again."
        );
    }


    // =========================================
    // HELPERS
    // =========================================

    function showError(message) {
        if (balanceErrorMessage) {
            balanceErrorMessage.textContent = message;
        }

        hide(loadingBalance);
        hide(balanceContent);
        show(balanceError);
    }


    function showAlreadyPaid(order) {
        hide(loadingBalance);

        if (balanceError) {
            balanceError.classList.remove("hidden");

            const title =
                balanceError.querySelector("h2");

            if (title) {
                title.textContent =
                    "Order Already Fully Paid";
            }
        }

        if (balanceErrorMessage) {
            balanceErrorMessage.textContent =
                `Order ${order.order_reference || ""} has no remaining balance.`;
        }
    }


    function formatMoney(amount) {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(amount);
    }


    function formatStatus(status) {
        return String(status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter =>
                letter.toUpperCase()
            );
    }


    function copyTextFallback(text) {
        const textarea =
            document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        try {
            document.execCommand("copy");

            if (copyAccountNumber) {
                const originalText =
                    copyAccountNumber.textContent;

                copyAccountNumber.textContent =
                    "Copied!";

                setTimeout(() => {
                    copyAccountNumber.textContent =
                        originalText;
                }, 2000);
            }
        } catch (error) {
            alert(
                "Copy failed. Please copy the account number manually."
            );
        }

        textarea.remove();
    }


    function show(element) {
        if (element) {
            element.classList.remove("hidden");
        }
    }


    function hide(element) {
        if (element) {
            element.classList.add("hidden");
        }
    }
});