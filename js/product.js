// =========================================
// AYODEJI FASHION HUBS
// PRODUCT PAGE JAVASCRIPT
// =========================================

let currentProduct = null;

let selectedSize = "";

let quantity = 1;

let paymentPlan = 60;


// =========================================
// PAGE START
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Ayodeji Product Page loaded."
        );


        setupMobileMenu();

        updateCartCount();


        const supabaseClient =
            window.supabaseClient;


        if (!supabaseClient) {

            console.error(
                "Supabase client not found."
            );

            showProductError(
                "The store could not connect to the database."
            );

            return;
        }


        await loadProduct();

    }
);


// =========================================
// GET PRODUCT ID
// =========================================

function getProductId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("id");
}


// =========================================
// LOAD PRODUCT
// =========================================

async function loadProduct() {

    const productId =
        getProductId();


    console.log(
        "Product ID:",
        productId
    );


    if (!productId) {

        showProductError(
            "No product was selected. Please return to the shop and choose a product."
        );

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
                .from("products")
                .select("*")
                .eq("id", productId)
                .eq("is_active", true)
                .maybeSingle();


        if (error) {

            console.error(
                "Product loading error:",
                error
            );


            showProductError(
                "Unable to load this product right now."
            );


            return;
        }


        if (!data) {

            console.error(
                "Product not found:",
                productId
            );


            showProductError(
                "This product is unavailable or no longer exists."
            );


            return;
        }


        currentProduct =
            data;


        console.log(
            "Product loaded:",
            currentProduct
        );


        quantity = 1;

        selectedSize = "";

        paymentPlan = 60;


        renderProduct();

        setupProductControls();

        updateQuantityDisplay();

        updateProductSummary();

        hideLoading();


    } catch (error) {

        console.error(
            "Unexpected product error:",
            error
        );


        showProductError(
            "Something went wrong while loading this product."
        );

    }
}


// =========================================
// RENDER PRODUCT
// =========================================

function renderProduct() {

    if (!currentProduct) {
        return;
    }


    const product =
        currentProduct;


    // PAGE TITLE

    document.title =
        `${product.name} | Ayodeji Fashion Hubs`;


    // BREADCRUMB

    setText(
        "breadcrumbCategory",
        product.category || "Product"
    );


    setText(
        "breadcrumbProduct",
        product.name || "Product"
    );


    // CATEGORY

    setText(
        "productCategory",
        product.category || "Fashion"
    );


    // TITLE

    setText(
        "productTitle",
        product.name || "Product"
    );


    // DESCRIPTION

    setText(
        "productDescription",
        product.description ||
        "Quality fashion product from Ayodeji Fashion Hubs."
    );


    // PRICE

    setText(
        "productPrice",
        formatCurrency(
            product.price
        )
    );


    // OLD PRICE

    const oldPrice =
        document.getElementById(
            "productOldPrice"
        );


    const discount =
        document.getElementById(
            "productDiscount"
        );


    if (
        oldPrice &&
        Number(product.old_price) >
        Number(product.price)
    ) {

        oldPrice.textContent =
            formatCurrency(
                product.old_price
            );


        oldPrice.hidden =
            false;


        if (discount) {

            const percentage =
                calculateDiscount(
                    Number(product.old_price),
                    Number(product.price)
                );


            discount.textContent =
                `${percentage}% OFF`;


            discount.hidden =
                false;
        }


    } else {

        if (oldPrice) {

            oldPrice.hidden =
                true;
        }


        if (discount) {

            discount.hidden =
                true;
        }
    }


    // IMAGE

    renderProductImage();


    // BADGE

    const badge =
        document.getElementById(
            "productBadge"
        );


    if (badge) {

        if (product.badge) {

            badge.textContent =
                product.badge;

            badge.hidden =
                false;

        } else {

            badge.hidden =
                true;
        }
    }


    // STOCK

    renderStock();


    // SIZES

    renderSizes();
}


// =========================================
// IMAGE
// =========================================

function renderProductImage() {

    const image =
        document.getElementById(
            "productImage"
        );


    const placeholder =
        document.getElementById(
            "productImagePlaceholder"
        );


    if (!image) {
        return;
    }


    image.onerror =
        function () {

            console.warn(
                "Product image failed:",
                image.src
            );


            image.hidden =
                true;


            if (placeholder) {

                placeholder.hidden =
                    false;
            }
        };


    if (currentProduct.image) {

        image.src =
            currentProduct.image;


        image.alt =
            currentProduct.name ||
            "Product";


        image.hidden =
            false;


        if (placeholder) {

            placeholder.hidden =
                true;
        }


    } else {

        image.hidden =
            true;


        if (placeholder) {

            placeholder.hidden =
                false;
        }
    }
}


// =========================================
// STOCK
// =========================================

function renderStock() {

    const stock =
        Number(
            currentProduct.stock || 0
        );


    const container =
        document.getElementById(
            "productStock"
        );


    const text =
        document.getElementById(
            "stockText"
        );


    if (!container || !text) {
        return;
    }


    container.classList.remove(
        "low-stock",
        "out-of-stock"
    );


    if (stock <= 0) {

        container.classList.add(
            "out-of-stock"
        );


        text.textContent =
            "Out of stock";


        disablePurchaseButtons();


        return;
    }


    if (stock <= 5) {

        container.classList.add(
            "low-stock"
        );


        text.textContent =
            `Only ${stock} left in stock`;

    } else {

        text.textContent =
            `${stock} available`;
    }


    enablePurchaseButtons();
}


// =========================================
// ENABLE PURCHASE BUTTONS
// =========================================

function enablePurchaseButtons() {

    const addButton =
        document.getElementById(
            "addToCartButton"
        );


    const buyButton =
        document.getElementById(
            "buyNowButton"
        );


    if (addButton) {

        addButton.disabled =
            false;
    }


    if (buyButton) {

        buyButton.disabled =
            false;
    }
}


// =========================================
// DISABLE PURCHASE BUTTONS
// =========================================

function disablePurchaseButtons() {

    const addButton =
        document.getElementById(
            "addToCartButton"
        );


    const buyButton =
        document.getElementById(
            "buyNowButton"
        );


    const increase =
        document.getElementById(
            "increaseQuantity"
        );


    if (addButton) {

        addButton.disabled =
            true;
    }


    if (buyButton) {

        buyButton.disabled =
            true;
    }


    if (increase) {

        increase.disabled =
            true;
    }
}


// =========================================
// RENDER SIZES
// =========================================

function renderSizes() {

    const container =
        document.getElementById(
            "sizeOptions"
        );


    const section =
        document.getElementById(
            "sizeOption"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    selectedSize =
        "";


    const sizes =
        Array.isArray(
            currentProduct.sizes
        )
            ? currentProduct.sizes
            : [];


    if (sizes.length === 0) {

        if (section) {

            section.style.display =
                "none";
        }


        setText(
            "selectedSizeText",
            "Not required"
        );


        return;
    }


    if (section) {

        section.style.display =
            "block";
    }


    setText(
        "selectedSizeText",
        "Not selected"
    );


    sizes.forEach(
        function (size) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "size-option";


            button.textContent =
                size;


            button.dataset.size =
                String(size);


            button.addEventListener(
                "click",
                function () {

                    selectSize(
                        String(size)
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );
}


// =========================================
// SELECT SIZE
// =========================================

function selectSize(size) {

    selectedSize =
        String(size);


    document
        .querySelectorAll(
            ".size-option"
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.size ===
                        selectedSize
                );

            }
        );


    setText(
        "selectedSizeText",
        `Size ${selectedSize}`
    );


    clearProductMessage();

    updateProductSummary();
}


// =========================================
// SETUP PRODUCT CONTROLS
// =========================================

function setupProductControls() {

    const decrease =
        document.getElementById(
            "decreaseQuantity"
        );


    const increase =
        document.getElementById(
            "increaseQuantity"
        );


    const addButton =
        document.getElementById(
            "addToCartButton"
        );


    const buyButton =
        document.getElementById(
            "buyNowButton"
        );


    const deposit =
        document.getElementById(
            "depositPlan"
        );


    const full =
        document.getElementById(
            "fullPlan"
        );


    // -----------------------------------------
    // DECREASE
    // -----------------------------------------

    if (decrease) {

        decrease.onclick =
            function () {

                if (quantity <= 1) {
                    return;
                }


                quantity--;


                updateQuantityDisplay();

                updateProductSummary();
            };
    }


    // -----------------------------------------
    // INCREASE
    // -----------------------------------------

    if (increase) {

        increase.onclick =
            function () {

                if (!currentProduct) {
                    return;
                }


                const stock =
                    Number(
                        currentProduct.stock || 0
                    );


                if (quantity >= stock) {

                    showProductMessage(
                        `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
                        "error"
                    );


                    return;
                }


                quantity++;


                updateQuantityDisplay();

                updateProductSummary();
            };
    }


    // -----------------------------------------
    // DEPOSIT
    // -----------------------------------------

    if (deposit) {

        deposit.onchange =
            function () {

                if (deposit.checked) {

                    paymentPlan =
                        60;


                    updateProductSummary();
                }
            };
    }


    // -----------------------------------------
    // FULL PAYMENT
    // -----------------------------------------

    if (full) {

        full.onchange =
            function () {

                if (full.checked) {

                    paymentPlan =
                        100;


                    updateProductSummary();
                }
            };
    }


    // -----------------------------------------
    // ADD TO CART
    // -----------------------------------------

    if (addButton) {

        addButton.onclick =
            function () {

                addProductToCart();
            };
    }


    // -----------------------------------------
    // BUY NOW
    // -----------------------------------------

    if (buyButton) {

        buyButton.onclick =
            function () {

                buyProductNow();
            };
    }


    updateQuantityDisplay();
}


// =========================================
// QUANTITY DISPLAY
// =========================================

function updateQuantityDisplay() {

    const value =
        document.getElementById(
            "quantityValue"
        );


    const decrease =
        document.getElementById(
            "decreaseQuantity"
        );


    const increase =
        document.getElementById(
            "increaseQuantity"
        );


    if (value) {

        value.textContent =
            quantity;
    }


    if (decrease) {

        decrease.disabled =
            quantity <= 1;
    }


    if (increase) {

        const stock =
            Number(
                currentProduct?.stock || 0
            );


        increase.disabled =
            stock <= 0 ||
            quantity >= stock;
    }
}


// =========================================
// UPDATE PRODUCT SUMMARY
// =========================================

function updateProductSummary() {

    if (!currentProduct) {
        return;
    }


    const price =
        Number(
            currentProduct.price || 0
        );


    const subtotal =
        price * quantity;


    const payNow =
        paymentPlan === 60
            ? subtotal * 0.60
            : subtotal;


    const balance =
        subtotal - payNow;


    setText(
        "summarySubtotal",
        formatCurrency(subtotal)
    );


    setText(
        "summaryPayNow",
        formatCurrency(payNow)
    );


    setText(
        "summaryBalance",
        formatCurrency(balance)
    );


    setText(
        "summaryTotal",
        formatCurrency(subtotal)
    );
}


// =========================================
// CREATE CART ITEM
// =========================================

function createCartItem() {

    return {

        id:
            currentProduct.id,

        name:
            currentProduct.name,

        price:
            Number(
                currentProduct.price || 0
            ),

        old_price:
            Number(
                currentProduct.old_price || 0
            ),

        image:
            currentProduct.image || "",

        icon:
            currentProduct.icon || "👟",

        category:
            currentProduct.category || "",

        size:
            selectedSize || "",

        quantity:
            quantity

    };
}


// =========================================
// ADD TO CART
// =========================================

function addProductToCart() {

    if (!currentProduct) {

        showProductMessage(
            "Product is not loaded yet.",
            "error"
        );

        return;
    }


    const stock =
        Number(
            currentProduct.stock || 0
        );


    if (stock <= 0) {

        showProductMessage(
            "This product is currently out of stock.",
            "error"
        );

        return;
    }


    // CHECK SIZE

    const sizes =
        Array.isArray(
            currentProduct.sizes
        )
            ? currentProduct.sizes
            : [];


    if (
        sizes.length > 0 &&
        !selectedSize
    ) {

        showProductMessage(
            "Please select a size first.",
            "error"
        );

        return;
    }


    const cart =
        getCart();


    const existingIndex =
        cart.findIndex(
            function (item) {

                return (
                    String(item.id) ===
                        String(
                            currentProduct.id
                        )
                    &&
                    String(item.size || "") ===
                        String(
                            selectedSize || ""
                        )
                );

            }
        );


    // EXISTING ITEM

    if (existingIndex !== -1) {

        const existingQuantity =
            Number(
                cart[
                    existingIndex
                ].quantity || 0
            );


        const newQuantity =
            existingQuantity +
            quantity;


        if (newQuantity > stock) {

            showProductMessage(
                `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
                "error"
            );

            return;
        }


        cart[
            existingIndex
        ].quantity =
            newQuantity;


    } else {

        cart.push(
            createCartItem()
        );
    }


    saveCart(cart);

    updateCartCount();


    showProductMessage(
        "Product added to cart successfully.",
        "success"
    );
}


// =========================================
// BUY NOW
// =========================================

function buyProductNow() {

    if (!currentProduct) {

        showProductMessage(
            "Product is not loaded yet.",
            "error"
        );

        return;
    }


    const stock =
        Number(
            currentProduct.stock || 0
        );


    if (stock <= 0) {

        showProductMessage(
            "This product is currently out of stock.",
            "error"
        );

        return;
    }


    // CHECK SIZE

    const sizes =
        Array.isArray(
            currentProduct.sizes
        )
            ? currentProduct.sizes
            : [];


    if (
        sizes.length > 0 &&
        !selectedSize
    ) {

        showProductMessage(
            "Please select a size first.",
            "error"
        );

        return;
    }


    const cart =
        getCart();


    const existingIndex =
        cart.findIndex(
            function (item) {

                return (
                    String(item.id) ===
                        String(
                            currentProduct.id
                        )
                    &&
                    String(item.size || "") ===
                        String(
                            selectedSize || ""
                        )
                );

            }
        );


    if (existingIndex !== -1) {

        const existingQuantity =
            Number(
                cart[
                    existingIndex
                ].quantity || 0
            );


        const newQuantity =
            existingQuantity +
            quantity;


        if (newQuantity > stock) {

            showProductMessage(
                `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
                "error"
            );

            return;
        }


        cart[
            existingIndex
        ].quantity =
            newQuantity;


    } else {

        cart.push(
            createCartItem()
        );
    }


    saveCart(cart);

    updateCartCount();


    // SAVE PAYMENT PLAN

    localStorage.setItem(
        "ayodejiPaymentMethod",
        paymentPlan === 60
            ? "deposit"
            : "full"
    );


    // GO TO CART

    window.location.href =
        "cart.html";
}


// =========================================
// GET CART
// =========================================

function getCart() {

    try {

        const saved =
            localStorage.getItem(
                "ayodejiCart"
            );


        if (!saved) {

            return [];
        }


        const parsed =
            JSON.parse(saved);


        return Array.isArray(parsed)
            ? parsed
            : [];


    } catch (error) {

        console.error(
            "Unable to read cart:",
            error
        );


        return [];
    }
}


// =========================================
// SAVE CART
// =========================================

function saveCart(cart) {

    try {

        localStorage.setItem(
            "ayodejiCart",
            JSON.stringify(cart)
        );


    } catch (error) {

        console.error(
            "Unable to save cart:",
            error
        );


        showProductMessage(
            "Unable to save your cart on this device.",
            "error"
        );
    }
}


// =========================================
// CART COUNT
// =========================================

function updateCartCount() {

    const cart =
        getCart();


    const count =
        cart.reduce(
            function (total, item) {

                return total +
                    Number(
                        item.quantity || 0
                    );

            },
            0
        );


    const desktopCount =
        document.getElementById(
            "cartCount"
        );


    const mobileCount =
        document.getElementById(
            "mobileCartCount"
        );


    if (desktopCount) {

        desktopCount.textContent =
            count;
    }


    if (mobileCount) {

        mobileCount.textContent =
            count;
    }
}


// =========================================
// MOBILE MENU
// =========================================

function setupMobileMenu() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );


    const mobileMenu =
        document.getElementById(
            "mobileMenu"
        );


    const closeButton =
        document.getElementById(
            "closeMobileMenu"
        );


    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    if (!menuToggle || !mobileMenu) {

        console.warn(
            "Mobile menu elements not found."
        );

        return;
    }


    function openMenu() {

        mobileMenu.classList.add(
            "active"
        );


        if (overlay) {

            overlay.classList.add(
                "active"
            );
        }


        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );


        menuToggle.setAttribute(
            "aria-label",
            "Close menu"
        );


        mobileMenu.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";
    }


    function closeMenu() {

        mobileMenu.classList.remove(
            "active"
        );


        if (overlay) {

            overlay.classList.remove(
                "active"
            );
        }


        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );


        menuToggle.setAttribute(
            "aria-label",
            "Open menu"
        );


        mobileMenu.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";
    }


    menuToggle.onclick =
        function () {

            if (
                mobileMenu.classList.contains(
                    "active"
                )
            ) {

                closeMenu();

            } else {

                openMenu();
            }
        };


    if (closeButton) {

        closeButton.onclick =
            function () {

                closeMenu();
            };
    }


    if (overlay) {

        overlay.onclick =
            function () {

                closeMenu();
            };
    }


    mobileMenu
        .querySelectorAll("a")
        .forEach(
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
                mobileMenu.classList.contains(
                    "active"
                )
            ) {

                closeMenu();
            }

        }
    );
}


// =========================================
// SHOW MESSAGE
// =========================================

function showProductMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "productMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `product-message show ${type}`;


    clearTimeout(
        window.productMessageTimer
    );


    window.productMessageTimer =
        setTimeout(
            function () {

                clearProductMessage();

            },
            4000
        );
}


// =========================================
// CLEAR MESSAGE
// =========================================

function clearProductMessage() {

    const element =
        document.getElementById(
            "productMessage"
        );


    if (!element) {
        return;
    }


    element.className =
        "product-message";


    element.textContent =
        "";
}


// =========================================
// HIDE LOADING
// =========================================

function hideLoading() {

    const loading =
        document.getElementById(
            "productLoading"
        );


    const content =
        document.getElementById(
            "productContent"
        );


    if (loading) {

        loading.hidden =
            true;
    }


    if (content) {

        content.hidden =
            false;
    }
}


// =========================================
// SHOW ERROR
// =========================================

function showProductError(message) {

    const loading =
        document.getElementById(
            "productLoading"
        );


    const content =
        document.getElementById(
            "productContent"
        );


    const error =
        document.getElementById(
            "productError"
        );


    const errorMessage =
        document.getElementById(
            "productErrorMessage"
        );


    if (loading) {

        loading.hidden =
            true;
    }


    if (content) {

        content.hidden =
            true;
    }


    if (errorMessage) {

        errorMessage.textContent =
            message;
    }


    if (error) {

        error.hidden =
            false;
    }
}


// =========================================
// TEXT HELPER
// =========================================

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


// =========================================
// CURRENCY
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
        Number(amount || 0)
    );
}


// =========================================
// DISCOUNT
// =========================================

function calculateDiscount(
    oldPrice,
    newPrice
) {

    if (
        !oldPrice ||
        oldPrice <= newPrice
    ) {

        return 0;
    }


    return Math.round(
        (
            (oldPrice - newPrice)
            / oldPrice
        ) * 100
    );
}