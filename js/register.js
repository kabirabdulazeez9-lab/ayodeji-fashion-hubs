// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER REGISTRATION
// Email confirmation compatible
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeRegistration();
});


// =========================================
// INITIALIZE
// =========================================

function initializeRegistration() {

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error(
            "Ayodeji Fashion Hubs: Supabase client was not loaded."
        );

        showMessage(
            "Unable to connect to the registration service. Please refresh the page.",
            "error"
        );

        return;
    }

    const registerForm =
        document.getElementById("registerForm");

    if (!registerForm) {
        console.error(
            "Registration form was not found."
        );

        return;
    }


    // -----------------------------------------
    // PASSWORD TOGGLE
    // -----------------------------------------

    const togglePassword =
        document.getElementById("togglePassword");

    if (togglePassword) {

        togglePassword.addEventListener("click", () => {

            const password =
                document.getElementById("password");

            if (!password) return;

            if (password.type === "password") {

                password.type = "text";

                togglePassword.textContent = "🙈";

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                password.type = "password";

                togglePassword.textContent = "👁️";

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

        });
    }


    // -----------------------------------------
    // CONFIRM PASSWORD TOGGLE
    // -----------------------------------------

    const toggleConfirmPassword =
        document.getElementById(
            "toggleConfirmPassword"
        );

    if (toggleConfirmPassword) {

        toggleConfirmPassword.addEventListener(
            "click",
            () => {

                const confirmPassword =
                    document.getElementById(
                        "confirmPassword"
                    );

                if (!confirmPassword) return;

                if (
                    confirmPassword.type ===
                    "password"
                ) {

                    confirmPassword.type = "text";

                    toggleConfirmPassword.textContent =
                        "🙈";

                    toggleConfirmPassword.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    confirmPassword.type =
                        "password";

                    toggleConfirmPassword.textContent =
                        "👁️";

                    toggleConfirmPassword.setAttribute(
                        "aria-label",
                        "Show password"
                    );
                }

            }
        );
    }


    // -----------------------------------------
    // REGISTRATION FORM
    // -----------------------------------------

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();


            // -----------------------------------------
            // GET FORM VALUES
            // -----------------------------------------

            const fullName =
                document
                    .getElementById("fullName")
                    ?.value
                    .trim() || "";


            const phone =
                document
                    .getElementById("phone")
                    ?.value
                    .trim() || "";


            const email =
                document
                    .getElementById("email")
                    ?.value
                    .trim()
                    .toLowerCase() || "";


            const password =
                document
                    .getElementById("password")
                    ?.value || "";


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    ?.value || "";


            const deliveryAddress =
                document
                    .getElementById("deliveryAddress")
                    ?.value
                    .trim() || "";


            const deliveryCity =
                document
                    .getElementById("deliveryCity")
                    ?.value
                    .trim() || "";


            const deliveryState =
                document
                    .getElementById("deliveryState")
                    ?.value || "";


            const agreeTerms =
                document
                    .getElementById("agreeTerms")
                    ?.checked || false;


            // -----------------------------------------
            // VALIDATE FULL NAME
            // -----------------------------------------

            if (!fullName) {

                showMessage(
                    "Please enter your full name.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // VALIDATE PHONE
            // -----------------------------------------

            if (!phone) {

                showMessage(
                    "Please enter your phone number.",
                    "error"
                );

                return;
            }


            if (!isValidNigerianPhone(phone)) {

                showMessage(
                    "Please enter a valid Nigerian phone number.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // VALIDATE EMAIL
            // -----------------------------------------

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


            // -----------------------------------------
            // VALIDATE PASSWORD
            // -----------------------------------------

            if (password.length < 6) {

                showMessage(
                    "Password must be at least 6 characters.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // CONFIRM PASSWORD
            // -----------------------------------------

            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // DELIVERY ADDRESS
            // -----------------------------------------

            if (!deliveryAddress) {

                showMessage(
                    "Please enter your delivery address.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // DELIVERY CITY
            // -----------------------------------------

            if (!deliveryCity) {

                showMessage(
                    "Please enter your delivery city.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // DELIVERY STATE
            // -----------------------------------------

            if (!deliveryState) {

                showMessage(
                    "Please select your state.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // TERMS
            // -----------------------------------------

            if (!agreeTerms) {

                showMessage(
                    "Please agree to the Terms & Conditions and Privacy Policy.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // START LOADING
            // -----------------------------------------

            setLoading(true);


            try {

                // -----------------------------------------
                // CHECK FOR EXISTING SESSION
                // -----------------------------------------

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient.auth.getSession();


                if (sessionError) {

                    console.warn(
                        "Could not check existing session:",
                        sessionError
                    );

                }


                // -----------------------------------------
                // IF ANOTHER ACCOUNT IS LOGGED IN,
                // SIGN IT OUT BEFORE REGISTRATION
                // -----------------------------------------

                if (sessionData?.session) {

                    await supabaseClient.auth.signOut();

                }


                // -----------------------------------------
                // CREATE SUPABASE AUTH ACCOUNT
                // -----------------------------------------

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                full_name:
                                    fullName,

                                name:
                                    fullName,

                                phone:
                                    phone

                            }

                        }

                    });


                // -----------------------------------------
                // SUPABASE REGISTRATION ERROR
                // -----------------------------------------

                if (error) {

                    throw error;
                }


                // -----------------------------------------
                // MAKE SURE USER WAS CREATED
                // -----------------------------------------

                if (!data?.user) {

                    throw new Error(
                        "Account could not be created. Please try again."
                    );

                }


                const user =
                    data.user;


                console.log(
                    "Supabase account created:",
                    user.id
                );


                // -----------------------------------------
                // SAVE DELIVERY INFORMATION TEMPORARILY
                //
                // IMPORTANT:
                // Email confirmation is ON.
                // Therefore data.session may be null.
                // We cannot insert into customer_profiles
                // until the customer is authenticated.
                // -----------------------------------------

                const pendingProfile = {

                    user_id:
                        user.id,

                    full_name:
                        fullName,

                    phone:
                        phone,

                    delivery_address:
                        deliveryAddress,

                    delivery_city:
                        deliveryCity,

                    delivery_state:
                        deliveryState

                };


                localStorage.setItem(
                    "ayodejiPendingProfile",
                    JSON.stringify(
                        pendingProfile
                    )
                );


                // -----------------------------------------
                // CHECK IF SESSION EXISTS
                // -----------------------------------------

                if (data.session) {

                    // This can happen if email confirmation
                    // is disabled.
                    //
                    // In that case, we can save the profile
                    // immediately.

                    const profileResult =
                        await saveCustomerProfile(
                            supabaseClient,
                            pendingProfile
                        );


                    if (
                        profileResult.error
                    ) {

                        console.error(
                            "Profile save error:",
                            profileResult.error
                        );

                        showMessage(
                            "Your account was created, but your delivery information could not be saved. Please log in and update your profile.",
                            "error"
                        );

                        setLoading(false);

                        return;
                    }


                    // Profile successfully saved.
                    localStorage.removeItem(
                        "ayodejiPendingProfile"
                    );


                    showMessage(
                        "Account created successfully. Redirecting...",
                        "success"
                    );


                    setTimeout(() => {

                        redirectAfterRegistration();

                    }, 800);


                    return;
                }


                // -----------------------------------------
                // EMAIL CONFIRMATION REQUIRED
                // -----------------------------------------

                showMessage(
                    "Account created successfully. Please check your email and confirm your account. After confirmation, log in to complete your delivery information.",
                    "success"
                );


                setLoading(false);


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                showMessage(
                    getRegistrationErrorMessage(
                        error
                    ),
                    "error"
                );


                setLoading(false);

            }

        }
    );

}


// =========================================
// SAVE CUSTOMER PROFILE
// =========================================

async function saveCustomerProfile(
    supabaseClient,
    profile
) {

    if (
        !supabaseClient ||
        !profile
    ) {

        return {
            data: null,
            error: new Error(
                "Missing Supabase client or profile data."
            )
        };

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("customer_profiles")
                .upsert(
                    {

                        user_id:
                            profile.user_id,

                        full_name:
                            profile.full_name,

                        phone:
                            profile.phone,

                        delivery_address:
                            profile.delivery_address,

                        delivery_city:
                            profile.delivery_city,

                        delivery_state:
                            profile.delivery_state,

                        updated_at:
                            new Date()
                                .toISOString()

                    },
                    {
                        onConflict:
                            "user_id"
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
            "Customer profile save error:",
            error
        );


        return {
            data: null,
            error
        };

    }

}


// =========================================
// REDIRECT AFTER REGISTRATION
// =========================================

function redirectAfterRegistration() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedRedirect =
        params.get("redirect");


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


    // Default destination
    window.location.href =
        "index.html";

}


// =========================================
// SAFE REDIRECT CHECK
// =========================================

function isSafeRedirect(value) {

    if (!value) {
        return false;
    }


    const lowerValue =
        value.toLowerCase();


    // Block external URLs.
    if (
        lowerValue.includes("://") ||
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
// EMAIL VALIDATION
// =========================================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// =========================================
// NIGERIAN PHONE VALIDATION
// =========================================

function isValidNigerianPhone(phone) {

    const cleaned =
        phone.replace(
            /[\s\-()]/g,
            ""
        );


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
        document.getElementById(
            "registerButton"
        );


    const buttonText =
        document.getElementById(
            "registerButtonText"
        );


    const spinner =
        document.getElementById(
            "registerSpinner"
        );


    if (button) {

        button.disabled =
            isLoading;

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
// SHOW MESSAGE
// =========================================

function showMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "registerMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.className =
        `auth-message show ${type}`;

}


// =========================================
// CLEAR MESSAGE
// =========================================

function clearMessage() {

    const messageElement =
        document.getElementById(
            "registerMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        "";


    messageElement.className =
        "auth-message";

}


// =========================================
// SUPABASE ERROR TRANSLATION
// =========================================

function getRegistrationErrorMessage(
    error
) {

    const message =
        error?.message || "";


    const lowerMessage =
        message.toLowerCase();


    if (
        lowerMessage.includes(
            "already registered"
        ) ||
        lowerMessage.includes(
            "already exists"
        ) ||
        lowerMessage.includes(
            "user already registered"
        )
    ) {

        return (
            "An account with this email already exists. Please log in instead."
        );

    }


    if (
        lowerMessage.includes(
            "invalid email"
        )
    ) {

        return (
            "Please enter a valid email address."
        );

    }


    if (
        lowerMessage.includes(
            "password"
        ) &&
        lowerMessage.includes(
            "weak"
        )
    ) {

        return (
            "Your password is too weak. Please use a stronger password."
        );

    }


    if (
        lowerMessage.includes(
            "email rate limit"
        )
    ) {

        return (
            "Too many registration attempts. Please wait a little and try again."
        );

    }


    if (
        lowerMessage.includes(
            "rate limit"
        )
    ) {

        return (
            "Too many requests. Please wait a little and try again."
        );

    }


    if (
        lowerMessage.includes(
            "network"
        ) ||
        lowerMessage.includes(
            "fetch"
        )
    ) {

        return (
            "Network error. Please check your internet connection and try again."
        );

    }


    return (
        message ||
        "Registration failed. Please try again."
    );

}


// =========================================
// EXPOSE FUNCTIONS
// =========================================

window.initializeRegistration =
    initializeRegistration;

window.saveCustomerProfile =
    saveCustomerProfile;

window.redirectAfterRegistration =
    redirectAfterRegistration;