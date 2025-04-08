// --- Initialization ---

// Main function to load logos and update UI for a namespace
async function loadLogos() {
    if (!currentNamespaceId) return;
    setStatusMessage('statusLoadingLogos', false);
    logoGrid.innerHTML = ''; // Clear grid
    noLogosMessage.style.display = 'none'; // Hide message initially
    displayedLogos = []; // Reset logo data

    try {
        const data = await fetchLogosData(currentNamespaceId);

        // Check for password protection before processing
        if (data.isPasswordProtected && !namespacePasswordVerified && !isAdmin) {
            openPasswordModal(); // Require password input
            setStatusMessage('', false); // Clear loading message
            return; // Stop further processing until password verified
        }

        // Process the fetched data and update UI elements
        processLogosResponse(data);

    } catch (error) {
        console.error('Error loading logos:', error);
        if (error.status === 404) {
            setStatusMessage('statusNamespaceNotFound', true); // Specific message for 404
            // Optionally redirect or show welcome view
            showWelcomeView();
        } else {
            setStatusMessage('statusError', true, { message: error.message });
        }
        // Ensure loading state is cleared on error
        logoGrid.innerHTML = '';
        noLogosMessage.style.display = 'none';
    }
}

// Sets up the view for a specific namespace based on URL parameters
async function initializeNamespaceView() {
    // 1. Update UI structure for namespace view
    showNamespaceViewUI();

    // 2. Load logo data (this handles password check and UI updates via processLogosResponse)
    await loadLogos();
}

// Attach all primary event listeners
function attachEventListeners() {
    // Namespace Creation
    createNamespaceBtn?.addEventListener('click', handleCreateNamespaceClick);

    // Logo Upload
    uploadForm?.addEventListener('submit', handleUploadSubmit);

    // Identifier Modal
    submitIdentifierBtn?.addEventListener('click', handleSubmitIdentifier);
    identifierModal?.querySelector('.close-button')?.addEventListener('click', closeIdentifierModal);

    // Password Modal
    submitPasswordBtn?.addEventListener('click', handlePasswordVerification);
    passwordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePasswordVerification();
    });
    passwordModal?.querySelector('.close-button')?.addEventListener('click', closePasswordModal);

    // Logo Viewer Modal
    logoViewerCloseBtn?.addEventListener('click', closeLogoViewer);
    logoViewerPrevBtn?.addEventListener('click', showPreviousLogoInViewer);
    logoViewerNextBtn?.addEventListener('click', showNextLogoInViewer);
    logoViewerVoteBtn?.addEventListener('click', handleLogoViewerVoteClick);
    // Close viewer if background is clicked (handled by global listener)
    // Keyboard navigation for viewer
    document.addEventListener('keydown', handleLogoViewerKeydown);

    // Admin Controls
    clearVotesBtn?.addEventListener('click', handleClearVotes);
    deleteNamespaceBtn?.addEventListener('click', handleDeleteNamespace);
    setFriendlyUrlBtn?.addEventListener('click', handleSetFriendlyUrl);
    saveDescriptionBtn?.addEventListener('click', handleSaveNamespaceDescription); // Namespace description save button
    descriptionInput?.addEventListener('input', updateCharacterCount); // Namespace description char count
    setPasswordBtn?.addEventListener('click', handleSetPassword); // Set password button

    // Language Switcher
    langEnLink?.addEventListener('click', () => setLanguage('en'));
    langFrLink?.addEventListener('click', () => setLanguage('fr'));

    // Global click listener for modals
    window.addEventListener('click', handleWindowClickForModals);
}

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

// --- Start the App ---
document.addEventListener('DOMContentLoaded', initializeApp);