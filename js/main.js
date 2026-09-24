/* =========================================
AYODEJI FASHION HUBS
MAIN JAVASCRIPT
========================================= */

document.addEventListener(
"DOMContentLoaded",
() => {

    setupMobileMenu();

    updateCartCount();

    updateYear();

}

);

/* =========================================
MOBILE MENU
========================================= */

function setupMobileMenu() {

const menuButton =
    document.getElementById("menuButton");

const mobileMenu =
    document.getElementById("mobileMenu");


if (!menuButton || !mobileMenu) {
    return;
}


menuButton.addEventListener(
    "click",
    () => {

        const isOpen =
            mobileMenu.classList.toggle("open");


        menuButton.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );


        menuButton.textContent =
            isOpen ? "✕" : "☰";

    }
);


/*
    Close mobile menu when
    a navigation link is clicked.
*/

const links =
    mobileMenu.querySelectorAll("a");


links.forEach(link => {

    link.addEventListener(
        "click",
        () => {

            mobileMenu.classList.remove(
                "open"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            menuButton.textContent = "☰";

        }
    );

});

}

/* =========================================
CART COUNT
========================================= */

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
            localStorage.getItem(
                "ayodejiCart"
            )
        ) || [];

} catch (error) {

    console.error(
        "Unable to read shopping cart:",
        error
    );

}


const totalItems =
    cart.reduce(
        (total, item) => {

            return total +
                Number(
                    item.quantity || 1
                );

        },
        0
    );


cartCount.textContent =
    totalItems;

}

/* =========================================
CURRENT YEAR
========================================= */

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