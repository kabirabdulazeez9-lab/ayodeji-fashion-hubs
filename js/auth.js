// =========================================
// AYODEJI FASHION HUBS
// SHARED AUTHENTICATION HELPER
// =========================================

(function () {
    "use strict";

    // -----------------------------------------
    // GET SUPABASE CLIENT
    // -----------------------------------------

    function getSupabase() {
        if (!window.supabaseClient) {
            console.error(
                "Ayodeji Fashion Hubs: Supabase client is not available."
            );

            return null;
        }

        return window.supabaseClient;
    }


    // -----------------------------------------
    // GET CURRENT SESSION
    // -----------------------------------------

    async function getSession() {

        const supabaseClient = getSupabase();

        if (!supabaseClient) {
            return null;
        }

        try {

            const {
                data,
                error
            } = await supabaseClient.auth.getSession();

            if (error) {
                console.error(
                    "Error getting session:",
                    error
                );

                return null;
            }

            return data?.session || null;

        } catch (error) {

            console.error(
                "Unexpected session error:",
                error
            );

            return null;
        }
    }


    // -----------------------------------------
    // GET CURRENT USER
    // -----------------------------------------

    async function getCurrentUser() {

        const session =
            await getSession();

        return session?.user || null;
    }


    // -----------------------------------------
    // CHECK IF USER IS LOGGED IN
    // -----------------------------------------

    async function isLoggedIn() {

        const session =
            await getSession();

        return !!session;
    }


    // -----------------------------------------
    // REQUIRE LOGIN
    //
    // Use this on pages such as checkout,
    // profile and account pages.
    // -----------------------------------------

    async function requireLogin(options = {}) {

        const {
            redirect = "login.html",
            saveReturnUrl = true
        } = options;

        const session =
            await getSession();

        if (session) {
            return session;
        }

        // Save the page the customer was trying
        // to access.
        if (saveReturnUrl) {

            const currentPage =
                window.location.pathname
                    .split("/")
                    .pop() || "index.html";

            const currentQuery =
                window.location.search || "";

            const returnUrl =
                currentPage + currentQuery;

            localStorage.setItem(
                "ayodejiCheckoutReturn",
                returnUrl
            );
        }

        // Redirect to login.
        const separator =
            redirect.includes("?")
                ? "&"
                : "?";

        window.location.href =
            `${redirect}${separator}redirect=${encodeURIComponent(
                "checkout.html"
            )}`;

        return null;
    }


    // -----------------------------------------
    // LOGOUT
    // -----------------------------------------

    async function logout(options = {}) {

        const {
            redirect = "index.html"
        } = options;

        const supabaseClient =
            getSupabase();

        if (!supabaseClient) {
            return false;
        }

        try {

            const {
                error
            } = await supabaseClient.auth.signOut();

            if (error) {
                console.error(
                    "Logout error:",
                    error
                );

                return false;
            }

            // Remove saved checkout redirect.
            localStorage.removeItem(
                "ayodejiCheckoutReturn"
            );

            // Remove temporary auth data.
            localStorage.removeItem(
                "ayodejiLoginRedirect"
            );

            window.location.href =
                redirect;

            return true;

        } catch (error) {

            console.error(
                "Unexpected logout error:",
                error
            );

            return false;
        }
    }


    // -----------------------------------------
    // GET CUSTOMER PROFILE
    // -----------------------------------------

    async function getCustomerProfile(userId = null) {

        const supabaseClient =
            getSupabase();

        if (!supabaseClient) {
            return {
                data: null,
                error: new Error(
                    "Supabase client is unavailable."
                )
            };
        }

        try {

            let user = null;

            if (userId) {
                user = {
                    id: userId
                };
            } else {
                user =
                    await getCurrentUser();
            }

            if (!user) {

                return {
                    data: null,
                    error: new Error(
                        "Customer is not logged in."
                    )
                };
            }

            const {
                data,
                error
            } = await supabaseClient
                .from("customer_profiles")
                .select(`
                    user_id,
                    full_name,
                    phone,
                    delivery_address,
                    delivery_city,
                    delivery_state,
                    created_at,
                    updated_at
                `)
                .eq("user_id", user.id)
                .maybeSingle();

            return {
                data,
                error
            };

        } catch (error) {

            console.error(
                "Profile loading error:",
                error
            );

            return {
                data: null,
                error
            };
        }
    }


    // -----------------------------------------
    // SAVE CUSTOMER PROFILE
    // -----------------------------------------

    async function saveCustomerProfile(profile = {}) {

        const supabaseClient =
            getSupabase();

        if (!supabaseClient) {

            return {
                data: null,
                error: new Error(
                    "Supabase client is unavailable."
                )
            };
        }

        try {

            const user =
                await getCurrentUser();

            if (!user) {

                return {
                    data: null,
                    error: new Error(
                        "You must be logged in to save your profile."
                    )
                };
            }

            const profileData = {

                user_id: user.id,

                full_name:
                    String(
                        profile.full_name || ""
                    ).trim(),

                phone:
                    String(
                        profile.phone || ""
                    ).trim(),

                delivery_address:
                    String(
                        profile.delivery_address || ""
                    ).trim(),

                delivery_city:
                    String(
                        profile.delivery_city || ""
                    ).trim(),

                delivery_state:
                    String(
                        profile.delivery_state || ""
                    ).trim(),

                updated_at:
                    new Date().toISOString()

            };

            const {
                data,
                error
            } = await supabaseClient
                .from("customer_profiles")
                .upsert(
                    profileData,
                    {
                        onConflict: "user_id"
                    }
                )
                .select()
                .single();

            return {
                data,
                error
            };

        } catch (error) {

            console.error(
                "Profile saving error:",
                error
            );

            return {
                data: null,
                error
            };
        }
    }


    // -----------------------------------------
    // GET USER DISPLAY NAME
    // -----------------------------------------

    async function getUserDisplayName() {

        const user =
            await getCurrentUser();

        if (!user) {
            return "Customer";
        }

        const metadata =
            user.user_metadata || {};

        return (
            metadata.full_name ||
            metadata.name ||
            user.email?.split("@")[0] ||
            "Customer"
        );
    }


    // -----------------------------------------
    // GET USER EMAIL
    // -----------------------------------------

    async function getUserEmail() {

        const user =
            await getCurrentUser();

        return user?.email || "";
    }


    // -----------------------------------------
    // CHECK AUTHENTICATION AND UPDATE UI
    // -----------------------------------------

    async function updateAuthUI() {

        const session =
            await getSession();

        const loggedIn =
            !!session;

        // Elements that should only appear
        // when the customer is logged in.
        document
            .querySelectorAll(
                "[data-auth='logged-in']"
            )
            .forEach(element => {

                element.style.display =
                    loggedIn
                        ? ""
                        : "none";

            });


        // Elements that should only appear
        // when the customer is logged out.
        document
            .querySelectorAll(
                "[data-auth='logged-out']"
            )
            .forEach(element => {

                element.style.display =
                    loggedIn
                        ? "none"
                        : "";

            });


        // Customer name placeholders.
        if (loggedIn) {

            const name =
                await getUserDisplayName();

            document
                .querySelectorAll(
                    "[data-user-name]"
                )
                .forEach(element => {

                    element.textContent =
                        name;

                });


            document
                .querySelectorAll(
                    "[data-user-email]"
                )
                .forEach(element => {

                    element.textContent =
                        session.user.email || "";

                });
        }
    }


    // -----------------------------------------
    // AUTH STATE LISTENER
    // -----------------------------------------

    function listenForAuthChanges(callback) {

        const supabaseClient =
            getSupabase();

        if (!supabaseClient) {
            return null;
        }

        const {
            data
        } =
            supabaseClient.auth.onAuthStateChange(
                (event, session) => {

                    console.log(
                        "Auth state changed:",
                        event
                    );

                    if (
                        typeof callback ===
                        "function"
                    ) {

                        callback(
                            event,
                            session
                        );
                    }

                }
            );

        return data?.subscription || null;
    }


    // -----------------------------------------
    // SAFE REDIRECT
    // -----------------------------------------

    function isSafeRedirect(value) {

        if (!value) {
            return false;
        }

        const lower =
            value.toLowerCase();

        if (
            lower.includes("://") ||
            value.startsWith("//") ||
            lower.startsWith("javascript:")
        ) {
            return false;
        }

        return (
            value.endsWith(".html") ||
            value.startsWith("./") ||
            value.startsWith("/")
        );
    }


    // -----------------------------------------
    // GET SAVED RETURN URL
    // -----------------------------------------

    function getSavedReturnUrl() {

        const saved =
            localStorage.getItem(
                "ayodejiCheckoutReturn"
            );

        if (
            saved &&
            isSafeRedirect(saved)
        ) {
            return saved;
        }

        return null;
    }


    // -----------------------------------------
    // CLEAR SAVED RETURN URL
    // -----------------------------------------

    function clearSavedReturnUrl() {

        localStorage.removeItem(
            "ayodejiCheckoutReturn"
        );
    }


    // -----------------------------------------
    // REDIRECT AFTER LOGIN
    // -----------------------------------------

    function redirectAfterLogin() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const requestedRedirect =
            params.get("redirect");

        if (
            requestedRedirect &&
            isSafeRedirect(requestedRedirect)
        ) {

            clearSavedReturnUrl();

            window.location.href =
                requestedRedirect;

            return;
        }

        const saved =
            getSavedReturnUrl();

        if (saved) {

            clearSavedReturnUrl();

            window.location.href =
                saved;

            return;
        }

        window.location.href =
            "index.html";
    }


    // -----------------------------------------
    // REDIRECT AFTER LOGOUT
    // -----------------------------------------

    function redirectAfterLogout() {

        window.location.href =
            "index.html";
    }


    // -----------------------------------------
    // AUTH ERROR MESSAGE
    // -----------------------------------------

    function getAuthErrorMessage(error) {

        if (!error) {
            return "Something went wrong. Please try again.";
        }

        const message =
            error.message || "";

        const lower =
            message.toLowerCase();

        if (
            lower.includes("invalid login credentials")
        ) {
            return "Incorrect email or password.";
        }

        if (
            lower.includes("email not confirmed")
        ) {
            return "Please confirm your email address before logging in.";
        }

        if (
            lower.includes("user already registered") ||
            lower.includes("already registered")
        ) {
            return "An account with this email already exists. Please log in.";
        }

        if (
            lower.includes("password")
        ) {
            return message;
        }

        if (
            lower.includes("network") ||
            lower.includes("fetch")
        ) {
            return "Network error. Please check your internet connection.";
        }

        return message ||
            "Authentication failed. Please try again.";
    }


    // -----------------------------------------
    // EXPOSE AUTH FUNCTIONS
    // -----------------------------------------

    window.AyodejiAuth = {

        getSession,

        getCurrentUser,

        isLoggedIn,

        requireLogin,

        logout,

        getCustomerProfile,

        saveCustomerProfile,

        getUserDisplayName,

        getUserEmail,

        updateAuthUI,

        listenForAuthChanges,

        isSafeRedirect,

        getSavedReturnUrl,

        clearSavedReturnUrl,

        redirectAfterLogin,

        redirectAfterLogout,

        getAuthErrorMessage

    };

})();