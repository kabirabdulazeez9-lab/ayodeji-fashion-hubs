// =========================================
// AYODEJI FASHION HUBS
// CHECKOUT - SUPABASE + LIVE STOCK CHECK
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    // =========================================
    // CONFIG
    // =========================================

    const CART_KEY = "ayodejiCart";

    const PAYMENT_METHOD_KEY =
        "ayodejiPaymentMethod";

    const supabaseClient =
        window.supabaseClient;

    // =========================================
    // CHECK SUPABASE
    // =========================================

    if (!supabaseClient) {

        console.error(
            "Supabase client is not available."
        );

        alert(
            "Unable to connect to the order system. Please refresh the page and try again."
        );

        return;
    }

    // =========================================
    // ELEMENTS
    // =========================================

    const checkoutForm =
        document.getElementById(
            "checkoutForm"
        );

    const customerName =
        document.getElementById(
            "customerName"
        );

    const customerPhone =
        document.getElementById(
            "customerPhone"
        );

    const customerEmail =
        document.getElementById(
            "customerEmail"
        );

    const deliveryAddress =
        document.getElementById(
            "deliveryAddress"
        );

    const deliveryCity =
        document.getElementById(
            "deliveryCity"
        );

    const deliveryState =
        document.getElementById(
            "deliveryState"
        );

    const orderNote =
        document.getElementById(
            "orderNote"
        );

    const bankTransfer =
        document.getElementById(
            "bankTransfer"
        );

    const cashOnDelivery =
        document.getElementById(
            "cashOnDelivery"
        );

    const depositPlan =
        document.getElementById(
            "depositPlan"
        );

    const fullPlan =
        document.getElementById(
            "fullPlan"
        );

    const orderItems =
        document.getElementById(
            "orderItems"
        );

    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );

    const payNowElement =
        document.getElementById(
            "payNowAmount"
        );

    const balanceElement =
        document.getElementById(
            "balanceAmount"
        );

    const paymentDetails =
        document.getElementById(
            "paymentDetails"
        );

    const copyAccountButton =
        document.getElementById(
            "copyAccountNumber"
        );

    const accountNumberElement =
        document.getElementById(
            "accountNumber"
        );

    const orderSuccess =
        document.getElementById(
            "orderSuccess"
        );

    const orderReferenceElement =
        document.getElementById(
            "orderReference"
        );

    const successMessage =
        document.getElementById(
            "successMessage"
        );

    // =========================================
    // GET CART
    // =========================================

    function getCart() {

        try {

            const savedCart =
                localStorage.getItem(
                    CART_KEY
                );

            if (!savedCart) {
                return [];
            }

            const parsed =
                JSON.parse(savedCart);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Cart loading error:",
                error
            );

            return [];
        }
    }

    let cart = getCart();

    // =========================================
    // EMPTY CART
    // =========================================

    if (cart.length === 0) {

        if (checkoutForm) {

            checkoutForm.style.display =
                "none";
        }

        alert(
            "Your cart is empty."
        );

        window.location.href =
            "shop.html";

        return;
    }

    // =========================================
    // FORMAT MONEY
    // =========================================

    function formatMoney(amount) {

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
    // CALCULATE SUBTOTAL
    // =========================================

    function calculateSubtotal() {

        return cart.reduce(
            (total, item) => {

                const price =
                    Number(item.price) || 0;

                const quantity =
                    Number(item.quantity) || 0;

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
    // PAYMENT PLAN
    // =========================================

    function getPaymentPlan() {

        if (
            depositPlan &&
            depositPlan.checked
        ) {

            return "deposit";
        }

        return "full";
    }

    // =========================================
    // PAYMENT METHOD
    // =========================================

    function getPaymentMethod() {

        if (
            cashOnDelivery &&
            cashOnDelivery.checked
        ) {

            return "Cash on Delivery";
        }

        return "Bank Transfer";
    }

    // =========================================
    // PAYMENT CALCULATION
    // =========================================

    function calculatePayment() {

        const subtotal =
            calculateSubtotal();

        const plan =
            getPaymentPlan();

        let payNow =
            subtotal;

        let balance =
            0;

        if (
            plan === "deposit"
        ) {

            payNow =
                Math.round(
                    subtotal * 0.60
                );

            balance =
                subtotal -
                payNow;
        }

        return {

            subtotal,

            total:
                subtotal,

            payNow,

            balance
        };
    }

    // =========================================
    // CHECK LIVE PRODUCTS
    // =========================================

    async function verifyLiveCart() {

        if (!cart.length) {

            throw new Error(
                "Your cart is empty."
            );
        }

        const productIds =
            [
                ...new Set(
                    cart
                        .map(item => item.id)
                        .filter(Boolean)
                )
            ];

        if (!productIds.length) {

            throw new Error(
                "Your cart contains an invalid product."
            );
        }

        const {
            data,
            error
        } = await supabaseClient
            .from("products")
            .select(`
                id,
                name,
                category,
                price,
                icon,
                image,
                stock,
                is_active
            `)
            .in(
                "id",
                productIds
            );

        if (error) {

            console.error(
                "Live product check error:",
                error
            );

            throw new Error(
                "Unable to verify product availability. Please try again."
            );
        }

        const products =
            Array.isArray(data)
                ? data
                : [];

        const productMap =
            new Map(
                products.map(
                    product => [
                        product.id,
                        product
                    ]
                )
            );

        const updatedCart = [];

        for (
            const item
            of cart
        ) {

            const product =
                productMap.get(
                    item.id
                );

            // ---------------------------------
            // PRODUCT DOES NOT EXIST
            // ---------------------------------

            if (!product) {

                throw new Error(
                    `"${item.name || "A product"}" is no longer available. Please return to your cart.`
                );
            }

            // ---------------------------------
            // PRODUCT DISABLED
            // ---------------------------------

            if (
                product.is_active !== true
            ) {

                throw new Error(
                    `"${product.name}" is currently unavailable. Please return to your cart.`
                );
            }

            // ---------------------------------
            // STOCK
            // ---------------------------------

            const stock =
                Number(product.stock) || 0;

            const quantity =
                Number(item.quantity) || 1;

            if (stock <= 0) {

                throw new Error(
                    `"${product.name}" is currently out of stock.`
                );
            }

            if (
                quantity > stock
            ) {

                throw new Error(
                    `"${product.name}" only has ${stock} item${
                        stock === 1
                            ? ""
                            : "s"
                    } available. You requested ${quantity}. Please return to your cart and reduce the quantity.`
                );
            }

            // ---------------------------------
            // UPDATE WITH LIVE PRODUCT DATA
            // ---------------------------------

            const livePrice =
                Number(
                    product.price
                ) || 0;

            updatedCart.push({

                id:
                    product.id,

                name:
                    product.name,

                price:
                    livePrice,

                image:
                    product.image ||
                    null,

                icon:
                    product.icon ||
                    "👟",

                category:
                    product.category ||
                    "",

                size:
                    item.size || "",

                quantity:
                    quantity
            });
        }

        // -------------------------------------
        // UPDATE CART WITH LIVE DATA
        // -------------------------------------

        cart =
            updatedCart;

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(
                cart
            )
        );

        return cart;
    }

    // =========================================
    // DISPLAY ITEMS
    // =========================================

    function renderOrderItems() {

        if (!orderItems) {
            return;
        }

        orderItems.innerHTML = "";

        cart.forEach(item => {

            const price =
                Number(item.price) || 0;

            const quantity =
                Number(item.quantity) || 1;

            const itemTotal =
                price * quantity;

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "checkout-item";

            const imageHTML =
                item.image
                    ? `
                        <img
                            src="${item.image}"
                            alt="${item.name || "Product"}"
                        >
                    `
                    : `
                        <span>
                            ${item.icon || "👟"}
                        </span>
                    `;

            element.innerHTML = `

                <div class="checkout-item-image">

                    ${imageHTML}

                </div>

                <div class="checkout-item-info">

                    <h4>
                        ${item.name || "Product"}
                    </h4>

                    ${
                        item.size
                        ?
                        `
                        <p>
                            Size: ${item.size}
                        </p>
                        `
                        :
                        ""
                    }

                    <p>
                        Quantity: ${quantity}
                    </p>

                </div>

                <div class="checkout-item-price">

                    ${formatMoney(itemTotal)}

                </div>

            `;

            orderItems.appendChild(
                element
            );
        });
    }

    // =========================================
    // UPDATE SUMMARY
    // =========================================

    function updateSummary() {

        const payment =
            calculatePayment();

        if (subtotalElement) {

            subtotalElement.textContent =
                formatMoney(
                    payment.subtotal
                );
        }

        if (totalElement) {

            totalElement.textContent =
                formatMoney(
                    payment.total
                );
        }

        if (payNowElement) {

            payNowElement.textContent =
                formatMoney(
                    payment.payNow
                );
        }

        if (balanceElement) {

            balanceElement.textContent =
                formatMoney(
                    payment.balance
                );
        }
    }

    // =========================================
    // PAYMENT DETAILS
    // =========================================

    function updatePaymentDetails() {

        if (!paymentDetails) {
            return;
        }

        const method =
            getPaymentMethod();

        if (
            method ===
            "Bank Transfer"
        ) {

            paymentDetails.style.display =
                "block";

        } else {

            paymentDetails.style.display =
                "none";
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
    // PHONE VALIDATION
    // =========================================

    function isValidPhone(phone) {

        const cleaned =
            phone.replace(
                /\s+/g,
                ""
            );

        return /^(?:\+234|234|0)[789][01]\d{8}$/
            .test(
                cleaned
            );
    }

    // =========================================
    // SAVE ORDER TO SUPABASE
    // =========================================

    async function saveOrderToSupabase(
        order
    ) {

        // -------------------------------------
        // INSERT ORDER
        // -------------------------------------

        const {
            data,
            error
        } =
            await supabaseClient
                .from("orders")
                .insert({

                    order_reference:
                        order.orderReference,

                    status:
                        order.status,

                    customer_name:
                        order.customer.name,

                    customer_phone:
                        order.customer.phone,

                    customer_email:
                        order.customer.email ||
                        null,

                    delivery_address:
                        order.delivery.address,

                    delivery_city:
                        order.delivery.city,

                    delivery_state:
                        order.delivery.state,

                    payment_method:
                        order.payment.method,

                    payment_plan:
                        order.payment.plan,

                    subtotal:
                        order.payment.subtotal,

                    total:
                        order.payment.total,

                    pay_now:
                        order.payment.payNow,

                    balance:
                        order.payment.balance,

                    payment_status:
                        "Pending",

                    customer_note:
                        order.note ||
                        null
                })
                .select()
                .single();

        if (error) {

            console.error(
                "Order insert error:",
                error
            );

            throw new Error(
                "Unable to create your order. Please try again."
            );
        }

        // -------------------------------------
        // INSERT ORDER ITEMS
        // -------------------------------------

        const items =
            order.items.map(
                item => ({

                    order_id:
                        data.id,

                    product_id:
                        item.id ||
                        null,

                    product_name:
                        item.name,

                    price:
                        Number(
                            item.price
                        ) || 0,

                    quantity:
                        Number(
                            item.quantity
                        ) || 1,

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
                })
            );

        const {
            error:
                itemsError
        } =
            await supabaseClient
                .from(
                    "order_items"
                )
                .insert(
                    items
                );

        if (itemsError) {

            console.error(
                "Order items insert error:",
                itemsError
            );

            // ---------------------------------
            // TRY TO REMOVE INCOMPLETE ORDER
            // ---------------------------------

            await supabaseClient
                .from("orders")
                .delete()
                .eq(
                    "id",
                    data.id
                );

            throw new Error(
                "The order could not be completed. Please try again."
            );
        }

        return data;
    }

    // =========================================
    // SHOW SUCCESS
    // =========================================

    function showOrderSuccess(
        order
    ) {

        if (checkoutForm) {

            checkoutForm.style.display =
                "none";
        }

        if (orderSuccess) {

            orderSuccess.style.display =
                "block";
        }

        if (
            orderReferenceElement
        ) {

            orderReferenceElement.textContent =
                order.orderReference;
        }

        if (!successMessage) {
            return;
        }

        const payment =
            order.payment;

        if (
            payment.method ===
            "Bank Transfer"
        ) {

            if (
                payment.plan ===
                "deposit"
            ) {

                successMessage.textContent =
                    `Your order has been received. Please transfer ${formatMoney(payment.payNow)} to the OPay account shown above. Your remaining balance is ${formatMoney(payment.balance)}.`;

            } else {

                successMessage.textContent =
                    `Your order has been received. Please transfer ${formatMoney(payment.payNow)} to the OPay account shown above.`;
            }

        } else {

            if (
                payment.plan ===
                "deposit"
            ) {

                successMessage.textContent =
                    "Your order has been received. You selected Cash on Delivery with a 60% deposit plan.";

            } else {

                successMessage.textContent =
                    "Your order has been received. You selected Cash on Delivery with full payment.";
            }
        }
    }

    // =========================================
    // SUBMIT CHECKOUT
    // =========================================

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const submitButton =
                    checkoutForm.querySelector(
                        'button[type="submit"]'
                    );

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.dataset.originalText =
                        submitButton.textContent;

                    submitButton.textContent =
                        "Checking Stock...";
                }

                try {

                    // ---------------------------------
                    // RELOAD CART
                    // ---------------------------------

                    cart =
                        getCart();

                    if (!cart.length) {

                        throw new Error(
                            "Your cart is empty."
                        );
                    }

                    // ---------------------------------
                    // VERIFY LIVE STOCK + PRICES
                    // ---------------------------------

                    await verifyLiveCart();

                    // ---------------------------------
                    // REFRESH DISPLAY
                    // ---------------------------------

                    renderOrderItems();

                    updateSummary();

                    // ---------------------------------
                    // CUSTOMER
                    // ---------------------------------

                    const name =
                        customerName
                        ? customerName.value.trim()
                        : "";

                    const phone =
                        customerPhone
                        ? customerPhone.value.trim()
                        : "";

                    const email =
                        customerEmail
                        ? customerEmail.value.trim()
                        : "";

                    // ---------------------------------
                    // DELIVERY
                    // ---------------------------------

                    const address =
                        deliveryAddress
                        ? deliveryAddress.value.trim()
                        : "";

                    const city =
                        deliveryCity
                        ? deliveryCity.value.trim()
                        : "";

                    const state =
                        deliveryState
                        ? deliveryState.value.trim()
                        : "";

                    const note =
                        orderNote
                        ? orderNote.value.trim()
                        : "";

                    // ---------------------------------
                    // VALIDATION
                    // ---------------------------------

                    if (!name) {

                        throw new Error(
                            "Please enter your full name."
                        );
                    }

                    if (!phone) {

                        throw new Error(
                            "Please enter your phone number."
                        );
                    }

                    if (
                        !isValidPhone(
                            phone
                        )
                    ) {

                        throw new Error(
                            "Please enter a valid Nigerian phone number."
                        );
                    }

                    if (!address) {

                        throw new Error(
                            "Please enter your delivery address."
                        );
                    }

                    if (!city) {

                        throw new Error(
                            "Please enter your city."
                        );
                    }

                    if (!state) {

                        throw new Error(
                            "Please enter your state."
                        );
                    }

                    // ---------------------------------
                    // PAYMENT
                    // ---------------------------------

                    const payment =
                        calculatePayment();

                    const paymentMethod =
                        getPaymentMethod();

                    const paymentPlan =
                        getPaymentPlan();

                    // ---------------------------------
                    // ORDER REFERENCE
                    // ---------------------------------

                    const orderReference =
                        generateOrderReference();

                    const createdAt =
                        new Date()
                            .toISOString();

                    // ---------------------------------
                    // ORDER OBJECT
                    // ---------------------------------

                    const checkoutData = {

                        orderReference,

                        status:
                            "Pending Payment",

                        createdAt,

                        updatedAt:
                            createdAt,

                        customer: {

                            name,

                            phone,

                            email
                        },

                        delivery: {

                            address,

                            city,

                            state
                        },

                        payment: {

                            method:
                                paymentMethod,

                            plan:
                                paymentPlan,

                            subtotal:
                                payment.subtotal,

                            total:
                                payment.total,

                            payNow:
                                payment.payNow,

                            balance:
                                payment.balance
                        },

                        note,

                        items:
                            cart.map(
                                item => ({

                                    id:
                                        item.id,

                                    name:
                                        item.name,

                                    price:
                                        Number(
                                            item.price
                                        ) || 0,

                                    quantity:
                                        Number(
                                            item.quantity
                                        ) || 1,

                                    size:
                                        item.size ||
                                        "",

                                    category:
                                        item.category ||
                                        "",

                                    image:
                                        item.image ||
                                        null,

                                    icon:
                                        item.icon ||
                                        ""
                                })
                            )
                    };

                    // ---------------------------------
                    // SAVE ORDER
                    // ---------------------------------

                    if (submitButton) {

                        submitButton.textContent =
                            "Placing Order...";
                    }

                    await saveOrderToSupabase(
                        checkoutData
                    );

                    // ---------------------------------
                    // LOCAL BACKUP
                    // ---------------------------------

                    try {

                        localStorage.setItem(
                            "ayodejiCheckoutData",
                            JSON.stringify(
                                checkoutData
                            )
                        );

                    } catch (
                        storageError
                    ) {

                        console.warn(
                            "Local backup unavailable:",
                            storageError
                        );
                    }

                    // ---------------------------------
                    // CLEAR CART
                    // ---------------------------------

                    localStorage.removeItem(
                        CART_KEY
                    );

                    localStorage.removeItem(
                        PAYMENT_METHOD_KEY
                    );

                    // ---------------------------------
                    // SHOW SUCCESS
                    // ---------------------------------

                    showOrderSuccess(
                        checkoutData
                    );

                } catch (error) {

                    console.error(
                        "Checkout error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Unable to place your order. Please try again."
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            submitButton.dataset.originalText ||
                            "Place Order";
                    }
                }
            }
        );
    }

    // =========================================
    // COPY ACCOUNT NUMBER
    // =========================================

    if (copyAccountButton) {

        copyAccountButton.addEventListener(
            "click",
            async () => {

                const accountNumber =
                    accountNumberElement
                    ? accountNumberElement
                        .textContent
                        .trim()
                        .replace(
                            /\s+/g,
                            ""
                        )
                    : "07019154961";

                try {

                    await navigator
                        .clipboard
                        .writeText(
                            accountNumber
                        );

                    const oldText =
                        copyAccountButton.textContent;

                    copyAccountButton.textContent =
                        "Copied!";

                    setTimeout(
                        () => {

                            copyAccountButton.textContent =
                                oldText;

                        },
                        2000
                    );

                } catch (error) {

                    alert(
                        `OPay Account Number: ${accountNumber}`
                    );
                }
            }
        );
    }

    // =========================================
    // PAYMENT METHOD EVENTS
    // =========================================

    if (bankTransfer) {

        bankTransfer.addEventListener(
            "change",
            updatePaymentDetails
        );
    }

    if (cashOnDelivery) {

        cashOnDelivery.addEventListener(
            "change",
            updatePaymentDetails
        );
    }

    // =========================================
    // PAYMENT PLAN EVENTS
    // =========================================

    if (depositPlan) {

        depositPlan.addEventListener(
            "change",
            updateSummary
        );
    }

    if (fullPlan) {

        fullPlan.addEventListener(
            "change",
            updateSummary
        );
    }

    // =========================================
    // INITIALIZE
    // =========================================

    renderOrderItems();

    updateSummary();

    updatePaymentDetails();

    console.log(
        "Ayodeji Fashion Hubs checkout initialized with live stock verification."
    );
});