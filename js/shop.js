/* =========================================
   AYODEJI FASHION HUBS
   SHOP PAGE
   SUPABASE VERSION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* =========================================
       ELEMENTS
    ========================================= */

    const productsGrid =
        document.getElementById("productsGrid");

    const productCount =
        document.getElementById("productCount");

    const noProducts =
        document.getElementById("noProducts");

    const searchInput =
        document.getElementById("searchInput");

    const categorySelect =
        document.getElementById("categorySelect");

    const sortSelect =
        document.getElementById("sortSelect");

    const categoryButtons =
        document.querySelectorAll(".category-button");

    const clearFiltersButton =
        document.getElementById("clearFiltersButton");


    /* =========================================
       SUPABASE
    ========================================= */

    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        productsGrid.innerHTML = `
            <div class="no-products">
                <div class="no-products-icon">
                    ⚠️
                </div>

                <h2>Unable to load products</h2>

                <p>
                    Please refresh the page and try again.
                </p>
            </div>
        `;

        return;
    }


    /* =========================================
       PRODUCTS
    ========================================= */

    let products = [];


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
       ESCAPE HTML
    ========================================= */

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================================
       CATEGORY NAME
    ========================================= */

    function getCategoryName(category) {

        const categories = {

            sneakers: "Sneakers",

            formal: "Formal Shoes",

            casual: "Casual Shoes",

            slippers: "Slippers"

        };

        return (
            categories[category] ||
            category ||
            "Other"
        );

    }


    /* =========================================
       PAYMENT CALCULATION
    ========================================= */

    function getPaymentAmounts(price) {

        const numericPrice =
            Number(price) || 0;


        const deposit =
            Math.round(
                numericPrice * 0.60
            );


        const balance =
            numericPrice - deposit;


        return {

            deposit,

            balance,

            fullPayment:
                numericPrice

        };

    }


    /* =========================================
       STOCK STATUS
    ========================================= */

    function getStockStatus(stock) {

        const quantity =
            Number(stock) || 0;


        if (quantity <= 0) {

            return {

                text: "Out of stock",

                className: "out-stock"

            };

        }


        if (quantity <= 5) {

            return {

                text: `Only ${quantity} left`,

                className: "low-stock"

            };

        }


        return {

            text: "In stock",

            className: "in-stock"

        };

    }


    /* =========================================
       LOAD PRODUCTS FROM SUPABASE
    ========================================= */

    async function loadProducts() {

        showLoading();


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
                old_price,
                badge,
                icon,
                image,
                description,
                sizes,
                stock,
                is_active,
                created_at
            `)

            .eq("is_active", true)

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Error loading products:",
                error
            );


            products = [];


            productsGrid.innerHTML = `
                <div class="no-products">
                    <div class="no-products-icon">
                        ⚠️
                    </div>

                    <h2>Unable to load products</h2>

                    <p>
                        ${escapeHTML(error.message)}
                    </p>
                </div>
            `;


            productCount.textContent = "0";

            return;
        }


        products =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "Products loaded:",
            products
        );


        filterProducts();

    }


    /* =========================================
       LOADING UI
    ========================================= */

    function showLoading() {

        productCount.textContent = "0";


        productsGrid.innerHTML = `

            <div class="admin-loading">

                <div class="admin-spinner"></div>

                <p>
                    Loading products...
                </p>

            </div>

        `;


        noProducts.hidden = true;

    }


    /* =========================================
       CREATE PRODUCT IMAGE
    ========================================= */

    function createProductImage(product) {

        const image =
            product.image;


        if (image) {

            return `

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="product-placeholder"
                    style="display:none;"
                    aria-label="${escapeHTML(product.name)}"
                >
                    ${escapeHTML(product.icon || "👟")}
                </div>

            `;

        }


        return `

            <div
                class="product-placeholder"
                aria-label="${escapeHTML(product.name)}"
            >
                ${escapeHTML(product.icon || "👟")}
            </div>

        `;

    }


    /* =========================================
       CREATE PRODUCT CARD
    ========================================= */

    function createProductCard(product) {

        const payment =
            getPaymentAmounts(
                product.price
            );


        const stock =
            getStockStatus(
                product.stock
            );


        const badge =
            product.badge
                ? `

                    <span
                        class="product-badge ${
                            String(product.badge)
                                .toLowerCase() === "sale"
                                ? "sale"
                                : ""
                        }"
                    >
                        ${escapeHTML(
                            product.badge
                        )}
                    </span>

                `
                : "";


        const oldPrice =
            product.old_price
                ? `

                    <span class="old-price">
                        ${formatNaira(
                            product.old_price
                        )}
                    </span>

                `
                : "";


        const sizes =
            Array.isArray(product.sizes)
                ? product.sizes
                : [];


        const sizeHTML =
            sizes
                .map(size => `

                    <span class="size">
                        ${escapeHTML(size)}
                    </span>

                `)
                .join("");


        return `

            <article
                class="product-card"
                data-product-id="${escapeHTML(product.id)}"
                tabindex="0"
                role="link"
                aria-label="View ${escapeHTML(product.name)}"
            >

                <div class="product-image">

                    ${createProductImage(product)}

                    ${badge}

                </div>


                <div class="product-body">

                    <span class="product-category">
                        ${escapeHTML(
                            getCategoryName(
                                product.category
                            )
                        )}
                    </span>


                    <h2 class="product-name">
                        ${escapeHTML(
                            product.name
                        )}
                    </h2>


                    <p class="product-description">
                        ${escapeHTML(
                            product.description ||
                            "Quality footwear from Ayodeji Fashion Hubs."
                        )}
                    </p>


                    <div class="product-price">

                        <span class="current-price">
                            ${formatNaira(
                                product.price
                            )}
                        </span>

                        ${oldPrice}

                    </div>


                    <div class="payment-preview">

                        <div>

                            <strong>
                                60% deposit:
                            </strong>

                            <span class="deposit">
                                ${formatNaira(
                                    payment.deposit
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Balance:
                            </strong>

                            <span class="balance">
                                ${formatNaira(
                                    payment.balance
                                )}
                            </span>

                        </div>

                    </div>


                    ${
                        sizes.length > 0
                            ? `

                                <div class="product-sizes">

                                    <span class="size-label">
                                        Available sizes
                                    </span>

                                    ${sizeHTML}

                                </div>

                            `
                            : ""
                    }


                    <span
                        class="stock-status ${stock.className}"
                    >
                        ${stock.text}
                    </span>


                    <div class="product-card-actions">

                        <button
                            type="button"
                            class="view-product"
                            data-product-id="${escapeHTML(product.id)}"
                        >
                            View Product
                        </button>


                        <button
                            type="button"
                            class="add-to-cart"
                            data-product-id="${escapeHTML(product.id)}"
                            ${
                                Number(product.stock) <= 0
                                    ? "disabled"
                                    : ""
                            }
                        >

                            ${
                                Number(product.stock) <= 0
                                    ? "Out of Stock"
                                    : "Add to Cart"
                            }

                        </button>

                    </div>

                </div>

            </article>

        `;

    }


    /* =========================================
       RENDER PRODUCTS
    ========================================= */

    function renderProducts(list) {

        productsGrid.innerHTML = "";


        productCount.textContent =
            list.length;


        if (list.length === 0) {

            noProducts.hidden = false;

            return;

        }


        noProducts.hidden = true;


        productsGrid.innerHTML =
            list
                .map(createProductCard)
                .join("");


        setupProductLinks();

        setupAddToCartButtons();

    }


    /* =========================================
       OPEN PRODUCT PAGE
    ========================================= */

    function openProduct(productId) {

        window.location.href =
            `product.html?id=${encodeURIComponent(
                productId
            )}`;

    }


    /* =========================================
       PRODUCT LINKS
    ========================================= */

    function setupProductLinks() {

        const cards =
            document.querySelectorAll(
                ".product-card"
            );


        cards.forEach(card => {

            const productId =
                card.dataset.productId;


            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "button"
                        )
                    ) {

                        return;

                    }


                    openProduct(
                        productId
                    );

                }
            );


            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        openProduct(
                            productId
                        );

                    }

                }
            );

        });


        const viewButtons =
            document.querySelectorAll(
                ".view-product"
            );


        viewButtons.forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    openProduct(
                        button.dataset.productId
                    );

                }
            );

        });

    }


    /* =========================================
       FILTER PRODUCTS
    ========================================= */

    function filterProducts() {

        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();


        const selectedCategory =
            categorySelect.value;


        let filtered =
            products.filter(product => {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();


                const description =
                    String(
                        product.description || ""
                    ).toLowerCase();


                const category =
                    String(
                        product.category || ""
                    ).toLowerCase();


                const matchesSearch =

                    name.includes(
                        searchTerm
                    )

                    ||

                    description.includes(
                        searchTerm
                    )

                    ||

                    category.includes(
                        searchTerm
                    );


                const matchesCategory =

                    selectedCategory === "all"

                    ||

                    product.category ===
                        selectedCategory;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            });


        /* =========================================
           SORT
        ========================================= */

        const sortValue =
            sortSelect.value;


        if (
            sortValue ===
            "price-low"
        ) {

            filtered.sort(
                (a, b) =>
                    Number(a.price) -
                    Number(b.price)
            );

        }


        if (
            sortValue ===
            "price-high"
        ) {

            filtered.sort(
                (a, b) =>
                    Number(b.price) -
                    Number(a.price)
            );

        }


        if (
            sortValue ===
            "name"
        ) {

            filtered.sort(
                (a, b) =>
                    String(a.name || "")
                        .localeCompare(
                            String(b.name || "")
                        )
            );

        }


        renderProducts(
            filtered
        );

    }


    /* =========================================
       CATEGORY BUTTONS
    ========================================= */

    categoryButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const category =
                    button.dataset.category;


                categorySelect.value =
                    category;


                categoryButtons.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                filterProducts();

            }
        );

    });


    /* =========================================
       SEARCH
    ========================================= */

    searchInput.addEventListener(
        "input",
        filterProducts
    );


    /* =========================================
       CATEGORY SELECT
    ========================================= */

    categorySelect.addEventListener(
        "change",
        () => {

            const selected =
                categorySelect.value;


            categoryButtons.forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.category ===
                        selected
                );

            });


            filterProducts();

        }
    );


    /* =========================================
       SORT
    ========================================= */

    sortSelect.addEventListener(
        "change",
        filterProducts
    );


    /* =========================================
       CLEAR FILTERS
    ========================================= */

    clearFiltersButton.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            categorySelect.value =
                "all";

            sortSelect.value =
                "default";


            categoryButtons.forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.category ===
                        "all"
                );

            });


            filterProducts();

        }
    );


    /* =========================================
       CART
    ========================================= */

    function getCart() {

        try {

            const cart =
                localStorage.getItem(
                    "ayodejiCart"
                );


            return cart
                ? JSON.parse(cart)
                : [];

        } catch (error) {

            console.error(
                "Unable to read cart:",
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


    function updateCartCount() {

        const cart =
            getCart();


        const count =
            cart.reduce(
                (total, item) =>
                    total +
                    Number(
                        item.quantity || 1
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
       ADD TO CART
    ========================================= */

    function setupAddToCartButtons() {

        const buttons =
            document.querySelectorAll(
                ".add-to-cart"
            );


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const productId =
                        button.dataset.productId;


                    const product =
                        products.find(
                            item =>
                                item.id ===
                                productId
                        );


                    if (!product) {
                        return;
                    }


                    if (
                        Number(product.stock) <=
                        0
                    ) {

                        return;

                    }


                    /*
                     * A size must be selected
                     * before adding a shoe to cart.
                     *
                     * Therefore the customer is sent
                     * to the product page.
                     */

                    openProduct(
                        productId
                    );

                }
            );

        });

    }


    /* =========================================
       URL CATEGORY
    ========================================= */

    function loadCategoryFromURL() {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const category =
            params.get(
                "category"
            );


        if (
            category &&
            [
                "sneakers",
                "formal",
                "casual",
                "slippers"
            ].includes(category)
        ) {

            categorySelect.value =
                category;


            categoryButtons.forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.category ===
                        category
                );

            });

        }

    }


    /* =========================================
       INITIALIZE
    ========================================= */

    loadCategoryFromURL();

    updateCartCount();

    await loadProducts();

});