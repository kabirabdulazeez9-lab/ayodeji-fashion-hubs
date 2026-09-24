/* =========================================
   AYODEJI FASHION HUBS
   CART - SUPABASE STOCK SYNC
========================================= */

let cart = [];
let paymentMethod = "deposit";


/* =========================================
   FORMAT NAIRA
========================================= */

function formatNaira(amount) {

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);

}


/* =========================================
   LOAD CART
========================================= */

function loadCart() {

    try {

        const savedCart =
            JSON.parse(
                localStorage.getItem("ayodejiCart")
            );

        cart = Array.isArray(savedCart)
            ? savedCart
            : [];

    } catch (error) {

        console.error(
            "Could not load cart:",
            error
        );

        cart = [];

    }

}


/* =========================================
   SAVE CART
========================================= */

function saveCart() {

    localStorage.setItem(
        "ayodejiCart",
        JSON.stringify(cart)
    );

}


/* =========================================
   LOAD PAYMENT METHOD
========================================= */

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

        selectedInput.checked = true;

    }


    updatePaymentOptionStyles();

}


/* =========================================
   CART COUNT
========================================= */

function updateCartCount() {

    const count =
        cart.reduce(
            (total, item) => {

                return total +
                    Number(item.quantity || 0);

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

}


/* =========================================
   FORMAT CATEGORY
========================================= */

function formatCategory(category) {

    if (!category) {
        return "Product";
    }

    return category.charAt(0).toUpperCase()
        + category.slice(1);

}


/* =========================================
   SYNC CART WITH SUPABASE
========================================= */

async function syncCartWithProducts() {

    if (cart.length === 0) {
        return;
    }


    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        return;

    }


    const productIds =
        [
            ...new Set(
                cart
                    .map(item => item.id)
                    .filter(Boolean)
            )
        ];


    if (productIds.length === 0) {
        return;
    }


    try {

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
            .in("id", productIds);


        if (error) {
            throw error;
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


        cart.forEach(item => {

            const product =
                productMap.get(item.id);


            /*
               Product no longer exists
               or is no longer active.
            */

            if (
                !product ||
                product.is_active !== true
            ) {

                return;

            }


            const stock =
                Number(product.stock) || 0;


            /*
               Product is now out of stock.
            */

            if (stock <= 0) {

                return;

            }


            let quantity =
                Number(item.quantity) || 1;


            /*
               Never allow cart quantity
               to exceed live stock.
            */

            if (quantity > stock) {

                quantity = stock;

            }


            /*
               Update the cart with the
               current product information.
            */

            updatedCart.push({

                id:
                    product.id,

                name:
                    product.name,

                price:
                    Number(product.price) || 0,

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

        });


        cart =
            updatedCart;


        saveCart();

        updateCartCount();


    } catch (error) {

        console.error(
            "Could not sync cart with products:",
            error
        );

    }

}


/* =========================================
   RENDER CART
========================================= */

function renderCart() {

    const emptyCart =
        document.getElementById(
            "emptyCart"
        );

    const cartContent =
        document.getElementById(
            "cartContent"
        );


    if (!emptyCart || !cartContent) {
        return;
    }


    if (cart.length === 0) {

        emptyCart.hidden = false;

        cartContent.hidden = true;

        updateItemsLabel();

        updateSummary();

        return;

    }


    emptyCart.hidden = true;

    cartContent.hidden = false;


    renderCartItems();

    updateSummary();

}


/* =========================================
   RENDER ITEMS
========================================= */

function renderCartItems() {

    const container =
        document.getElementById(
            "cartItems"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    cart.forEach((item, index) => {

        const article =
            document.createElement("article");


        article.className =
            "cart-item";


        /* =================================
           IMAGE
        ================================= */

        const image =
            document.createElement("div");


        image.className =
            "cart-item-image";


        if (item.image) {

            const img =
                document.createElement("img");


            img.src =
                item.image;

            img.alt =
                item.name || "Product";


            img.loading =
                "lazy";


            img.onerror = () => {

                img.remove();

                image.textContent =
                    item.icon || "👟";

            };


            image.appendChild(img);

        } else {

            image.textContent =
                item.icon || "👟";

        }


        /* =================================
           INFO
        ================================= */

        const info =
            document.createElement("div");


        info.className =
            "cart-item-info";


        const category =
            document.createElement("div");


        category.className =
            "cart-item-category";


        category.textContent =
            formatCategory(
                item.category
            );


        const name =
            document.createElement("h3");


        name.className =
            "cart-item-name";


        name.textContent =
            item.name ||
            "Product";


        const meta =
            document.createElement("div");


        meta.className =
            "cart-item-meta";


        const size =
            document.createElement("span");


        size.textContent =
            item.size
                ? `Size: ${item.size}`
                : "Size not selected";


        const unitPrice =
            document.createElement("span");


        unitPrice.textContent =
            `Unit price: ${formatNaira(item.price)}`;


        meta.appendChild(size);

        meta.appendChild(unitPrice);


        const itemPrice =
            document.createElement("div");


        itemPrice.className =
            "cart-item-price";


        itemPrice.textContent =
            formatNaira(
                Number(item.price || 0) *
                Number(item.quantity || 0)
            );


        info.appendChild(category);

        info.appendChild(name);

        info.appendChild(meta);

        info.appendChild(itemPrice);


        /* =================================
           ACTIONS
        ================================= */

        const actions =
            document.createElement("div");


        actions.className =
            "cart-item-actions";


        const removeButton =
            document.createElement("button");


        removeButton.type =
            "button";


        removeButton.className =
            "remove-item";


        removeButton.textContent =
            "Remove";


        removeButton.addEventListener(
            "click",
            () => {

                removeItem(index);

            }
        );


        /* =================================
           QUANTITY
        ================================= */

        const quantityBox =
            document.createElement("div");


        quantityBox.className =
            "item-quantity";


        const minus =
            document.createElement("button");


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
            () => {

                changeQuantity(
                    index,
                    -1
                );

            }
        );


        const quantity =
            document.createElement("span");


        quantity.textContent =
            item.quantity;


        const plus =
            document.createElement("button");


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
            () => {

                changeQuantity(
                    index,
                    1
                );

            }
        );


        quantityBox.appendChild(minus);

        quantityBox.appendChild(quantity);

        quantityBox.appendChild(plus);


        actions.appendChild(removeButton);

        actions.appendChild(quantityBox);


        /* =================================
           ADD TO ITEM
        ================================= */

        article.appendChild(image);

        article.appendChild(info);

        article.appendChild(actions);


        container.appendChild(article);

    });


    updateItemsLabel();

}


/* =========================================
   GET LIVE PRODUCT STOCK
========================================= */

async function getLiveProduct(productId) {

    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {
        return null;
    }


    try {

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
            .eq("id", productId)
            .maybeSingle();


        if (error) {
            throw error;
        }


        return data || null;


    } catch (error) {

        console.error(
            "Could not check product stock:",
            error
        );

        return null;

    }

}


/* =========================================
   ITEMS LABEL
========================================= */

function updateItemsLabel() {

    const totalItems =
        cart.reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0),
            0
        );


    const label =
        document.getElementById(
            "itemsLabel"
        );


    if (!label) {
        return;
    }


    label.textContent =
        `${totalItems} ${
            totalItems === 1
                ? "item"
                : "items"
        }`;

}


/* =========================================
   CHANGE QUANTITY
========================================= */

async function changeQuantity(
    index,
    amount
) {

    const item =
        cart[index];


    if (!item) {
        return;
    }


    const newQuantity =
        Number(item.quantity || 0) +
        amount;


    if (newQuantity < 1) {
        return;
    }


    /*
       When increasing quantity,
       check the LIVE stock first.
    */

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


        if (!product.is_active) {

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
            Number(product.stock) || 0;


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


        /*
           Refresh price and product
           information as well.
        */

        item.name =
            product.name;

        item.price =
            Number(product.price) || 0;

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


/* =========================================
   REMOVE ITEM
========================================= */

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


/* =========================================
   CLEAR CART
========================================= */

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


/* =========================================
   CALCULATE SUBTOTAL
========================================= */

function calculateSubtotal() {

    return cart.reduce(
        (total, item) => {

            return total +
                (
                    Number(item.price || 0) *
                    Number(item.quantity || 0)
                );

        },
        0
    );

}


/* =========================================
   UPDATE PAYMENT OPTION STYLES
========================================= */

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


/* =========================================
   UPDATE PAYMENT METHOD
========================================= */

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


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    const subtotal =
        calculateSubtotal();


    const deposit =
        Math.round(
            subtotal * 0.60
        );


    const balance =
        subtotal - deposit;


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
            (total, item) =>
                total +
                Number(item.quantity || 0),
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
            formatNaira(subtotal);

    }


    const paymentTotal =
        document.getElementById(
            "paymentTotal"
        );


    if (paymentTotal) {

        paymentTotal.textContent =
            formatNaira(subtotal);

    }


    const paymentNow =
        document.getElementById(
            "paymentNow"
        );


    if (paymentNow) {

        paymentNow.textContent =
            formatNaira(payNow);

    }


    const paymentBalance =
        document.getElementById(
            "paymentBalance"
        );


    if (paymentBalance) {

        paymentBalance.textContent =
            formatNaira(remaining);

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

}


/* =========================================
   CHECKOUT
========================================= */

function goToCheckout() {

    if (cart.length === 0) {
        return;
    }


    localStorage.setItem(
        "ayodejiPaymentMethod",
        paymentMethod
    );


    window.location.href =
        "checkout.html";

}


/* =========================================
   EVENTS
========================================= */

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
            clearCart
        );

    }


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            goToCheckout
        );

    }


    document
        .querySelectorAll(
            'input[name="cartPayment"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                updatePaymentMethod
            );

        });

}


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        loadCart();

        loadPaymentMethod();

        setupEvents();

        updateCartCount();


        /*
           Sync cart with live Supabase
           product information before
           displaying the cart.
        */

        await syncCartWithProducts();


        renderCart();

        updateCartCount();


        const year =
            document.getElementById(
                "currentYear"
            );


        if (year) {

            year.textContent =
                new Date().getFullYear();

        }

    }
);