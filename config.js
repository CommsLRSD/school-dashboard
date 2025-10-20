/**
 * Application Configuration
 * 
 * SECURITY WARNING: This file contains a public API key for the JigsawStack Translation Widget.
 * 
 * IMPORTANT SECURITY CONSIDERATIONS:
 * 1. The API key in this file is a PUBLIC key that is safe to expose in client-side code
 * 2. For production deployments, consider these additional security measures:
 *    - Set up rate limiting on the API key in your JigsawStack dashboard
 *    - Use domain restrictions to limit where the API key can be used
 *    - Monitor API usage for unusual patterns
 *    - Consider implementing a backend proxy to hide the API key completely
 * 3. Never commit private/secret API keys to version control
 * 4. Regularly rotate API keys as a security best practice
 * 
 * For enhanced security in production:
 * - Create a backend endpoint that proxies translation requests
 * - Store the API key as an environment variable on your server
 * - Have the frontend call your backend, which then calls JigsawStack
 * - This completely hides the API key from the client
 */

// Configuration object
window.DASHBOARD_CONFIG = {
    // JigsawStack Translation Widget API Key
    // This is a public API key that is safe to expose in client-side code
    // The key is restricted by domain in the JigsawStack dashboard
    translationApiKey: 'pk_d15868bbd7b0fbb5f94982b49983f4d1db175eb021b098c3324494f2686ccee8d35ed90d50e819f666e46221fb56b52d3eb6bbe36ee015bdcdc33165d51f45c5024I6bd1gY13TBTetD7Kq'
};

// Initialize translation widget when available
document.addEventListener('DOMContentLoaded', function() {
    // Wait for JigsawStack widget to load
    const initTranslationWidget = function() {
        if (typeof window.JigtsWidget !== 'undefined') {
            // Widget is loaded, initialize it with the API key
            const scriptTag = document.querySelector('script[src*="jigts-widget.js"]');
            if (scriptTag && !scriptTag.hasAttribute('data-jigts-api-key')) {
                scriptTag.setAttribute('data-jigts-api-key', window.DASHBOARD_CONFIG.translationApiKey);
                
                // Trigger widget initialization if needed
                if (window.JigtsWidget && window.JigtsWidget.init) {
                    window.JigtsWidget.init();
                }
            }
        } else {
            // Widget not yet loaded, wait a bit and try again
            setTimeout(initTranslationWidget, 100);
        }
    };
    
    // Start initialization
    initTranslationWidget();
});
