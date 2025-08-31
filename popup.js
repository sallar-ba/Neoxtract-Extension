document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractLinks');
    const copyAllBtn = document.getElementById('copyAll');
    const exportJsonBtn = document.getElementById('exportJson');
    const exportExcelBtn = document.getElementById('exportExcel');
    const searchInput = document.getElementById('searchInput');
    const filterInternal = document.getElementById('filterInternal');
    const filterExternal = document.getElementById('filterExternal');
    const linksContainer = document.getElementById('linksContainer');
    const linkCount = document.getElementById('linkCount');
    
    // Email elements
    const extractEmailsBtn = document.getElementById('extractEmails');
    const copyAllEmailsBtn = document.getElementById('copyAllEmails');
    const exportEmailsJsonBtn = document.getElementById('exportEmailsJson');
    const exportEmailsExcelBtn = document.getElementById('exportEmailsExcel');
    const emailSearchInput = document.getElementById('emailSearchInput');
    const filterVisibleEmails = document.getElementById('filterVisibleEmails');
    const filterHiddenEmails = document.getElementById('filterHiddenEmails');
    const emailsContainer = document.getElementById('emailsContainer');
    const emailCount = document.getElementById('emailCount');
    
    // Tab elements
    const linksTab = document.getElementById('linksTab');
    const emailsTab = document.getElementById('emailsTab');
    const linksTabContent = document.getElementById('linksTabContent');
    const emailsTabContent = document.getElementById('emailsTabContent');
    
    // Usage limit elements
    const usageCount = document.getElementById('usageCount');
    const usageProgressFill = document.getElementById('usageProgressFill');
    const usageFooter = document.getElementById('usageFooter');
    
    let allLinks = [];
    let filteredLinks = [];
    let isExtracting = false;
    let allEmails = [];
    let filteredEmails = [];
    let isExtractingEmails = false;
    let currentTab = 'links'; // Track current active tab
    let isAutoMode = false; // Track if auto mode is enabled
    
    // Usage limit configuration
    const DAILY_LIMIT = 50;
    const STORAGE_KEY = 'linkExtractorUsage';
    const DEVICE_KEY = 'linkExtractorDevice';
    const INSTALL_KEY = 'linkExtractorInstall';
    const MODE_KEY = 'linkExtractorMode'; // Store user's preferred mode
    
    // Initialize usage tracking
    initializeUsageTracking();
    
    // Initialize mode from storage
    initializeMode();
    
    // Tab event listeners
    linksTab.addEventListener('click', () => switchTab('links'));
    emailsTab.addEventListener('click', () => switchTab('emails'));
    
    // Extract links button click
    extractBtn.addEventListener('click', extractLinks);
    
    // Extract emails button click
    extractEmailsBtn.addEventListener('click', extractEmails);
    
    // Copy all links button
    copyAllBtn.addEventListener('click', () => {
        const linkUrls = filteredLinks.map(link => link.url).join('\n');
        navigator.clipboard.writeText(linkUrls).then(() => {
            showNotification('Links copied to clipboard!');
        }).catch(err => {
            showError('Failed to copy links: ' + err.message);
        });
    });
    
    // Export JSON button
    exportJsonBtn.addEventListener('click', () => {
        const dataToExport = {
            links: filteredLinks,
            exportedAt: new Date().toISOString(),
            totalCount: filteredLinks.length
        };
        
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `links-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Links exported as JSON!');
    });
    
    // Export Excel button
    exportExcelBtn.addEventListener('click', () => {
        try {
            // Show loading state
            exportExcelBtn.disabled = true;
            exportExcelBtn.innerHTML = '⏳ Creating Excel...';
            
            // Prepare data for Excel
            const worksheetData = [
                ['URL', 'Text', 'Type', 'Domain', 'Visible on Page']
            ];
            
            filteredLinks.forEach(link => {
                worksheetData.push([
                    link.url,
                    link.text || 'No text',
                    link.isExternal ? 'External' : 'Internal',
                    link.domain,
                    link.isVisible ? 'Yes' : 'No'
                ]);
            });
            
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Set column widths
            ws['!cols'] = [
                { wch: 50 }, // URL
                { wch: 30 }, // Text
                { wch: 12 }, // Type
                { wch: 20 }, // Domain
                { wch: 15 }  // Visible
            ];
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Links');
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `links-${timestamp}.xlsx`;
            
            // Write file
            XLSX.writeFile(wb, filename);
            
            // Success feedback
            exportExcelBtn.innerHTML = '✅ Downloaded!';
            showNotification('Links exported to Excel!');
            
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            showError('Failed to export to Excel: ' + error.message);
            exportExcelBtn.innerHTML = '❌ Failed';
        } finally {
            // Reset button state after delay
            setTimeout(() => {
                exportExcelBtn.disabled = false;
                exportExcelBtn.innerHTML = '📊 Export to Excel';
            }, 2000);
        }
    });
    
    // Search functionality
    searchInput.addEventListener('input', filterAndDisplayLinks);
    filterInternal.addEventListener('change', filterAndDisplayLinks);
    filterExternal.addEventListener('change', filterAndDisplayLinks);
    
    // Email search functionality
    emailSearchInput.addEventListener('input', filterAndDisplayEmails);
    filterVisibleEmails.addEventListener('change', filterAndDisplayEmails);
    filterHiddenEmails.addEventListener('change', filterAndDisplayEmails);
    
    // Copy all emails button
    copyAllEmailsBtn.addEventListener('click', () => {
        const emailAddresses = filteredEmails.map(email => email.email).join('\n');
        navigator.clipboard.writeText(emailAddresses).then(() => {
            showNotification('Emails copied to clipboard!');
        }).catch(err => {
            showError('Failed to copy emails: ' + err.message);
        });
    });
    
    // Export Emails JSON button
    exportEmailsJsonBtn.addEventListener('click', () => {
        const dataToExport = {
            emails: filteredEmails,
            exportedAt: new Date().toISOString(),
            totalCount: filteredEmails.length
        };
        
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `emails-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Emails exported as JSON!');
    });
    
    // Export Emails Excel button
    exportEmailsExcelBtn.addEventListener('click', () => {
        try {
            // Show loading state
            exportEmailsExcelBtn.disabled = true;
            exportEmailsExcelBtn.innerHTML = '⏳ Creating Excel...';
            
            // Prepare data for Excel
            const worksheetData = [
                ['Email', 'Source', 'Visible on Page', 'Context']
            ];
            
            filteredEmails.forEach(email => {
                worksheetData.push([
                    email.email,
                    email.source,
                    email.isVisible ? 'Yes' : 'No',
                    email.context || ''
                ]);
            });
            
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Set column widths
            ws['!cols'] = [
                { wch: 50 }, // Email
                { wch: 12 }, // Source
                { wch: 15 }, // Visible
                { wch: 30 }  // Context
            ];
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Emails');
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `emails-${timestamp}.xlsx`;
            
            // Write file
            XLSX.writeFile(wb, filename);
            
            // Success feedback
            exportEmailsExcelBtn.innerHTML = '✅ Downloaded!';
            showNotification('Emails exported to Excel!');
            
        } catch (error) {
            console.error('Error exporting emails to Excel:', error);
            showError('Failed to export emails to Excel: ' + error.message);
            exportEmailsExcelBtn.innerHTML = '❌ Failed';
        } finally {
            // Reset button state after delay
            setTimeout(() => {
                exportEmailsExcelBtn.disabled = false;
                exportEmailsExcelBtn.innerHTML = '📊 Export to Excel';
            }, 2000);
        }
    });
    
    // Tab switching functionality
    function switchTab(tab) {
        currentTab = tab;
        
        // Update tab buttons
        linksTab.classList.toggle('active', tab === 'links');
        emailsTab.classList.toggle('active', tab === 'emails');
        
        // Update tab content
        linksTabContent.classList.toggle('active', tab === 'links');
        emailsTabContent.classList.toggle('active', tab === 'emails');
        
        // Update header based on active tab
        const headerTitle = document.querySelector('.header h1');
        const headerDesc = document.querySelector('.header p');
        
        if (tab === 'links') {
            headerTitle.textContent = '🔗📧 Link & Email Extractor';
            headerDesc.textContent = 'Extract all links and emails from the current page';
        } else {
            headerTitle.textContent = '📧📧 Email Extractor';
            headerDesc.textContent = 'Extract all emails from the current page';
        }
        
        // Update mode UI for new tab
        updateModeUI();
        
        // Auto-extract if in auto mode
        if (isAutoMode) {
            setTimeout(() => {
                if (tab === 'links') {
                    extractLinks();
                } else {
                    extractEmails();
                }
            }, 300);
        }
    }
    
    // Mode management functions
    async function initializeMode() {
        try {
            const result = await chrome.storage.sync.get([MODE_KEY]);
            const savedMode = result[MODE_KEY];
            
            if (savedMode) {
                isAutoMode = savedMode === 'auto';
            }
            
            // Update UI to reflect current mode
            updateModeUI();
            
            // Auto-extract based on current tab and mode
            if (isAutoMode) {
                setTimeout(() => {
                    if (currentTab === 'links') {
                        extractLinks();
                    } else {
                        extractEmails();
                    }
                }, 500); // Small delay to ensure page is ready
            }
        } catch (error) {
            console.error('Error initializing mode:', error);
            // Default to manual mode on error
            isAutoMode = false;
            updateModeUI();
        }
    }
    
    async function setMode(mode, save = true) {
        isAutoMode = mode === 'auto';
        
        if (save) {
            try {
                await chrome.storage.sync.set({ [MODE_KEY]: mode });
            } catch (error) {
                console.error('Error saving mode:', error);
            }
        }
        
        updateModeUI();
        
        // Auto-extract if switching to auto mode
        if (isAutoMode) {
            setTimeout(() => {
                if (currentTab === 'links') {
                    extractLinks();
                } else {
                    extractEmails();
                }
            }, 300);
        }
    }
    
    function updateModeUI() {
        // Update button text based on current tab and mode
        if (currentTab === 'links') {
            extractBtn.textContent = isAutoMode ? '🔄 Refresh Links' : '🔗 Extract Links';
        } else {
            extractEmailsBtn.textContent = isAutoMode ? '🔄 Refresh Emails' : '📧 Extract Emails';
        }
    }
    
    // Extract links function
    async function extractLinks() {
        if (isExtracting) return;
        
        // Check usage limit before proceeding
        const currentUsage = await getCurrentUsageCount();
        if (currentUsage >= DAILY_LIMIT) {
            showLimitReached();
            showNotification('Daily extraction limit reached! Please try again tomorrow.', 'error', 4000);
            return;
        }
        
        isExtracting = true;
        showLoading(true);
        
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can access the tab
            if (!tab || !tab.url) {
                throw new Error('No active tab found');
            }
            
            // Check if it's a restricted page
            if (tab.url.startsWith('chrome://') || 
                tab.url.startsWith('chrome-extension://') || 
                tab.url.startsWith('edge://') || 
                tab.url.startsWith('about:')) {
                throw new Error('Cannot access browser internal pages');
            }
            
            console.log('Attempting to extract links from:', tab.url);
            
            // Try to send message to existing content script
            let response = await sendMessageWithRetry(tab.id, { action: 'extractLinks' });
            
            if (response && response.success) {
                // Increment usage count on successful extraction
                await incrementUsageCount();
                
                allLinks = response.data.links;
                updateLinkCount(response.data);
                enableControls();
                filterAndDisplayLinks();
                showSuccessMessage();
            } else {
                const errorMsg = response ? response.error : 'Unknown error occurred';
                throw new Error('Failed to extract links: ' + errorMsg);
            }
        } catch (error) {
            console.error('Error extracting links:', error);
            let userMessage = 'Error extracting links. ';
            
            if (error.message.includes('Cannot access browser internal pages')) {
                userMessage += 'This extension cannot work on browser internal pages.';
            } else if (error.message.includes('Could not communicate with page')) {
                userMessage += 'Please refresh the page and try again.';
            } else {
                userMessage += 'Please refresh the page if the issue persists.';
            }
            
            showError(userMessage);
        } finally {
            showLoading(false);
            isExtracting = false;
        }
    }
    
    // Extract emails function
    async function extractEmails() {
        if (isExtractingEmails) return;
        
        // Check usage limit before proceeding
        const currentUsage = await getCurrentUsageCount();
        if (currentUsage >= DAILY_LIMIT) {
            showLimitReached();
            showNotification('Daily extraction limit reached! Please try again tomorrow.', 'error', 4000);
            return;
        }
        
        isExtractingEmails = true;
        showLoading(true, 'emails');
        
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can access the tab
            if (!tab || !tab.url) {
                throw new Error('No active tab found');
            }
            
            // Check if it's a restricted page
            if (tab.url.startsWith('chrome://') || 
                tab.url.startsWith('chrome-extension://') || 
                tab.url.startsWith('edge://') || 
                tab.url.startsWith('about:')) {
                throw new Error('Cannot access browser internal pages');
            }
            
            console.log('Attempting to extract emails from:', tab.url);
            
            // Try to send message to existing content script
            let response = await sendMessageWithRetry(tab.id, { action: 'extractEmails' });
            
            if (response && response.success) {
                // Increment usage count on successful extraction
                await incrementUsageCount();
                
                allEmails = response.data.emails;
                updateEmailCount(response.data);
                enableEmailControls();
                filterAndDisplayEmails();
                showSuccessMessage('Emails extracted successfully!');
            } else {
                const errorMsg = response ? response.error : 'Unknown error occurred';
                throw new Error('Failed to extract emails: ' + errorMsg);
            }
        } catch (error) {
            console.error('Error extracting emails:', error);
            let userMessage = 'Error extracting emails. ';
            
            if (error.message.includes('Cannot access browser internal pages')) {
                userMessage += 'This extension cannot work on browser internal pages.';
            } else if (error.message.includes('Could not communicate with page')) {
                userMessage += 'Please refresh the page and try again.';
            } else {
                userMessage += 'Please try again.';
            }
            
            showError(userMessage);
        } finally {
            showLoading(false, 'emails');
            isExtractingEmails = false;
        }
    }
    
    // Send message with retry logic and content script injection
    async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await chrome.tabs.sendMessage(tabId, message);
                return response;
            } catch (error) {
                console.log(`Message attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                
                // Try to inject content script if it failed
                if (attempt === 1) {
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        });
                        console.log('Content script injected');
                    } catch (injectError) {
                        console.log('Failed to inject content script:', injectError);
                    }
                }
            }
        }
    }
    
    function filterAndDisplayLinks() {
        const searchTerm = searchInput.value.toLowerCase();
        const showInternal = filterInternal.checked;
        const showExternal = filterExternal.checked;
        
        filteredLinks = allLinks.filter(link => {
            const matchesSearch = link.url.toLowerCase().includes(searchTerm) || 
                                link.text.toLowerCase().includes(searchTerm);
            const matchesFilter = (link.isExternal && showExternal) || 
                                (!link.isExternal && showInternal);
            
            return matchesSearch && matchesFilter;
        });
        
        displayLinks(filteredLinks);
        updateFilteredCount();
    }
    
    function displayLinks(links) {
        if (links.length === 0) {
            if (allLinks.length === 0) {
                linksContainer.innerHTML = '<div class="placeholder">No links found on this page</div>';
            } else {
                linksContainer.innerHTML = '<div class="placeholder">No links match your search criteria</div>';
            }
            return;
        }
        
        // Limit to first 10 links
        const displayedLinks = links.slice(0, 10);
        const hasMoreLinks = links.length > 10;
        
        const html = displayedLinks.map(link => `
            <div class="link-item" data-link-id="${link.id}">
                <div class="link-header">
                    <span class="link-type ${link.isExternal ? 'external' : 'internal'}">
                        ${link.isExternal ? '🌐 External' : '🏠 Internal'}
                    </span>
                    <span class="link-domain">${link.domain}</span>
                </div>
                <div class="link-url">
                    <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.url}</a>
                </div>
                <div class="link-text">${link.text}</div>
                <div class="link-actions">
                    <button class="btn-small copy-link" data-url="${link.url}">
                        <span class="icon">📋</span>Copy
                    </button>
                    <button class="btn-small highlight-link" data-link-id="${link.id}" ${!link.isVisible ? 'disabled title="Link not visible on page"' : ''}>
                        <span class="icon">${link.isVisible ? '🎯' : '👁️'}</span>${link.isVisible ? 'Highlight' : 'Hidden'}
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add the links HTML to container
        let finalHtml = html;
        
        // Add "showing limited results" message if there are more links
        if (hasMoreLinks) {
            finalHtml += `
                <div class="more-links-notice">
                    <div class="more-links-text">
                        📄 Showing first 10 of ${links.length} links
                        <div class="more-links-tip">Use search or filters to narrow results</div>
                    </div>
                </div>
            `;
        }
        
        linksContainer.innerHTML = finalHtml;
        
        // Add event listeners for copy and highlight buttons
        document.querySelectorAll('.copy-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = btn.dataset.url;
                
                // Add visual feedback
                btn.style.background = 'linear-gradient(135deg, #20c997, #17a2b8)';
                btn.innerHTML = '<span class="icon">✅</span>Copied!';
                
                navigator.clipboard.writeText(url).then(() => {
                    showNotification('Link copied to clipboard!');
                    
                    // Reset button after a delay
                    setTimeout(() => {
                        btn.style.background = '';
                        btn.innerHTML = '<span class="icon">📋</span>Copy';
                    }, 1000);
                }).catch(err => {
                    showError('Failed to copy link');
                    // Reset button on error
                    btn.style.background = '';
                    btn.innerHTML = '<span class="icon">📋</span>Copy';
                });
            });
        });
        
        document.querySelectorAll('.highlight-link:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const linkId = parseInt(btn.dataset.linkId);
                
                // Add visual feedback
                btn.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
                btn.innerHTML = '<span class="icon">⚡</span>Highlighting...';
                
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    const response = await chrome.tabs.sendMessage(tab.id, { 
                        action: 'highlightLink', 
                        linkId: linkId 
                    });
                    
                    if (response.success) {
                        showNotification('Link highlighted on page!');
                        btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                        btn.innerHTML = '<span class="icon">✨</span>Highlighted!';
                        
                        // Reset button after delay
                        setTimeout(() => {
                            btn.style.background = '';
                            btn.innerHTML = '<span class="icon">🎯</span>Highlight';
                        }, 2000);
                    } else {
                        throw new Error('Failed to highlight');
                    }
                } catch (error) {
                    showError('Failed to highlight link on page');
                    btn.style.background = '';
                    btn.innerHTML = '<span class="icon">🎯</span>Highlight';
                }
            });
        });
    }
    
    function updateLinkCount(data) {
        const visibleText = data.visibleCount ? ` (${data.visibleCount} visible, ${data.hiddenCount} hidden)` : '';
        linkCount.textContent = `${data.totalCount} links found${visibleText} - ${data.internalCount} internal, ${data.externalCount} external`;
    }
    
    function updateFilteredCount() {
        const total = allLinks.length;
        const filtered = filteredLinks.length;
        if (filtered !== total) {
            linkCount.textContent = `Showing ${filtered} of ${total} links`;
        } else {
            linkCount.textContent = `${total} links found`;
        }
    }
    
    function enableControls() {
        copyAllBtn.disabled = false;
        exportJsonBtn.disabled = false;
        exportExcelBtn.disabled = false;
        searchInput.disabled = false;
    }
    
    function updateEmailCount(data) {
        const count = data.totalCount;
        const visible = data.visibleCount;
        const hidden = data.hiddenCount;
        
        let countText = `${count} email${count !== 1 ? 's' : ''} found`;
        if (visible !== count) {
            countText += ` (${visible} visible, ${hidden} hidden)`;
        }
        
        emailCount.textContent = countText;
    }
    
    function enableEmailControls() {
        emailSearchInput.disabled = false;
        filterVisibleEmails.disabled = false;
        filterHiddenEmails.disabled = false;
        copyAllEmailsBtn.disabled = false;
        exportEmailsJsonBtn.disabled = false;
        exportEmailsExcelBtn.disabled = false;
    }
    
    function filterAndDisplayEmails() {
        const searchTerm = emailSearchInput.value.toLowerCase();
        const showVisible = filterVisibleEmails.checked;
        const showHidden = filterHiddenEmails.checked;
        
        filteredEmails = allEmails.filter(email => {
            // Search filter
            const matchesSearch = !searchTerm || 
                email.email.toLowerCase().includes(searchTerm) ||
                (email.context && email.context.toLowerCase().includes(searchTerm));
            
            // Visibility filter
            const matchesVisibility = (showVisible && email.isVisible) || (showHidden && !email.isVisible);
            
            return matchesSearch && matchesVisibility;
        });
        
        displayEmails(filteredEmails);
    }
    
    function displayEmails(emails) {
        emailsContainer.innerHTML = '';
        
        if (emails.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            placeholder.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 8px;">📧</div>
                No emails found matching your criteria.<br>
                <small>Try adjusting your search or filters.</small>
            `;
            emailsContainer.appendChild(placeholder);
            return;
        }
        
        emails.forEach(email => {
            const emailItem = document.createElement('div');
            emailItem.className = 'email-item';
            
            const sourceIcon = getEmailSourceIcon(email.source);
            const visibilityIcon = email.isVisible ? '👁️' : '👻';
            
            emailItem.innerHTML = `
                <div class="email-header">
                    <div class="email-source">
                        ${sourceIcon} ${email.source}
                    </div>
                    <div class="email-visibility">
                        ${visibilityIcon} ${email.isVisible ? 'Visible' : 'Hidden'}
                    </div>
                </div>
                <div class="email-address">
                    <a href="mailto:${email.email}" class="email-link">${email.email}</a>
                </div>
                ${email.context ? `<div class="email-context">${escapeHtml(email.context)}</div>` : ''}
                <div class="email-actions">
                    <button class="btn-small copy-email" data-email="${email.email}">
                        📋 Copy
                    </button>
                </div>
            `;
            
            // Add event listener for copy button
            const copyBtn = emailItem.querySelector('.copy-email');
            copyBtn.addEventListener('click', () => copyEmailToClipboard(email.email));
            
            emailsContainer.appendChild(emailItem);
        });
    }
    
    function getEmailSourceIcon(source) {
        switch (source) {
            case 'mailto': return '📧';
            case 'input': return '📝';
            case 'text': return '📄';
            default: return '📧';
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async function copyEmailToClipboard(email) {
        try {
            await navigator.clipboard.writeText(email);
            showNotification('Email copied to clipboard!', 'success', 2000);
        } catch (error) {
            console.error('Failed to copy email:', error);
            showNotification('Failed to copy email', 'error');
        }
    }
    
    function showLoading(show, type = 'links') {
        if (show) {
            if (type === 'links') {
                linksContainer.innerHTML = '<div class="loading">Extracting links...</div>';
                extractBtn.disabled = true;
                extractBtn.textContent = 'Extracting...';
            } else {
                emailsContainer.innerHTML = '<div class="loading">Extracting emails...</div>';
                extractEmailsBtn.disabled = true;
                extractEmailsBtn.textContent = 'Extracting...';
            }
        } else {
            if (type === 'links') {
                extractBtn.disabled = false;
                extractBtn.textContent = '🔄 Refresh Links';
            } else {
                extractEmailsBtn.disabled = false;
                extractEmailsBtn.textContent = '🔄 Refresh Emails';
            }
        }
    }
    
    function showSuccessMessage(message = '') {
        // Only show success notification if links or emails were found
        if (allLinks.length > 0) {
            showNotification(`Found ${allLinks.length} links!`);
        }
        if (allEmails.length > 0) {
            showNotification(`Found ${allEmails.length} emails!`);
        }
        if (message) {
            showNotification(message);
        }
    }
    
    function showNotification(message, type = 'success', duration = 3000) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    function showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Usage tracking functions
    async function initializeUsageTracking() {
        try {
            // Generate a simple device fingerprint for secondary validation
            const deviceId = await getOrCreateDeviceId();
            
            // Get current usage data
            const result = await chrome.storage.sync.get([STORAGE_KEY, INSTALL_KEY]);
            const today = new Date().toDateString();
            let usageData = result[STORAGE_KEY] || { 
                date: today, 
                count: 0, 
                deviceId: deviceId,
                created: Date.now()
            };
            
            // Check if this is a first-time install
            if (!result[INSTALL_KEY]) {
                await chrome.storage.sync.set({ 
                    [INSTALL_KEY]: { 
                        date: Date.now(), 
                        deviceId: deviceId 
                    } 
                });
            }
            
            // Reset count if it's a new day
            if (usageData.date !== today) {
                usageData = { 
                    date: today, 
                    count: 0, 
                    deviceId: deviceId,
                    created: usageData.created || Date.now(),
                    lastReset: Date.now()
                };
                await chrome.storage.sync.set({ [STORAGE_KEY]: usageData });
            }
            
            // Validate device consistency (simple anti-abuse measure)
            if (usageData.deviceId && usageData.deviceId !== deviceId) {
                // Device mismatch detected - could be data from another device or tampering
                console.log('Device mismatch detected, checking for data loss scenario...');
                await handleDeviceMismatch(usageData, deviceId, today);
                return;
            }
            
            updateUsageDisplay(usageData.count);
        } catch (error) {
            console.error('Error initializing usage tracking:', error);
            // Fallback to conservative approach
            showStorageError();
            updateUsageDisplay(0);
        }
    }
    
    async function getOrCreateDeviceId() {
        try {
            // Create a simple device fingerprint using available browser info
            const fingerprint = btoa(
                navigator.userAgent.slice(0, 20) + 
                navigator.language + 
                screen.width + 'x' + screen.height +
                new Date().getTimezoneOffset()
            ).slice(0, 16);
            
            const result = await chrome.storage.sync.get([DEVICE_KEY]);
            if (result[DEVICE_KEY]) {
                return result[DEVICE_KEY];
            }
            
            // Store the device ID
            await chrome.storage.sync.set({ [DEVICE_KEY]: fingerprint });
            return fingerprint;
        } catch (error) {
            console.error('Error creating device ID:', error);
            return 'fallback-device';
        }
    }
    
    async function handleDeviceMismatch(oldData, newDeviceId, today) {
        try {
            // This could be a legitimate case where:
            // 1. User is on a different device (sync storage)
            // 2. User cleared extension data
            // 3. Browser profile was reset
            
            const installData = await chrome.storage.sync.get([INSTALL_KEY]);
            const daysSinceInstall = installData[INSTALL_KEY] ? 
                Math.floor((Date.now() - installData[INSTALL_KEY].date) / (1000 * 60 * 60 * 24)) : 0;
            
            // If it's been more than a day since install, be more lenient
            if (daysSinceInstall > 1) {
                // Reset usage data for new device
                const newUsageData = { 
                    date: today, 
                    count: 0, 
                    deviceId: newDeviceId,
                    created: Date.now(),
                    lastReset: Date.now()
                };
                await chrome.storage.sync.set({ [STORAGE_KEY]: newUsageData });
                updateUsageDisplay(0);
                console.log('Usage data reset for new device');
            } else {
                // Keep old data but log the mismatch
                console.log('Device mismatch detected but keeping existing data');
                updateUsageDisplay(oldData.count);
            }
        } catch (error) {
            console.error('Error handling device mismatch:', error);
            updateUsageDisplay(0);
        }
    }
    
    function showStorageError() {
        const usageFooter = document.getElementById('usageFooter');
        usageFooter.innerHTML = `
            <div class="usage-error">
                <div style="color: #dc2626; font-size: 12px; text-align: center; padding: 8px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
                    ⚠️ Storage Error<br>
                    <span style="font-size: 11px; color: #991b1b;">
                        Unable to track usage. This may be due to browser restrictions.<br>
                        Extension functionality may be limited.
                    </span>
                    <button id="retryBtn" style="
                        margin-top: 8px;
                        padding: 4px 8px;
                        font-size: 10px;
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Retry</button>
                </div>
            </div>
        `;
        
        // Add event listener for retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                location.reload();
            });
        }
    }
    
    async function incrementUsageCount() {
        try {
            const deviceId = await getOrCreateDeviceId();
            const result = await chrome.storage.sync.get([STORAGE_KEY]);
            const today = new Date().toDateString();
            let usageData = result[STORAGE_KEY] || { 
                date: today, 
                count: 0, 
                deviceId: deviceId,
                created: Date.now()
            };
            
            // Reset count if it's a new day
            if (usageData.date !== today) {
                usageData = { 
                    date: today, 
                    count: 0, 
                    deviceId: deviceId,
                    created: usageData.created || Date.now(),
                    lastReset: Date.now()
                };
            }
            
            // Validate device consistency
            if (usageData.deviceId && usageData.deviceId !== deviceId) {
                console.log('Device mismatch during increment, handling...');
                await handleDeviceMismatch(usageData, deviceId, today);
                const newResult = await chrome.storage.sync.get([STORAGE_KEY]);
                usageData = newResult[STORAGE_KEY];
            }
            
            usageData.count++;
            usageData.lastUsed = Date.now();
            await chrome.storage.sync.set({ [STORAGE_KEY]: usageData });
            updateUsageDisplay(usageData.count);
            
            return usageData.count;
        } catch (error) {
            console.error('Error incrementing usage count:', error);
            return DAILY_LIMIT; // Conservative fallback
        }
    }
    
    async function getCurrentUsageCount() {
        try {
            const deviceId = await getOrCreateDeviceId();
            const result = await chrome.storage.sync.get([STORAGE_KEY]);
            const today = new Date().toDateString();
            const usageData = result[STORAGE_KEY] || { 
                date: today, 
                count: 0, 
                deviceId: deviceId,
                created: Date.now()
            };
            
            // Return limit if it's a new day (will be reset on next operation)
            if (usageData.date !== today) {
                return 0;
            }
            
            // Validate device consistency
            if (usageData.deviceId && usageData.deviceId !== deviceId) {
                console.log('Device mismatch during get, returning conservative count');
                return Math.min(usageData.count || 0, DAILY_LIMIT);
            }
            
            return usageData.count || 0;
        } catch (error) {
            console.error('Error getting usage count:', error);
            return DAILY_LIMIT; // Conservative fallback
        }
    }
    
    function updateUsageDisplay(count) {
        const remaining = Math.max(0, DAILY_LIMIT - count);
        const percentage = Math.min(100, (count / DAILY_LIMIT) * 100);
        
        // Update count display
        usageCount.textContent = `${count}/${DAILY_LIMIT}`;
        
        // Update progress bar
        usageProgressFill.style.width = `${percentage}%`;
        
        // Update progress bar color based on usage
        usageProgressFill.className = 'usage-progress-fill';
        if (percentage >= 100) {
            usageProgressFill.classList.add('danger');
        } else if (percentage >= 80) {
            usageProgressFill.classList.add('warning');
        }
        
        // Update footer content
        if (count >= DAILY_LIMIT) {
            showLimitReached();
        } else {
            usageFooter.innerHTML = `
                <span class="usage-remaining">${remaining} extractions remaining today</span>
            `;
        }
    }
    
    function showLimitReached() {
        usageFooter.innerHTML = `
            <div class="usage-limit-reached">
                <div class="limit-title">Daily Limit Reached</div>
                <div class="limit-message">
                    You've used all ${DAILY_LIMIT} free extractions today. Please try again tomorrow!
                </div>
                <div class="limit-reset-info">
                    Free limit resets at midnight
                </div>
            </div>
        `;
        
        // Disable the extract buttons
        extractBtn.disabled = true;
        extractBtn.textContent = '🚫 Daily Limit Reached';
        extractBtn.style.opacity = '0.6';
        extractBtn.style.cursor = 'not-allowed';
        
        extractEmailsBtn.disabled = true;
        extractEmailsBtn.textContent = '🚫 Daily Limit Reached';
        extractEmailsBtn.style.opacity = '0.6';
        extractEmailsBtn.style.cursor = 'not-allowed';
    }
});
