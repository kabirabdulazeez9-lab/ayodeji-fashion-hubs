// =========================================
// AYODEJI FASHION HUBS - SUPABASE
// =========================================

const SUPABASE_URL =
    "https://pkcqvznegmplhpexcheh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_RmGESU4R6ErQ3VCAbPDDzQ_P02PgYO8";

if (
    typeof window.supabase === "undefined"
) {
    console.error(
        "Supabase JS library was not loaded."
    );
} else {

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

    console.log(
        "Ayodeji Fashion Hubs Supabase connected."
    );
}