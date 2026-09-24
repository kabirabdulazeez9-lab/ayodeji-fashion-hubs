// =========================================
// AYODEJI FASHION HUBS
// CHECKOUT
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error("Supabase client was not loaded.");
        return;
    }


    // =========================================
    // ELEMENTS
    // =========================================

    const customerName =
        document.getElementById("customerName");

    const customerPhone =
        document.getElementById("customerPhone");

    const customerEmail =
        document.getElementById("customerEmail");

    const deliveryAddress =
        document.getElementById("deliveryAddress");

    const deliveryCity =
        document.getElementById("deliveryCity");

    const deliveryState =
        document.getElementById("deliveryState");

    const orderNote =
        document.getElementById("orderNote");


    const orderItems =
        document.getElementById("orderItems");

    const checkoutSubtotal =
        document.getElementById("checkoutSubtotal");

    const checkoutTotal =
        document.getElementById("checkoutTotal");

    const payNowAmount =
        document.getElementById("payNowAmount");

    const balanceAmount =
        document.getElementById("balanceAmount");


    const depositPlan =
        document.getElementById("depositPlan");

    const fullPlan =
        document.getElementById("fullPlan");


    const bankTransfer =
        document.getElementById("bankTransfer");

    const cashOnDelivery =
        document.getElementById("cashOnDelivery");


    const checkoutForm =
        document.getElementById("checkoutForm");


    const orderSuccess =
        document.getElementById("orderSuccess");

    const orderReference =
        document.getElementById("orderReference");

    const successMessage =
        document.getElementById("successMessage");


    const copyAccountNumber =
        document.getElementById("copyAccountNumber");

    const accountNumber =
        document.getElementById("accountNumber");


    // =========================================
    // CART
    // =========================================

    const CART_KEY = "ayodejiCart";

    let cart = [];

    let currentUser = null;

    let currentProducts = [];


    // =========================================
    // MONEY
    // =========================================

    function formatMoney(amount) {

        return Number(amount || 0).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

    }


    // =========================================
    // GET CART
    // =========================================

    function getCart() {

        try {

            const savedCart =
                localStorage.getItem(CART_KEY);

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


    // =========================================
    // SAVE CART
    // =========================================

    function saveCart() {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }


    // =========================================
    // SHOW MESSAGE
    // =========================================

    function showCheckoutMessage(
        text,
        type = "error"
    ) {

        let message =
            document.getElementById(
                "checkoutMessage"
            );

        if (!message) {

            message =
                document.createElement("div");

            message.id =
                "checkoutMessage";

            message.className =
                "checkout-message";

            if (checkoutForm) {

                checkoutForm.prepend(
                    message
                );

            }

        }

        message.textContent = text;

        message.className =
            "checkout-message " + type;

    }


    // =========================================
    // CURRENT USER
    // =========================================

    async function getCurrentUser() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.getUser();

            if (error) {

                console.warn(
                    "Unable to get current user:",
                    error
                );

                return null;

            }

            return data.user || null;

        } catch (error) {

            console.error(
                "User check error:",
                error
            );

            return null;

        }

    }


    // =========================================
    // LOAD CUSTOMER PROFILE
    // =========================================

    async function loadCustomerProfile() {

        currentUser =
            await getCurrentUser();


        // --------------------------------------
        // NOT LOGGED IN
        // --------------------------------------

        if (!currentUser) {

            console.log(
                "Customer is not logged in. Guest checkout enabled."
            );

            return;

        }


        // --------------------------------------
        // EMAIL
        // --------------------------------------

        if (customerEmail) {

            customerEmail.value =
                currentUser.email || "";

        }


        // --------------------------------------
        // LOAD PROFILE
        // --------------------------------------

        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("customer_profiles")
                .select(`
                    full_name,
                    phone,
                    delivery_address,
                    delivery_city,
                    delivery_state
                `)
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Customer profile loading error:",
                error
            );

            return;

        }


        if (!profile) {

            console.log(
                "No customer profile found."
            );

            // Try auth metadata
            const metadata =
                currentUser.user_metadata || {};

            if (
                customerName &&
                !customerName.value
            ) {

                customerName.value =
                    metadata.full_name ||
                    metadata.name ||
                    "";

            }

            if (
                customerPhone &&
                !customerPhone.value
            ) {

                customerPhone.value =
                    metadata.phone ||
                    "";

            }

            return;

        }


        // --------------------------------------
        // FILL CHECKOUT
        // --------------------------------------

        if (customerName) {

            customerName.value =
                profile.full_name || "";

        }

        if (customerPhone) {

            customerPhone.value =
                profile.phone || "";

        }

        if (deliveryAddress) {

            deliveryAddress.value =
                profile.delivery_address || "";

        }

        if (deliveryCity) {

            deliveryCity.value =
                profile.delivery_city || "";

        }

        if (deliveryState) {

            deliveryState.value =
                profile.delivery_state || "";

        }


        console.log(
            "Customer profile loaded into checkout."
        );

    }


    // =========================================
    // LOAD PRODUCTS FROM SUPABASE
    // =========================================

    async function validateCartAgainstProducts() {

        if (!cart.length) {

            renderEmptyCart();

            return false;

        }


        const productIds =
            [
                ...new Set(
                    cart.map(item => item.id)
                )
            ];


        const {
            data: products,
            error
        } =
            await supabaseClient
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
                "Product validation error:",
                error
            );

            showCheckoutMessage(
                "Unable to verify your cart. Please try again."
            );

            return false;

        }


        currentProducts =
            products || [];


        const productMap =
            new Map(
                currentProducts.map(
                    product => [
                        product.id,
                        product
                    ]
                )
            );


        const validCart = [];


        for (const item of cart) {

            const product =
                productMap.get(item.id);


            // Product removed
            if (!product) {

                continue;

            }


            // Product inactive
            if (!product.is_active) {

                continue;

            }


            // Product out of stock
            if (
                Number(product.stock) <= 0
            ) {

                continue;

            }


            const quantity =
                Math.min(
                    Number(item.quantity) || 1,
                    Number(product.stock)
                );


            validCart.push({

                ...item,

                name:
                    product.name,

                price:
                    Number(product.price),

                category:
                    product.category,

                icon:
                    product.icon,

                image:
                    product.image,

                quantity:
                    quantity

            });

        }


        cart =
            validCart;


        saveCart();


        if (!cart.length) {

            renderEmptyCart();

            return false;

        }


        return true;

    }


    // =========================================
    // RENDER EMPTY CART
    // =========================================

    function renderEmptyCart() {

        if (orderItems) {

            orderItems.innerHTML = `

                <div class="checkout-empty">

                    <div class="checkout-empty-icon">
                        🛒
                    </div>

                    <h3>
                        Your cart is empty
                    </h3>

                    <p>
                        Add products to your cart before checking out.
                    </p>

                    <a href="shop.html">
                        Continue Shopping
                    </a>

                </div>

            `;

        }


        if (checkoutForm) {

            checkoutForm.style.display =
                "none";

        }

    }


    // =========================================
    // CALCULATE TOTAL
    // =========================================

    function calculateSubtotal() {

        return cart.reduce(
            (
                total,
                item
            ) => {

                return total +
                    (
                        Number(item.price) *
                        Number(item.quantity)
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

            return "60% Deposit";

        }

        return "100% Full Payment";

    }


    // =========================================
    // UPDATE PAYMENT SUMMARY
    // =========================================

    function updatePaymentSummary() {

        const subtotal =
            calculateSubtotal();

        const paymentPlan =
            getPaymentPlan();


        let payNow =
            subtotal;

        let balance =
            0;


        if (
            paymentPlan ===
            "60% Deposit"
        ) {

            payNow =
                subtotal * 0.60;

            balance =
                subtotal - payNow;

        }


        if (checkoutSubtotal) {

            checkoutSubtotal.textContent =
                `₦${formatMoney(subtotal)}`;

        }

        if (checkoutTotal) {

            checkoutTotal.textContent =
                `₦${formatMoney(subtotal)}`;

        }

        if (payNowAmount) {

            payNowAmount.textContent =
                `₦${formatMoney(payNow)}`;

        }

        if (balanceAmount) {

            balanceAmount.textContent =
                `₦${formatMoney(balance)}`;

        }

    }


    // =========================================
    // RENDER ORDER ITEMS
    // =========================================

    function renderOrderItems() {

        if (!orderItems) return;


        if (!cart.length) {

            renderEmptyCart();

            return;

        }


        orderItems.innerHTML =
            cart.map(item => {

                const image =
                    item.image
                        ? `
                            <img
                                src="${escapeHtml(item.image)}"
                                alt="${escapeHtml(item.name)}"
                            >
                        `
                        : `
                            <div class="checkout-item-icon">
                                ${escapeHtml(
                                    item.icon || "👞"
                                )}
                            </div>
                        `;


                return `

                    <div class="checkout-item">

                        <div class="checkout-item-image">

                            ${image}

                        </div>


                        <div class="checkout-item-info">

                            <h4>
                                ${escapeHtml(
                                    item.name
                                )}
                            </h4>

                            <p>
                                Size:
                                ${escapeHtml(
                                    item.size || "N/A"
                                )}
                            </p>

                            <p>
                                Quantity:
                                ${Number(
                                    item.quantity
                                )}
                            </p>

                        </div>


                        <div class="checkout-item-price">

                            ₦${formatMoney(
                                Number(item.price) *
                                Number(item.quantity)
                            )}

                        </div>

                    </div>

                `;

            }).join("");

    }


    // =========================================
    // ESCAPE HTML
    // =========================================

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


    // =========================================
    // PAYMENT METHOD
    // =========================================

    function getPaymentMethod() {

        if (
            bankTransfer &&
            bankTransfer.checked
        ) {

            return "OPay Bank Transfer";

        }

        if (
            cashOnDelivery &&
            cashOnDelivery.checked
        ) {

            return "Cash on Delivery";

        }

        return "";

    }


    // =========================================
    // GENERATE ORDER REFERENCE
    // =========================================

    function generateOrderReference() {

        const now =
            new Date();

        const date =
            now.getFullYear().toString() +
            String(
                now.getMonth() + 1
            ).padStart(2, "0") +
            String(
                now.getDate()
            ).padStart(2, "0");


        const random =
            Math.floor(
                1000 +
                Math.random() * 9000
            );


        return `AFH-${date}-${random}`;

    }


    // =========================================
    // COPY ACCOUNT NUMBER
    // =========================================

    if (copyAccountNumber) {

        copyAccountNumber.addEventListener(
            "click",
            async () => {

                const number =
                    accountNumber
                        ? accountNumber.textContent.trim()
                        : "";


                if (!number) return;


                try {

                    await navigator.clipboard.writeText(
                        number
                    );

                    copyAccountNumber.textContent =
                        "Copied!";

                    setTimeout(() => {

                        copyAccountNumber.textContent =
                            "Copy";

                    }, 1500);

                } catch (error) {

                    console.error(
                        "Copy failed:",
                        error
                    );

                }

            }
        );

    }


    // =========================================
    // PAYMENT PLAN EVENTS
    // =========================================

    if (depositPlan) {

        depositPlan.addEventListener(
            "change",
            updatePaymentSummary
        );

    }


    if (fullPlan) {

        fullPlan.addEventListener(
            "change",
            updatePaymentSummary
        );

    }


    // =========================================
    // CHECKOUT SUBMIT
    // =========================================

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                // ---------------------------------
                // RECHECK CART
                // ---------------------------------

                cart =
                    getCart();


                const validCart =
                    await validateCartAgainstProducts();


                if (!validCart) {

                    return;

                }


                // ---------------------------------
                // CUSTOMER DATA
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


                // ---------------------------------
                // VALIDATE CUSTOMER
                // ---------------------------------

                if (!name) {

                    showCheckoutMessage(
                        "Please enter your full name."
                    );

                    customerName?.focus();

                    return;

                }


                if (!phone) {

                    showCheckoutMessage(
                        "Please enter your phone number."
                    );

                    customerPhone?.focus();

                    return;

                }


                if (!address) {

                    showCheckoutMessage(
                        "Please enter your delivery address."
                    );

                    deliveryAddress?.focus();

                    return;

                }


                if (!city) {

                    showCheckoutMessage(
                        "Please enter your delivery city."
                    );

                    deliveryCity?.focus();

                    return;

                }


                if (!state) {

                    showCheckoutMessage(
                        "Please enter your delivery state."
                    );

                    deliveryState?.focus();

                    return;

                }


                // ---------------------------------
                // PAYMENT METHOD
                // ---------------------------------

                const paymentMethod =
                    getPaymentMethod();


                if (!paymentMethod) {

                    showCheckoutMessage(
                        "Please select a payment method."
                    );

                    return;

                }


                // ---------------------------------
                // PAYMENT PLAN
                // ---------------------------------

                const paymentPlan =
                    getPaymentPlan();


                const subtotal =
                    calculateSubtotal();


                let payNow =
                    subtotal;

                let balance =
                    0;


                if (
                    paymentPlan ===
                    "60% Deposit"
                ) {

                    payNow =
                        subtotal * 0.60;

                    balance =
                        subtotal - payNow;

                }


                // ---------------------------------
                // BUTTON
                // ---------------------------------

                const submitButton =
                    checkoutForm.querySelector(
                        'button[type="submit"]'
                    );


                const originalButtonText =
                    submitButton
                        ? submitButton.textContent
                        : "";


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Placing Order...";

                }


                try {

                    // -----------------------------
                    // ORDER REFERENCE
                    // -----------------------------

                    const reference =
                        generateOrderReference();


                    // -----------------------------
                    // PAYMENT STATUS
                    // -----------------------------

                    let paymentStatus =
                        "Pending";


                    // -----------------------------
                    // ORDER STATUS
                    // -----------------------------

                    const orderStatus =
                        "Pending Payment";


                    // -----------------------------
                    // CREATE ORDER
                    // -----------------------------

                    const {
                        data: order,
                        error: orderError
                    } =
                        await supabaseClient
                            .from("orders")
                            .insert({

                                order_reference:
                                    reference,

                                status:
                                    orderStatus,

                                customer_name:
                                    name,

                                customer_phone:
                                    phone,

                                customer_email:
                                    email || null,

                                delivery_address:
                                    address,

                                delivery_city:
                                    city,

                                delivery_state:
                                    state,

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

                                payment_status:
                                    paymentStatus,

                                customer_note:
                                    orderNote
                                        ? orderNote.value.trim() || null
                                        : null

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


                    // -----------------------------
                    // CREATE ORDER ITEMS
                    // -----------------------------

                    const orderItemsData =
                        cart.map(item => ({

                            order_id:
                                order.id,

                            product_id:
                                item.id,

                            product_name:
                                item.name,

                            price:
                                Number(item.price),

                            quantity:
                                Number(item.quantity),

                            size:
                                item.size || null,

                            category:
                                item.category || null,

                            image:
                                item.image || null,

                            icon:
                                item.icon || null

                        }));


                    const {
                        error: itemsError
                    } =
                        await supabaseClient
                            .from("order_items")
                            .insert(
                                orderItemsData
                            );


                    if (itemsError) {

                        console.error(
                            "Order items error:",
                            itemsError
                        );

                        throw itemsError;

                    }


                    // -----------------------------
                    // CLEAR CART
                    // -----------------------------

                    cart = [];

                    saveCart();


                    // -----------------------------
                    // SHOW SUCCESS
                    // -----------------------------

                    if (orderReference) {

                        orderReference.textContent =
                            reference;

                    }


                    if (successMessage) {

                        successMessage.textContent =
                            `Your order ${reference} has been placed successfully.`;

                    }


                    if (orderSuccess) {

                        orderSuccess.style.display =
                            "block";

                    }


                    checkoutForm.style.display =
                        "none";


                    // Scroll to success
                    if (orderSuccess) {

                        orderSuccess.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                } catch (error) {

                    console.error(
                        "Checkout error:",
                        error
                    );

                    showCheckoutMessage(
                        error.message ||
                        "Unable to place your order. Please try again."
                    );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            originalButtonText ||
                            "Place Order";

                    }

                }

            }
        );

    }


    // =========================================
    // INITIALIZE
    // =========================================

    cart =
        getCart();


    const validCart =
        await validateCartAgainstProducts();


    if (!validCart) {

        return;

    }


    renderOrderItems();

    updatePaymentSummary();

    await loadCustomerProfile();

});