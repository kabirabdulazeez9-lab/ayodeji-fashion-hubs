// =========================================
// AYODEJI FASHION HUBS - CUSTOMER LOGIN
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error("Supabase client was not loaded.");
        return;
    }

    const loginForm =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("loginEmail");

    const passwordInput =
        document.getElementById("loginPassword");

    const togglePassword =
        document.getElementById("toggleLoginPassword");

    const loginButton =
        document.getElementById("loginButton");

    const loginButtonText =
        document.getElementById("loginButtonText");

    const message =
        document.getElementById("loginMessage");


    // =========================================
    // CHECK EXISTING SESSION
    // =========================================

    try {

        const {
            data: {
                session
            }
        } = await supabaseClient.auth.getSession();

        if (session) {

            window.location.href =
                "profile.html";

            return;
        }

    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

    }


    // =========================================
    // PASSWORD TOGGLE
    // =========================================

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            () => {

                const isPassword =
                    passwordInput.type === "password";

                passwordInput.type =
                    isPassword
                        ? "text"
                        : "password";

                togglePassword.textContent =
                    isPassword
                        ? "🙈"
                        : "👁️";

                togglePassword.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Hide password"
                        : "Show password"
                );

            }
        );

    }


    // =========================================
    // SHOW MESSAGE
    // =========================================

    function showMessage(
        text,
        type = "error"
    ) {

        if (!message) return;

        message.textContent = text;

        message.className =
            "auth-message " + type;

    }


    // =========================================
    // CLEAR MESSAGE
    // =========================================

    function clearMessage() {

        if (!message) return;

        message.textContent = "";

        message.className =
            "auth-message";

    }


    // =========================================
    // SET LOADING
    // =========================================

    function setLoading(isLoading) {

        if (!loginButton) return;

        loginButton.disabled =
            isLoading;

        if (loginButtonText) {

            loginButtonText.textContent =
                isLoading
                    ? "Logging in..."
                    : "Login";

        }

    }


    // =========================================
    // LOGIN
    // =========================================

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;


            // ---------------------------------
            // VALIDATION
            // ---------------------------------

            if (!email) {

                showMessage(
                    "Please enter your email address."
                );

                emailInput.focus();

                return;
            }


            if (!password) {

                showMessage(
                    "Please enter your password."
                );

                passwordInput.focus();

                return;
            }


            if (password.length < 6) {

                showMessage(
                    "Your password must be at least 6 characters."
                );

                passwordInput.focus();

                return;
            }


            // ---------------------------------
            // START LOGIN
            // ---------------------------------

            setLoading(true);


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signInWithPassword({

                        email: email,

                        password: password

                    });


                // ---------------------------------
                // ERROR
                // ---------------------------------

                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    const errorMessage =
                        error.message || "";

                    if (
                        errorMessage
                            .toLowerCase()
                            .includes("email not confirmed")
                    ) {

                        showMessage(
                            "Please confirm your email address before logging in."
                        );

                    } else if (
                        errorMessage
                            .toLowerCase()
                            .includes("invalid login credentials")
                    ) {

                        showMessage(
                            "Incorrect email or password."
                        );

                    } else {

                        showMessage(
                            errorMessage ||
                            "Unable to log in. Please try again."
                        );

                    }

                    setLoading(false);

                    return;
                }


                // ---------------------------------
                // SUCCESS
                // ---------------------------------

                if (data && data.session) {

                    showMessage(
                        "Login successful. Redirecting...",
                        "success"
                    );

                    setTimeout(() => {

                        window.location.href =
                            "profile.html";

                    }, 700);

                    return;
                }


                // ---------------------------------
                // NO SESSION
                // ---------------------------------

                showMessage(
                    "Login completed, but no active session was created."
                );

                setLoading(false);

            } catch (error) {

                console.error(
                    "Unexpected login error:",
                    error
                );

                showMessage(
                    "Something went wrong. Please try again."
                );

                setLoading(false);

            }

        }
    );

});