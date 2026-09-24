// =========================================
// AYODEJI FASHION HUBS
// CART JAVASCRIPT
// =========================================

let cart = [];

let paymentMethod = "deposit";


// =========================================
// INITIALIZE
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Ayodeji Fashion Hubs cart loaded."
        );


        setupMobileMenu();

        loadCart();

        loadPaymentMethod();

        setupEvents();

        updateCartCount();

        renderCart();


        // Sync product information if Supabase
        // is available.

        await syncCartWithProducts();

        renderCart();

        updateCartCount();

        updateYear();

    }
);


// =========================================
// MOBILE MENU
// =========================================

function setupMobileMenu() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const mobileNav =
        document.getElementById(
            "mobileNav"
        );

    const closeButton =
        document.getElementById(
            "closeMenuButton"
        );

    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    if (!menuButton || !mobileNav) {

        console.warn(
            "Cart mobile menu elements not found."
        );

        return;

    }


    function openMenu() {

        mobileNav.classList.add(
            "active"
        );


        if (overlay) {

            overlay.classList.add(
                "active"
            );

        }


        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );


        menuButton.setAttribute(
            "aria-label",
            "Close menu"
        );


        mobileNav.setAttribute(
            "aria-hidden",
            "false"
        );


        if (overlay) {

            overlay.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    function closeMenu() {

        mobileNav.classList.remove(
            "active"
        );


        if (overlay) {

            overlay.classList.remove(
                "active"
            );

        }


        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );


        menuButton.setAttribute(
            "aria-label",
            "Open menu"
        );


        mobileNav.setAttribute(
            "aria-hidden",
            "true"
        );


        if (overlay) {

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        document.body.style.overflow =
            "";

    }


    menuButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


            if (
                mobileNav.classList.contains(
                    "active"
                )
            ) {

                closeMenu();

            } else {

                openMenu();

            }

        }
    );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeMenu();

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                closeMenu();

            }
        );

    }


    const links =
        mobileNav.querySelectorAll(
            "a"
        );


    links.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    closeMenu();

                }
            );

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                mobileNav.classList.contains(
                    "active"
                )
            ) {

                closeMenu();

            }

        }
    );

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

            cart = [];

            return;

        }


        const parsed =
            JSON.parse(
                savedCart
            );


        cart =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.error(
            "Could not load cart:",
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
            "ayodejiCart",
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Could not save cart:",
            error
        );

    }

}


// =========================================
// LOAD PAYMENT METHOD
// =========================================

function loadPaymentMethod() {

    const savedMethod =
        localStorage.getItem(
            "ayodejiPaymentMethod"
        );


    if (
        savedMethod === "deposit" ||
        savedMethod === "full"
    ) {

        paymentMethod =
            savedMethod;

    } else {

        paymentMethod =
            "deposit";

    }


    const selectedInput =
        document.querySelector(
            `input[name="cartPayment"][value="${paymentMethod}"]`
        );


    if (selectedInput) {

        selectedInput.checked =
            true;

    }


    updatePaymentOptionStyles();

}


// =========================================
// CART COUNT
// =========================================

function updateCartCount() {

    const count =
        cart.reduce(
            function (
                total,
                item
            ) {

                return total +
                    Number(
                        item.quantity || 0
                    );

            },
            0
        );


    const cartCount =
        document.getElementById(
            "cartCount"
        );


    if (cartCount) {

        cartCount.textContent =
            count;

    }


    const mobileCartCount =
        document.getElementById(
            "mobileCartCount"
        );


    if (mobileCartCount) {

        mobileCartCount.textContent =
            count;

    }

}


// =========================================
// FORMAT NAIRA
// =========================================

function formatNaira(amount) {

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
// FORMAT CATEGORY
// =========================================

function formatCategory(category) {

    if (!category) {

        return "Product";

    }


    return (
        category.charAt(0).toUpperCase() +
        category.slice(1)
    );

}


// =========================================
// SYNC CART WITH SUPABASE
// =========================================

async function syncCartWithProducts() {

    if (cart.length === 0) {

        return;

    }


    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.warn(
            "Supabase client unavailable. Using local cart."
        );

        return;

    }


    const productIds =
        [
            ...new Set(
                cart
                    .map(
                        item => item.id
                    )
                    .filter(Boolean)
            )
        ];


    if (productIds.length === 0) {

        return;

    }


    try {

        const result =
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


        const data =
            result.data;

        const error =
            result.error;


        if (error) {

            console.error(
                "Could not sync cart:",
                error
            );

            return;

        }


        const products =
            Array.isArray(data)
                ? data
                : [];


        const productMap =
            new Map(
                products.map(
                    function (product) {

                        return [
                            product.id,
                            product
                        ];

                    }
                )
            );


        const updatedCart = [];


        cart.forEach(
            function (item) {

                const product =
                    productMap.get(
                        item.id
                    );


                // Product no longer exists.

                if (!product) {

                    return;

                }


                // Product disabled.

                if (
                    product.is_active !== true
                ) {

                    return;

                }


                const stock =
                    Number(
                        product.stock
                    ) || 0;


                // Product out of stock.

                if (stock <= 0) {

                    return;

                }


                let quantity =
                    Number(
                        item.quantity
                    ) || 1;


                if (quantity > stock) {

                    quantity =
                        stock;

                }


                updatedCart.push({

                    id:
                        product.id,

                    name:
                        product.name,

                    price:
                        Number(
                            product.price
                        ) || 0,

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
                        item.size ||
                        "",

                    quantity:
                        quantity

                });

            }
        );


        cart =
            updatedCart;


        saveCart();

        updateCartCount();

    } catch (error) {

        console.error(
            "Cart synchronization failed:",
            error
        );

    }

}


// =========================================
// RENDER CART
// =========================================

function renderCart() {

    const emptyCart =
        document.getElementById(
            "emptyCart"
        );

    const cartContent =
        document.getElementById(
            "cartContent"
        );


    if (
        !emptyCart ||
        !cartContent
    ) {

        return;

    }


    if (cart.length === 0) {

        emptyCart.hidden =
            false;

        cartContent.hidden =
            true;

        updateItemsLabel();

        updateSummary();

        return;

    }


    emptyCart.hidden =
        true;

    cartContent.hidden =
        false;


    renderCartItems();

    updateItemsLabel();

    updateSummary();

}


// =========================================
// RENDER CART ITEMS
// =========================================

function renderCartItems() {

    const container =
        document.getElementById(
            "cartItems"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    cart.forEach(
        function (
            item,
            index
        ) {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "cart-item";


            // =================================
            // IMAGE
            // =================================

            const image =
                document.createElement(
                    "div"
                );


            image.className =
                "cart-item-image";


            if (item.image) {

                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    item.image;

                img.alt =
                    item.name ||
                    "Product";

                img.loading =
                    "lazy";


                img.onerror =
                    function () {

                        img.remove();

                        image.textContent =
                            item.icon ||
                            "👟";

                    };


                image.appendChild(
                    img
                );

            } else {

                image.textContent =
                    item.icon ||
                    "👟";

            }


            // =================================
            // INFORMATION
            // =================================

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "cart-item-info";


            const category =
                document.createElement(
                    "div"
                );


            category.className =
                "cart-item-category";


            category.textContent =
                formatCategory(
                    item.category
                );


            const name =
                document.createElement(
                    "h3"
                );


            name.className =
                "cart-item-name";


            name.textContent =
                item.name ||
                "Product";


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "cart-item-meta";


            const size =
                document.createElement(
                    "span"
                );


            size.textContent =
                item.size
                    ? `Size: ${item.size}`
                    : "Size not selected";


            const unitPrice =
                document.createElement(
                    "span"
                );


            unitPrice.textContent =
                `Unit price: ${formatNaira(
                    item.price
                )}`;


            meta.appendChild(
                size
            );

            meta.appendChild(
                unitPrice
            );


            const itemPrice =
                document.createElement(
                    "div"
                );


            itemPrice.className =
                "cart-item-price";


            itemPrice.textContent =
                formatNaira(
                    Number(
                        item.price || 0
                    ) *
                    Number(
                        item.quantity || 0
                    )
                );


            info.appendChild(
                category
            );

            info.appendChild(
                name
            );

            info.appendChild(
                meta
            );

            info.appendChild(
                itemPrice
            );


            // =================================
            // ACTIONS
            // =================================

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "cart-item-actions";


            // REMOVE

            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";

            removeButton.className =
                "remove-item";

            removeButton.textContent =
                "Remove";


            removeButton.addEventListener(
                "click",
                function () {

                    removeItem(index);

                }
            );


            // QUANTITY

            const quantityBox =
                document.createElement(
                    "div"
                );


            quantityBox.className =
                "item-quantity";


            const minus =
                document.createElement(
                    "button"
                );


            minus.type =
                "button";

            minus.textContent =
                "−";

            minus.setAttribute(
                "aria-label",
                "Decrease quantity"
            );


            minus.addEventListener(
                "click",
                function () {

                    changeQuantity(
                        index,
                        -1
                    );

                }
            );


            const quantity =
                document.createElement(
                    "span"
                );


            quantity.textContent =
                item.quantity;


            const plus =
                document.createElement(
                    "button"
                );


            plus.type =
                "button";

            plus.textContent =
                "+";

            plus.setAttribute(
                "aria-label",
                "Increase quantity"
            );


            plus.addEventListener(
                "click",
                function () {

                    changeQuantity(
                        index,
                        1
                    );

                }
            );


            quantityBox.appendChild(
                minus
            );

            quantityBox.appendChild(
                quantity
            );

            quantityBox.appendChild(
                plus
            );


            actions.appendChild(
                removeButton
            );

            actions.appendChild(
                quantityBox
            );


            // =================================
            // FINAL ITEM
            // =================================

            article.appendChild(
                image
            );

            article.appendChild(
                info
            );

            article.appendChild(
                actions
            );


            container.appendChild(
                article
            );

        }
    );

}


// =========================================
// ITEMS LABEL
// =========================================

function updateItemsLabel() {

    const totalItems =
        cart.reduce(
            function (
                total,
                item
            ) {

                return total +
                    Number(
                        item.quantity || 0
                    );

            },
            0
        );


    const label =
        document.getElementById(
            "itemsLabel"
        );


    if (label) {

        label.textContent =
            `${totalItems} ${
                totalItems === 1
                    ? "item"
                    : "items"
            }`;

    }

}


// =========================================
// GET LIVE PRODUCT
// =========================================

async function getLiveProduct(
    productId
) {

    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        return null;

    }


    try {

        const result =
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
                .eq(
                    "id",
                    productId
                )
                .maybeSingle();


        if (result.error) {

            console.error(
                "Could not check product:",
                result.error
            );

            return null;

        }


        return result.data || null;

    } catch (error) {

        console.error(
            "Could not check product:",
            error
        );

        return null;

    }

}


// =========================================
// CHANGE QUANTITY
// =========================================

async function changeQuantity(
    index,
    amount
) {

    const item =
        cart[index];


    if (!item) {

        return;

    }


    const currentQuantity =
        Number(
            item.quantity
        ) || 1;


    const newQuantity =
        currentQuantity +
        amount;


    if (newQuantity < 1) {

        return;

    }


    // Only check stock when increasing.

    if (amount > 0) {

        const product =
            await getLiveProduct(
                item.id
            );


        if (!product) {

            alert(
                "This product is no longer available."
            );

            cart.splice(
                index,
                1
            );

            saveCart();

            renderCart();

            updateCartCount();

            return;

        }


        if (
            product.is_active !== true
        ) {

            alert(
                "This product is no longer available."
            );

            cart.splice(
                index,
                1
            );

            saveCart();

            renderCart();

            updateCartCount();

            return;

        }


        const stock =
            Number(
                product.stock
            ) || 0;


        if (stock <= 0) {

            alert(
                "This product is currently out of stock."
            );

            cart.splice(
                index,
                1
            );

            saveCart();

            renderCart();

            updateCartCount();

            return;

        }


        if (newQuantity > stock) {

            alert(
                `Only ${stock} item${
                    stock === 1
                        ? ""
                        : "s"
                } available in stock.`
            );

            return;

        }


        // Update current product data.

        item.name =
            product.name;

        item.price =
            Number(
                product.price
            ) || 0;

        item.image =
            product.image ||
            null;

        item.icon =
            product.icon ||
            "👟";

        item.category =
            product.category ||
            "";

    }


    item.quantity =
        newQuantity;


    saveCart();

    renderCart();

    updateCartCount();

}


// =========================================
// REMOVE ITEM
// =========================================

function removeItem(index) {

    if (!cart[index]) {

        return;

    }


    cart.splice(
        index,
        1
    );


    saveCart();

    renderCart();

    updateCartCount();

}


// =========================================
// CLEAR CART
// =========================================

function clearCart() {

    if (cart.length === 0) {

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to clear your cart?"
        );


    if (!confirmed) {

        return;

    }


    cart = [];


    saveCart();

    renderCart();

    updateCartCount();

}


// =========================================
// CALCULATE SUBTOTAL
// =========================================

function calculateSubtotal() {

    return cart.reduce(
        function (
            total,
            item
        ) {

            return total +
                (
                    Number(
                        item.price || 0
                    ) *
                    Number(
                        item.quantity || 0
                    )
                );

        },
        0
    );

}


// =========================================
// PAYMENT OPTION STYLES
// =========================================

function updatePaymentOptionStyles() {

    const depositOption =
        document.getElementById(
            "cartDepositOption"
        );

    const fullOption =
        document.getElementById(
            "cartFullOption"
        );


    if (depositOption) {

        depositOption.classList.toggle(
            "selected",
            paymentMethod === "deposit"
        );

    }


    if (fullOption) {

        fullOption.classList.toggle(
            "selected",
            paymentMethod === "full"
        );

    }

}


// =========================================
// PAYMENT METHOD
// =========================================

function updatePaymentMethod() {

    const selected =
        document.querySelector(
            'input[name="cartPayment"]:checked'
        );


    if (!selected) {

        return;

    }


    paymentMethod =
        selected.value;


    localStorage.setItem(
        "ayodejiPaymentMethod",
        paymentMethod
    );


    updatePaymentOptionStyles();

    updateSummary();

}


// =========================================
// UPDATE SUMMARY
// =========================================

function updateSummary() {

    const subtotal =
        calculateSubtotal();


    const deposit =
        Math.round(
            subtotal * 0.60
        );


    const balance =
        subtotal -
        deposit;


    const payNow =
        paymentMethod === "deposit"
            ? deposit
            : subtotal;


    const remaining =
        paymentMethod === "deposit"
            ? balance
            : 0;


    const itemCount =
        cart.reduce(
            function (
                total,
                item
            ) {

                return total +
                    Number(
                        item.quantity || 0
                    );

            },
            0
        );


    const summaryItems =
        document.getElementById(
            "summaryItems"
        );


    if (summaryItems) {

        summaryItems.textContent =
            itemCount;

    }


    const summarySubtotal =
        document.getElementById(
            "summarySubtotal"
        );


    if (summarySubtotal) {

        summarySubtotal.textContent =
            formatNaira(
                subtotal
            );

    }


    const paymentTotal =
        document.getElementById(
            "paymentTotal"
        );


    if (paymentTotal) {

        paymentTotal.textContent =
            formatNaira(
                subtotal
            );

    }


    const paymentNow =
        document.getElementById(
            "paymentNow"
        );


    if (paymentNow) {

        paymentNow.textContent =
            formatNaira(
                payNow
            );

    }


    const paymentBalance =
        document.getElementById(
            "paymentBalance"
        );


    if (paymentBalance) {

        paymentBalance.textContent =
            formatNaira(
                remaining
            );

    }


    const balanceRow =
        document.getElementById(
            "balanceRow"
        );


    if (balanceRow) {

        balanceRow.style.display =
            paymentMethod === "deposit"
                ? "flex"
                : "none";

    }


    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );


    if (checkoutButton) {

        checkoutButton.disabled =
            cart.length === 0;

    }


    updatePaymentOptionStyles();

}


// =========================================
// CHECKOUT
// =========================================

function goToCheckout() {

    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    localStorage.setItem(
        "ayodejiPaymentMethod",
        paymentMethod
    );


    // Make sure the latest cart is saved.

    saveCart();


    window.location.href =
        "checkout.html";

}


// =========================================
// EVENTS
// =========================================

function setupEvents() {

    const clearButton =
        document.getElementById(
            "clearCartButton"
        );


    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                clearCart();

            }
        );

    }


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                goToCheckout();

            }
        );

    }


    const paymentInputs =
        document.querySelectorAll(
            'input[name="cartPayment"]'
        );


    paymentInputs.forEach(
        function (input) {

            input.addEventListener(
                "change",
                updatePaymentMethod
            );

        }
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