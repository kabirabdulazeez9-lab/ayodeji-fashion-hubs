// =========================================
// AYODEJI FASHION HUBS - REGISTER
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeRegister
);


// =========================================
// INITIALIZE
// =========================================

async function initializeRegister() {

    const supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        showRegisterMessage(
            "Unable to connect to the account system.",
            true
        );

        return;
    }


    setupPasswordToggle(
        "toggleRegisterPassword",
        "registerPassword"
    );


    setupPasswordToggle(
        "toggleConfirmPassword",
        "registerConfirmPassword"
    );


    const form =
        document.getElementById(
            "registerForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await registerUser(
                supabaseClient
            );
        }
    );
}


// =========================================
// REGISTER USER
// =========================================

async function registerUser(
    supabaseClient
) {

    const name =
        document.getElementById(
            "registerName"
        )?.value.trim();


    const email =
        document.getElementById(
            "registerEmail"
        )?.value.trim();


    const phone =
        document.getElementById(
            "registerPhone"
        )?.value.trim();


    const password =
        document.getElementById(
            "registerPassword"
        )?.value;


    const confirmPassword =
        document.getElementById(
            "registerConfirmPassword"
        )?.value;


    const terms =
        document.getElementById(
            "registerTerms"
        )?.checked;


    const button =
        document.getElementById(
            "registerButton"
        );


    const buttonText =
        document.getElementById(
            "registerButtonText"
        );


    if (!name) {

        showRegisterMessage(
            "Please enter your full name.",
            true
        );

        return;
    }


    if (!email) {

        showRegisterMessage(
            "Please enter your email address.",
            true
        );

        return;
    }


    if (!password) {

        showRegisterMessage(
            "Please create a password.",
            true
        );

        return;
    }


    if (password.length < 6) {

        showRegisterMessage(
            "Password must be at least 6 characters.",
            true
        );

        return;
    }


    if (
        password !==
        confirmPassword
    ) {

        showRegisterMessage(
            "Passwords do not match.",
            true
        );

        return;
    }


    if (!terms) {

        showRegisterMessage(
            "Please agree to the terms and conditions.",
            true
        );

        return;
    }


    if (button) {
        button.disabled = true;
    }


    if (buttonText) {

        buttonText.textContent =
            "Creating Account...";
    }


    showRegisterMessage(
        "",
        false
    );


    try {

        const { data, error } =
            await supabaseClient.auth.signUp({

                email,

                password,

                options: {

                    data: {

                        full_name:
                            name,

                        name:
                            name,

                        phone:
                            phone || ""
                    }
                }
            });


        if (error) {
            throw error;
        }


        /*
         * If Supabase email confirmation
         * is enabled, session may be null.
         */

        if (!data.session) {

            showRegisterMessage(
                "Account created successfully. Please check your email to confirm your account.",
                false
            );


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                2500
            );


            return;
        }


        showRegisterMessage(
            "Account created successfully. Redirecting...",
            false
        );


        setTimeout(
            () => {

                window.location.href =
                    "profile.html";

            },
            800
        );


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        let message =
            error?.message ||
            "Unable to create your account.";


        if (
            message
                .toLowerCase()
                .includes(
                    "already registered"
                )
        ) {

            message =
                "An account with this email already exists. Please login instead.";
        }


        showRegisterMessage(
            message,
            true
        );


    } finally {

        if (button) {
            button.disabled = false;
        }


        if (buttonText) {

            buttonText.textContent =
                "Create Account";
        }
    }
}


// =========================================
// PASSWORD TOGGLE
// =========================================

function setupPasswordToggle(
    toggleId,
    inputId
) {

    const toggle =
        document.getElementById(
            toggleId
        );


    const input =
        document.getElementById(
            inputId
        );


    if (!toggle || !input) {
        return;
    }


    toggle.addEventListener(
        "click",
        () => {

            if (
                input.type ===
                "password"
            ) {

                input.type =
                    "text";

                toggle.textContent =
                    "🙈";

            } else {

                input.type =
                    "password";

                toggle.textContent =
                    "👁️";
            }
        }
    );
}


// =========================================
// MESSAGE
// =========================================

function showRegisterMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "registerMessage"
        );


    if (!element) return;


    element.textContent =
        message;


    element.style.color =
        error
            ? "#c62828"
            : "#16834b";
}