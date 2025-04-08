// --- Event Handlers ---

// Handles click on the "Create Namespace" button
async function handleCreateNamespaceClick() {
    setStatusMessage('statusCreatingNamespace', false);
    try {
        const data = await createNamespace();

        // Update state
        currentNamespaceId = data.namespaceId;
        currentAdminKey = data.adminKey;
        isAdmin = true; // Creator is admin

        // Update URL without reloading using History API
        const newUrl = `${window.location.origin}${window.location.pathname}?namespace=${currentNamespaceId}&admin=${currentAdminKey}`;
        history.pushState({ namespaceId: currentNamespaceId, adminKey: currentAdminKey }, '', newUrl);

        setStatusMessage('statusNamespaceCreated', false); // Persistent message

        // Initialize the view for the newly created namespace
        await initializeNamespaceView(); // Will show UI and load (empty) logos

    } catch (error) {
        console.error('Error creating namespace:', error);
        setStatusMessage('statusError', true, { message: error.message });
        namespaceLinksDiv.style.display = 'none'; // Ensure links are hidden on error
    }
}

// Handles the logo upload form submission
async function handleUploadSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    if (!currentNamespaceId) {
        setStatusMessage('statusNoNamespace', true);
        return;
    }
    if (!logoFileInput.files || logoFileInput.files.length === 0) {
        setStatusMessage('statusSelectFiles', true);
        return;
    }

    const fileCount = logoFileInput.files.length;
    setStatusMessage('statusUploading', false, { count: fileCount });
    uploadStatus.textContent = t('statusUploading', { count: fileCount }); // Also update local status
    uploadStatus.className = 'mt-3 text-sm text-blue-600';


    const formData = new FormData(uploadForm); // Use form to create FormData

    try {
        const result = await uploadLogos(currentNamespaceId, formData);

        // Handle full (201) or partial (207) success
        if (result.status === 201) {
            uploadStatus.textContent = t('statusUploadSuccess', { message: result.message });
            uploadStatus.className = 'mt-3 text-sm text-green-600';
        } else if (result.status === 207) {
            uploadStatus.textContent = t('statusUploadPartial', { message: result.message });
            uploadStatus.className = 'mt-3 text-sm text-yellow-600';
            console.warn("Partial upload errors:", result.errors);
        } else {
             // Should not happen based on api.js logic, but as fallback
             uploadStatus.textContent = t('statusUploadSuccess', { message: result.message || 'Upload processed.'});
             uploadStatus.className = 'mt-3 text-sm text-green-600';
        }
        // Clear status message after delay
        setTimeout(() => { uploadStatus.textContent = ''; }, 5000);


        logoFileInput.value = ''; // Clear the file input
        await loadLogos(); // Refresh the logo grid

    } catch (error) {
        console.error('Upload error:', error);
        setStatusMessage('statusUploadError', true, { message: error.message }); // General status
        uploadStatus.textContent = t('statusUploadError', { message: error.message }); // Local status
        uploadStatus.className = 'mt-3 text-sm text-red-500';
    }
}

// Handles click on a "Vote" button in the logo grid
function handleVoteClick(logoId) {
    if (globalIdentifier) {
        // Identifier exists, proceed to vote directly
        submitVote(logoId, globalIdentifier);
    } else {
        // No identifier stored globally, open modal with logo context
        openIdentifierModal(logoId);
    }
}

// Handles submission from the identifier modal
function handleSubmitIdentifier() {
    const identifier = identifierInput.value.trim();
    if (!identifier) {
        modalError.textContent = t('modalErrorIdentifierEmpty');
        return;
    }
    modalError.textContent = ''; // Clear previous errors

    // Encode identifier (simple Base64) - consider hashing if privacy is paramount
    // Note: Base64 is easily reversible.
    const encodedIdentifier = btoa(identifier);

    // Store identifier globally in localStorage
    const globalIdentifierKey = 'global-user-identifier';
    localStorage.setItem(globalIdentifierKey, encodedIdentifier);
    globalIdentifier = encodedIdentifier;

    // Update the footer UI
    updateIdentifierUI();

    // Close modal
    const logoIdToVote = currentLogoIdToVote;
    closeIdentifierModal();

    // Submit the vote IF the modal was opened for voting (logoIdToVote is not null)
    if (logoIdToVote) {
        submitVote(logoIdToVote, encodedIdentifier);
    } else {
        setStatusMessage('Identifier set successfully.', false);
    }
}

// Handles the actual vote submission process (called after identifier is known)
async function submitVote(logoId, identifier) {
    if (!currentNamespaceId) return;
    setStatusMessage('statusSubmittingVote', false);

    try {
        const result = await submitVoteRequest(currentNamespaceId, logoId, identifier);
        setStatusMessage('statusVoteRecorded', false);

        // Update vote count display dynamically IN THE GRID
        const voteCountElement = document.getElementById(`votes-${logoId}`);
        if (voteCountElement) {
            voteCountElement.textContent = t('votesLabel', { count: result.votes });
        }
        // Update the stored logo data as well
        const logoIndex = displayedLogos.findIndex(l => l.id === logoId);
        if (logoIndex !== -1) {
            displayedLogos[logoIndex].votes = result.votes;
        }
        // Update viewer if open and showing this logo
        if (logoViewerModal.style.display === 'flex' && currentLogoIndex === logoIndex) {
            // Potentially update viewer UI, e.g., disable vote button
        }

    } catch (error) {
        console.error('Vote error:', error);
        if (error.status === 409) {
             // Specific message for already voted
            setStatusMessage('statusVoteExists', true); // Persistent error
        } else {
            setStatusMessage('statusError', true, { message: error.message });
        }
    }
}

// --- Password Verification Handler (Modal) ---
async function handlePasswordVerification() {
    const password = passwordInput.value;
    if (!password) {
        passwordModalError.textContent = 'Password cannot be empty.'; // Or use t()
        return;
    }
    passwordModalError.textContent = ''; // Clear previous errors

    try {
        const result = await verifyNamespacePasswordRequest(currentNamespaceId, password);
        if (result.verified) {
            namespacePasswordVerified = true;
            closePasswordModal();
            // Reload content now that access is granted
            await loadLogos();
        } else {
            // This case should ideally be caught by the !response.ok in fetchApi
             passwordModalError.textContent = t('statusPasswordInvalid');
        }
    } catch (error) {
         // Handle specific statuses if needed, otherwise show generic error
        passwordModalError.textContent = error.status === 401 ? t('statusPasswordInvalid') : t('statusError', { message: 'Verification failed' });
        console.error('Error verifying password:', error);
    }
}

// --- Logo Viewer Modal Event Handlers ---
function handleLogoViewerVoteClick() {
    if (currentLogoIndex !== -1 && currentLogoIndex < displayedLogos.length) {
        const logoId = displayedLogos[currentLogoIndex].id;
        handleVoteClick(logoId);
    }
}

function handleLogoViewerKeydown(event) {
    if (logoViewerModal.style.display === 'flex') {
        switch (event.key) {
            case 'ArrowLeft':
                showPreviousLogoInViewer();
                break;
            case 'ArrowRight':
                showNextLogoInViewer();
                break;
            case 'Escape':
                closeLogoViewer();
                break;
            case 'Enter':
                // handleLogoViewerVoteClick();
                break;
        }
    }
}

// === NEW: Handle Logout Click ===
function handleLogout() {
    const globalIdentifierKey = 'global-user-identifier';
    localStorage.removeItem(globalIdentifierKey);
    globalIdentifier = null;
    updateIdentifierUI();
    setStatusMessage('Logged out successfully.', false);
    console.log("User logged out (identifier cleared).");
}
// === END NEW ===

// === NEW: Handle Identify Click (from footer) ===
function handleIdentifyClick() {
    openIdentifierModal(null);
}
// === END NEW ===