// =========================================
// AYODEJI FASHION HUBS
// CHECKOUT
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeCheckout();
});


// =========================================
// GLOBAL STATE
// =========================================

let checkoutCart = [];

let checkoutUser = null;

let checkoutProfile = null;

let checkoutTotal = 0;

let checkoutSubmitting = false;


// =========================================
// INITIALIZE CHECKOUT
// =========================================

async function initializeCheckout() {

    const supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {

        showCheckoutMessage(
            "Unable to connect to the checkout service. Please refresh the page.",
            "error"
        );

        return;
    }


    // -----------------------------------------
    // GET CURRENT SESSION
    // -----------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        showCheckoutMessage(
            "Unable to verify your account. Please try again.",
            "error"
        );

        return;
    }


    // -----------------------------------------
    // ACCOUNT REQUIRED
    // -----------------------------------------

    if (!data?.session) {

        showLoginRequired();

        return;
    }


    checkoutUser =
        data.session.user;


    // -----------------------------------------
    // LOAD CART
    // -----------------------------------------

    loadCart();


    if (!checkoutCart.length) {

        showCheckoutMessage(
            "Your cart is empty. Please add a product before checking out.",
            "error"
        );

        disableCheckoutForm();

        return;
    }


    // -----------------------------------------
    // LOAD CUSTOMER PROFILE
    // -----------------------------------------

    await loadCustomerProfile();


    // -----------------------------------------
    // DISPLAY USER INFORMATION
    // -----------------------------------------

    populateCustomerInformation();


    // -----------------------------------------
    // SETUP CHECKOUT
    // -----------------------------------------

    setupPaymentMethods();

    setupPaymentPlans();

    setupCopyAccountNumber();

    setupCheckoutForm();


    // -----------------------------------------
    // CALCULATE TOTAL
    // -----------------------------------------

    renderOrderSummary();

}


// =========================================
// LOAD CART
// =========================================

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem(
                "ayodejiCart"
            );


        if (!savedCart) {

            checkoutCart = [];

            return;
        }


        const parsedCart =
            JSON.parse(savedCart);


        if (!Array.isArray(parsedCart)) {

            checkoutCart = [];

            return;
        }


        checkoutCart =
            parsedCart
                .filter(item => item)
                .map(item => ({

                    id:
                        item.id,

                    name:
                        item.name || "Product",

                    price:
                        Number(item.price) || 0,

                    quantity:
                        Math.max(
                            1,
                            Number(item.quantity) || 1
                        ),

                    image:
                        item.image || "",

                    icon:
                        item.icon || "👟",

                    size:
                        item.size || ""

                }));


    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        checkoutCart = [];

    }

}


// =========================================
// LOAD CUSTOMER PROFILE
// =========================================

async function loadCustomerProfile() {

    if (!checkoutUser) {
        return;
    }


    const supabaseClient =
        window.supabaseClient;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("customer_profiles")
                .select(
                    `
                    user_id,
                    full_name,
                    phone,
                    delivery_address,
                    delivery_city,
                    delivery_state
                    `
                )
                .eq(
                    "user_id",
                    checkoutUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Profile loading error:",
                error
            );

            return;
        }


        checkoutProfile =
            data || null;


    } catch (error) {

        console.error(
            "Profile loading exception:",
            error
        );

    }

}


// =========================================
// POPULATE CUSTOMER INFORMATION
// =========================================

function populateCustomerInformation() {

    const nameInput =
        document.getElementById(
            "customerName"
        );


    const phoneInput =
        document.getElementById(
            "customerPhone"
        );


    const emailInput =
        document.getElementById(
            "customerEmail"
        );


    const addressInput =
        document.getElementById(
            "deliveryAddress"
        );


    const cityInput =
        document.getElementById(
            "deliveryCity"
        );


    const stateInput =
        document.getElementById(
            "deliveryState"
        );


    const metadata =
        checkoutUser?.user_metadata || {};


    const name =
        checkoutProfile?.full_name ||
        metadata.full_name ||
        metadata.name ||
        "";


    const phone =
        checkoutProfile?.phone ||
        metadata.phone ||
        "";


    const address =
        checkoutProfile?.delivery_address ||
        "";


    const city =
        checkoutProfile?.delivery_city ||
        "";


    const state =
        checkoutProfile?.delivery_state ||
        "";


    const email =
        checkoutUser?.email ||
        "";


    if (nameInput) {

        nameInput.value = name;

    }


    if (phoneInput) {

        phoneInput.value = phone;

    }


    if (emailInput) {

        emailInput.value = email;

    }


    if (addressInput) {

        addressInput.value = address;

    }


    if (cityInput) {

        cityInput.value = city;

    }


    if (stateInput) {

        stateInput.value = state;

    }

}


// =========================================
// PAYMENT METHODS
// =========================================

function setupPaymentMethods() {

    const paymentInputs =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    const paymentDetails =
        document.getElementById(
            "paymentDetails"
        );


    if (!paymentInputs.length) {
        return;
    }


    function updatePaymentMethod() {

        const selected =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );


        if (!paymentDetails) {
            return;
        }


        if (
            selected?.value ===
            "OPay Bank Transfer"
        ) {

            paymentDetails.style.display =
                "block";

        } else {

            paymentDetails.style.display =
                "none";

        }

    }


    paymentInputs.forEach(input => {

        input.addEventListener(
            "change",
            updatePaymentMethod
        );

    });


    updatePaymentMethod();

}


// =========================================
// PAYMENT PLANS
// =========================================

function setupPaymentPlans() {

    const planInputs =
        document.querySelectorAll(
            'input[name="paymentPlan"]'
        );


    planInputs.forEach(input => {

        input.addEventListener(
            "change",
            renderPaymentAmounts
        );

    });


    renderPaymentAmounts();

}


// =========================================
// RENDER ORDER SUMMARY
// =========================================

function renderOrderSummary() {

    const itemsContainer =
        document.getElementById(
            "orderItems"
        );


    if (!itemsContainer) {
        return;
    }


    itemsContainer.innerHTML = "";


    checkoutTotal = 0;


    checkoutCart.forEach(item => {

        const itemTotal =
            item.price *
            item.quantity;


        checkoutTotal +=
            itemTotal;


        const itemElement =
            document.createElement("div");


        itemElement.className =
            "order-item";


        const imageHTML =
            item.image
                ? `
                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.name)}"
                        class="order-item-image"
                    >
                `
                : `
                    <div class="order-item-image order-item-placeholder">
                        ${escapeHTML(item.icon || "👟")}
                    </div>
                `;


        const sizeHTML =
            item.size
                ? `
                    <small>
                        Size: ${escapeHTML(item.size)}
                    </small>
                `
                : "";


        itemElement.innerHTML = `

            ${imageHTML}

            <div class="order-item-info">

                <strong>
                    ${escapeHTML(item.name)}
                </strong>

                <small>
                    ${formatCurrency(item.price)}
                    × ${item.quantity}
                </small>

                ${sizeHTML}

            </div>

            <strong class="order-item-total">
                ${formatCurrency(itemTotal)}
            </strong>

        `;


        itemsContainer.appendChild(
            itemElement
        );

    });


    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );


    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatCurrency(
                checkoutTotal
            );

    }


    if (totalElement) {

        totalElement.textContent =
            formatCurrency(
                checkoutTotal
            );

    }


    renderPaymentAmounts();

}


// =========================================
// PAYMENT AMOUNTS
// =========================================

function renderPaymentAmounts() {

    const payNowElement =
        document.getElementById(
            "payNowAmount"
        );


    const balanceElement =
        document.getElementById(
            "balanceAmount"
        );


    if (!checkoutTotal) {

        if (payNowElement) {
            payNowElement.textContent =
                formatCurrency(0);
        }

        if (balanceElement) {
            balanceElement.textContent =
                formatCurrency(0);
        }

        return;
    }


    const selectedPlan =
        document.querySelector(
            'input[name="paymentPlan"]:checked'
        );


    let payNow =
        checkoutTotal;


    if (
        selectedPlan?.value ===
        "deposit"
    ) {

        payNow =
            Math.round(
                checkoutTotal * 0.60
            );

    }


    const balance =
        checkoutTotal -
        payNow;


    if (payNowElement) {

        payNowElement.textContent =
            formatCurrency(
                payNow
            );

    }


    if (balanceElement) {

        balanceElement.textContent =
            formatCurrency(
                balance
            );

    }

}


// =========================================
// COPY OPAY ACCOUNT NUMBER
// =========================================

function setupCopyAccountNumber() {

    const button =
        document.getElementById(
            "copyAccountNumber"
        );


    const accountNumber =
        document.getElementById(
            "accountNumber"
        );


    if (
        !button ||
        !accountNumber
    ) {

        return;
    }


    button.addEventListener(
        "click",
        async () => {

            const number =
                accountNumber.textContent
                    .trim();


            try {

                await navigator.clipboard.writeText(
                    number
                );


                const original =
                    button.textContent;


                button.textContent =
                    "Copied!";


                setTimeout(() => {

                    button.textContent =
                        original;

                }, 1500);


            } catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );


                showCheckoutMessage(
                    `Copy failed. Account number: ${number}`,
                    "info"
                );

            }

        }
    );

}


// =========================================
// CHECKOUT FORM
// =========================================

function setupCheckoutForm() {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleCheckoutSubmit
    );

}


// =========================================
// SUBMIT ORDER
// =========================================

async function handleCheckoutSubmit(
    event
) {

    event.preventDefault();


    if (checkoutSubmitting) {
        return;
    }


    const supabaseClient =
        window.supabaseClient;


    // -----------------------------------------
    // VERIFY AUTH AGAIN
    // -----------------------------------------

    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth.getSession();


    if (
        sessionError ||
        !sessionData?.session
    ) {

        showLoginRequired();

        return;
    }


    checkoutUser =
        sessionData.session.user;


    // -----------------------------------------
    // VERIFY CART
    // -----------------------------------------

    loadCart();


    if (!checkoutCart.length) {

        showCheckoutMessage(
            "Your cart is empty.",
            "error"
        );

        return;
    }


    // -----------------------------------------
    // GET FORM VALUES
    // -----------------------------------------

    const customerName =
        getValue("customerName");


    const customerPhone =
        getValue("customerPhone");


    const customerEmail =
        getValue("customerEmail");


    const deliveryAddress =
        getValue("deliveryAddress");


    const deliveryCity =
        getValue("deliveryCity");


    const deliveryState =
        getValue("deliveryState");


    const orderNote =
        getValue("orderNote");


    const paymentMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value || "";


    const paymentPlan =
        document.querySelector(
            'input[name="paymentPlan"]:checked'
        )?.value || "deposit";


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!customerName) {

        showCheckoutMessage(
            "Please enter your full name.",
            "error"
        );

        focusElement(
            "customerName"
        );

        return;
    }


    if (
        !customerPhone ||
        !isValidPhone(customerPhone)
    ) {

        showCheckoutMessage(
            "Please enter a valid Nigerian phone number.",
            "error"
        );

        focusElement(
            "customerPhone"
        );

        return;
    }


    if (!customerEmail) {

        showCheckoutMessage(
            "Your account email could not be found. Please log in again.",
            "error"
        );

        return;
    }


    if (!deliveryAddress) {

        showCheckoutMessage(
            "Please enter your delivery address.",
            "error"
        );

        focusElement(
            "deliveryAddress"
        );

        return;
    }


    if (!deliveryCity) {

        showCheckoutMessage(
            "Please enter your delivery city.",
            "error"
        );

        focusElement(
            "deliveryCity"
        );

        return;
    }


    if (!deliveryState) {

        showCheckoutMessage(
            "Please enter your delivery state.",
            "error"
        );

        focusElement(
            "deliveryState"
        );

        return;
    }


    if (!paymentMethod) {

        showCheckoutMessage(
            "Please select a payment method.",
            "error"
        );

        return;
    }


    // -----------------------------------------
    // CALCULATE TOTAL
    // -----------------------------------------

    const subtotal =
        calculateCartTotal();


    if (subtotal <= 0) {

        showCheckoutMessage(
            "Your cart total is invalid.",
            "error"
        );

        return;
    }


    let payNow =
        subtotal;


    if (
        paymentPlan ===
        "deposit"
    ) {

        payNow =
            Math.round(
                subtotal * 0.60
            );

    }


    const balance =
        subtotal -
        payNow;


    // -----------------------------------------
    // START SUBMITTING
    // -----------------------------------------

    checkoutSubmitting = true;

    setSubmitLoading(true);


    try {

        // -----------------------------------------
        // CREATE ORDER REFERENCE
        // -----------------------------------------

        const orderReference =
            generateOrderReference();


        // -----------------------------------------
        // DETERMINE INITIAL STATUS
        // -----------------------------------------

        let orderStatus =
            "Pending Payment";


        let paymentStatus =
            "Pending";


        if (
            paymentMethod ===
            "Cash on Delivery"
        ) {

            orderStatus =
                "Processing";

            paymentStatus =
                "Cash on Delivery";

        }


        // -----------------------------------------
        // INSERT ORDER
        // -----------------------------------------

        const orderPayload = {

            order_reference:
                orderReference,

            user_id:
                checkoutUser.id,

            customer_name:
                customerName,

            customer_phone:
                customerPhone,

            customer_email:
                customerEmail,

            delivery_address:
                deliveryAddress,

            delivery_city:
                deliveryCity,

            delivery_state:
                deliveryState,

            payment_method:
                paymentMethod,

            payment_plan:
                paymentPlan,

            subtotal:
                subtotal,

            total:
                subtotal,

            pay_now:
                payNow,

            balance:
                balance,

            status:
                orderStatus,

            payment_status:
                paymentStatus,

            notes:
                orderNote || null

        };


        console.log(
            "Creating order:",
            orderPayload
        );


        const {
            data: order,
            error: orderError
        } =
            await supabaseClient
                .from("orders")
                .insert(
                    orderPayload
                )
                .select()
                .single();


        if (orderError) {

            console.error(
                "Order creation error:",
                orderError
            );

            throw orderError;
        }


        if (!order?.id) {

            throw new Error(
                "The order was created but its ID could not be found."
            );

        }


        // -----------------------------------------
        // CREATE ORDER ITEMS
        // -----------------------------------------

        const orderItems =
            checkoutCart.map(item => ({

                order_id:
                    order.id,

                product_id:
                    item.id,

                product_name:
                    item.name,

                product_price:
                    item.price,

                quantity:
                    item.quantity,

                size:
                    item.size || null,

                subtotal:
                    item.price *
                    item.quantity

            }));


        const {
            error: itemsError
        } =
            await supabaseClient
                .from("order_items")
                .insert(
                    orderItems
                );


        if (itemsError) {

            console.error(
                "Order items error:",
                itemsError
            );


            // Try to remove the incomplete order.
            try {

                await supabaseClient
                    .from("orders")
                    .delete()
                    .eq(
                        "id",
                        order.id
                    );

            } catch (deleteError) {

                console.error(
                    "Could not remove incomplete order:",
                    deleteError
                );

            }


            throw itemsError;
        }


        // -----------------------------------------
        // SAVE CUSTOMER PROFILE
        // -----------------------------------------

        await saveCheckoutProfile({

            user_id:
                checkoutUser.id,

            full_name:
                customerName,

            phone:
                customerPhone,

            delivery_address:
                deliveryAddress,

            delivery_city:
                deliveryCity,

            delivery_state:
                deliveryState

        });


        // -----------------------------------------
        // CLEAR CART
        // -----------------------------------------

        localStorage.removeItem(
            "ayodejiCart"
        );


        // -----------------------------------------
        // CLEAR PENDING PROFILE
        // -----------------------------------------

        localStorage.removeItem(
            "ayodejiPendingProfile"
        );


        // -----------------------------------------
        // SHOW SUCCESS
        // -----------------------------------------

        showOrderSuccess(
            orderReference,
            paymentMethod,
            payNow,
            balance
        );


    } catch (error) {

        console.error(
            "Checkout error:",
            error
        );


        showCheckoutMessage(
            getCheckoutErrorMessage(
                error
            ),
            "error"
        );


    } finally {

        checkoutSubmitting =
            false;

        setSubmitLoading(false);

    }

}


// =========================================
// SAVE PROFILE FROM CHECKOUT
// =========================================

async function saveCheckoutProfile(
    profile
) {

    if (!profile?.user_id) {
        return;
    }


    const supabaseClient =
        window.supabaseClient;


    const {
        error
    } =
        await supabaseClient
            .from("customer_profiles")
            .upsert(
                {

                    user_id:
                        profile.user_id,

                    full_name:
                        profile.full_name,

                    phone:
                        profile.phone,

                    delivery_address:
                        profile.delivery_address,

                    delivery_city:
                        profile.delivery_city,

                    delivery_state:
                        profile.delivery_state,

                    updated_at:
                        new Date()
                            .toISOString()

                },
                {
                    onConflict:
                        "user_id"
                }
            );


    if (error) {

        console.warn(
            "Profile could not be updated:",
            error
        );

    }

}


// =========================================
// CALCULATE CART TOTAL
// =========================================

function calculateCartTotal() {

    return checkoutCart.reduce(
        (total, item) => {

            return (
                total +
                (
                    Number(item.price) *
                    Number(item.quantity)
                )
            );

        },
        0
    );

}


// =========================================
// GENERATE ORDER REFERENCE
// =========================================

function generateOrderReference() {

    const now =
        new Date();


    const datePart =
        now.getFullYear().toString() +
        String(
            now.getMonth() + 1
        ).padStart(2, "0") +
        String(
            now.getDate()
        ).padStart(2, "0");


    const randomPart =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return (
        `AFH-${datePart}-${randomPart}`
    );

}


// =========================================
// SHOW ORDER SUCCESS
// =========================================

function showOrderSuccess(
    orderReference,
    paymentMethod,
    payNow,
    balance
) {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    const successSection =
        document.getElementById(
            "orderSuccess"
        );


    const referenceElement =
        document.getElementById(
            "orderReference"
        );


    const successMessage =
        document.getElementById(
            "successMessage"
        );


    if (form) {

        form.style.display =
            "none";

    }


    if (referenceElement) {

        referenceElement.textContent =
            orderReference;

    }


    if (successMessage) {

        if (
            paymentMethod ===
            "OPay Bank Transfer"
        ) {

            if (balance > 0) {

                successMessage.textContent =
                    `Your order has been received. Please transfer ${formatCurrency(payNow)} to our OPay account. Your remaining balance is ${formatCurrency(balance)}.`;

            } else {

                successMessage.textContent =
                    `Your order has been received. Please transfer ${formatCurrency(payNow)} to our OPay account.`;

            }

        } else {

            successMessage.textContent =
                `Your order has been received. You selected Cash on Delivery. Your order reference is ${orderReference}.`;

        }

    }


    if (successSection) {

        successSection.style.display =
            "block";


        successSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// =========================================
// LOGIN REQUIRED
// =========================================

function showLoginRequired() {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    const loginMessage =
        document.getElementById(
            "loginRequiredMessage"
        );


    if (form) {

        form.style.display =
            "none";

    }


    if (loginMessage) {

        loginMessage.style.display =
            "flex";

    }


    // Save checkout destination.
    localStorage.setItem(
        "ayodejiCheckoutReturn",
        "checkout.html"
    );

}


// =========================================
// DISABLE CHECKOUT
// =========================================

function disableCheckoutForm() {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (!form) {
        return;
    }


    const controls =
        form.querySelectorAll(
            "input, textarea, select, button"
        );


    controls.forEach(
        control => {

            control.disabled =
                true;

        }
    );

}


// =========================================
// SET SUBMIT LOADING
// =========================================

function setSubmitLoading(
    isLoading
) {

    const buttons =
        document.querySelectorAll(
            ".place-order-button"
        );


    buttons.forEach(button => {

        button.disabled =
            isLoading;


        const text =
            button.querySelector(
                ".place-order-text"
            );


        const spinner =
            button.querySelector(
                ".place-order-spinner"
            );


        if (text) {

            text.style.display =
                isLoading
                    ? "none"
                    : "inline";

        }


        if (spinner) {

            spinner.style.display =
                isLoading
                    ? "inline"
                    : "none";

        }

    });

}


// =========================================
// SHOW CHECKOUT MESSAGE
// =========================================

function showCheckoutMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "checkoutMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `checkout-message show ${type}`;


    element.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


// =========================================
// GET INPUT VALUE
// =========================================

function getValue(id) {

    const element =
        document.getElementById(id);


    return (
        element?.value?.trim() ||
        ""
    );

}


// =========================================
// FOCUS ELEMENT
// =========================================

function focusElement(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.focus();

    }

}


// =========================================
// PHONE VALIDATION
// =========================================

function isValidPhone(phone) {

    const cleaned =
        phone.replace(
            /[\s\-()]/g,
            ""
        );


    return (
        /^0\d{10}$/.test(cleaned) ||
        /^\+234\d{10}$/.test(cleaned) ||
        /^234\d{10}$/.test(cleaned)
    );

}


// =========================================
// FORMAT CURRENCY
// =========================================

function formatCurrency(
    amount
) {

    const value =
        Number(amount) || 0;


    return (
        "₦" +
        value.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    return String(value ?? "")
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
// CHECKOUT ERROR TRANSLATOR
// =========================================

function getCheckoutErrorMessage(
    error
) {

    const message =
        error?.message || "";


    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "row-level security"
        ) ||
        lower.includes(
            "violates row-level security"
        )
    ) {

        return (
            "Your account is not currently permitted to place this order. Please make sure you are logged in and try again."
        );

    }


    if (
        lower.includes(
            "foreign key"
        )
    ) {

        return (
            "Some product information in your cart is no longer available. Please return to your cart and try again."
        );

    }


    if (
        lower.includes(
            "duplicate"
        ) &&
        lower.includes(
            "order_reference"
        )
    ) {

        return (
            "A duplicate order reference was detected. Please try placing the order again."
        );

    }


    if (
        lower.includes(
            "network"
        ) ||
        lower.includes(
            "fetch"
        )
    ) {

        return (
            "Network error. Please check your internet connection and try again."
        );

    }


    return (
        message ||
        "We could not place your order. Please try again."
    );

}


// =========================================
// EXPORT
// =========================================

window.initializeCheckout =
    initializeCheckout;

window.renderOrderSummary =
    renderOrderSummary;

window.handleCheckoutSubmit =
    handleCheckoutSubmit;