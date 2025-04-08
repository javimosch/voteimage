// --- DOM Element Selection ---

// Assuming elements exist in body.html
const logoGrid = document.getElementById('logo-grid');
const uploadForm = document.getElementById('upload-form');
const logoFileInput = document.getElementById('logo-file-input');
const uploadStatus = document.getElementById('upload-status');
const createNamespaceBtn = document.getElementById('create-namespace-btn');
const namespaceInfoDiv = document.getElementById('namespace-info');
const currentNamespaceIdP = document.getElementById('current-namespace-id'); // Displays the raw ID
const uploadSection = document.getElementById('upload-section');
const logoGridSection = document.getElementById('logo-grid-section');
const createNamespaceSection = document.getElementById('create-namespace-section');
const welcomeMessage = document.getElementById('welcome-message');
const noLogosMessage = document.getElementById('no-logos-message');
const statusMessage = document.getElementById('status-message');

// Admin Controls specific elements
const adminControlsSection = document.getElementById('admin-controls-section');
const clearVotesBtn = document.getElementById('clear-votes-btn');
const deleteNamespaceBtn = document.getElementById('delete-namespace-btn');
const namespaceLinksDiv = document.getElementById('namespace-links');
const votingLinkA = document.getElementById('voting-link');
const adminLinkA = document.getElementById('admin-link');
const friendlyUrlInput = document.getElementById('friendly-url-input');
const setFriendlyUrlBtn = document.getElementById('set-friendly-url-btn');
const friendlyUrlStatus = document.getElementById('friendly-url-status'); // The <p> tag
const currentFriendlyUrlSpan = document.getElementById('current-friendly-url'); // The <span> inside the <p>
const friendlyLinkP = document.getElementById('friendly-link-p');
const friendlyLinkA = document.getElementById('friendly-link');

// Identifier Modal elements
const identifierModal = document.getElementById('identifier-modal');
const identifierInput = document.getElementById('identifier-input');
const submitIdentifierBtn = document.getElementById('submit-identifier-btn');
const modalError = document.getElementById('modal-error'); // Error message inside identifier modal

// Password Modal elements
const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const submitPasswordBtn = document.getElementById('submit-password-btn');
const passwordModalError = document.getElementById('password-modal-error'); // Error message inside password modal

// Password Admin Controls
const passwordControls = document.getElementById('password-controls');
const setPasswordInput = document.getElementById('set-password-input');
const setPasswordBtn = document.getElementById('set-password-btn');
const passwordStatus = document.getElementById('password-status'); // Status message for setting password

// Logo Viewer Modal elements
const logoViewerModal = document.getElementById('logo-viewer-modal');
const logoViewerImg = document.getElementById('logo-viewer-img');
const logoViewerCloseBtn = document.getElementById('logo-viewer-close-btn');
const logoViewerPrevBtn = document.getElementById('logo-viewer-prev');
const logoViewerNextBtn = document.getElementById('logo-viewer-next');
const logoViewerVoteBtn = document.getElementById('logo-viewer-vote-btn');

// Namespace Description elements
const namespaceDescriptionDisplaySection = document.getElementById('namespace-description-display-section');
const namespaceDescriptionText = document.getElementById('namespace-description-text'); // Display area for users/admins
const descriptionControls = document.getElementById('description-controls'); // Admin section wrapper
const descriptionInput = document.getElementById('description-input'); // Admin textarea
const saveDescriptionBtn = document.getElementById('save-description-btn'); // Admin save button
const characterCountSpan = document.getElementById('character-count'); // Admin char count
const descriptionSaveStatus = document.getElementById('description-save-status'); // Admin save status message

// Language switcher links
const langEnLink = document.getElementById('lang-en');
const langFrLink = document.getElementById('lang-fr');

// Base URL for API calls (assuming same origin)
const apiUrl = '';