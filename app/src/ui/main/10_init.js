// Main initialization logic runs when the DOM is fully loaded
async function initializeApp() {
    // --- Language Setup ---
    const serverDefaultLang = await getDefaultLanguage();
    const preferredLang = getPreferredLanguage(); // Check localStorage/browser

    // Set initial language (preference > server default)
    currentLanguage = supportedLanguages.includes(preferredLang) ? preferredLang : serverDefaultLang;
    localStorage.setItem('preferredLanguage', currentLanguage); // Store the determined language

    // Load initial translations and apply them
    await loadTranslations(currentLanguage);
    translatePage(); // Initial translation of static content
    updateLanguageSwitcherUI(); // Set initial active button

    // --- Identifier Setup ---
    const globalIdentifierKey = 'global-user-identifier';
    globalIdentifier = localStorage.getItem(globalIdentifierKey); // Load global identifier
    updateIdentifierUI(); // Update footer UI based on loaded identifier

    // --- View Setup based on URL ---
    const urlParams = new URLSearchParams(window.location.search);
    currentNamespaceId = urlParams.get('namespace');
    currentAdminKey = urlParams.get('admin'); // Might be null
    isAdmin = !!currentAdminKey; // Basic check, server verifies actions

    if (currentNamespaceId) {
        // If a namespace is specified, initialize that view
        await initializeNamespaceView();
    } else {
        // Otherwise, show the welcome/creation view
        showWelcomeView();
    }

    // --- Attach Event Listeners ---
    attachEventListeners();

    console.log("App initialized.");
}

// === NEW: Function to set up the view for an existing/new namespace ===
async function initializeNamespaceView() {
    if (!currentNamespaceId) {
        console.warn("initializeNamespaceView called without currentNamespaceId");
        showWelcomeView(); // Fallback to welcome view
        return;
    }

    // Set up the basic UI structure (show/hide sections, set links if admin)
    showNamespaceViewUI();

    // Fetch and display logos (this will handle password prompt if needed)
    await loadLogos();
}
// === END NEW ===

// --- Start the App ---
document.addEventListener('DOMContentLoaded', initializeApp);