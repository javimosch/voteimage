// --- UI Update Functions ---

// Creates a single logo card element
function createLogoElement(logo, index) {
    const div = document.createElement('div');
    div.className = 'bg-white p-3 md:p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 ease-in-out relative flex flex-col';
    div.dataset.logoId = logo.id; // Add logo id for easier selection if needed

    // Image
    const img = document.createElement('img');
    const imgSrc = `${apiUrl}/data/uploads/${logo.path}`;
    img.src = imgSrc;
    img.alt = t('logoThumbnailAlt', {id: logo.id}); // Use translation
    img.className = 'w-full h-32 md:h-40 object-contain mb-2 md:mb-3 cursor-pointer';
    img.onclick = () => openLogoViewer(index); // Open viewer modal

    // Description Container
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'mt-1 mb-2 md:mb-3 flex-grow'; // flex-grow allows description to take space

    // User-facing Description Display
    const descriptionDisplay = document.createElement('p');
    descriptionDisplay.id = `desc-display-${logo.id}`;
    descriptionDisplay.textContent = logo.description || t('descriptionNone');
    descriptionDisplay.className = `text-sm text-gray-600 whitespace-pre-wrap ${isAdmin ? 'hidden' : ''}`; // Hide if admin, show formatted text

    descriptionContainer.appendChild(descriptionDisplay);

    // Admin Description Input/Status
    if (isAdmin) {
        const descriptionInput = document.createElement('textarea');
        descriptionInput.id = `desc-input-${logo.id}`;
        descriptionInput.value = logo.description || '';
        descriptionInput.placeholder = t('descriptionPlaceholder'); // Translate placeholder
        descriptionInput.rows = 2;
        descriptionInput.maxLength = 200; // Add a reasonable max length for logo descriptions
        descriptionInput.className = 'w-full p-1 border border-gray-300 rounded text-xs md:text-sm mb-1';
        descriptionInput.addEventListener('input', () => handleLogoDescriptionInput(logo.id)); // Debounced save on input

        const descriptionStatus = document.createElement('p');
        descriptionStatus.id = `desc-status-${logo.id}`;
        descriptionStatus.className = 'text-xs text-gray-500 h-4'; // Height to prevent layout shift

        descriptionContainer.appendChild(descriptionInput);
        descriptionContainer.appendChild(descriptionStatus);
    }

    // Vote Count
    const voteCount = document.createElement('p');
    voteCount.textContent = t('votesLabel', { count: logo.votes }); // Use translation
    voteCount.className = 'text-center text-base md:text-lg font-semibold mb-1 md:mb-2';
    voteCount.id = `votes-${logo.id}`;

    // Vote Button
    const voteButton = document.createElement('button');
    voteButton.textContent = t('voteBtn'); // Translate button text
    voteButton.className = 'w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out mt-auto vote-button-class'; // Added mt-auto and class
    voteButton.onclick = () => handleVoteClick(logo.id); // Trigger vote process

    // Append elements in order
    div.appendChild(img);
    div.appendChild(descriptionContainer);
    div.appendChild(voteCount);
    div.appendChild(voteButton);

    // Admin Delete Button
    if (isAdmin) {
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '&times;'; // 'X' symbol
        deleteButton.className = 'absolute top-1 right-1 bg-red-500 hover:bg-red-700 text-white font-bold h-6 w-6 rounded-full flex items-center justify-center text-xs z-10';
        deleteButton.title = t('deleteLogoTooltip'); // Translate tooltip
        deleteButton.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering image click
            handleDeleteLogo(logo.id);
        };
        div.appendChild(deleteButton);
    }

    return div;
}

// Processes the response from the /logos endpoint and updates the UI
function processLogosResponse(responseData) {
    const logos = responseData.logos || [];
    currentFriendlyUrlName = responseData.friendlyUrlName || null; // Update global state
    const currentNamespaceDescription = responseData.namespaceDescription || ""; // Get namespace description

    // Update the global list of logos being displayed
    displayedLogos = logos.map(logo => ({
        ...logo,
        description: logo.description || "" // Ensure description property exists
    }));

    // Clear previous grid content
    logoGrid.innerHTML = '';

    // Display logos or "no logos" message
    if (logos.length === 0) {
        noLogosMessage.style.display = 'block';
        setStatusMessage('', false); // Clear any loading status
    } else {
        noLogosMessage.style.display = 'none';
        // Create and append logo elements
        displayedLogos.forEach((logo, index) => {
            const logoElement = createLogoElement(logo, index);
            logoGrid.appendChild(logoElement);
        });
        setStatusMessage('', false); // Clear any loading status
    }

    // Update Namespace Description Display Area
    namespaceDescriptionText.textContent = currentNamespaceDescription || t('descriptionNone');
    namespaceDescriptionDisplaySection.style.display = currentNamespaceDescription ? 'block' : 'none'; // Show if description exists

    // Populate admin description textarea if admin
    if (isAdmin) {
        descriptionInput.value = currentNamespaceDescription;
        updateCharacterCount(); // Update count on load
    }

    // Update friendly URL display elements
    updateFriendlyUrlDisplay();

    // Ensure the page is translated correctly after dynamic content update
    translatePage();
}


// Updates the friendly URL input and links based on current state
function updateFriendlyUrlDisplay() {
    // Update admin input/status
    if (isAdmin && friendlyUrlInput && currentFriendlyUrlSpan && friendlyUrlStatus) {
        friendlyUrlInput.value = currentFriendlyUrlName || '';
        currentFriendlyUrlSpan.textContent = currentFriendlyUrlName || t('none'); // Display current name or "None"
        // Reset status message style if needed
        friendlyUrlStatus.className = 'mt-1 text-sm text-gray-600';
    }

    // Update share link visibility and content
    if (friendlyLinkP && friendlyLinkA) {
        if (currentFriendlyUrlName) {
            const friendlyUrl = `${window.location.origin}/v/${currentFriendlyUrlName}`;
            friendlyLinkA.href = friendlyUrl;
            friendlyLinkA.textContent = friendlyUrl;
            friendlyLinkP.style.display = 'flex'; // Show the paragraph (use flex for alignment)
        } else {
            friendlyLinkP.style.display = 'none'; // Hide if no friendly URL
        }
    }

    // Re-translate elements that might contain the friendly URL or related text
    translatePage();
}

// Shows the main welcome/create view, hides namespace-specific sections
function showWelcomeView() {
    namespaceInfoDiv.style.display = 'none';
    uploadSection.style.display = 'none';
    logoGridSection.style.display = 'none';
    adminControlsSection.style.display = 'none'; // Ensure admin controls are hidden
    passwordControls.style.display = 'none'; // Ensure password controls are hidden
    namespaceLinksDiv.style.display = 'none'; // Ensure links are hidden
    namespaceDescriptionDisplaySection.style.display = 'none'; // Hide description display

    createNamespaceSection.style.display = 'block';
    welcomeMessage.style.display = 'block';

    // Reset state variables that might persist from a previous view
    currentNamespaceId = null;
    currentAdminKey = null;
    isAdmin = false;
    currentFriendlyUrlName = null;
    displayedLogos = [];
    namespacePasswordVerified = false;

    // Translate static elements shown in this view
    translatePage();
}

// Shows the view for an active namespace, hiding the welcome section
function showNamespaceViewUI() {
    createNamespaceSection.style.display = 'none';
    welcomeMessage.style.display = 'none';

    namespaceInfoDiv.style.display = 'block';
    uploadSection.style.display = 'block'; // Show upload by default (might be hidden later if not admin)
    logoGridSection.style.display = 'block';

    // Set raw namespace ID display
    currentNamespaceIdP.textContent = `Namespace ID: ${currentNamespaceId}`;

    // Configure visibility based on admin status
    if (isAdmin) {
        adminControlsSection.style.display = 'block';
        passwordControls.style.display = 'block'; // Show admin password controls
        namespaceLinksDiv.style.display = 'block'; // Show share links section for admin

        // Populate admin links
        const baseUrl = window.location.origin + window.location.pathname;
        const votingUrl = `${baseUrl}?namespace=${currentNamespaceId}`;
        const adminUrl = `${baseUrl}?namespace=${currentNamespaceId}&admin=${currentAdminKey}`;
        votingLinkA.href = votingUrl;
        votingLinkA.textContent = votingUrl;
        adminLinkA.href = adminUrl;
        adminLinkA.textContent = adminUrl;

        // Make sure upload section is visible for admin
        uploadSection.style.display = 'block';
        // Show namespace description admin controls
        descriptionControls.style.display = 'block';

    } else {
        adminControlsSection.style.display = 'none';
        passwordControls.style.display = 'none'; // Hide admin password controls
        namespaceLinksDiv.style.display = 'none'; // Hide share links section for non-admin
        uploadSection.style.display = 'none'; // Hide upload section for non-admin
         // Hide namespace description admin controls
        descriptionControls.style.display = 'none';
    }

    // Friendly URL and description display will be updated by processLogosResponse/updateFriendlyUrlDisplay
    // Translate static elements shown in this view initially
    translatePage();
}