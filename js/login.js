// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER LOGIN
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeLogin();
});


// =========================================
// INITIALIZE LOGIN
// =========================================

function initializeLogin() {

    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "Ayodeji Fashion Hubs: Supabase client was not loaded."
        );

        showLoginMessage(
            "Unable to connect to the login service. Please refresh the page.",
            "error"
        );

        return;
    }


    const loginForm =
        document.getElementById(
            "loginForm"
        );


    if (!loginForm) {

        console.error(
            "Login form was not found."
        );

        return;
    }


    setupPasswordToggle();

    setupForgotPassword();

    setupLoginForm();

}


// =========================================
// PASSWORD TOGGLE
// =========================================

function setupPasswordToggle() {

    const togglePassword =
        document.getElementById(
            "togglePassword"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    if (
        !togglePassword ||
        !passwordInput
    ) {

        return;
    }


    togglePassword.addEventListener(
        "click",
        () => {

            if (
                passwordInput.type ===
                "password"
            ) {

                passwordInput.type =
                    "text";


                togglePassword.textContent =
                    "🙈";


                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type =
                    "password";


                togglePassword.textContent =
                    "👁️";


                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        }
    );

}


// =========================================
// FORGOT PASSWORD
// =========================================

function setupForgotPassword() {

    const forgotPassword =
        document.getElementById(
            "forgotPassword"
        );


    if (!forgotPassword) {
        return;
    }


    forgotPassword.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const supabaseClient =
                window.supabaseClient;


            const emailInput =
                document.getElementById(
                    "email"
                );


            const email =
                emailInput?.value
                    ?.trim()
                    .toLowerCase() || "";


            if (!email) {

                showLoginMessage(
                    "Please enter your email address first.",
                    "error"
                );


                emailInput?.focus();

                return;
            }


            if (!isValidEmail(email)) {

                showLoginMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            setLoading(true);


            try {

                const redirectURL =
                    getSiteURL(
                        "login.html"
                    );


                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    redirectURL
                            }
                        );


                if (error) {

                    throw error;
                }


                showLoginMessage(
                    "Password reset instructions have been sent to your email.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Password reset error:",
                    error
                );


                showLoginMessage(
                    getLoginErrorMessage(
                        error
                    ),
                    "error"
                );

            } finally {

                setLoading(false);

            }

        }
    );

}


// =========================================
// LOGIN FORM
// =========================================

function setupLoginForm() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    if (!loginForm) {
        return;
    }


    loginForm.addEventListener(
        "submit",
        handleLogin
    );

}


// =========================================
// HANDLE LOGIN
// =========================================

async function handleLogin(
    event
) {

    event.preventDefault();


    const supabaseClient =
        window.supabaseClient;


    clearLoginMessage();


    const emailInput =
        document.getElementById(
            "email"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    const rememberMe =
        document.getElementById(
            "rememberMe"
        );


    const email =
        emailInput?.value
            ?.trim()
            .toLowerCase() || "";


    const password =
        passwordInput?.value || "";


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!email) {

        showLoginMessage(
            "Please enter your email address.",
            "error"
        );

        emailInput?.focus();

        return;
    }


    if (!isValidEmail(email)) {

        showLoginMessage(
            "Please enter a valid email address.",
            "error"
        );

        emailInput?.focus();

        return;
    }


    if (!password) {

        showLoginMessage(
            "Please enter your password.",
            "error"
        );

        passwordInput?.focus();

        return;
    }


    setLoading(true);


    try {

        // -----------------------------------------
        // CHECK FOR EXISTING SESSION
        // -----------------------------------------

        const {
            data: existingSessionData
        } =
            await supabaseClient
                .auth
                .getSession();


        // -----------------------------------------
        // SIGN OUT EXISTING USER
        // -----------------------------------------

        if (
            existingSessionData?.session
        ) {

            await supabaseClient
                .auth
                .signOut();

        }


        // -----------------------------------------
        // SIGN IN
        // -----------------------------------------

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });


        if (error) {

            throw error;
        }


        if (!data?.user) {

            throw new Error(
                "Login failed. No user account was returned."
            );

        }


        // -----------------------------------------
        // VERIFY SESSION
        // -----------------------------------------

        const {
            data: verifiedSession,
            error: sessionError
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            sessionError ||
            !verifiedSession?.session
        ) {

            throw new Error(
                "Your login was not completed. Please try again."
            );

        }


        // -----------------------------------------
        // SAVE PENDING PROFILE
        // -----------------------------------------

        const profileResult =
            await savePendingProfile(
                supabaseClient,
                data.user
            );


        if (
            profileResult ===
            "saved"
        ) {

            console.log(
                "Pending customer profile saved."
            );

        } else if (
            profileResult ===
            "failed"
        ) {

            console.warn(
                "Pending customer profile could not be saved."
            );

            showLoginMessage(
                "Login successful, but your delivery information could not be saved. You can update it from your profile.",
                "error"
            );

            setTimeout(() => {

                redirectAfterLogin();

            }, 1800);

            return;
        }


        // -----------------------------------------
        // SUCCESS
        // -----------------------------------------

        showLoginMessage(
            "Login successful. Redirecting...",
            "success"
        );


        // -----------------------------------------
        // REDIRECT
        // -----------------------------------------

        setTimeout(() => {

            redirectAfterLogin();

        }, 700);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        showLoginMessage(
            getLoginErrorMessage(
                error
            ),
            "error"
        );


        setLoading(false);

    }

}


// =========================================
// SAVE PENDING PROFILE
// =========================================

async function savePendingProfile(
    supabaseClient,
    user
) {

    if (
        !supabaseClient ||
        !user
    ) {

        return "none";
    }


    const pendingData =
        localStorage.getItem(
            "ayodejiPendingProfile"
        );


    if (!pendingData) {

        return "none";
    }


    let profile;


    try {

        profile =
            JSON.parse(
                pendingData
            );

    } catch (error) {

        console.error(
            "Invalid pending profile:",
            error
        );


        localStorage.removeItem(
            "ayodejiPendingProfile"
        );


        return "failed";
    }


    if (!profile) {

        localStorage.removeItem(
            "ayodejiPendingProfile"
        );


        return "none";
    }


    // -----------------------------------------
    // MAKE SURE PROFILE BELONGS TO
    // CURRENT LOGGED-IN USER
    // -----------------------------------------

    profile.user_id =
        user.id;


    // -----------------------------------------
    // FALLBACK AUTH DATA
    // -----------------------------------------

    const metadata =
        user.user_metadata || {};


    if (!profile.full_name) {

        profile.full_name =
            metadata.full_name ||
            metadata.name ||
            "";

    }


    if (!profile.phone) {

        profile.phone =
            metadata.phone ||
            "";

    }


    // -----------------------------------------
    // SAVE TO CUSTOMER_PROFILES
    // -----------------------------------------

    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "customer_profiles"
                )
                .upsert(
                    {

                        user_id:
                            user.id,

                        full_name:
                            profile.full_name || null,

                        phone:
                            profile.phone || null,

                        delivery_address:
                            profile.delivery_address || null,

                        delivery_city:
                            profile.delivery_city || null,

                        delivery_state:
                            profile.delivery_state || null,

                        updated_at:
                            new Date()
                                .toISOString()

                    },
                    {
                        onConflict:
                            "user_id"
                    }
                );


        if (error) {

            console.error(
                "Pending profile save error:",
                error
            );

            return "failed";
        }


        // -----------------------------------------
        // PROFILE SAVED SUCCESSFULLY
        // -----------------------------------------

        localStorage.removeItem(
            "ayodejiPendingProfile"
        );


        return "saved";


    } catch (error) {

        console.error(
            "Pending profile save exception:",
            error
        );


        return "failed";

    }

}


// =========================================
// REDIRECT AFTER LOGIN
// =========================================

function redirectAfterLogin() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedRedirect =
        params.get(
            "redirect"
        );


    // -----------------------------------------
    // EXPLICIT REDIRECT
    // -----------------------------------------

    if (
        requestedRedirect &&
        isSafeRedirect(
            requestedRedirect
        )
    ) {

        window.location.href =
            requestedRedirect;

        return;
    }


    // -----------------------------------------
    // SAVED CHECKOUT REDIRECT
    // -----------------------------------------

    const savedCheckoutReturn =
        localStorage.getItem(
            "ayodejiCheckoutReturn"
        );


    if (
        savedCheckoutReturn &&
        isSafeRedirect(
            savedCheckoutReturn
        )
    ) {

        localStorage.removeItem(
            "ayodejiCheckoutReturn"
        );


        window.location.href =
            savedCheckoutReturn;

        return;
    }


    // -----------------------------------------
    // DEFAULT
    // -----------------------------------------

    window.location.href =
        "index.html";

}


// =========================================
// SAFE REDIRECT
// =========================================

function isSafeRedirect(
    value
) {

    if (!value) {
        return false;
    }


    const lowerValue =
        value.toLowerCase();


    // Block external URLs.
    if (
        lowerValue.includes(
            "://"
        ) ||
        value.startsWith("//") ||
        lowerValue.startsWith(
            "javascript:"
        )
    ) {

        return false;
    }


    return (
        value.endsWith(".html") ||
        value.startsWith("./") ||
        value.startsWith("/")
    );

}


// =========================================
// SITE URL
// =========================================

function getSiteURL(
    page
) {

    const currentURL =
        window.location.href;


    const baseURL =
        currentURL.substring(
            0,
            currentURL.lastIndexOf("/") + 1
        );


    return (
        baseURL +
        page
    );

}


// =========================================
// EMAIL VALIDATION
// =========================================

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// =========================================
// LOADING STATE
// =========================================

function setLoading(
    isLoading
) {

    const button =
        document.getElementById(
            "loginButton"
        );


    const buttonText =
        document.getElementById(
            "loginButtonText"
        );


    const spinner =
        document.getElementById(
            "loginSpinner"
        );


    if (button) {

        button.disabled =
            isLoading;

    }


    if (buttonText) {

        buttonText.textContent =
            isLoading
                ? "Signing In..."
                : "Sign In";

    }


    if (spinner) {

        spinner.style.display =
            isLoading
                ? "inline-block"
                : "none";

    }

}


// =========================================
// SHOW LOGIN MESSAGE
// =========================================

function showLoginMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "loginMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `auth-message show ${type}`;

}


// =========================================
// CLEAR LOGIN MESSAGE
// =========================================

function clearLoginMessage() {

    const element =
        document.getElementById(
            "loginMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "auth-message";

}


// =========================================
// LOGIN ERROR TRANSLATOR
// =========================================

function getLoginErrorMessage(
    error
) {

    const message =
        error?.message || "";


    const lower =
        message.toLowerCase();


    // -----------------------------------------
    // INVALID LOGIN
    // -----------------------------------------

    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return (
            "Incorrect email or password. Please check your details and try again."
        );

    }


    // -----------------------------------------
    // EMAIL NOT CONFIRMED
    // -----------------------------------------

    if (
        lower.includes(
            "email not confirmed"
        )
    ) {

        return (
            "Please confirm your email address before logging in. Check your inbox for the confirmation email."
        );

    }


    // -----------------------------------------
    // USER NOT FOUND
    // -----------------------------------------

    if (
        lower.includes(
            "user not found"
        )
    ) {

        return (
            "No account was found with this email address. Please create an account first."
        );

    }


    // -----------------------------------------
    // WEAK PASSWORD
    // -----------------------------------------

    if (
        lower.includes(
            "password"
        ) &&
        lower.includes(
            "weak"
        )
    ) {

        return (
            "Your password does not meet the required security level."
        );

    }


    // -----------------------------------------
    // RATE LIMIT
    // -----------------------------------------

    if (
        lower.includes(
            "rate limit"
        )
    ) {

        return (
            "Too many login attempts. Please wait a little and try again."
        );

    }


    // -----------------------------------------
    // NETWORK
    // -----------------------------------------

    if (
        lower.includes(
            "network"
        ) ||
        lower.includes(
            "fetch"
        )
    ) {

        return (
            "Network error. Please check your internet connection and try again."
        );

    }


    // -----------------------------------------
    // DEFAULT
    // -----------------------------------------

    return (
        message ||
        "Login failed. Please try again."
    );

}


// =========================================
// EXPORT
// =========================================

window.initializeLogin =
    initializeLogin;

window.handleLogin =
    handleLogin;

window.savePendingProfile =
    savePendingProfile;

window.redirectAfterLogin =
    redirectAfterLogin;