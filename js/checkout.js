// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER CHECKOUT
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeCheckout
);


// =========================================
// GLOBAL VARIABLES
// =========================================

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;
let cart = [];

const CART_KEY = "ayodejiCart";


// =========================================
// INITIALIZE CHECKOUT
// =========================================

async function initializeCheckout() {

    console.log(
        "Ayodeji Fashion Hubs checkout starting..."
    );

    supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        showCheckoutMessage(
            "The checkout system could not connect. Please refresh the page.",
            "error"
        );

        return;
    }


    /*
        FIRST:
        Make sure the customer is logged in.
    */

    const authenticated =
        await requireCustomerLogin();

    if (!authenticated) {
        return;
    }


    /*
        Load cart.
    */

    loadCart();


    if (!cart.length) {

        showCheckoutMessage(
            "Your cart is empty. Please add a product before checkout.",
            "error"
        );

        setTimeout(
            () => {
                window.location.href =
                    "shop.html";
            },
            1500
        );

        return;
    }


    /*
        Load customer profile.
    */

    await loadCustomerProfile();


    /*
        Setup checkout.
    */

    setupCheckoutForm();

    setupPaymentPlan();

    setupPaymentMethod();

    setupOrderSummary();

    setupDeliveryFields();

    updateCheckoutTotals();

    updateYear();

    console.log(
        "Checkout initialized successfully."
    );
}


// =========================================
// REQUIRE CUSTOMER LOGIN
// =========================================

async function requireCustomerLogin() {

    if (!supabaseClient) {

        return false;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            showCheckoutMessage(
                "Unable to verify your account. Please try again.",
                "error"
            );

            return false;
        }


        /*
            No authenticated session.
        */

        if (!data?.session) {

            console.log(
                "Customer is not logged in."
            );


            /*
                Save checkout destination.
                This allows login/register to
                return the customer here.
            */

            localStorage.setItem(
                "ayodejiCheckoutReturn",
                "checkout.html"
            );


            showCheckoutMessage(
                "Please log in or create an account before placing an order.",
                "error"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "login.html?redirect=checkout.html";

                },
                900
            );


            return false;
        }


        currentUser =
            data.session.user;


        console.log(
            "Authenticated customer:",
            currentUser.email
        );


        return true;

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showCheckoutMessage(
            "Unable to verify your account. Please try again.",
            "error"
        );

        return false;
    }
}


// =========================================
// LOAD CART
// =========================================

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem(
                CART_KEY
            );


        if (!savedCart) {

            cart = [];

            return;
        }


        const parsed =
            JSON.parse(savedCart);


        if (Array.isArray(parsed)) {

            cart = parsed;

        } else {

            cart = [];

        }


        console.log(
            "Cart loaded:",
            cart
        );

    } catch (error) {

        console.error(
            "Unable to load cart:",
            error
        );

        cart = [];
    }
}


// =========================================
// SAVE CART
// =========================================

function saveCart() {

    try {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Unable to save cart:",
            error
        );
    }
}


// =========================================
// LOAD CUSTOMER PROFILE
// =========================================

async function loadCustomerProfile() {

    if (!currentUser) {
        return;
    }


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
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Profile loading error:",
                error
            );

            return;
        }


        currentProfile =
            data || null;


        if (currentProfile) {

            fillProfileFields(
                currentProfile
            );
        }


    } catch (error) {

        console.error(
            "Unexpected profile error:",
            error
        );
    }
}


// =========================================
// FILL PROFILE FIELDS
// =========================================

function fillProfileFields(profile) {

    setFieldValue(
        [
            "customerName",
            "fullName",
            "full_name"
        ],
        profile.full_name
    );


    setFieldValue(
        [
            "customerPhone",
            "phone"
        ],
        profile.phone
    );


    setFieldValue(
        [
            "deliveryAddress",
            "address",
            "delivery_address"
        ],
        profile.delivery_address
    );


    setFieldValue(
        [
            "deliveryCity",
            "city",
            "delivery_city"
        ],
        profile.delivery_city
    );


    setFieldValue(
        [
            "deliveryState",
            "state",
            "delivery_state"
        ],
        profile.delivery_state
    );


    setFieldValue(
        [
            "customerEmail",
            "email"
        ],
        currentUser?.email || ""
    );
}


// =========================================
// SET FIELD VALUE
// =========================================

function setFieldValue(ids, value) {

    if (!Array.isArray(ids)) {
        return;
    }


    for (const id of ids) {

        const element =
            document.getElementById(id);


        if (element) {

            if (
                element.tagName === "INPUT" ||
                element.tagName === "TEXTAREA" ||
                element.tagName === "SELECT"
            ) {

                element.value =
                    value || "";

            }

            return;
        }
    }
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

        console.warn(
            "checkoutForm not found."
        );

        return;
    }


    form.addEventListener(
        "submit",
        handleOrderSubmission
    );
}


// =========================================
// PAYMENT PLAN
// =========================================

function setupPaymentPlan() {

    const options =
        document.querySelectorAll(
            'input[name="paymentPlan"]'
        );


    options.forEach(
        option => {

            option.addEventListener(
                "change",
                updateCheckoutTotals
            );

        }
    );
}


// =========================================
// PAYMENT METHOD
// =========================================

function setupPaymentMethod() {

    const options =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    options.forEach(
        option => {

            option.addEventListener(
                "change",
                handlePaymentMethodChange
            );

        }
    );


    handlePaymentMethodChange();
}


// =========================================
// PAYMENT METHOD CHANGE
// =========================================

function handlePaymentMethodChange() {

    const selected =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    const opayDetails =
        document.getElementById(
            "opayDetails"
        );


    if (!selected) {
        return;
    }


    const method =
        selected.value.toLowerCase();


    if (opayDetails) {

        if (
            method.includes("opay") ||
            method.includes("bank")
        ) {

            opayDetails.hidden = false;

        } else {

            opayDetails.hidden = true;

        }
    }
}


// =========================================
// ORDER SUMMARY
// =========================================

function setupOrderSummary() {

    /*
        Some checkout layouts use:
        #checkoutItems
        while others use:
        #orderItems

        Support both.
    */

    renderCheckoutItems();
}


// =========================================
// RENDER CHECKOUT ITEMS
// =========================================

function renderCheckoutItems() {

    const container =
        document.getElementById(
            "checkoutItems"
        ) ||
        document.getElementById(
            "orderItems"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!cart.length) {

        container.innerHTML = `
            <div class="empty-checkout">
                Your cart is empty.
            </div>
        `;

        return;
    }


    cart.forEach(
        item => {

            const quantity =
                Number(
                    item.quantity || 1
                );


            const price =
                Number(
                    item.price || 0
                );


            const total =
                price * quantity;


            const itemElement =
                document.createElement(
                    "div"
                );


            itemElement.className =
                "checkout-item";


            itemElement.innerHTML = `

                <div class="checkout-item-image">

                    ${
                        item.image
                            ? `
                                <img
                                    src="${escapeHtml(item.image)}"
                                    alt="${escapeHtml(item.name || "Product")}"
                                >
                              `
                            : `
                                <span>
                                    ${escapeHtml(item.icon || "👟")}
                                </span>
                              `
                    }

                </div>


                <div class="checkout-item-info">

                    <h4>
                        ${escapeHtml(item.name || "Product")}
                    </h4>

                    ${
                        item.size
                            ? `
                                <small>
                                    Size: ${escapeHtml(item.size)}
                                </small>
                              `
                            : ""
                    }

                    <small>
                        Quantity: ${quantity}
                    </small>

                </div>


                <div class="checkout-item-price">

                    ₦${formatMoney(total)}

                </div>

            `;


            container.appendChild(
                itemElement
            );

        }
    );
}


// =========================================
// CHECKOUT TOTALS
// =========================================

function calculateSubtotal() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            const price =
                Number(
                    item.price || 0
                );

            const quantity =
                Number(
                    item.quantity || 1
                );

            return total +
                (
                    price *
                    quantity
                );

        },
        0
    );
}


// =========================================
// UPDATE TOTALS
// =========================================

function updateCheckoutTotals() {

    const subtotal =
        calculateSubtotal();


    /*
        Delivery fee.
        If your checkout has a delivery
        fee input/element, use it.
    */

    const deliveryFee =
        getDeliveryFee();


    const total =
        subtotal +
        deliveryFee;


    const paymentPlan =
        document.querySelector(
            'input[name="paymentPlan"]:checked'
        );


    let payNow =
        total;


    let balance =
        0;


    if (
        paymentPlan &&
        (
            paymentPlan.value === "60" ||
            paymentPlan.value === "60_percent" ||
            paymentPlan.value === "deposit"
        )
    ) {

        payNow =
            total * 0.60;

        balance =
            total - payNow;

    } else {

        payNow =
            total;

        balance =
            0;
    }


    setMoney(
        [
            "subtotal",
            "subtotalAmount",
            "checkoutSubtotal"
        ],
        subtotal
    );


    setMoney(
        [
            "deliveryFee",
            "deliveryAmount",
            "checkoutDelivery"
        ],
        deliveryFee
    );


    setMoney(
        [
            "total",
            "totalAmount",
            "checkoutTotal"
        ],
        total
    );


    setMoney(
        [
            "payNow",
            "payNowAmount",
            "checkoutPayNow"
        ],
        payNow
    );


    setMoney(
        [
            "balance",
            "balanceAmount",
            "checkoutBalance"
        ],
        balance
    );


    renderCheckoutItems();
}


// =========================================
// DELIVERY FEE
// =========================================

function getDeliveryFee() {

    /*
        If the checkout already has a
        delivery fee value, use it.
    */

    const element =
        document.getElementById(
            "deliveryFee"
        );


    if (
        element &&
        (
            element.tagName === "INPUT" ||
            element.tagName === "SELECT"
        )
    ) {

        const value =
            Number(
                element.value || 0
            );

        return isNaN(value)
            ? 0
            : value;
    }


    /*
        Otherwise default to zero.
    */

    return 0;
}


// =========================================
// SET MONEY
// =========================================

function setMoney(ids, amount) {

    if (!Array.isArray(ids)) {
        return;
    }


    ids.forEach(
        id => {

            const element =
                document.getElementById(id);


            if (element) {

                /*
                    Do not overwrite an input
                    used for delivery fee.
                */

                if (
                    element.tagName === "INPUT" &&
                    id === "deliveryFee"
                ) {
                    return;
                }


                element.textContent =
                    `₦${formatMoney(amount)}`;
            }

        }
    );
}


// =========================================
// DELIVERY FIELDS
// =========================================

function setupDeliveryFields() {

    const fields =
        document.querySelectorAll(
            "input, textarea, select"
        );


    fields.forEach(
        field => {

            field.addEventListener(
                "input",
                function () {

                    if (
                        field.id ===
                        "deliveryCity"
                    ) {

                        updateCheckoutTotals();

                    }

                }
            );

        }
    );
}


// =========================================
// SUBMIT ORDER
// =========================================

async function handleOrderSubmission(event) {

    event.preventDefault();


    /*
        SECURITY CHECK #1
        Check login again at the exact
        moment the order is submitted.
    */

    const authenticated =
        await verifyAuthenticatedUser();


    if (!authenticated) {

        return;
    }


    /*
        SECURITY CHECK #2
        Make sure cart isn't empty.
    */

    loadCart();


    if (!cart.length) {

        showCheckoutMessage(
            "Your cart is empty.",
            "error"
        );

        return;
    }


    /*
        Disable button.
    */

    setCheckoutLoading(true);


    try {

        /*
            Collect customer details.
        */

        const customer =
            getCustomerDetails();


        if (!validateCustomerDetails(customer)) {

            setCheckoutLoading(false);

            return;
        }


        /*
            Calculate totals.
        */

        const subtotal =
            calculateSubtotal();


        const deliveryFee =
            getDeliveryFee();


        const total =
            subtotal +
            deliveryFee;


        const paymentPlan =
            getPaymentPlan();


        const paymentMethod =
            getPaymentMethod();


        let payNow =
            total;


        let balance =
            0;


        if (
            paymentPlan === "60" ||
            paymentPlan === "60_percent" ||
            paymentPlan === "deposit"
        ) {

            payNow =
                total * 0.60;

            balance =
                total - payNow;

        }


        /*
            Generate order reference.
        */

        const orderReference =
            generateOrderReference();


        /*
            Prepare order.
        */

        const orderData = {

            order_reference:
                orderReference,

            user_id:
                currentUser.id,

            customer_name:
                customer.name,

            customer_email:
                customer.email,

            customer_phone:
                customer.phone,

            delivery_address:
                customer.address,

            delivery_city:
                customer.city,

            delivery_state:
                customer.state,

            payment_method:
                paymentMethod,

            payment_plan:
                paymentPlan,

            subtotal:
                subtotal,

            delivery_fee:
                deliveryFee,

            total:
                total,

            pay_now:
                payNow,

            balance:
                balance,

            status:
                "Pending Payment",

            payment_status:
                "Pending",

            notes:
                getNotes()

        };


        console.log(
            "Creating order:",
            orderData
        );


        /*
            INSERT ORDER
        */

        const {
            data: order,
            error: orderError
        } =
            await supabaseClient
                .from("orders")
                .insert(
                    orderData
                )
                .select()
                .single();


        if (orderError) {

            console.error(
                "Order creation error:",
                orderError
            );


            /*
                If RLS rejects the order,
                tell the customer to log in again.
            */

            if (
                String(
                    orderError.message || ""
                )
                .toLowerCase()
                .includes("row-level security")
            ) {

                showCheckoutMessage(
                    "Your account session has expired. Please log in again.",
                    "error"
                );

            } else {

                showCheckoutMessage(
                    orderError.message ||
                    "Unable to create your order. Please try again.",
                    "error"
                );
            }


            return;
        }


        if (!order) {

            showCheckoutMessage(
                "The order could not be created. Please try again.",
                "error"
            );

            return;
        }


        /*
            INSERT ORDER ITEMS
        */

        const orderId =
            order.id;


        const orderItems =
            cart.map(
                item => ({

                    order_id:
                        orderId,

                    product_id:
                        item.id ||
                        item.product_id ||
                        null,

                    product_name:
                        item.name ||
                        "Product",

                    product_price:
                        Number(
                            item.price || 0
                        ),

                    quantity:
                        Number(
                            item.quantity || 1
                        ),

                    size:
                        item.size ||
                        null,

                    subtotal:
                        Number(
                            item.price || 0
                        ) *
                        Number(
                            item.quantity || 1
                        )

                })
            );


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


            /*
                We don't delete the order here
                because the order may already exist.
            */

            showCheckoutMessage(
                "Your order was created, but the product details could not be saved. Please contact us.",
                "error"
            );

            return;
        }


        /*
            ORDER CREATED SUCCESSFULLY
        */

        console.log(
            "Order created successfully:",
            orderReference
        );


        /*
            Clear cart.
        */

        cart = [];

        saveCart();


        /*
            Show success page.
        */

        showOrderSuccess(
            orderReference,
            total,
            payNow,
            balance,
            paymentMethod
        );


    } catch (error) {

        console.error(
            "Unexpected checkout error:",
            error
        );


        showCheckoutMessage(
            "Something went wrong while placing your order. Please try again.",
            "error"
        );

    } finally {

        setCheckoutLoading(false);
    }
}


// =========================================
// VERIFY AUTHENTICATED USER
// =========================================

async function verifyAuthenticatedUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (
            error ||
            !data?.session
        ) {

            localStorage.setItem(
                "ayodejiCheckoutReturn",
                "checkout.html"
            );


            showCheckoutMessage(
                "Please log in or create an account before placing an order.",
                "error"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "login.html?redirect=checkout.html";

                },
                800
            );


            return false;
        }


        currentUser =
            data.session.user;


        return true;

    } catch (error) {

        console.error(
            "Session verification error:",
            error
        );

        showCheckoutMessage(
            "Unable to verify your account. Please log in again.",
            "error"
        );

        return false;
    }
}


// =========================================
// CUSTOMER DETAILS
// =========================================

function getCustomerDetails() {

    return {

        name:
            getInputValue([
                "customerName",
                "fullName",
                "full_name"
            ]),

        email:
            getInputValue([
                "customerEmail",
                "email"
            ]) ||
            currentUser?.email ||
            "",

        phone:
            getInputValue([
                "customerPhone",
                "phone"
            ]),

        address:
            getInputValue([
                "deliveryAddress",
                "address",
                "delivery_address"
            ]),

        city:
            getInputValue([
                "deliveryCity",
                "city",
                "delivery_city"
            ]),

        state:
            getInputValue([
                "deliveryState",
                "state",
                "delivery_state"
            ])
    };
}


// =========================================
// VALIDATE CUSTOMER
// =========================================

function validateCustomerDetails(customer) {

    if (!customer.name) {

        showCheckoutMessage(
            "Please enter your full name.",
            "error"
        );

        focusFirstExisting([
            "customerName",
            "fullName",
            "full_name"
        ]);

        return false;
    }


    if (!customer.phone) {

        showCheckoutMessage(
            "Please enter your phone number.",
            "error"
        );

        focusFirstExisting([
            "customerPhone",
            "phone"
        ]);

        return false;
    }


    if (!customer.address) {

        showCheckoutMessage(
            "Please enter your delivery address.",
            "error"
        );

        focusFirstExisting([
            "deliveryAddress",
            "address",
            "delivery_address"
        ]);

        return false;
    }


    if (!customer.city) {

        showCheckoutMessage(
            "Please enter your delivery city.",
            "error"
        );

        focusFirstExisting([
            "deliveryCity",
            "city"
        ]);

        return false;
    }


    if (!customer.state) {

        showCheckoutMessage(
            "Please enter your delivery state.",
            "error"
        );

        focusFirstExisting([
            "deliveryState",
            "state"
        ]);

        return false;
    }


    return true;
}


// =========================================
// GET PAYMENT PLAN
// =========================================

function getPaymentPlan() {

    const selected =
        document.querySelector(
            'input[name="paymentPlan"]:checked'
        );


    if (!selected) {

        return "100";
    }


    return selected.value;
}


// =========================================
// GET PAYMENT METHOD
// =========================================

function getPaymentMethod() {

    const selected =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    if (!selected) {

        return "";
    }


    return selected.value;
}


// =========================================
// GET NOTES
// =========================================

function getNotes() {

    return getInputValue([
        "orderNotes",
        "notes",
        "customerNotes"
    ]);
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
        )
        .padStart(2, "0");


    const day =
        String(
            now.getDate()
        )
        .padStart(2, "0");


    const random =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();


    return `AFH-${year}${month}${day}-${random}`;
}


// =========================================
// SUCCESS SCREEN
// =========================================

function showOrderSuccess(
    orderReference,
    total,
    payNow,
    balance,
    paymentMethod
) {

    const container =
        document.querySelector(
            ".checkout-container"
        ) ||
        document.querySelector(
            "main"
        );


    if (!container) {
        return;
    }


    const trackingUrl =
        `track-order.html?order=${encodeURIComponent(orderReference)}`;


    container.innerHTML = `

        <section class="order-success">

            <div class="success-icon">
                ✓
            </div>


            <span class="success-label">
                ORDER RECEIVED
            </span>


            <h1>
                Thank you for your order!
            </h1>


            <p>
                Your order has been received
                successfully.
            </p>


            <div class="order-reference">

                <span>
                    ORDER REFERENCE
                </span>

                <strong>
                    ${escapeHtml(orderReference)}
                </strong>

            </div>


            <div class="success-summary">

                <div>
                    <span>
                        Order Total
                    </span>

                    <strong>
                        ₦${formatMoney(total)}
                    </strong>
                </div>


                <div>
                    <span>
                        Pay Now
                    </span>

                    <strong>
                        ₦${formatMoney(payNow)}
                    </strong>
                </div>


                ${
                    balance > 0
                        ? `
                            <div>
                                <span>
                                    Balance
                                </span>

                                <strong>
                                    ₦${formatMoney(balance)}
                                </strong>
                            </div>
                          `
                        : ""
                }

            </div>


            ${
                paymentMethod &&
                (
                    paymentMethod
                        .toLowerCase()
                        .includes("opay") ||
                    paymentMethod
                        .toLowerCase()
                        .includes("bank")
                )
                    ? `
                        <div class="payment-instructions">

                            <h3>
                                OPay Bank Transfer
                            </h3>

                            <p>
                                Transfer your payment to:
                            </p>

                            <p>
                                <strong>
                                    Bank:
                                </strong>
                                OPay
                            </p>

                            <p>
                                <strong>
                                    Account Name:
                                </strong>
                                Kabir Abdulazeez
                            </p>

                            <p>
                                <strong>
                                    Account Number:
                                </strong>
                                07019154961
                            </p>

                            <p>
                                <strong>
                                    Amount:
                                </strong>
                                ₦${formatMoney(payNow)}
                            </p>

                        </div>
                      `
                    : ""
            }


            <div class="success-actions">

                <a
                    href="${trackingUrl}"
                    class="primary-button"
                >
                    Track My Order
                </a>


                <a
                    href="shop.html"
                    class="secondary-button"
                >
                    Continue Shopping
                </a>

            </div>

        </section>

    `;
}


// =========================================
// CHECKOUT MESSAGE
// =========================================

function showCheckoutMessage(
    message,
    type = "error"
) {

    const possibleIds = [
        "checkoutMessage",
        "orderMessage",
        "formMessage"
    ];


    let element = null;


    for (const id of possibleIds) {

        element =
            document.getElementById(id);


        if (element) {
            break;
        }
    }


    /*
        If the checkout doesn't have a
        message element, create one.
    */

    if (!element) {

        element =
            document.createElement("div");

        element.id =
            "checkoutMessage";

        element.className =
            "checkout-message";


        const form =
            document.getElementById(
                "checkoutForm"
            );


        if (form) {

            form.prepend(
                element
            );

        } else {

            document.body.prepend(
                element
            );
        }
    }


    element.textContent =
        message;


    element.className =
        `checkout-message show ${type}`;


    element.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// =========================================
// CHECKOUT LOADING
// =========================================

function setCheckoutLoading(
    loading
) {

    const possibleButtons = [
        "placeOrderButton",
        "submitOrderButton",
        "checkoutButton",
        "placeOrder"
    ];


    let button = null;


    for (
        const id of possibleButtons
    ) {

        button =
            document.getElementById(id);


        if (button) {
            break;
        }
    }


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    if (!button.dataset.originalText) {

        button.dataset.originalText =
            button.textContent.trim();
    }


    button.textContent =
        loading
            ? "PLACING ORDER..."
            : button.dataset.originalText;
}


// =========================================
// GET INPUT VALUE
// =========================================

function getInputValue(ids) {

    if (!Array.isArray(ids)) {
        return "";
    }


    for (const id of ids) {

        const element =
            document.getElementById(id);


        if (element) {

            return String(
                element.value || ""
            ).trim();
        }
    }


    return "";
}


// =========================================
// FOCUS FIRST EXISTING
// =========================================

function focusFirstExisting(ids) {

    if (!Array.isArray(ids)) {
        return;
    }


    for (const id of ids) {

        const element =
            document.getElementById(id);


        if (element) {

            element.focus();

            return;
        }
    }
}


// =========================================
// FORMAT MONEY
// =========================================

function formatMoney(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

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
// YEAR
// =========================================

function updateYear() {

    const year =
        document.getElementById(
            "currentYear"
        );


    if (year) {

        year.textContent =
            new Date().getFullYear();
    }
}