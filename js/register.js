// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER REGISTRATION
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeRegistration();
});

function initializeRegistration() {

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error("Supabase client was not loaded.");
        showMessage(
            "Unable to connect to the registration service. Please refresh the page.",
            "error"
        );
        return;
    }

    const registerForm =
        document.getElementById("registerForm");

    const togglePassword =
        document.getElementById("togglePassword");

    const toggleConfirmPassword =
        document.getElementById("toggleConfirmPassword");

    if (!registerForm) {
        console.error("Registration form not found.");
        return;
    }

    // -----------------------------------------
    // PASSWORD TOGGLE
    // -----------------------------------------

    if (togglePassword) {
        togglePassword.addEventListener("click", () => {

            const password =
                document.getElementById("password");

            if (!password) return;

            if (password.type === "password") {
                password.type = "text";
                togglePassword.textContent = "🙈";
            } else {
                password.type = "password";
                togglePassword.textContent = "👁️";
            }

        });
    }

    // -----------------------------------------
    // CONFIRM PASSWORD TOGGLE
    // -----------------------------------------

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener("click", () => {

            const confirmPassword =
                document.getElementById("confirmPassword");

            if (!confirmPassword) return;

            if (confirmPassword.type === "password") {
                confirmPassword.type = "text";
                toggleConfirmPassword.textContent = "🙈";
            } else {
                confirmPassword.type = "password";
                toggleConfirmPassword.textContent = "👁️";
            }

        });
    }

    // -----------------------------------------
    // REGISTRATION
    // -----------------------------------------

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessage();

        const fullName =
            document.getElementById("fullName")?.value.trim() || "";

        const phone =
            document.getElementById("phone")?.value.trim() || "";

        const email =
            document.getElementById("email")?.value.trim().toLowerCase() || "";

        const password =
            document.getElementById("password")?.value || "";

        const confirmPassword =
            document.getElementById("confirmPassword")?.value || "";

        const deliveryAddress =
            document.getElementById("deliveryAddress")?.value.trim() || "";

        const deliveryCity =
            document.getElementById("deliveryCity")?.value.trim() || "";

        const deliveryState =
            document.getElementById("deliveryState")?.value || "";

        const agreeTerms =
            document.getElementById("agreeTerms")?.checked || false;

        // -----------------------------------------
        // VALIDATION
        // -----------------------------------------

        if (!fullName) {
            showMessage(
                "Please enter your full name.",
                "error"
            );
            return;
        }

        if (!phone) {
            showMessage(
                "Please enter your phone number.",
                "error"
            );
            return;
        }

        if (!isValidPhone(phone)) {
            showMessage(
                "Please enter a valid Nigerian phone number.",
                "error"
            );
            return;
        }

        if (!email) {
            showMessage(
                "Please enter your email address.",
                "error"
            );
            return;
        }

        if (!isValidEmail(email)) {
            showMessage(
                "Please enter a valid email address.",
                "error"
            );
            return;
        }

        if (password.length < 6) {
            showMessage(
                "Password must be at least 6 characters.",
                "error"
            );
            return;
        }

        if (password !== confirmPassword) {
            showMessage(
                "Passwords do not match.",
                "error"
            );
            return;
        }

        if (!deliveryAddress) {
            showMessage(
                "Please enter your delivery address.",
                "error"
            );
            return;
        }

        if (!deliveryCity) {
            showMessage(
                "Please enter your delivery city.",
                "error"
            );
            return;
        }

        if (!deliveryState) {
            showMessage(
                "Please select your state.",
                "error"
            );
            return;
        }

        if (!agreeTerms) {
            showMessage(
                "Please agree to the Terms & Conditions and Privacy Policy.",
                "error"
            );
            return;
        }

        // -----------------------------------------
        // LOADING STATE
        // -----------------------------------------

        setLoading(true);

        try {

            // -----------------------------------------
            // CHECK IF ANOTHER USER IS ALREADY SIGNED IN
            // -----------------------------------------

            const {
                data: existingSessionData
            } = await supabaseClient.auth.getSession();

            if (existingSessionData?.session) {

                await supabaseClient.auth.signOut();

            }

            // -----------------------------------------
            // CREATE SUPABASE ACCOUNT
            // -----------------------------------------

            const {
                data,
                error
            } = await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {
                    data: {
                        full_name: fullName,
                        name: fullName,
                        phone: phone
                    }
                }

            });

            if (error) {
                throw error;
            }

            if (!data?.user) {
                throw new Error(
                    "Account could not be created. Please try again."
                );
            }

            const user = data.user;

            // -----------------------------------------
            // SAVE CUSTOMER PROFILE
            // -----------------------------------------

            const {
                error: profileError
            } = await supabaseClient
                .from("customer_profiles")
                .upsert(
                    {
                        user_id: user.id,
                        full_name: fullName,
                        phone: phone,
                        delivery_address: deliveryAddress,
                        delivery_city: deliveryCity,
                        delivery_state: deliveryState,
                        updated_at: new Date().toISOString()
                    },
                    {
                        onConflict: "user_id"
                    }
                );

            if (profileError) {
                console.error(
                    "Profile save error:",
                    profileError
                );

                // The Auth account was created, so don't tell
                // the customer that registration completely failed.
                showMessage(
                    "Your account was created, but we could not save your delivery information. Please log in and update your profile.",
                    "error"
                );

                setLoading(false);
                return;
            }

            // -----------------------------------------
            // CHECK WHETHER EMAIL CONFIRMATION IS REQUIRED
            // -----------------------------------------

            const {
                data: sessionData
            } = await supabaseClient.auth.getSession();

            if (sessionData?.session) {

                showMessage(
                    "Account created successfully. Redirecting...",
                    "success"
                );

                setTimeout(() => {
                    redirectAfterRegistration();
                }, 800);

            } else {

                showMessage(
                    "Account created successfully. Please check your email to confirm your account, then log in.",
                    "success"
                );

                setLoading(false);

            }

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            showMessage(
                getRegistrationErrorMessage(error),
                "error"
            );

            setLoading(false);
        }

    });
}


// =========================================
// REDIRECT AFTER REGISTRATION
// =========================================

function redirectAfterRegistration() {

    const params =
        new URLSearchParams(window.location.search);

    const requestedRedirect =
        params.get("redirect");

    if (isSafeRedirect(requestedRedirect)) {
        window.location.href = requestedRedirect;
        return;
    }

    const savedCheckoutReturn =
        localStorage.getItem(
            "ayodejiCheckoutReturn"
        );

    if (isSafeRedirect(savedCheckoutReturn)) {

        localStorage.removeItem(
            "ayodejiCheckoutReturn"
        );

        window.location.href =
            savedCheckoutReturn;

        return;
    }

    // Default destination
    window.location.href = "index.html";
}


// =========================================
// SAFE REDIRECT
// =========================================

function isSafeRedirect(value) {

    if (!value) {
        return false;
    }

    // Only allow local HTML pages.
    if (
        value.includes("://") ||
        value.startsWith("//") ||
        value.toLowerCase().startsWith("javascript:")
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
// EMAIL VALIDATION
// =========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


// =========================================
// NIGERIAN PHONE VALIDATION
// =========================================

function isValidPhone(phone) {

    const cleaned =
        phone.replace(/[\s\-()]/g, "");

    return (
        /^0\d{10}$/.test(cleaned) ||
        /^\+234\d{10}$/.test(cleaned) ||
        /^234\d{10}$/.test(cleaned)
    );

}


// =========================================
// LOADING STATE
// =========================================

function setLoading(isLoading) {

    const button =
        document.getElementById("registerButton");

    const buttonText =
        document.getElementById("registerButtonText");

    const spinner =
        document.getElementById("registerSpinner");

    if (button) {
        button.disabled = isLoading;
    }

    if (buttonText) {
        buttonText.textContent =
            isLoading
                ? "Creating Account..."
                : "Create Account";
    }

    if (spinner) {
        spinner.style.display =
            isLoading
                ? "inline-block"
                : "none";
    }

}


// =========================================
// MESSAGE
// =========================================

function showMessage(message, type) {

    const messageElement =
        document.getElementById("registerMessage");

    if (!messageElement) return;

    messageElement.textContent = message;

    messageElement.className =
        `auth-message show ${type}`;

}


function clearMessage() {

    const messageElement =
        document.getElementById("registerMessage");

    if (!messageElement) return;

    messageElement.textContent = "";

    messageElement.className =
        "auth-message";

}


// =========================================
// SUPABASE ERROR TRANSLATION
// =========================================

function getRegistrationErrorMessage(error) {

    const message =
        error?.message || "";

    const lowerMessage =
        message.toLowerCase();

    if (
        lowerMessage.includes("already registered") ||
        lowerMessage.includes("already exists") ||
        lowerMessage.includes("user already registered")
    ) {
        return "An account with this email already exists. Please log in instead.";
    }

    if (
        lowerMessage.includes("password") &&
        lowerMessage.includes("weak")
    ) {
        return "Your password is too weak. Please use a stronger password.";
    }

    if (
        lowerMessage.includes("invalid email")
    ) {
        return "Please enter a valid email address.";
    }

    if (
        lowerMessage.includes("email rate limit")
    ) {
        return "Too many registration attempts. Please wait a little and try again.";
    }

    if (
        lowerMessage.includes("network") ||
        lowerMessage.includes("fetch")
    ) {
        return "Network error. Please check your internet connection and try again.";
    }

    return message ||
        "Registration failed. Please try again.";
}


// =========================================
// MAKE FUNCTIONS AVAILABLE
// =========================================

window.initializeRegistration =
    initializeRegistration;

window.redirectAfterRegistration =
    redirectAfterRegistration;