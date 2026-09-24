/* =========================================
   AYODEJI FASHION HUBS
   PRODUCT DETAILS - SUPABASE
========================================= */

let currentProduct = null;
let selectedSize = null;
let quantity = 1;
let paymentMethod = "deposit";


/* =========================================
   HELPERS
========================================= */

function formatNaira(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}


function getProductId() {
    const params = new URLSearchParams(
        window.location.search
    );

    return params.get("id");
}


function formatCategory(category) {
    if (!category) {
        return "Product";
    }

    return category.charAt(0).toUpperCase()
        + category.slice(1);
}


/* =========================================
   LOAD PRODUCT FROM SUPABASE
========================================= */

async function loadProduct() {

    const productId = getProductId();

    const productContent =
        document.getElementById("productContent");

    const productError =
        document.getElementById("productError");


    if (!productId) {

        productContent.hidden = true;
        productError.hidden = false;

        document.title =
            "Product Not Found | Ayodeji Fashion Hubs";

        return;
    }


    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        productContent.hidden = true;
        productError.hidden = false;

        return;
    }


    try {

        const { data, error } =
            await supabaseClient
                .from("products")
                .select(`
                    id,
                    name,
                    category,
                    price,
                    old_price,
                    badge,
                    icon,
                    image,
                    description,
                    sizes,
                    stock,
                    is_active
                `)
                .eq("id", productId)
                .eq("is_active", true)
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {

            productContent.hidden = true;
            productError.hidden = false;

            document.title =
                "Product Not Found | Ayodeji Fashion Hubs";

            return;
        }


        currentProduct = data;

        quantity = 1;
        selectedSize = null;
        paymentMethod = "deposit";


        productContent.hidden = false;
        productError.hidden = true;

        renderProduct();


    } catch (error) {

        console.error(
            "Could not load product:",
            error
        );

        productContent.hidden = true;
        productError.hidden = false;

    }
}


/* =========================================
   RENDER PRODUCT
========================================= */

function renderProduct() {

    if (!currentProduct) {
        return;
    }


    document.title =
        `${currentProduct.name} | Ayodeji Fashion Hubs`;


    document.getElementById(
        "breadcrumbProduct"
    ).textContent =
        currentProduct.name;


    document.getElementById(
        "productCategory"
    ).textContent =
        formatCategory(currentProduct.category);


    document.getElementById(
        "productName"
    ).textContent =
        currentProduct.name;


    document.getElementById(
        "productPrice"
    ).textContent =
        formatNaira(currentProduct.price);


    /* =====================================
       OLD PRICE
    ===================================== */

    const oldPriceElement =
        document.getElementById(
            "productOldPrice"
        );


    if (
        currentProduct.old_price !== null &&
        Number(currentProduct.old_price) > 0
    ) {

        oldPriceElement.hidden = false;

        oldPriceElement.textContent =
            formatNaira(
                currentProduct.old_price
            );

    } else {

        oldPriceElement.hidden = true;

    }


    /* =====================================
       DESCRIPTION
    ===================================== */

    document.getElementById(
        "productDescription"
    ).textContent =
        currentProduct.description ||
        "Quality product from Ayodeji Fashion Hubs.";


    /* =====================================
       STOCK
    ===================================== */

    const stock =
        Number(currentProduct.stock) || 0;


    const stockElement =
        document.getElementById(
            "productStock"
        );


    if (stock > 0) {

        stockElement.textContent =
            `${stock} available`;

        stockElement.style.color =
            "#18753c";

    } else {

        stockElement.textContent =
            "Out of stock";

        stockElement.style.color =
            "#c62828";

    }


    /* =====================================
       IMAGE
    ===================================== */

    renderProductImage();


    /* =====================================
       BADGE
    ===================================== */

    const badge =
        document.getElementById(
            "productBadge"
        );


    if (currentProduct.badge) {

        badge.hidden = false;

        badge.textContent =
            currentProduct.badge;

    } else {

        badge.hidden = true;

    }


    /* =====================================
       SIZES
    ===================================== */

    renderSizes();


    /* =====================================
       DISABLE PURCHASE IF OUT OF STOCK
    ===================================== */

    const addButton =
        document.getElementById(
            "addToCartButton"
        );

    const buyButton =
        document.getElementById(
            "buyNowButton"
        );


    if (stock <= 0) {

        addButton.disabled = true;
        buyButton.disabled = true;

        addButton.textContent =
            "Out of Stock";

        buyButton.textContent =
            "Out of Stock";

    } else {

        addButton.disabled = false;
        buyButton.disabled = false;

        addButton.textContent =
            "Add to Cart";

        buyButton.textContent =
            "Buy Now";

    }


    updateSummary();

}


/* =========================================
   PRODUCT IMAGE
========================================= */

function renderProductImage() {

    const imageElement =
        document.getElementById(
            "productImage"
        );


    imageElement.innerHTML = "";


    if (currentProduct.image) {

        const image =
            document.createElement("img");


        image.src =
            currentProduct.image;


        image.alt =
            currentProduct.name;


        image.loading = "eager";


        image.onerror = () => {

            imageElement.innerHTML =
                "";

            imageElement.textContent =
                currentProduct.icon || "👟";

        };


        imageElement.appendChild(
            image
        );

    } else {

        imageElement.textContent =
            currentProduct.icon || "👟";

    }
}


/* =========================================
   SIZES
========================================= */

function renderSizes() {

    const sizeContainer =
        document.getElementById(
            "sizeOptions"
        );


    sizeContainer.innerHTML = "";


    const sizes =
        Array.isArray(currentProduct.sizes)
            ? currentProduct.sizes
            : [];


    if (sizes.length === 0) {

        sizeContainer.innerHTML =
            `<span style="color:#777;font-size:13px;">
                No size options available
            </span>`;

        return;
    }


    sizes.forEach(size => {

        const button =
            document.createElement("button");


        button.type = "button";

        button.className =
            "size-button";

        button.textContent =
            size;

        button.dataset.size =
            size;


        button.addEventListener(
            "click",
            () => {

                selectSize(size);

            }
        );


        sizeContainer.appendChild(
            button
        );

    });
}


/* =========================================
   SELECT SIZE
========================================= */

function selectSize(size) {

    selectedSize = String(size);


    document
        .querySelectorAll(
            ".size-button"
        )
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.size ===
                selectedSize
            );

        });


    document.getElementById(
        "selectedSizeText"
    ).textContent =
        `Size ${selectedSize}`;


    document.getElementById(
        "sizeError"
    ).hidden = true;
}


/* =========================================
   QUANTITY
========================================= */

function increaseQuantity() {

    if (!currentProduct) {
        return;
    }


    const stock =
        Number(currentProduct.stock) || 0;


    if (stock <= 0) {
        return;
    }


    if (quantity >= stock) {

        showMessage(
            "You cannot add more than the available stock.",
            false
        );

        return;
    }


    quantity++;

    updateSummary();
}


function decreaseQuantity() {

    if (quantity <= 1) {
        return;
    }


    quantity--;

    updateSummary();
}


/* =========================================
   PAYMENT METHOD
========================================= */

function updatePaymentMethod() {

    const selected =
        document.querySelector(
            'input[name="payment"]:checked'
        );


    if (!selected) {
        return;
    }


    paymentMethod =
        selected.value;


    document.getElementById(
        "depositOption"
    ).classList.toggle(
        "selected",
        paymentMethod === "deposit"
    );


    document.getElementById(
        "fullOption"
    ).classList.toggle(
        "selected",
        paymentMethod === "full"
    );


    updateSummary();
}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    if (!currentProduct) {
        return;
    }


    const price =
        Number(currentProduct.price) || 0;


    const total =
        price * quantity;


    const deposit =
        Math.round(total * 0.60);


    const balance =
        total - deposit;


    const payNow =
        paymentMethod === "deposit"
            ? deposit
            : total;


    const remainingBalance =
        paymentMethod === "deposit"
            ? balance
            : 0;


    document.getElementById(
        "depositAmount"
    ).textContent =
        formatNaira(deposit);


    document.getElementById(
        "fullAmount"
    ).textContent =
        formatNaira(total);


    document.getElementById(
        "summaryItem"
    ).textContent =
        currentProduct.name;


    document.getElementById(
        "summaryQuantity"
    ).textContent =
        quantity;


    document.getElementById(
        "summaryTotal"
    ).textContent =
        formatNaira(total);


    document.getElementById(
        "summaryPayNow"
    ).textContent =
        formatNaira(payNow);


    document.getElementById(
        "summaryBalance"
    ).textContent =
        formatNaira(remainingBalance);


    document.getElementById(
        "quantity"
    ).textContent =
        quantity;


    document.getElementById(
        "balanceRow"
    ).style.display =
        paymentMethod === "deposit"
            ? "flex"
            : "none";
}


/* =========================================
   CART
========================================= */

function getCart() {

    try {

        const cart =
            JSON.parse(
                localStorage.getItem(
                    "ayodejiCart"
                )
            );


        return Array.isArray(cart)
            ? cart
            : [];

    } catch (error) {

        console.error(
            "Could not read cart:",
            error
        );

        return [];
    }
}


function saveCart(cart) {

    localStorage.setItem(
        "ayodejiCart",
        JSON.stringify(cart)
    );
}


/* =========================================
   ADD TO CART
========================================= */

function addToCart() {

    if (!currentProduct) {
        return false;
    }


    const stock =
        Number(currentProduct.stock) || 0;


    if (stock <= 0) {

        showMessage(
            "This product is currently out of stock.",
            false
        );

        return false;
    }


    /* Require size */

    if (!selectedSize) {

        document.getElementById(
            "sizeError"
        ).hidden = false;


        document.getElementById(
            "sizeOptions"
        ).scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        return false;
    }


    if (quantity > stock) {

        showMessage(
            "There is not enough stock for that quantity.",
            false
        );

        return false;
    }


    const cart =
        getCart();


    const existingItem =
        cart.find(item =>
            item.id === currentProduct.id &&
            String(item.size) ===
                String(selectedSize)
        );


    if (existingItem) {

        const newQuantity =
            Number(existingItem.quantity || 0)
            + quantity;


        if (newQuantity > stock) {

            showMessage(
                "There is not enough stock for that quantity.",
                false
            );

            return false;
        }


        existingItem.quantity =
            newQuantity;


    } else {

        cart.push({

            id: currentProduct.id,

            name: currentProduct.name,

            price: Number(
                currentProduct.price
            ),

            image:
                currentProduct.image ||
                null,

            icon:
                currentProduct.icon ||
                "👟",

            category:
                currentProduct.category ||
                "",

            size:
                selectedSize,

            quantity:
                quantity

        });
    }


    saveCart(cart);

    updateCartCount();


    showMessage(
        `${currentProduct.name} has been added to your cart.`,
        true
    );


    return true;
}


/* =========================================
   BUY NOW
========================================= */

function buyNow() {

    const added =
        addToCart();


    if (!added) {
        return;
    }


    window.location.href =
        "cart.html";
}


/* =========================================
   CART COUNT
========================================= */

function updateCartCount() {

    const cart =
        getCart();


    const count =
        cart.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 0
                ),
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
   MESSAGE
========================================= */

function showMessage(
    message,
    success = true
) {

    const messageElement =
        document.getElementById(
            "actionMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.hidden =
        false;


    messageElement.textContent =
        message;


    if (success) {

        messageElement.style.background =
            "#eaf7ee";

        messageElement.style.color =
            "#176b35";

    } else {

        messageElement.style.background =
            "#fff0f0";

        messageElement.style.color =
            "#b42318";
    }


    clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        setTimeout(() => {

            messageElement.hidden =
                true;

        }, 3500);
}


/* =========================================
   BUTTON FEEDBACK
========================================= */

function buttonFeedback(
    button,
    text
) {

    const originalText =
        button.textContent;


    button.textContent =
        text;


    button.disabled =
        true;


    setTimeout(() => {

        button.textContent =
            originalText;

        button.disabled =
            false;

    }, 1200);
}


/* =========================================
   EVENT LISTENERS
========================================= */

function setupProductEvents() {

    const increaseButton =
        document.getElementById(
            "increaseQuantity"
        );


    const decreaseButton =
        document.getElementById(
            "decreaseQuantity"
        );


    const addButton =
        document.getElementById(
            "addToCartButton"
        );


    const buyButton =
        document.getElementById(
            "buyNowButton"
        );


    if (increaseButton) {

        increaseButton.addEventListener(
            "click",
            increaseQuantity
        );
    }


    if (decreaseButton) {

        decreaseButton.addEventListener(
            "click",
            decreaseQuantity
        );
    }


    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                const added =
                    addToCart();


                if (added) {

                    buttonFeedback(
                        addButton,
                        "Added ✓"
                    );
                }
            }
        );
    }


    if (buyButton) {

        buyButton.addEventListener(
            "click",
            buyNow
        );
    }


    document
        .querySelectorAll(
            'input[name="payment"]'
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

        setupProductEvents();

        updateCartCount();


        const year =
            document.getElementById(
                "currentYear"
            );


        if (year) {

            year.textContent =
                new Date().getFullYear();
        }


        await loadProduct();
    }
);