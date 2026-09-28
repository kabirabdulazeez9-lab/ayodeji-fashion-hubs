// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER LOGIN
// =========================================

document.addEventListener("DOMContentLoaded", initializeLogin);


// =========================================
// INITIALIZE LOGIN
// =========================================

async function initializeLogin() {

    console.log("Ayodeji Fashion Hubs login starting...");

    updateYear();

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {

        console.error("Supabase client was not loaded.");

        showMessage(
            "The login system could not connect. Please refresh the page.",
            "error"
        );

        return;
    }


    // Set up the page
    setupPasswordToggle();
    setupLoginForm();
    setupForgotPassword();


    // -------------------------------------------------
    // IMPORTANT:
    // DO NOT automatically redirect an existing session.
    //
    // This allows the customer to open login.html
    // and enter another account.
    // -------------------------------------------------

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Session check error:",
                error
            );

            return;
        }

        if (data?.session) {

            console.log(
                "An existing customer session was found:",
                data.session.user?.email
            );

            /*
             * We intentionally DO NOT redirect here.
             *
             * The customer may have opened login.html
             * because they want to sign into another account.
             */

        }

    } catch (error) {

        console.error(
            "Unable to check session:",
            error
        );
    }
}


// =========================================
// LOGIN FORM
// =========================================

function setupLoginForm() {

    const form =
        document.getElementById("loginForm");

    if (!form) {

        console.error(
            "Login form not found."
        );

        return;
    }

    form.addEventListener(
        "submit",
        handleLogin
    );
}


// =========================================
// HANDLE LOGIN
// =========================================

async function handleLogin(event) {

    event.preventDefault();

    const supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {

        showMessage(
            "The login system is unavailable. Please refresh the page.",
            "error"
        );

        return;
    }


    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");


    if (!emailInput || !passwordInput) {

        showMessage(
            "Login form is not available. Please refresh the page.",
            "error"
        );

        return;
    }


    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;


    clearMessage();


    // =========================================
    // VALIDATION
    // =========================================

    if (!email) {

        showMessage(
            "Please enter your email address.",
            "error"
        );

        emailInput.focus();

        return;
    }


    if (!isValidEmail(email)) {

        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        emailInput.focus();

        return;
    }


    if (!password) {

        showMessage(
            "Please enter your password.",
            "error"
        );

        passwordInput.focus();

        return;
    }


    if (password.length < 6) {

        showMessage(
            "Your password must contain at least 6 characters.",
            "error"
        );

        passwordInput.focus();

        return;
    }


    setLoginLoading(true);


    try {

        console.log(
            "Signing in:",
            email
        );


        // =========================================
        // SIGN OUT OLD SESSION FIRST
        // =========================================
        //
        // This is important if another customer is
        // already signed in on this browser.
        //

        const {
            data: currentSessionData
        } = await supabaseClient.auth.getSession();


        if (currentSessionData?.session) {

            console.log(
                "Existing session found. Replacing it with the new login."
            );

            await supabaseClient.auth.signOut();
        }


        // =========================================
        // SUPABASE LOGIN
        // =========================================

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        // =========================================
        // LOGIN ERROR
        // =========================================

        if (error) {

            console.error(
                "Supabase login error:",
                error
            );

            handleLoginError(error);

            return;
        }


        // =========================================
        // VERIFY USER
        // =========================================

        if (!data?.user) {

            console.error(
                "Supabase returned no user."
            );

            showMessage(
                "Login could not be completed. Please try again.",
                "error"
            );

            return;
        }


        console.log(
            "Customer login successful."
        );

        console.log(
            "User ID:",
            data.user.id
        );

        console.log(
            "User email:",
            data.user.email
        );


        // =========================================
        // VERIFY SESSION
        // =========================================

        const {
            data: verifySession,
            error: verifyError
        } =
            await supabaseClient.auth.getSession();


        if (
            verifyError ||
            !verifySession?.session
        ) {

            console.error(
                "Login succeeded but session was not found.",
                verifyError
            );

            showMessage(
                "Login was completed, but your session could not be saved. Please try again.",
                "error"
            );

            return;
        }


        console.log(
            "Session verified successfully."
        );


        // =========================================
        // SUCCESS MESSAGE
        // =========================================

        showMessage(
            "Login successful. Welcome back!",
            "success"
        );


        // =========================================
        // REDIRECT
        // =========================================

        setTimeout(
            () => {

                redirectAfterLogin();

            },
            500
        );


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        showMessage(
            "Something went wrong while signing in. Please try again.",
            "error"
        );

    } finally {

        setLoginLoading(false);
    }
}


// =========================================
// LOGIN ERROR
// =========================================

function handleLoginError(error) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        ) ||
        message.includes(
            "invalid credentials"
        )
    ) {

        showMessage(
            "Incorrect email or password. Please check your details and try again.",
            "error"
        );

        return;
    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        showMessage(
            "Please confirm your email address before signing in.",
            "error"
        );

        return;
    }


    if (
        message.includes(
            "too many requests"
        )
    ) {

        showMessage(
            "Too many login attempts. Please wait a moment and try again.",
            "error"
        );

        return;
    }


    if (
        message.includes(
            "network"
        )
    ) {

        showMessage(
            "Network error. Please check your internet connection and try again.",
            "error"
        );

        return;
    }


    showMessage(
        error?.message ||
        "Unable to sign in. Please try again.",
        "error"
    );
}


// =========================================
// PASSWORD VISIBILITY
// =========================================

function setupPasswordToggle() {

    const toggle =
        document.getElementById(
            "togglePassword"
        );

    const password =
        document.getElementById(
            "password"
        );


    if (!toggle || !password) {
        return;
    }


    toggle.addEventListener(
        "click",
        function () {

            const showing =
                password.type === "text";


            if (showing) {

                password.type =
                    "password";

                toggle.textContent =
                    "👁";

                toggle.setAttribute(
                    "aria-label",
                    "Show password"
                );

                toggle.setAttribute(
                    "aria-pressed",
                    "false"
                );

            } else {

                password.type =
                    "text";

                toggle.textContent =
                    "🙈";

                toggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

                toggle.setAttribute(
                    "aria-pressed",
                    "true"
                );
            }
        }
    );
}


// =========================================
// FORGOT PASSWORD
// =========================================

function setupForgotPassword() {

    const button =
        document.getElementById(
            "forgotPassword"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "email"
                );


            if (!emailInput) {
                return;
            }


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            if (!email) {

                showMessage(
                    "Enter your email address first, then tap Forgot password.",
                    "error"
                );

                emailInput.focus();

                return;
            }


            if (!isValidEmail(email)) {

                showMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                emailInput.focus();

                return;
            }


            const supabaseClient =
                window.supabaseClient;


            if (!supabaseClient) {

                showMessage(
                    "The password reset system is unavailable.",
                    "error"
                );

                return;
            }


            button.style.pointerEvents =
                "none";

            button.textContent =
                "Sending...";


            try {

                /*
                 * Return to the login page after
                 * requesting a password reset.
                 */

                const redirectUrl =
                    window.location.origin +
                    window.location.pathname;


                const {
                    error
                } =
                    await supabaseClient.auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    redirectUrl
                            }
                        );


                if (error) {

                    console.error(
                        "Password reset error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to send the password reset email.",
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Password reset instructions have been sent to your email.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Password reset error:",
                    error
                );

                showMessage(
                    "Unable to send the password reset email. Please try again.",
                    "error"
                );


            } finally {

                button.style.pointerEvents =
                    "";

                button.textContent =
                    "Forgot password?";
            }
        }
    );
}


// =========================================
// REDIRECT AFTER LOGIN
// =========================================

function redirectAfterLogin() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    // =========================================
    // 1. EXPLICIT REDIRECT
    // =========================================

    const requestedPage =
        params.get("redirect");


    if (
        requestedPage &&
        isSafeRedirect(requestedPage)
    ) {

        console.log(
            "Returning to requested page:",
            requestedPage
        );

        window.location.href =
            requestedPage;

        return;
    }


    // =========================================
    // 2. SAVED CHECKOUT REDIRECT
    // =========================================

    const savedCheckout =
        localStorage.getItem(
            "ayodejiCheckoutReturn"
        );


    if (
        savedCheckout &&
        isSafeRedirect(savedCheckout)
    ) {

        console.log(
            "Returning to checkout:",
            savedCheckout
        );


        localStorage.removeItem(
            "ayodejiCheckoutReturn"
        );


        window.location.href =
            savedCheckout;

        return;
    }


    // =========================================
    // 3. DEFAULT
    // =========================================

    console.log(
        "No return page specified. Opening homepage."
    );


    window.location.href =
        "index.html";
}


// =========================================
// SAFE REDIRECT
// =========================================

function isSafeRedirect(url) {

    if (!url) {
        return false;
    }


    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("//")
    ) {

        return false;
    }


    if (
        url
            .toLowerCase()
            .startsWith("javascript:")
    ) {

        return false;
    }


    return true;
}


// =========================================
// LOGIN LOADING
// =========================================

function setLoginLoading(isLoading) {

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


    if (!button) {
        return;
    }


    button.disabled =
        isLoading;


    if (buttonText) {

        buttonText.textContent =
            isLoading
                ? "SIGNING IN..."
                : "SIGN IN";
    }


    if (spinner) {

        spinner.hidden =
            !isLoading;
    }
}


// =========================================
// SHOW MESSAGE
// =========================================

function showMessage(
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
        "auth-message show " +
        (
            type === "success"
                ? "success"
                : "error"
        );
}


// =========================================
// CLEAR MESSAGE
// =========================================

function clearMessage() {

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
// EMAIL VALIDATION
// =========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
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