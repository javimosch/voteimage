// --- Admin Action Handlers ---

// Handler for deleting a single logo
async function handleDeleteLogo(logoId) {
    if (!isAdmin || !currentAdminKey || !currentNamespaceId) return;

    if (!confirm(t('confirmDeleteLogo', { logoId }))) {
        return;
    }

    setStatusMessage('statusDeletingLogo', false);
    try {
        await deleteLogoRequest(currentNamespaceId, logoId, currentAdminKey);
        setStatusMessage('statusLogoDeleted', false);
        await loadLogos(); // Refresh grid
    } catch (error) {
        console.error('Error deleting logo:', error);
        setStatusMessage('statusError', true, { message: error.message });
    }
}

// Handler for clearing all votes in the namespace
async function handleClearVotes() {
    if (!isAdmin || !currentAdminKey || !currentNamespaceId) return;

    if (!confirm(t('confirmClearVotes'))) {
        return;
    }

    setStatusMessage('statusClearingVotes', false);
    try {
        await clearVotesRequest(currentNamespaceId, currentAdminKey);
        setStatusMessage('statusVotesCleared', false);
        await loadLogos(); // Refresh grid to show zero votes
    } catch (error) {
        console.error('Error clearing votes:', error);
        setStatusMessage('statusError', true, { message: error.message });
    }
}

// Handler for deleting the entire namespace
async function handleDeleteNamespace() {
    if (!isAdmin || !currentAdminKey || !currentNamespaceId) return;

    if (!confirm(t('confirmDeleteNamespace'))) {
        return;
    }

    setStatusMessage('statusDeletingNamespace', false);
    try {
        await deleteNamespaceRequest(currentNamespaceId, currentAdminKey);
        setStatusMessage('statusNamespaceDeleted', false); // Message indicates redirecting
        // Redirect to home page after deletion
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname;
        }, 2000);

    } catch (error) {
        console.error('Error deleting namespace:', error);
        setStatusMessage('statusError', true, { message: error.message });
    }
}

// Handler for setting the friendly URL
async function handleSetFriendlyUrl() {
    if (!isAdmin || !currentNamespaceId || !currentAdminKey) return;

    const desiredName = friendlyUrlInput.value.trim(); // Get value from input

    setStatusMessage('statusSettingFriendlyUrl', false);
    friendlyUrlStatus.textContent = t('loading'); // Indicate updating specific status
    friendlyUrlStatus.className = 'mt-1 text-sm text-gray-600';

    try {
        const result = await setFriendlyUrlRequest(currentNamespaceId, currentAdminKey, desiredName);
        setStatusMessage('statusFriendlyUrlUpdated', false); // General status
        currentFriendlyUrlName = result.friendlyUrlName || null; // Update state
        updateFriendlyUrlDisplay(); // Refresh links and input display

    } catch (error) {
        console.error('Error setting friendly URL:', error);
        let errorMessage = error.message || 'Failed to set friendly URL.';
        setStatusMessage('statusError', true, { message: errorMessage }); // General status
        // Display specific error near the input
        friendlyUrlStatus.textContent = t('statusFriendlyUrlError', { message: errorMessage });
        friendlyUrlStatus.className = 'mt-1 text-sm text-red-600';
         // Optionally restore input/display to previous state if needed
        updateFriendlyUrlDisplay();
    }
}

// Handler for saving the main namespace description
async function handleSaveNamespaceDescription() {
     if (!isAdmin || !currentAdminKey || !currentNamespaceId) return;

    try {
        const description = descriptionInput.value.trim();
        if (description.length > 500) {
            // Basic client-side validation, though server validates too
            throw new Error("Description exceeds 500 characters.");
        }
        descriptionSaveStatus.textContent = t('descriptionSaving');
        descriptionSaveStatus.className = 'mt-1 text-sm text-blue-600 h-4';

        const result = await setNamespaceDescriptionRequest(currentNamespaceId, currentAdminKey, description);

        // Update the display section immediately
        namespaceDescriptionText.textContent = result.description || t('descriptionNone');
        namespaceDescriptionDisplaySection.style.display = result.description ? 'block' : 'none';

        descriptionSaveStatus.textContent = t('statusDescriptionSaved');
        descriptionSaveStatus.className = 'mt-1 text-sm text-green-600 h-4';
        setTimeout(() => { descriptionSaveStatus.textContent = ''; }, 3000);

    } catch (error) {
        console.error('Error saving namespace description:', error);
        descriptionSaveStatus.textContent = t('statusError', { message: error.message });
        descriptionSaveStatus.className = 'mt-1 text-sm text-red-600 h-4';
        // Don't clear error message immediately
    }
}

// Debounced handler for saving individual logo descriptions (called on input)
const debouncedSaveLogoDescription = debounce(async (logoId) => {
    if (!isAdmin || !currentAdminKey || !currentNamespaceId) return;

    const inputElement = document.getElementById(`desc-input-${logoId}`);
    const statusElement = document.getElementById(`desc-status-${logoId}`);
    if (!inputElement || !statusElement) return;

    const description = inputElement.value.trim();
    statusElement.textContent = t('descriptionSaving');
    statusElement.className = 'text-xs text-blue-600 h-4';

    try {
        const result = await setLogoDescriptionRequest(currentNamespaceId, logoId, currentAdminKey, description);

        statusElement.textContent = t('descriptionSaved');
        statusElement.className = 'text-xs text-green-600 h-4';

        // Update the internal data store
        const logoIndex = displayedLogos.findIndex(l => l.id === logoId);
        if (logoIndex !== -1) {
            displayedLogos[logoIndex].description = result.description;
            // Also update the non-admin display paragraph if it exists
            const displayElement = document.getElementById(`desc-display-${logoId}`);
            if (displayElement) {
                displayElement.textContent = result.description || t('descriptionNone');
            }
        }

        // Clear the 'Saved!' message after a delay
        setTimeout(() => {
            if (statusElement.textContent === t('descriptionSaved')) {
                statusElement.textContent = '';
                statusElement.className = 'text-xs text-gray-500 h-4';
            }
        }, 3000);

    } catch (error) {
        console.error(`Error saving description for logo ${logoId}:`, error);
        statusElement.textContent = t('descriptionError', { message: 'Save failed' }); // Keep it short
        statusElement.className = 'text-xs text-red-600 h-4';
        // Use general status message for broader errors if needed
        setStatusMessage('statusError', true, { message: `Failed to save description for logo ${logoId}` });
    }
}, 1500); // Debounce time: 1.5 seconds

// Handler for the input event on logo description textareas
function handleLogoDescriptionInput(logoId) {
    // Trigger the debounced save function
    debouncedSaveLogoDescription(logoId);
}


// Handle setting namespace password
async function handleSetPassword() {
    if (!isAdmin || !currentAdminKey || !currentNamespaceId) return;

    const password = setPasswordInput.value; // No trim, allow spaces if desired
    passwordStatus.textContent = t('loading'); // Generic loading
    passwordStatus.className = 'text-sm text-blue-600';

    try {
        const result = await setNamespacePasswordRequest(currentNamespaceId, currentAdminKey, password);

        setPasswordInput.value = ''; // Clear input on success
        passwordStatus.textContent = result.isProtected ? t('statusPasswordSet') : t('statusPasswordRemoved');
        passwordStatus.className = 'text-sm text-green-600';

        // Clear status after a delay and show current state
        setTimeout(() => {
            passwordStatus.textContent = result.isProtected ?
                t('statusNamespaceProtected') :
                t('statusNamespaceNotProtected');
            passwordStatus.className = 'text-sm text-gray-600';
        }, 3000);

    } catch (error) {
        console.error('Error setting password:', error);
        passwordStatus.textContent = t('statusError', { message: error.message });
        passwordStatus.className = 'text-sm text-red-600';
    }
}