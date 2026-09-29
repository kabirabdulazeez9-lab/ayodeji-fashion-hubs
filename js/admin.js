/* =====================================================
   AYODEJI FASHION HUBS
   ADMIN DASHBOARD
===================================================== */

"use strict";

let supabaseClient = null;

let currentUser = null;
let currentOrder = null;

let allOrders = [];
let allProducts = [];
let allCategories = [];

let selectedProductImageFile = null;


/* =====================================================
   START
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Ayodeji Admin JS started.");

    supabaseClient = window.supabaseClient;

    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        showLoginMessage(
            "Supabase connection failed. Please refresh the page.",
            "error"
        );

        return;
    }


    setupLogin();
    setupPasswordToggle();
    setupLogout();
    setupNavigation();

    setupOrderControls();

    setupProductControls();
    setupCategoryControls();

    setupMobileMenu();

    await initializeAdmin();
});


/* =====================================================
   INITIALIZE
===================================================== */

async function initializeAdmin() {

    try {

        const {
            data: {
                session
            }
        } = await supabaseClient.auth.getSession();


        if (!session || !session.user) {

            showLoginView();

            return;
        }


        const isAdmin =
            await verifyAdmin(session.user);


        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            showLoginView();

            showLoginMessage(
                "This account is not registered as an admin.",
                "error"
            );

            return;
        }


        currentUser = session.user;

        showDashboard();

        await loadDashboardData();

    } catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );

        showLoginView();

        showLoginMessage(
            getErrorMessage(error),
            "error"
        );
    }
}


/* =====================================================
   VERIFY ADMIN
===================================================== */

async function verifyAdmin(user) {

    if (!user) {
        return false;
    }


    try {

        /*
         IMPORTANT:
         We check the authenticated user's ID,
         not only the email.
        */

        const {
            data,
            error
        } = await supabaseClient
            .from("admin_users")
            .select("user_id, email")
            .eq("user_id", user.id)
            .maybeSingle();


        if (error) {

            console.error(
                "Admin verification error:",
                error
            );

            return false;
        }


        console.log(
            "Logged-in user ID:",
            user.id
        );

        console.log(
            "Admin record:",
            data
        );


        return !!data;

    } catch (error) {

        console.error(
            "Admin verification failed:",
            error
        );

        return false;
    }
}


/* =====================================================
   LOGIN
===================================================== */

function setupLogin() {

    const form =
        document.getElementById("adminLoginForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            await loginAdmin();
        }
    );
}


async function loginAdmin() {

    const email =
        document
           