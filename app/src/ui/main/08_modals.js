// --- Modal Control Functions ---

// --- Identifier Modal ---
function openIdentifierModal(logoId) {
    currentLogoIdToVote = logoId; // Store which logo is being voted on
    identifierInput.value = ''; // Clear previous input
    modalError.textContent = ''; // Clear previous errors
    identifierModal.style.display = 'block';
    identifierInput.focus(); // Focus input field
}

function closeIdentifierModal() {
    identifierModal.style.display = 'none';
    currentLogoIdToVote = null; // Reset context
}

// --- Password Modal ---
function openPasswordModal() {
    passwordInput.value = '';
    passwordModalError.textContent = '';
    passwordModal.style.display = 'block';
    passwordInput.focus();
}

function closePasswordModal() {
    passwordModal.style.display = 'none';
}

// --- Logo Viewer Modal ---
function openLogoViewer(index) {
    if (index < 0 || index >= displayedLogos.length) return;
    currentLogoIndex = index;
    updateLogoViewerContent(); // Show the selected logo
    logoViewerModal.style.display = "flex"; // Show the modal using flex
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
    // Add active class for potential transition effects
    requestAnimationFrame(() => {
         logoViewerModal.classList.add('visible');
    });
}

function closeLogoViewer() {
    logoViewerModal.classList.remove('visible');
    // Wait for transition before hiding and clearing
    setTimeout(() => {
        logoViewerModal.style.display = "none"; // Hide the modal
        logoViewerImg.src = ""; // Clear src
        currentLogoIndex = -1; // Reset index
        document.body.style.overflow = ''; // Restore body scrolling
    }, 300); // Match transition duration if any
}

// Updates the content (image, buttons) of the logo viewer modal
function updateLogoViewerContent() {
    if (currentLogoIndex < 0 || currentLogoIndex >= displayedLogos.length) return;

    const logo = displayedLogos[currentLogoIndex];
    logoViewerImg.src = `${apiUrl}/data/uploads/${logo.path}`;
    logoViewerImg.alt = t('logoViewerAlt', { index: currentLogoIndex + 1 }); // Use translation if needed

    // Update navigation button states
    logoViewerPrevBtn.classList.toggle('disabled', currentLogoIndex === 0);
    logoViewerPrevBtn.disabled = currentLogoIndex === 0; // Also disable for accessibility

    logoViewerNextBtn.classList.toggle('disabled', currentLogoIndex === displayedLogos.length - 1);
    logoViewerNextBtn.disabled = currentLogoIndex === displayedLogos.length - 1; // Also disable

    // Update Vote button text/state if needed (e.g., show "Already Voted")
    // This requires knowing if the current identifier has voted for this specific logo.
    // For simplicity, we'll just keep the standard "Vote" text for now.
    logoViewerVoteBtn.textContent = t('logoViewerVoteBtn');
}

function showPreviousLogoInViewer() {
    if (currentLogoIndex > 0) {
        currentLogoIndex--;
        updateLogoViewerContent();
    }
}

function showNextLogoInViewer() {
    if (currentLogoIndex < displayedLogos.length - 1) {
        currentLogoIndex++;
        updateLogoViewerContent();
    }
}

// --- Global Modal Click Listener ---
// Close modals if user clicks outside the content area
function handleWindowClickForModals(event) {
    if (event.target == identifierModal) {
        closeIdentifierModal();
    }
    if (event.target == passwordModal) {
        closePasswordModal();
    }
    // Close viewer only if clicking the background, not the image/controls
    if (event.target == logoViewerModal) {
        closeLogoViewer();
    }
}