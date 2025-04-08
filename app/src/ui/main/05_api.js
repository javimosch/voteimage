// --- API Interaction Functions ---

async function fetchApi(endpoint, options = {}) {
    try {
        const response = await fetch(apiUrl + endpoint, options);
        const data = await response.json().catch(() => ({})); // Try to parse JSON, default to empty object on failure

        if (!response.ok) {
            // Attach status and potentially parsed data to the error
            const error = new Error(data.message || `HTTP error! status: ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data; // Return parsed JSON data on success
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        // Re-throw the error so calling functions can handle it
        throw error;
    }
}

// Fetch logos for the current namespace
async function fetchLogosData(namespaceId) {
    return fetchApi(`/logos?namespace=${namespaceId}`);
}

// Create a new namespace
async function createNamespace() {
    return fetchApi('/namespace', { method: 'POST' });
}

// Upload logo files
async function uploadLogos(namespaceId, formData) {
    // Use fetch directly for FormData upload, handling response manually
    try {
        const response = await fetch(`${apiUrl}/upload?namespace=${namespaceId}`, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();

        // Handle non-OK responses, including 207 Partial Content
        if (!response.ok && response.status !== 207) {
            throw new Error(result.message || `Upload failed: ${response.statusText}`);
        }
        return { status: response.status, ...result }; // Combine status and result body
    } catch (error) {
        console.error('Upload error:', error);
        throw error; // Re-throw
    }
}

// Submit a vote
async function submitVoteRequest(namespaceId, logoId, identifier) {
    return fetchApi(`/vote?namespace=${namespaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoId, identifier }),
    });
}

// Delete a specific logo (Admin)
async function deleteLogoRequest(namespaceId, logoId, adminKey) {
    return fetchApi(`/logo?namespace=${namespaceId}&logoId=${logoId}&admin=${adminKey}`, {
        method: 'DELETE',
    });
}

// Clear all votes in a namespace (Admin)
async function clearVotesRequest(namespaceId, adminKey) {
    return fetchApi(`/clear-votes?namespace=${namespaceId}&admin=${adminKey}`, {
        method: 'POST',
    });
}

// Delete an entire namespace (Admin)
async function deleteNamespaceRequest(namespaceId, adminKey) {
    return fetchApi(`/namespace?namespace=${namespaceId}&admin=${adminKey}`, {
        method: 'DELETE',
    });
}

// Set/Update friendly URL for a namespace (Admin)
async function setFriendlyUrlRequest(namespaceId, adminKey, friendlyName) {
    return fetchApi(`/namespace/friendly-url?namespace=${namespaceId}&admin=${adminKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendlyName }),
    });
}

// Set/Update namespace description (Admin)
async function setNamespaceDescriptionRequest(namespaceId, adminKey, description) {
    return fetchApi(`/namespace/description?namespace=${namespaceId}&admin=${adminKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
    });
}

// Set/Update logo description (Admin)
async function setLogoDescriptionRequest(namespaceId, logoId, adminKey, description) {
    return fetchApi(`/logo/description?namespace=${namespaceId}&logoId=${logoId}&admin=${adminKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
    });
}

// Set/Update namespace password (Admin)
async function setNamespacePasswordRequest(namespaceId, adminKey, password) {
    return fetchApi(`/namespace/password?namespace=${namespaceId}&admin=${adminKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }), // Empty string removes password
    });
}

// Verify namespace password (User)
async function verifyNamespacePasswordRequest(namespaceId, password) {
    return fetchApi(`/namespace/verify-password?namespace=${namespaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });
}