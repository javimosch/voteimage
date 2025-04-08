// --- Internationalization (i18n) ---

async function getDefaultLanguage() {
    try {
        // Get default language from server response headers
        const response = await fetch(window.location.pathname); // Fetch root to get header
        const defaultLang = response.headers.get('X-Default-Lang') || 'fr';
        // Validate against supported languages
        return supportedLanguages.includes(defaultLang) ? defaultLang : 'fr';
    } catch (error) {
        console.warn('Could not fetch default language:', error);
        return 'fr'; // Fallback to French
    }
}

function getPreferredLanguage() {
    // Check localStorage first
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && supportedLanguages.includes(storedLang)) {
        return storedLang;
    }

    // Then check browser language
    const browserLang = navigator.language.split('-')[0];
    if (supportedLanguages.includes(browserLang)) {
        return browserLang;
    }

    // Return default (will be set during initialization)
    return currentLanguage; // currentLanguage holds the initial default
}

function updateLanguageSwitcherUI() {
    document.querySelectorAll('.lang-switcher a').forEach(a => {
        const lang = a.id.split('-')[1];
        if (lang === currentLanguage) {
            a.classList.add('active');
        } else {
            a.classList.remove('active');
        }
        a.setAttribute('aria-pressed', lang === currentLanguage);
        a.setAttribute('role', 'button');
    });
    document.documentElement.lang = currentLanguage; // Update HTML lang attribute
}

async function loadTranslations(lang) {
    // Ensure lang is supported, fallback to currentLanguage if not
    const langToLoad = supportedLanguages.includes(lang) ? lang : currentLanguage;
    try {
        const response = await fetch(`/locales/${langToLoad}.json`);
        if (!response.ok) {
            throw new Error(`Could not load ${langToLoad}.json: ${response.statusText}`);
        }
        translations = await response.json(); // Update global translations object
        console.log(`Translations loaded for ${langToLoad}`);
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to English if the requested language fails, unless English itself failed
        if (langToLoad !== 'en') {
            console.warn(`Falling back to English translations.`);
            await loadTranslations('en');
        } else {
            // If English fails, use keys as fallback
            translations = {};
        }
    }
}

function t(key, params = {}) {
    let translation = translations[key] || key; // Fallback to key if not found
    for (const param in params) {
        // Use a regex to replace all occurrences of the placeholder
        const regex = new RegExp(`\\{${param}\\}`, 'g');
        translation = translation.replace(regex, params[param]);
    }
    return translation;
}

function translatePage() {
    // Translate elements with data-i18n attribute (textContent)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Translate titles (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });

    // Translate elements with data-i18n-base (used for dynamic text like friendly URL status)
    // This needs careful handling if the dynamic part (span) exists
    document.querySelectorAll('[data-i18n-base]').forEach(element => {
        const key = element.getAttribute('data-i18n-base');
        const span = element.querySelector('span'); // Assume one dynamic part per element
        if (span) {
            // Translate the base text, replacing the placeholder part
            // Example: key = "currentFriendlyUrl", translation = "Current: {url}"
            const baseText = t(key, { url: '' }).replace('{url}', ''); // Get "Current: "
            element.textContent = baseText; // Set base text first
            element.appendChild(span); // Re-append the dynamic span
        } else {
            // If no span, just translate the whole text
            element.textContent = t(key);
        }
    });

    // Special case: Translate button text directly if needed (e.g., vote button in grid)
    // Note: This might be better handled when the element is created/updated
    // document.querySelectorAll('.vote-button-class').forEach(btn => btn.textContent = t('voteBtn'));

    // === NEW: Update footer identifier text during translation ===
    updateIdentifierUI();
    // === END NEW ===

    // Update language switcher visual state
    updateLanguageSwitcherUI();
}

async function setLanguage(lang) {
    if (!supportedLanguages.includes(lang) || lang === currentLanguage) {
        console.warn(`Unsupported or already active language: ${lang}`);
        return;
    }
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang); // Persist preference

    await loadTranslations(lang); // Load new translations
    translatePage(); // Apply translations to the whole page

    // Re-load dynamic content if a namespace is active, as some text comes from the server
    // or is generated dynamically (like logo cards)
    if (currentNamespaceId) {
        console.log("Re-loading logos after language change...");
        await loadLogos(); // This function should call translatePage() internally or its results should be translated
        // Also re-translate any existing status messages
        const currentStatusKey = statusMessage.dataset.i18nKey;
        const currentStatusParams = statusMessage.dataset.i18nParams ? JSON.parse(statusMessage.dataset.i18nParams) : {};
        const isError = statusMessage.classList.contains('text-red-600');
        if (currentStatusKey) {
             setStatusMessage(currentStatusKey, isError, currentStatusParams);
        }

    }
}