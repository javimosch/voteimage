// Global state variables

let globalIdentifier = null; // <-- NEW: Store the global identifier

let isAdmin = false;
let currentNamespaceId = null;
let currentAdminKey = null;
let currentFriendlyUrlName = null; // Store current friendly name
let namespacePasswordVerified = false;

// Data stores
let displayedLogos = []; // To store the current list of logos displayed in the grid/viewer
let translations = {}; // To store loaded i18n strings
let saveDescriptionDebounceTimers = {}; // Store debounce timers for logo description saving

// Modal/Viewer state
let currentLogoIdToVote = null; // Store logo ID when identifier modal opens
let currentLogoIndex = -1; // Index of the logo currently shown in the viewer

// Language state
const supportedLanguages = ['en', 'fr'];
let currentLanguage = 'en'; // Default, will be potentially overridden during init