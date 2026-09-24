// =========================================
// AYODEJI FASHION HUBS
// CUSTOMER PROFILE
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    const supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {

        console.error(
            "Supabase client was not loaded."
        );

        return;
    }


    // =========================================
    // ELEMENTS
    // =========================================

    const profileForm =
        document.getElementById("profileForm");

    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    const profilePhone =
        document.getElementById("profilePhone");

    const profileAddress =
        document.getElementById("profileAddress");

    const profileCity =
        document.getElementById("profileCity");

    const profileState =
        document.getElementById("profileState");

    const profileMessage =
        document.getElementById("profileMessage");

    const saveProfileButton =
        document.getElementById(
            "saveProfileButton"
        );

    const saveProfileText =
        document.getElementById(
            "saveProfileText"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    let currentUser = null;


    // =========================================
    // MESSAGE
    // =========================================

    function showMessage(
        text,
        type = "error"
    ) {

        if (!profileMessage) return;

        profileMessage.textContent = text;

        profileMessage.className =
            "profile-message " + type;

    }


    function clearMessage() {

        if (!profileMessage) return;

        profileMessage.textContent = "";

        profileMessage.className =
            "profile-message";

    }


    // =========================================
    // LOADING
    // =========================================

    function setSaving(isSaving) {

        if (!saveProfileButton) return;

        saveProfileButton.disabled =
            isSaving;

        if (saveProfileText) {

            saveProfileText.textContent =
                isSaving
                    ? "Saving..."
                    : "Save Profile";

        }

    }


    // =========================================
    // GET CURRENT USER
    // =========================================

    async function getCurrentUser() {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (error) {

            console.error(
                "Unable to get user:",
                error
            );

            return null;
        }

        return data.user || null;

    }


    // =========================================
    // LOAD PROFILE
    // =========================================

    async function loadProfile() {

        clearMessage();

        currentUser =
            await getCurrentUser();


        // --------------------------------------
        // NOT LOGGED IN
        // --------------------------------------

        if (!currentUser) {

            window.location.href =
                "login.html";

            return;

        }


        // --------------------------------------
        // EMAIL
        // --------------------------------------

        profileEmail.value =
            currentUser.email || "";


        // --------------------------------------
        // DEFAULT NAME FROM AUTH
        // --------------------------------------

        const metadata =
            currentUser.user_metadata || {};

        const authName =
            metadata.full_name ||
            metadata.name ||
            "";


        // --------------------------------------
        // LOAD DATABASE PROFILE
        // --------------------------------------

        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("customer_profiles")
                .select(`
                    user_id,
                    full_name,
                    phone,
                    delivery_address,
                    delivery_city,
                    delivery_state
                `)
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Profile loading error:",
                error
            );

            showMessage(
                "Unable to load your profile. Please refresh and try again."
            );

            return;

        }


        // --------------------------------------
        // PROFILE EXISTS
        // --------------------------------------

        if (profile) {

            profileName.value =
                profile.full_name || "";

            profilePhone.value =
                profile.phone || "";

            profileAddress.value =
                profile.delivery_address || "";

            profileCity.value =
                profile.delivery_city || "";

            profileState.value =
                profile.delivery_state || "";

            return;

        }


        // --------------------------------------
        // PROFILE DOES NOT EXIST
        // --------------------------------------

        profileName.value =
            authName;

        profilePhone.value =
            metadata.phone || "";

    }


    // =========================================
    // SAVE PROFILE
    // =========================================

    profileForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();


            if (!currentUser) {

                showMessage(
                    "Your session has expired. Please log in again."
                );

                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1000);

                return;

            }


            // ----------------------------------
            // GET VALUES
            // ----------------------------------

            const fullName =
                profileName.value.trim();

            const phone =
                profilePhone.value.trim();

            const address =
                profileAddress.value.trim();

            const city =
                profileCity.value.trim();

            const state =
                profileState.value.trim();


            // ----------------------------------
            // VALIDATION
            // ----------------------------------

            if (!fullName) {

                showMessage(
                    "Please enter your full name."
                );

                profileName.focus();

                return;
            }


            if (!phone) {

                showMessage(
                    "Please enter your phone number."
                );

                profilePhone.focus();

                return;
            }


            if (!address) {

                showMessage(
                    "Please enter your delivery address."
                );

                profileAddress.focus();

                return;
            }


            if (!city) {

                showMessage(
                    "Please enter your city."
                );

                profileCity.focus();

                return;
            }


            if (!state) {

                showMessage(
                    "Please enter your state."
                );

                profileState.focus();

                return;
            }


            // ----------------------------------
            // START SAVING
            // ----------------------------------

            setSaving(true);


            try {

                const profileData = {

                    user_id:
                        currentUser.id,

                    full_name:
                        fullName,

                    phone:
                        phone,

                    delivery_address:
                        address,

                    delivery_city:
                        city,

                    delivery_state:
                        state,

                    updated_at:
                        new Date().toISOString()

                };


                // --------------------------------
                // UPSERT
                // --------------------------------

                const {
                    error
                } =
                    await supabaseClient
                        .from("customer_profiles")
                        .upsert(
                            profileData,
                            {
                                onConflict:
                                    "user_id"
                            }
                        );


                if (error) {

                    console.error(
                        "Profile save error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to save your profile."
                    );

                    setSaving(false);

                    return;

                }


                // --------------------------------
                // UPDATE AUTH METADATA
                // --------------------------------

                const {
                    error:
                        authUpdateError
                } =
                    await supabaseClient.auth.updateUser({

                        data: {

                            full_name:
                                fullName,

                            name:
                                fullName,

                            phone:
                                phone

                        }

                    });


                if (authUpdateError) {

                    console.warn(
                        "Auth metadata update failed:",
                        authUpdateError
                    );

                }


                // --------------------------------
                // SUCCESS
                // --------------------------------

                showMessage(
                    "Your profile has been saved successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Unexpected profile error:",
                    error
                );

                showMessage(
                    "Something went wrong while saving your profile."
                );

            }


            setSaving(false);

        }
    );


    // =========================================
    // LOGOUT
    // =========================================

    logoutButton.addEventListener(
        "click",
        async () => {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "Logging out...";


            try {

                const {
                    error
                } =
                    await supabaseClient.auth.signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    showMessage(
                        "Unable to log out. Please try again."
                    );

                    logoutButton.disabled = false;

                    logoutButton.textContent =
                        "🚪 Logout";

                    return;

                }


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Unexpected logout error:",
                    error
                );

                showMessage(
                    "Unable to log out. Please try again."
                );

                logoutButton.disabled = false;

                logoutButton.textContent =
                    "🚪 Logout";

            }

        }
    );


    // =========================================
    // INITIALIZE
    // =========================================

    await loadProfile();

});