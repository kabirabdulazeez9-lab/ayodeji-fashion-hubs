// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER LOGIN
// =========================================


document.addEventListener(
    "DOMContentLoaded",
    initializeLogin
);


async function initializeLogin() {

    console.log(
        "Ayodeji Fashion Hubs login starting..."
    );


    updateYear();


    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        showMessage(
            "The login system could not connect. Please refresh the page.",
            "error"
        );

        return;
    }


    setupPasswordToggle();

    setupLoginForm();

    setupForgotPassword();


    /*
        Check whether the customer is
        already signed in.
    */

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session check error:",
                error
            );

            return;
        }


        if (data && data.session) {

            console.log(
                "Customer already signed in."
            );

            redirectAfterLogin();

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
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    clearMessage();


    // =====================================
    // VALIDATION
    // =====================================

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
            "Signing in customer..."
        );


        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error(
                "Login error:",
                error
            );


            handleLoginError(error);

            return;
        }


        if (!data || !data.user) {

            showMessage(
                "Login could not be completed. Please try again.",
                "error"
            );

            return;
        }


        console.log(
            "Customer login successful."
        );


        showMessage(
            "Login successful. Welcome back!",
            "success"
        );


        /*
            Small delay allows the success
            message to be visible before
            redirecting.
        */

        setTimeout(
            redirectAfterLogin,
            700
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
            error.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
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


    showMessage(
        error.message ||
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
                emailInput.value.trim();


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
                    Supabase redirects the customer
                    back to the login page after
                    the reset link is opened.
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
// REDIRECT
// =========================================

function redirectAfterLogin() {

    /*
        If another page sent the customer
        to login, return them there.
    */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedPage =
        params.get("redirect");


    if (
        requestedPage &&
        isSafeRedirect(requestedPage)
    ) {

        window.location.href =
            requestedPage;

        return;
    }


    /*
        Default destination after login.
    */

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


    /*
        Only allow local pages.
        Prevents external redirect URLs.
    */

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("//")
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
// MESSAGE
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