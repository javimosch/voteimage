        const supportedLanguages = ['en', 'fr'];
        let currentLanguage = 'en';
        let translations = {};

        function getPreferredLanguage() {
            const storedLang = localStorage.getItem('preferredLanguage');
            if (storedLang && supportedLanguages.includes(storedLang)) {
                return storedLang;
            }
            const browserLang = navigator.language.split('-')[0];
            return supportedLanguages.includes(browserLang) ? browserLang : 'en';
        }

        async function loadTranslations(lang) {
            try {
                const response = await fetch(`/locales/${lang}.json`);
                if (!response.ok) {
                    throw new Error(`Could not load ${lang}.json`);
                }
                translations = await response.json();
                console.log(`Translations loaded for ${lang}`);
            } catch (error) {
                console.error('Error loading translations:', error);
                if (lang !== 'en') {
                    console.warn(`Falling back to English translations.`);
                    await loadTranslations('en');
                } else {
                    translations = {};
                }
            }
        }

        function t(key, params = {}) {
            let translation = translations[key] || key;
            for (const param in params) {
                translation = translation.replace(`{${param}}`, params[param]);
            }
            return translation;
        }

        function translatePage() {
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                element.textContent = t(key);
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                element.placeholder = t(key);
            });
            document.querySelectorAll('[data-i18n-title]').forEach(element => {
                const key = element.getAttribute('data-i18n-title');
                element.title = t(key);
            });
            document.querySelectorAll('.lang-switcher a').forEach(a => {
                a.classList.remove('active');
            });
            const activeLink = document.getElementById(`lang-${currentLanguage}`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
            document.documentElement.lang = currentLanguage;
        }

        async function setLanguage(lang) {
            if (!supportedLanguages.includes(lang)) {
                console.warn(`Unsupported language: ${lang}`);
                return;
            }
            currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            await loadTranslations(lang);
            translatePage();
            await loadNamespaces();
        }

        const apiUrlBase = '/superadmin';
        const namespaceListBody = document.getElementById('namespace-list');
        const refreshBtn = document.getElementById('refresh-btn');
        const deleteEmptyBtn = document.getElementById('delete-empty-btn');
        const deleteAllBtn = document.getElementById('delete-all-btn');
        const statusMessageDiv = document.getElementById('status-message');
        const exportDataBtn = document.getElementById('export-data-btn');
        const importForm = document.getElementById('import-form');
        const importFileInput = document.getElementById('import-file-input');
        const importDataBtn = document.getElementById('import-data-btn');
        const importStatus = document.getElementById('import-status');

        document.addEventListener('DOMContentLoaded', async () => {
            currentLanguage = getPreferredLanguage();
            await loadTranslations(currentLanguage);
            translatePage();

            document.getElementById('lang-en').addEventListener('click', () => setLanguage('en'));
            document.getElementById('lang-fr').addEventListener('click', () => setLanguage('fr'));

            refreshBtn.addEventListener('click', loadNamespaces);
            deleteEmptyBtn.addEventListener('click', handleDeleteEmpty);
            deleteAllBtn.addEventListener('click', handleDeleteAll);
            exportDataBtn.addEventListener('click', handleExportData);
            importForm.addEventListener('submit', handleImportData);

            // === ADD THIS LINE BACK ===
            await loadNamespaces(); // Load the list initially
            // === END ADDITION ===
        });

        async function fetchNamespaces() {
            setStatusMessage('statusLoadingNamespaces', false);
            try {
                const response = await fetch(`${apiUrlBase}/namespaces`);
                if (response.status === 401) {
                    throw new Error(t('unauthorizedError'));
                }
                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Failed to fetch namespaces: ${response.status} ${response.statusText} - ${errorData}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error fetching namespaces:', error);
                setStatusMessage('statusErrorLoadingNamespaces', true, { message: error.message });
                return null;
            }
        }

        async function loadNamespaces() {
            namespaceListBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">${t('tableLoading')}</td></tr>`;
            const namespaces = await fetchNamespaces();

            if (namespaces === null) {
                namespaceListBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">${t('tableFailedLoad')}</td></tr>`;
                return;
            }

            namespaceListBody.innerHTML = '';

            if (namespaces.length === 0) {
                namespaceListBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">${t('tableNoNamespaces')}</td></tr>`;
                setStatusMessage('tableNoNamespaces', false);
            } else {
                namespaces.forEach(ns => {
                    const row = createNamespaceRow(ns);
                    namespaceListBody.appendChild(row);
                });
                setStatusMessage('statusLoadedNamespaces', false, { count: namespaces.length });
            }
            translatePage();
        }

        function createNamespaceRow(ns) {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            const baseAppUrl = window.location.origin + '/';

            if (ns.error) {
                tr.innerHTML = `
                    <td class="py-2 px-4 border-b" data-label="${t('tableHeaderNamespaceId')}">${ns.id}</td>
                    <td class="py-2 px-4 border-b text-red-500" colspan="6" data-label="${t('tableErrorRow', { error: '' })}">${t('tableErrorRow', { error: ns.error })}</td>
                    <td class="py-2 px-4 border-b text-center" data-label="${t('tableHeaderActions')}">
                        <button class="text-red-500 hover:text-red-700 font-semibold" onclick="handleDeleteSingle('${ns.id}')">${t('tableActionDelete')}</button>
                    </td>
                `;
                return tr;
            }

            let createdAtFormatted = 'N/A';
            if (ns.createdAt && ns.createdAt !== 'N/A') {
                try {
                    createdAtFormatted = new Date(ns.createdAt).toLocaleString(currentLanguage.replace('_', '-'));
                } catch (e) {
                    console.warn(`Could not parse date: ${ns.createdAt}`);
                    createdAtFormatted = ns.createdAt;
                }
            }

            const publicLink = `${baseAppUrl}?namespace=${ns.id}`;
            const adminLink = ns.adminKey ? `${baseAppUrl}?namespace=${ns.id}&admin=${ns.adminKey}` : 'N/A';
            const adminLinkHtml = ns.adminKey
                ? `<a href="${adminLink}" target="_blank" class="text-blue-600 hover:underline">${adminLink}</a>`
                : `<span class="text-gray-400">N/A</span>`;

            const friendlyUrl = ns.friendlyUrlName ? `${window.location.origin}/v/${ns.friendlyUrlName}` : null;
            const friendlyLinkHtml = friendlyUrl
                ? `<a href="${friendlyUrl}" target="_blank" class="text-purple-600 hover:underline">${friendlyUrl}</a>`
                : `<span class="text-gray-400">${t('tableFriendlyUrlNotSet')}</span>`;

            tr.innerHTML = `
                <td class="py-2 px-4 border-b" data-label="${t('tableHeaderNamespaceId')}">${ns.id}</td>
                <td class="py-2 px-4 border-b" data-label="${t('tableHeaderCreatedAt')}">${createdAtFormatted}</td>
                <td class="py-2 px-4 border-b text-right" data-label="${t('tableHeaderLogos')}">${ns.logoCount ?? 'N/A'}</td>
                <td class="py-2 px-4 border-b text-right" data-label="${t('tableHeaderVotes')}">${ns.totalVotes ?? 'N/A'}</td>
                <td class="py-2 px-4 border-b" data-label="${t('tableHeaderPublicLink')}"><a href="${publicLink}" target="_blank" class="text-blue-600 hover:underline">${publicLink}</a></td>
                <td class="py-2 px-4 border-b" data-label="${t('tableHeaderAdminLink')}">${adminLinkHtml}</td>
                <td class="py-2 px-4 border-b" data-label="${t('tableHeaderFriendlyUrl')}">${friendlyLinkHtml}</td>
                <td class="py-2 px-4 border-b text-center" data-label="${t('tableHeaderActions')}">
                    <button class="text-red-500 hover:text-red-700 font-semibold" onclick="handleDeleteSingle('${ns.id}')">${t('tableActionDelete')}</button>
                </td>
            `;
            return tr;
        }

        async function handleDeleteSingle(namespaceId) {
            if (!confirm(t('confirmDeleteSingleNs', { namespaceId: namespaceId }))) {
                return;
            }

            setStatusMessage('statusDeletingSingleNs', false, { namespaceId: namespaceId });
            try {
                const response = await fetch(`${apiUrlBase}/namespace/${namespaceId}`, {
                    method: 'DELETE',
                });
                if (response.status === 401) {
                    throw new Error(t('unauthorizedError'));
                }
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || `Failed to delete: ${response.statusText}`);
                }
                setStatusMessage('statusDeletedSingleNs', false, { namespaceId: namespaceId });
                await loadNamespaces();
            } catch (error) {
                console.error(`Error deleting namespace ${namespaceId}:`, error);
                setStatusMessage('statusErrorDeletingSingleNs', true, { namespaceId: namespaceId, message: error.message });
            }
        }

        async function handleDeleteEmpty() {
            if (!confirm(t('confirmDeleteEmptyNs'))) {
                return;
            }

            setStatusMessage('statusDeletingEmptyNs', false);
            try {
                const response = await fetch(`${apiUrlBase}/namespaces/empty`, {
                    method: 'DELETE',
                });
                if (response.status === 401) {
                    throw new Error(t('unauthorizedError'));
                }
                const result = await response.json();
                if (!response.ok) {
                     throw new Error(result.message || `Failed to delete empty namespaces: ${response.statusText}`);
                }
                setStatusMessage(result.messageKey || 'statusDeletedEmptyNs', false);
                await loadNamespaces();
            } catch (error) {
                console.error('Error deleting empty namespaces:', error);
                setStatusMessage('statusErrorDeletingEmptyNs', true, { message: error.message });
            }
        }

        async function handleDeleteAll() {
            if (!confirm(t('confirmDeleteAllNs'))) {
                return;
            }

            setStatusMessage('statusDeletingAllNs', false);
            try {
                const response = await fetch(`${apiUrlBase}/namespaces/all`, {
                    method: 'DELETE',
                });
                if (response.status === 401) {
                    throw new Error(t('unauthorizedError'));
                }
                const result = await response.json();
                if (!response.ok) {
                     throw new Error(result.message || `Failed to delete all namespaces: ${response.statusText}`);
                }
                setStatusMessage(result.messageKey || 'statusDeletedAllNs', false);
                await loadNamespaces();
            } catch (error) {
                console.error('Error deleting all namespaces:', error);
                setStatusMessage('statusErrorDeletingAllNs', true, { message: error.message });
            }
        }

        function handleExportData() {
            setStatusMessage('statusGeneratingExport', false);
            window.location.href = `${apiUrlBase}/export`;
            setTimeout(() => {
                setStatusMessage('statusExportStarted', false);
            }, 1500);
        }

        async function handleImportData(event) {
            event.preventDefault();
            if (!importFileInput.files || importFileInput.files.length === 0) {
                importStatus.textContent = t('importStatusSelectFile');
                importStatus.className = 'mt-2 text-sm text-yellow-600';
                return;
            }

            const file = importFileInput.files[0];
            if (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
                 importStatus.textContent = t('importStatusInvalidFile');
                 importStatus.className = 'mt-2 text-sm text-red-600';
                 return;
            }

            if (!confirm(t('importConfirmWarning'))) {
                return;
            }

            importStatus.textContent = t('importStatusImporting');
            importStatus.className = 'mt-2 text-sm text-blue-600';
            importDataBtn.disabled = true;

            const formData = new FormData();
            formData.append('backupFile', file);

            try {
                const response = await fetch(`${apiUrlBase}/import`, {
                    method: 'POST',
                    body: formData,
                });

                if (response.status === 401) {
                     throw new Error(t('unauthorizedError'));
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `Import failed: ${response.statusText}`);
                }

                importStatus.textContent = t('importStatusSuccess', { message: result.message });
                importStatus.className = 'mt-2 text-sm text-green-600';
                setStatusMessage('statusImportSuccess', false);
                importFileInput.value = '';
                await loadNamespaces();
            } catch (error) {
                console.error('Import error:', error);
                importStatus.textContent = t('importStatusError', { message: error.message });
                importStatus.className = 'mt-2 text-sm text-red-600';
                setStatusMessage('statusImportFailed', true, { message: error.message });
            } finally {
                 importDataBtn.disabled = false;
            }
        }

        function setStatusMessage(messageKey, isError = false, params = {}) {
            const message = t(messageKey, params);
            statusMessageDiv.textContent = message;
            statusMessageDiv.className = `mb-4 text-center font-medium ${isError ? 'text-red-600' : 'text-green-600'}`;
        }

        window.handleDeleteSingle = handleDeleteSingle;
