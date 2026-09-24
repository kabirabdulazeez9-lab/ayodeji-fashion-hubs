// =========================================
// AYODEJI FASHION HUBS
// MAIN JAVASCRIPT
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    setupMobileMenu();
    updateCartCount();
    updateYear();

});


// =========================================
// MOBILE MENU
// =========================================

function setupMobileMenu() {

    const menuButton = document.getElementById("menuButton");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!menuButton || !mobileMenu) {
        console.error("Mobile menu elements not found.");
        return;
    }

    function openMenu() {

        mobileMenu.classList.add("open");

        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );

        menuButton.setAttribute(
            "aria-label",
            "Close navigation menu"
        );

        menuButton.textContent = "✕";

        document.body.style.overflow = "hidden";
    }


    function closeMenu() {

        mobileMenu.classList.remove("open");

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        menuButton.setAttribute(
            "aria-label",
            "Open navigation menu"
        );

        menuButton.textContent = "☰";

        document.body.style.overflow = "";
    }


    menuButton.addEventListener("click", function () {

        if (mobileMenu.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }

    });


    // Close when a menu link is clicked

    const links = mobileMenu.querySelectorAll("a");

    links.forEach(function (link) {

        link.addEventListener("click", function () {
            closeMenu();
        });

    });


    // Close when Android/browser back-style escape is used

    document.addEventListener("keydown", function (event) {

        if (
            event.key === "Escape" &&
            mobileMenu.classList.contains("open")
        ) {
            closeMenu();
        }

    });

}


// =========================================
// CART COUNT
// =========================================

function updateCartCount() {

    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }


    let cart = [];


    try {

        cart =
            JSON.parse(
                localStorage.getItem("ayodejiCart")
            ) || [];

    } catch (error) {

        console.error(
            "Unable to read shopping cart:",
            error
        );

        cart = [];

    }


    const totalItems =
        cart.reduce(
            function (total, item) {

                return total +
                    Number(item.quantity || 1);

            },
            0
        );


    cartCount.textContent = totalItems;

}


// =========================================
// CURRENT YEAR
// =========================================

function updateYear() {

    const year =
        document.getElementById("currentYear");

    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}