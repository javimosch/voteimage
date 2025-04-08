// --- Utility Functions ---

function setStatusMessage(keyOrText, isError = false, params = {}) {
    const message = translations[keyOrText] ? t(keyOrText, params) : keyOrText; // Translate if key exists
    statusMessage.textContent = message;
    statusMessage.className = `mt-6 text-center font-medium ${isError ? 'text-red-600' : 'text-green-600'} status-message`; // Ensure class for selector

    // Store the key and params for potential re-translation on language change
    if (translations[keyOrText]) {
        statusMessage.dataset.i18nKey = keyOrText;
        statusMessage.dataset.i18nParams = JSON.stringify(params);
    } else {
        delete statusMessage.dataset.i18nKey;
        delete statusMessage.dataset.i18nParams;
    }

    // Clear message after a delay unless it's an error or specific persistent message
    // Example persistent messages: 'statusNamespaceCreated', 'statusVoteExists'
    const persistentKeys = ['statusNamespaceCreated', 'statusVoteExists', 'statusNamespaceNotFound'];
    if (!isError && !persistentKeys.includes(keyOrText)) {
        setTimeout(() => {
            // Only clear if the message hasn't changed in the meantime
            if (statusMessage.dataset.i18nKey === keyOrText || statusMessage.textContent === message) {
                 statusMessage.textContent = '';
                 statusMessage.className = 'mt-6 text-center font-medium status-message';
                 delete statusMessage.dataset.i18nKey;
                 delete statusMessage.dataset.i18nParams;
            }
        }, 5000); // 5 seconds
    }
}

function updateCharacterCount() {
    if (descriptionInput && characterCountSpan) {
        const count = descriptionInput.value.length;
        characterCountSpan.textContent = count;
    }
}

// Simple debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}