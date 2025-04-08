// --- Attach Event Listeners ---

function attachEventListeners() {
    // Welcome/Create View
    if (createNamespaceBtn) {
        createNamespaceBtn.addEventListener('click', handleCreateNamespaceClick);
    }

    // Upload Form (if exists)
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadSubmit);
    }

    // Identifier Modal (if exists)
    if (submitIdentifierBtn) {
        submitIdentifierBtn.addEventListener('click', handleSubmitIdentifier);
    }
    // Allow Enter key submission in identifier input
    if (identifierInput) {
        identifierInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                 event.preventDefault(); // Prevent potential form submission if wrapped
                 handleSubmitIdentifier();
            }
        });
    }


    // Password Modal (if exists)
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', handlePasswordVerification);
    }
     // Allow Enter key submission in password input
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                 event.preventDefault();
                 handlePasswordVerification();
            }
        });
    }

    // Admin Controls (if they exist)
    if (clearVotesBtn) {
        clearVotesBtn.addEventListener('click', handleClearVotes);
    }
    if (deleteNamespaceBtn) {
        deleteNamespaceBtn.addEventListener('click', handleDeleteNamespace);
    }
    if (setFriendlyUrlBtn) {
        setFriendlyUrlBtn.addEventListener('click', handleSetFriendlyUrl);
    }
    // Allow Enter key submission in friendly URL input
    if (friendlyUrlInput) {
        friendlyUrlInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                 event.preventDefault();
                 handleSetFriendlyUrl();
            }
        });
    }
    if (setPasswordBtn) {
        setPasswordBtn.addEventListener('click', handleSetPassword);
    }
    // Allow Enter key submission in set password input
    if (setPasswordInput) {
        setPasswordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                 event.preventDefault();
                 handleSetPassword();
            }
        });
    }

    // Namespace Description (Admin)
    if (saveDescriptionBtn) {
        saveDescriptionBtn.addEventListener('click', handleSaveNamespaceDescription);
    }
    if (descriptionInput) {
        descriptionInput.addEventListener('input', updateCharacterCount);
    }

    // Logo Viewer Modal Controls (if they exist)
    if (logoViewerCloseBtn) {
        logoViewerCloseBtn.addEventListener('click', closeLogoViewer);
    }
    if (logoViewerPrevBtn) {
        logoViewerPrevBtn.addEventListener('click', showPreviousLogoInViewer);
    }
    if (logoViewerNextBtn) {
        logoViewerNextBtn.addEventListener('click', showNextLogoInViewer);
    }
    if (logoViewerVoteBtn) {
        logoViewerVoteBtn.addEventListener('click', handleLogoViewerVoteClick);
    }

    // Language Switcher
    if (langEnLink) {
        langEnLink.addEventListener('click', () => setLanguage('en'));
    }
    if (langFrLink) {
        langFrLink.addEventListener('click', () => setLanguage('fr'));
    }

    // Global listeners
    window.addEventListener('click', handleWindowClickForModals); // For closing modals on outside click
    document.addEventListener('keydown', handleLogoViewerKeydown); // Keyboard navigation for viewer

    console.log("Base event listeners attached.");
    // Note: Logo card specific listeners (vote, delete, description input) are attached dynamically
    // when the logo grid is created in `createLogoElement`.
    // Footer identifier button listener is attached dynamically in `updateIdentifierUI`.
}