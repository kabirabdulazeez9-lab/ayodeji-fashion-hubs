// =========================================
// AYODEJI FASHION HUBS
// CHECKOUT
// =========================================

let checkoutCart = [];
let checkoutUser = null;
let checkoutProfile = null;
let checkoutTotal = 0;
let checkoutSubmitting = false;


// =========================================
// INITIALIZE
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeCheckout
);


async function initializeCheckout() {

    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        showCheckoutMessage(
            "Checkout service could not be loaded. Please refresh the page.",
            "error"
        );

        return;
    }


    try {

        // -------------------------------------
        // CHECK LOGIN
        // -------------------------------------

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {
            throw error;
        }


        checkoutUser =
            data?.session?.user || null;


        if (!checkoutUser) {

            localStorage.setItem(
                "ayodejiCheckoutReturn",
                "checkout.html"
            );


            showLoginRequired();

            return;
        }


        // -------------------------------------
        // LOAD CART
        // -------------------------------------

        checkoutCart =
            loadCart();


        if (
            !checkoutCart.length
        ) {

            showCheckoutMessage(
                "Your cart is empty. Please add products before checking out.",
                "error"
            );

            disableCheckoutForm();

            return;
        }


        // -------------------------------------
        // LOAD CUSTOMER PROFILE
        // -------------------------------------

        await loadCustomerProfile();


        // -------------------------------------
        // FILL CUSTOMER INFORMATION
        // -------------------------------------

        populateCustomerInformation();


        // -------------------------------------
        // SETUP
        // -------------------------------------

        setupPaymentMethods();

        setupPaymentPlans();

        setupCopyButton();

        setupCheckoutForm();


        // -------------------------------------
        // RENDER SUMMARY
        // -------------------------------------

        renderOrderSummary();

    } catch (error) {

        console.error(
            "Checkout initialization error:",
            error
        );

        showCheckoutMessage(
            getCheckoutErrorMessage(error),
            "error"
        );

    }

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
            return [];
        }


        const cart =
            JSON.parse(savedCart);


        if (!Array.isArray(cart)) {
            return [];
        }


        return cart
            .filter(item => item)
            .map(item => ({

                ...item,

                quantity:
                    Math.max(
                        1,
                        Number(
                            item.quantity
                        ) || 1
                    ),

                price:
                    Number(
                        item.price
                    ) || 0

            }));

    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        return [];

    }

}


// =========================================
// LOAD CUSTOMER PROFILE
// =========================================

async function loadCustomerProfile() {

    if (
        !checkoutUser
    ) {
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
                .from(
                    "customer_profiles"
                )
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

            console.warn(
                "Customer profile could not be loaded:",
                error
            );

            checkoutProfile = null;

            return;
        }


        checkoutProfile =
            data || null;

    } catch (error) {

        console.warn(
            "Customer profile error:",
            error
        );

        checkoutProfile = null;

    }

}


// =========================================
// POPULATE CUSTOMER INFORMATION
// =========================================

function populateCustomerInformation() {

    if (!checkoutUser) {
        return;
    }


    const metadata =
        checkoutUser.user_metadata || {};


    const fullName =
        checkoutProfile?.full_name ||
        metadata.full_name ||
        metadata.name ||
        "";


    const phone =
        checkoutProfile?.phone ||
        metadata.phone ||
        "";


    const email =
        checkoutUser.email ||
        "";


    setValue(
        "customerName",
        fullName
    );


    setValue(
        "customerPhone",
        phone
    );


    setValue(
        "customerEmail",
        email
    );


    setValue(
        "deliveryAddress",
        checkoutProfile?.delivery_address || ""
    );


    setValue(
        "deliveryCity",
        checkoutProfile?.delivery_city || ""
    );


    setValue(
        "deliveryState",
        checkoutProfile?.delivery_state || ""
    );

}


// =========================================
// PAYMENT METHODS
// =========================================

function setupPaymentMethods() {

    const paymentMethods =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    const paymentDetails =
        document.getElementById(
            "paymentDetails"
        );


    if (!paymentMethods.length) {
        return;
    }


    function updatePaymentDetails() {

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


    paymentMethods.forEach(
        radio => {

            radio.addEventListener(
                "change",
                updatePaymentDetails
            );

        }
    );


    updatePaymentDetails();

}


// =========================================
// PAYMENT PLANS
// =========================================

function setupPaymentPlans() {

    const plans =
        document.querySelectorAll(
            'input[name="paymentPlan"]'
        );


    plans.forEach(
        plan => {

            plan.addEventListener(
                "change",
                renderOrderSummary
            );

        }
    );

}


// =========================================
// COPY ACCOUNT NUMBER
// =========================================

function setupCopyButton() {

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


                button.textContent =
                    "Copied!";


                setTimeout(
                    () => {

                        button.textContent =
                            "Copy";

                    },
                    1500
                );

            } catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );

                showCheckoutMessage(
                    "Could not copy the account number. Please copy it manually.",
                    "error"
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


    if (!checkoutCart.length) {

        itemsContainer.innerHTML =
            `
            <div class="empty-checkout-cart">
                Your cart is empty.
            </div>
            `;

        checkoutTotal = 0;

        updatePaymentAmounts();

        return;
    }


    let html = "";


    checkoutCart.forEach(
        item => {

            const quantity =
                Math.max(
                    1,
                    Number(
                        item.quantity
                    ) || 1
                );


            const price =
                Number(
                    item.price
                ) || 0;


            const subtotal =
                price * quantity;


            const productName =
                escapeHTML(
                    item.name ||
                    item.product_name ||
                    "Product"
                );


            const size =
                item.size
                    ? `
                        <span class="checkout-item-size">
                            Size: ${escapeHTML(
                                String(item.size)
                            )}
                        </span>
                      `
                    : "";


            const image =
                item.image ||
                item.product_image ||
                "";


            html += `
                <div class="checkout-item">

                    <div class="checkout-item-image">

                        ${
                            image
                                ? `
                                    <img
                                        src="${escapeHTML(image)}"
                                        alt="${productName}"
                                    >
                                  `
                                : `
                                    <span>
                                        👟
                                    </span>
                                  `
                        }

                    </div>


                    <div class="checkout-item-info">

                        <strong>
                            ${productName}
                        </strong>

                        ${size}

                        <span>
                            Qty: ${quantity}
                        </span>

                    </div>


                    <strong class="checkout-item-price">
                        ${formatCurrency(subtotal)}
                    </strong>

                </div>
            `;

        }
    );


    itemsContainer.innerHTML =
        html;


    checkoutTotal =
        calculateCartTotal();


    updatePaymentAmounts();

}


// =========================================
// CALCULATE CART TOTAL
// =========================================

function calculateCartTotal() {

    return checkoutCart.reduce(
        (
            total,
            item
        ) => {

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


            return (
                total +
                (
                    price *
                    quantity
                )
            );

        },
        0
    );

}


// =========================================
// UPDATE PAYMENT AMOUNTS
// =========================================

function updatePaymentAmounts() {

    const subtotal =
        checkoutTotal;


    const paymentPlan =
        document.querySelector(
            'input[name="paymentPlan"]:checked'
        )?.value ||
        "deposit";


    let payNow =
        0;


    if (
        paymentPlan ===
        "full"
    ) {

        payNow =
            subtotal;

    } else {

        payNow =
            Math.round(
                subtotal * 0.60
            );

    }


    const balance =
        Math.max(
            0,
            subtotal - payNow
        );


    setText(
        "checkoutSubtotal",
        formatCurrency(subtotal)
    );


    setText(
        "checkoutTotal",
        formatCurrency(subtotal)
    );


    setText(
        "payNowAmount",
        formatCurrency(payNow)
    );


    setText(
        "balanceAmount",
        formatCurrency(balance)
    );

}


// =========================================
// HANDLE CHECKOUT
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


    if (!supabaseClient) {

        showCheckoutMessage(
            "Checkout service is unavailable. Please refresh the page.",
            "error"
        );

        return;
    }


    checkoutSubmitting =
        true;


    setSubmitLoading(true);

    clearCheckoutMessage();


    try {

        // -------------------------------------
        // CHECK SESSION AGAIN
        // -------------------------------------

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            sessionError
        ) {

            throw sessionError;
        }


        const session =
            sessionData?.session;


        if (!session?.user) {

            localStorage.setItem(
                "ayodejiCheckoutReturn",
                "checkout.html"
            );


            showLoginRequired();

            return;

        }


        checkoutUser =
            session.user;


        // -------------------------------------
        // CHECK CART
        // -------------------------------------

        checkoutCart =
            loadCart();


        if (!checkoutCart.length) {

            throw new Error(
                "Your cart is empty."
            );

        }


        // -------------------------------------
        // GET FORM VALUES
        // -------------------------------------

        const customerName =
            getValue(
                "customerName"
            );


        const customerPhone =
            getValue(
                "customerPhone"
            );


        const customerEmail =
            getValue(
                "customerEmail"
            );


        const deliveryAddress =
            getValue(
                "deliveryAddress"
            );


        const deliveryCity =
            getValue(
                "deliveryCity"
            );


        const deliveryState =
            getValue(
                "deliveryState"
            );


        const paymentMethod =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            )?.value ||
            "";


        const paymentPlan =
            document.querySelector(
                'input[name="paymentPlan"]:checked'
            )?.value ||
            "deposit";


        const orderNote =
            getValue(
                "orderNote"
            );


        // -------------------------------------
        // VALIDATION
        // -------------------------------------

        if (!customerName) {

            focusElement(
                "customerName"
            );

            throw new Error(
                "Please enter your full name."
            );

        }


        if (
            !customerPhone ||
            !isValidPhone(customerPhone)
        ) {

            focusElement(
                "customerPhone"
            );

            throw new Error(
                "Please enter a valid Nigerian phone number."
            );

        }


        if (!customerEmail) {

            throw new Error(
                "Your account email could not be found. Please log in again."
            );

        }


        if (!deliveryAddress) {

            focusElement(
                "deliveryAddress"
            );

            throw new Error(
                "Please enter your delivery address."
            );

        }


        if (!deliveryCity) {

            focusElement(
                "deliveryCity"
            );

            throw new Error(
                "Please enter your delivery city."
            );

        }


        if (!deliveryState) {

            focusElement(
                "deliveryState"
            );

            throw new Error(
                "Please enter your delivery state."
            );

        }


        if (!paymentMethod) {

            throw new Error(
                "Please select a payment method."
            );

        }


        // -------------------------------------
        // CALCULATE TOTAL
        // -------------------------------------

        const subtotal =
            calculateCartTotal();


        if (
            subtotal <= 0
        ) {

            throw new Error(
                "Your order total is invalid."
            );

        }


        const payNow =
            paymentPlan === "full"
                ? subtotal
                : Math.round(
                    subtotal * 0.60
                );


        const balance =
            Math.max(
                0,
                subtotal - payNow
            );


        // -------------------------------------
        // ORDER REFERENCE
        // -------------------------------------

        const orderReference =
            generateOrderReference();


        // -------------------------------------
        // ORDER STATUS
        // -------------------------------------

        const orderStatus =
            paymentMethod ===
            "Cash on Delivery"
                ? "Processing"
                : "Pending Payment";


        const paymentStatus =
            paymentMethod ===
            "Cash on Delivery"
                ? "Cash on Delivery"
                : "Pending";


        // -------------------------------------
        // CREATE ORDER
        // -------------------------------------

        const {
            data: order,
            error: orderError
        } =
            await supabaseClient
                .from("orders")
                .insert({

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

                })
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
                "The order could not be created."
            );

        }


        // -------------------------------------
        // CREATE ORDER ITEMS
        // -------------------------------------

        const orderItems =
    checkoutCart.map(
        item => {

            const price =
                Number(item.price) || 0;

            const quantity =
                Math.max(
                    1,
                    Number(item.quantity) || 1
                );

            return {

                order_id:
                    order.id,

                product_id:
                    item.product_id ||
                    item.productId ||
                    item.id ||
                    null,

                product_name:
                    item.name ||
                    item.product_name ||
                    "Product",

                price:
                    price,

                quantity:
                    quantity,

                size:
                    item.size ||
                    null,

                category:
                    item.category ||
                    null,

                image:
                    item.image ||
                    null,

                icon:
                    item.icon ||
                    null
            };
        }
    );


const {
    error: itemsError
} =
    await supabaseClient
        .from("order_items")
        .insert(orderItems);


if (itemsError) {

    console.error(
        "Order items error:",
        itemsError
    );

    throw itemsError;

}


        // -------------------------------------
        // SAVE CUSTOMER PROFILE
        // -------------------------------------

        try {

            await supabaseClient
                .from("customer_profiles")
                .upsert(
                    {

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
                            deliveryState,

                        updated_at:
                            new Date()
                                .toISOString()

                    },
                    {
                        onConflict:
                            "user_id"
                    }
                );

        } catch (profileError) {

            console.warn(
                "Profile update failed:",
                profileError
            );

        }


        // -------------------------------------
        // CLEAR CART
        // -------------------------------------

        localStorage.removeItem(
            "ayodejiCart"
        );


        localStorage.removeItem(
            "ayodejiPendingProfile"
        );


        localStorage.removeItem(
            "ayodejiCheckoutReturn"
        );


        // -------------------------------------
        // SHOW SUCCESS
        // -------------------------------------

        showOrderSuccess(
            orderReference,
            paymentMethod,
            paymentPlan,
            payNow,
            balance
        );


    } catch (error) {

        console.error(
            "Checkout submission error:",
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


        setSubmitLoading(
            false
        );

    }

}


// =========================================
// GENERATE ORDER REFERENCE
// =========================================

function generateOrderReference() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const random =
        Math.floor(
            1000 +
            Math.random() *
            9000
        );


    return (
        `AFH-${year}${month}${day}-${random}`
    );

}


// =========================================
// SHOW SUCCESS
// =========================================

function showOrderSuccess(
    reference,
    paymentMethod,
    paymentPlan,
    payNow,
    balance
) {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    const success =
        document.getElementById(
            "orderSuccess"
        );


    const successMessage =
        document.getElementById(
            "successMessage"
        );


    const referenceElement =
        document.getElementById(
            "orderReference"
        );


    if (form) {

        form.style.display =
            "none";

    }


    const loginRequired =
        document.getElementById(
            "loginRequiredMessage"
        );


    if (loginRequired) {

        loginRequired.style.display =
            "none";

    }


    if (referenceElement) {

        referenceElement.textContent =
            reference;

    }


    if (successMessage) {

        if (
            paymentMethod ===
            "OPay Bank Transfer"
        ) {

            successMessage.textContent =
                paymentPlan === "deposit"
                    ? `Your order has been received. Please transfer ${formatCurrency(payNow)} to our OPay account. Your remaining balance is ${formatCurrency(balance)}.`
                    : `Your order has been received. Please transfer ${formatCurrency(payNow)} to our OPay account.`;

        } else {

            successMessage.textContent =
                "Your order has been received. Please prepare your payment for delivery.";

        }

    }


    if (success) {

        success.style.display =
            "block";

        success.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// =========================================
// LOGIN REQUIRED
// =========================================

function showLoginRequired() {

    const message =
        document.getElementById(
            "loginRequiredMessage"
        );


    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (form) {

        form.style.display =
            "none";

    }


    if (message) {

        message.style.display =
            "flex";

        message.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

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


    form
        .querySelectorAll(
            "input, textarea, button"
        )
        .forEach(
            element => {

                element.disabled =
                    true;

            }
        );

}


// =========================================
// SUBMIT LOADING
// =========================================

function setSubmitLoading(
    loading
) {

    const button =
        document.getElementById(
            "placeOrderButton"
        );


    const buttonText =
        document.getElementById(
            "placeOrderButtonText"
        );


    const spinner =
        document.getElementById(
            "placeOrderSpinner"
        );


    if (button) {

        button.disabled =
            loading;

    }


    if (buttonText) {

        buttonText.style.display =
            loading
                ? "none"
                : "inline";

    }


    if (spinner) {

        spinner.style.display =
            loading
                ? "inline"
                : "none";

    }

}


// =========================================
// MESSAGE
// =========================================

function showCheckoutMessage(
    message,
    type
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


function clearCheckoutMessage() {

    const element =
        document.getElementById(
            "checkoutMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "checkout-message";

}


// =========================================
// HELPERS
// =========================================

function getValue(
    id
) {

    return (
        document.getElementById(id)
            ?.value
            ?.trim() ||
        ""
    );

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value || "";

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
            value;

    }

}


function focusElement(
    id
) {

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
    if (!phone) return false;

    const cleaned = phone
        .trim()
        .replace(/[\s\-()]/g, "");

    // Nigerian local format
    // Examples: 08012345678, 08123456789, 09012345678
    const localFormat = /^0[789][01]\d{8}$/;

    // Nigerian international format
    // Examples: +2348012345678
    const internationalFormat = /^\+234[789][01]\d{8}$/;

    return (
        localFormat.test(cleaned) ||
        internationalFormat.test(cleaned)
    );
}


// =========================================
// CURRENCY
// =========================================

function formatCurrency(
    amount
) {

    return (
        "₦" +
        Number(
            amount || 0
        ).toLocaleString(
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


// =========================================
// ERROR TRANSLATOR
// =========================================

function getCheckoutErrorMessage(
    error
) {

    const message =
        error?.message ||
        "";


    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "row-level security"
        )
    ) {

        return (
            "Your account is not currently allowed to place this order. Please make sure you are logged in and try again."
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
            "There was a problem generating your order reference. Please try again."
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


    if (
        lower.includes(
            "empty"
        ) &&
        lower.includes(
            "cart"
        )
    ) {

        return (
            "Your cart is empty. Please add a product before checking out."
        );

    }


    return (
        message ||
        "We could not complete your order. Please try again."
    );

}


// =========================================
// EXPORTS
// =========================================

window.initializeCheckout =
    initializeCheckout;

window.renderOrderSummary =
    renderOrderSummary;

window.handleCheckoutSubmit =
    handleCheckoutSubmit;