/**
 * Translation Widget Configuration
 * 
 * Security Note: In production, API keys should be stored securely on the server side.
 * For a client-side only application, the public key is exposed by design.
 * Consider implementing a proxy server to handle API key management more securely.
 */

// Initialize translation widget when DOM is ready
window.addEventListener('DOMContentLoaded', function() {
    // Check if TranslationWidget library is loaded
    if (typeof TranslationWidget !== 'undefined') {
        try {
            // Initialize translation widget with configuration
            // Note: This is a public API key - in production, consider using a backend proxy
            TranslationWidget("pk_5e0c38e24f577b80325e53ba31d998c62941ae8f60934a9105f8548796feb7ec9f07defc08d67273679911c6deb722c38ebdf6056e484b90b51b3fa533663b86024uWF5OOXIfV3FQWmd9Y", {
                pageLanguage: "en",
                position: "bottom-right",
                autoDetectLanguage: false,
                showUI: true
            });
        } catch (error) {
            console.error('Translation widget initialization error:', error);
        }
    } else {
        console.warn('TranslationWidget library not loaded');
    }
});
