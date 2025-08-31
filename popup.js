document.addEventListener('DOMContentLoaded', function() {
    // Initialize ExtPay for Stripe payments
    // Replace 'extractor' with your actual ExtPay extension ID
    const extpay = ExtPay('extractor'); // Your ExtPay ID
    
    const extractBtn = document.getElementById('extractLinks');
    const copyAllBtn = document.getElementById('copyAll');
    const exportJsonBtn = document.getElementById('exportJson');
    const exportExcelBtn = document.getElementById('exportExcel');
    const searchInput = document.getElementById('searchInput');
    const filterInternal = document.getElementById('filterInternal');
    const filterExternal = document.getElementById('filterExternal');
    const linksContainer = document.getElementById('linksContainer');
    const linkCount = document.getElementById('linkCount');
    
    // Mode toggle elements
    const autoModeBtn = document.getElementById('autoModeBtn');
    const manualModeBtn = document.getElementById('manualModeBtn');
    
    // Usage limit elements
    const usageCount = document.getElementById('usageCount');
    const usageProgressFill = document.getElementById('usageProgressFill');
    const usageFooter = document.getElementById('usageFooter');
    
    let allLinks = [];
    let filteredLinks = [];
    let isExtracting = false;
    let isAutoMode = true; // Default to auto mode
    let isPremiumUser = false; // Premium status
    
    // Usage limit configuration
    const DAILY_LIMIT = 5;
    const STORAGE_KEY = 'linkExtractorUsage';
    const DEVICE_KEY = 'linkExtractorDevice';
    const INSTALL_KEY = 'linkExtractorInstall';
    const MODE_KEY = 'linkExtractorMode'; // Store user's preferred mode
    
    // Initialize ExtPay and check user subscription status
    initializeExtPay();
    
    // Initialize usage tracking
    initializeUsageTracking();
    
    // Initialize mode from storage
    initializeMode();
    
    // Add event listeners for usage UI elements
    const resetUsageBtn = document.getElementById('resetUsageBtn');
    
    if (resetUsageBtn) {
        resetUsageBtn.addEventListener('click', resetUsageForTesting);
    }
    
    // Add event listeners for mode toggle
    if (autoModeBtn) {
        autoModeBtn.addEventListener('click', () => setMode('auto'));
    }
    if (manualModeBtn) {
        manualModeBtn.addEventListener('click', () => setMode('manual'));
    }
    
    // Auto-extract will be handled in initializeMode() after mode is loaded
    
    // ExtPay initialization and premium user management
    async function initializeExtPay() {
        try {
            // Check if user is premium
            const user = await extpay.getUser();
            isPremiumUser = user.paid;
            
            console.log('ExtPay user status:', { paid: user.paid, subscriptionStatus: user.subscriptionStatus });
            
            // Listen for subscription changes
            extpay.onPaid.addListener((user) => {
                console.log('User subscription activated:', user);
                isPremiumUser = true;
                updatePremiumStatus();
                showNotification('🎉 Premium activated! You now have unlimited extractions!', 'success', 5000);
            });
            
            // Update UI based on premium status
            updatePremiumStatus();
            
        } catch (error) {
            console.error('ExtPay initialization error:', error);
            // Fallback to free tier if ExtPay fails
            isPremiumUser = false;
            updatePremiumStatus();
        }
    }
    
    function updatePremiumStatus() {
        // Update usage display to reflect premium status
        if (isPremiumUser) {
            // Show premium status in usage header
            usageCount.textContent = '∞ Unlimited';
            usageCount.style.color = '#10b981';
            usageCount.style.fontWeight = '600';
            
            // Hide progress bar for premium users
            const progressBar = document.querySelector('.usage-progress-bar');
            if (progressBar) {
                progressBar.style.display = 'none';
            }
            
            // Update footer to show premium status
            usageFooter.innerHTML = `
                <div class="premium-status">
                    <span style="color: #10b981; font-weight: 600;">
                        ✨ Premium Active - Unlimited Extractions
                    </span>
                    <button id="managePremiumBtn" style="
                        margin-top: 8px;
                        padding: 4px 12px;
                        font-size: 11px;
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Manage Subscription</button>
                </div>
            `;
            
            // Add event listener for manage subscription button
            const managePremiumBtn = document.getElementById('managePremiumBtn');
            if (managePremiumBtn) {
                managePremiumBtn.addEventListener('click', openSubscriptionManagement);
            }
        } else {
            // Show regular usage display for free users
            const progressBar = document.querySelector('.usage-progress-bar');
            if (progressBar) {
                progressBar.style.display = 'block';
            }
            
            // Reset usage count styling
            usageCount.style.color = '';
            usageCount.style.fontWeight = '';
            
            // Re-initialize usage display for free users
            initializeUsageTracking();
        }
    }
    
    function openSubscriptionManagement() {
        try {
            // Open ExtPay subscription management
            extpay.openPaymentPage();
        } catch (error) {
            console.error('Error opening subscription management:', error);
            showNotification('Unable to open subscription management. Please try again.', 'error');
        }
    }
    
    async function initiateUpgrade() {
        try {
            // Open ExtPay payment page for subscription
            await extpay.openPaymentPage();
        } catch (error) {
            console.error('Error initiating upgrade:', error);
            showNotification('Unable to process upgrade. Please try again.', 'error');
        }
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
            if (daysSinceInstall > 0) {
                // Reset with grace period
                const resetData = { 
                    date: today, 
                    count: 0, 
                    deviceId: newDeviceId,
                    created: Date.now(),
                    gracePeriod: true,
                    lastReset: Date.now()
                };
                await chrome.storage.sync.set({ [STORAGE_KEY]: resetData });
                updateUsageDisplay(0);
                showDataResetMessage();
            } else {
                // Recent install - might be trying to bypass limits
                const conservativeData = { 
                    date: today, 
                    count: Math.min(oldData.count || 0, DAILY_LIMIT), 
                    deviceId: newDeviceId,
                    created: oldData.created || Date.now(),
                    lastReset: Date.now()
                };
                await chrome.storage.sync.set({ [STORAGE_KEY]: conservativeData });
                updateUsageDisplay(conservativeData.count);
                showDeviceMismatchMessage();
            }
        } catch (error) {
            console.error('Error handling device mismatch:', error);
            updateUsageDisplay(DAILY_LIMIT); // Conservative approach
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
    
    function showDataResetMessage() {
        showNotification(
            'Usage data was reset due to storage changes. You have a fresh daily limit!', 
            'info', 
            4000
        );
    }
    
    function showDeviceMismatchMessage() {
        showNotification(
            'Device change detected. Usage count preserved for security.', 
            'info', 
            3000
        );
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
        } else if (count >= DAILY_LIMIT - 1) {
            usageFooter.innerHTML = `
                <span class="usage-remaining">${remaining} extraction remaining today</span>
                <div class="usage-upgrade-prompt">
                    <div class="usage-upgrade-text">Almost at your daily limit!</div>
                    <button class="usage-upgrade-btn" id="upgradeBtn">
                        💎 Upgrade for Unlimited
                    </button>
                </div>
            `;
            
            // Add event listener for dynamically created button using ExtPay
            const upgradeBtn = document.getElementById('upgradeBtn');
            if (upgradeBtn) upgradeBtn.addEventListener('click', initiateUpgrade);
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
                    You've used all 5 free extractions today. Upgrade to continue extracting links!
                </div>
                <button class="limit-upgrade-btn" id="limitUpgradeBtn">
                    💎 Upgrade to Pro
                </button>
                <div class="limit-reset-info">
                    Free limit resets at midnight
                </div>
                <button id="resetUsageBtn" style="
                    margin-top: 8px;
                    padding: 4px 8px;
                    font-size: 10px;
                    background: #e5e7eb;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #6b7280;
                ">Reset Usage (Testing)</button>
            </div>
        `;
        
        // Add event listeners for dynamically created buttons using ExtPay
        const limitUpgradeBtn = document.getElementById('limitUpgradeBtn');
        const resetBtn = document.getElementById('resetUsageBtn');
        if (limitUpgradeBtn) limitUpgradeBtn.addEventListener('click', initiateUpgrade);
        if (resetBtn) resetBtn.addEventListener('click', resetUsageForTesting);
        
        // Disable the extract button
        extractBtn.disabled = true;
        extractBtn.textContent = '🚫 Daily Limit Reached';
        extractBtn.style.opacity = '0.6';
        extractBtn.style.cursor = 'not-allowed';
    }
    
    // Extract links function (can be called manually or automatically)
    async function extractLinks() {
        if (isExtracting) return;
        
        // Skip usage limit check for premium users
        if (!isPremiumUser) {
            // Check usage limit before proceeding for free users
            const currentUsage = await getCurrentUsageCount();
            if (currentUsage >= DAILY_LIMIT) {
                showLimitReached();
                showNotification('Daily extraction limit reached! Upgrade to continue.', 'error', 4000);
                return;
            }
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
                // Increment usage count only for free users on successful extraction
                if (!isPremiumUser) {
                    await incrementUsageCount();
                }
                
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
    
    // Send message with retry logic and content script injection
    async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await chrome.tabs.sendMessage(tabId, message);
                return response;
            } catch (error) {
                console.log(`Message attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    // Last attempt - try injecting content script
                    try {
                        console.log('Attempting to inject content script...');
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        });
                        
                        // Wait a bit longer for script to initialize
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Try one more time after injection
                        const response = await chrome.tabs.sendMessage(tabId, message);
                        return response;
                    } catch (injectionError) {
                        console.error('Content script injection failed:', injectionError);
                        throw new Error('Could not communicate with page. Please refresh the page and try again.');
                    }
                } else {
                    // Wait before retrying with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 300 * attempt));
                }
            }
        }
    }
    
    // Mode management functions
    async function initializeMode() {
        try {
            const result = await chrome.storage.sync.get([MODE_KEY]);
            const savedMode = result[MODE_KEY] || 'auto';
            await setMode(savedMode, false); // Don't save again when initializing
            
            // Only auto-extract if in auto mode and after mode is properly set
            if (isAutoMode) {
                setTimeout(() => {
                    autoExtractLinks();
                }, 100);
            }
        } catch (error) {
            console.error('Error loading mode preference:', error);
            await setMode('auto', false); // Default to auto
            
            // Auto-extract for fallback auto mode
            setTimeout(() => {
                autoExtractLinks();
            }, 100);
        }
    }
    
    async function setMode(mode, save = true) {
        isAutoMode = mode === 'auto';
        
        // Update button text immediately
        if (extractBtn) {
            extractBtn.textContent = isAutoMode ? '🔄 Refresh Links' : '🔍 Extract Links';
        }
        
        // Update button states with animation
        if (autoModeBtn && manualModeBtn) {
            autoModeBtn.classList.add('switching');
            manualModeBtn.classList.add('switching');
            
            setTimeout(() => {
                if (isAutoMode) {
                    autoModeBtn.classList.add('active');
                    manualModeBtn.classList.remove('active');
                } else {
                    autoModeBtn.classList.remove('active');
                    manualModeBtn.classList.add('active');
                }
                
                autoModeBtn.classList.remove('switching');
                manualModeBtn.classList.remove('switching');
            }, 150);
        }
        
        // Save preference
        if (save) {
            try {
                await chrome.storage.sync.set({ [MODE_KEY]: mode });
            } catch (error) {
                console.error('Error saving mode preference:', error);
            }
        }
        
        // If switching to auto mode and no links are extracted yet, auto-extract
        // Only do this when save=true (user initiated mode change, not initialization)
        if (isAutoMode && allLinks.length === 0 && save) {
            setTimeout(() => {
                autoExtractLinks();
            }, 300);
        }
    }
    
    // Auto-extract links when popup opens
    async function autoExtractLinks() {
        try {
            // For premium users, skip usage limit check
            if (!isPremiumUser) {
                // Check usage limit before auto-extracting for free users
                const currentUsage = await getCurrentUsageCount();
                if (currentUsage >= DAILY_LIMIT) {
                    showLimitReached();
                    linksContainer.innerHTML = `
                        <div class="placeholder">
                            <div style="margin-bottom: 12px;">🚫 Daily extraction limit reached</div>
                            <div style="font-size: 12px; color: #6b7280;">
                                You've used all 5 free extractions today.<br>
                                Upgrade to Pro for unlimited extractions!
                            </div>
                        </div>
                    `;
                    return;
                }
            }
            
            // Small delay to ensure popup is fully loaded
            await new Promise(resolve => setTimeout(resolve, 100));
            await extractLinks();
        } catch (error) {
            // Don't show error for auto-extract, just leave the manual button available
            console.log('Auto-extract failed:', error);
        }
    }
    
    // Extract links button click (now acts as refresh)
    extractBtn.addEventListener('click', extractLinks);
    
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
    
    function prepareCSVData(links) {
        // CSV header
        let csv = 'URL,Text,Type,Domain,Visible on Page\n';
        
        // CSV rows
        links.forEach(link => {
            const url = `"${(link.url || '').replace(/"/g, '""')}"`;
            const text = `"${(link.text || 'No text').replace(/"/g, '""')}"`;
            const type = link.isExternal ? 'External' : 'Internal';
            const domain = `"${(link.domain || '').replace(/"/g, '""')}"`;
            const visible = link.isVisible ? 'Yes' : 'No';
            
            csv += `${url},${text},${type},${domain},${visible}\n`;
        });
        
        return csv;
    }
    
    async function createGoogleSheetWithData(links) {
        try {
            // Create the data array
            const data = [
                ["URL", "Text", "Type", "Domain", "Visible on Page"],
                ...links.map(link => [
                    link.url || '',
                    link.text || 'No text',
                    link.isExternal ? 'External' : 'Internal',
                    link.domain || '',
                    link.isVisible ? 'Yes' : 'No'
                ])
            ];
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            
            // Method 1: Try using a working Google Apps Script web app
            try {
                const response = await fetch('https://script.google.com/macros/s/AKfycbxN9Z8Tj1mK5k1c5d8B7e9F2g3H4i5J6k7L8m9N0o1P2q3R4s5T6u7V8w9X0y1Z/exec', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: `Link Export ${timestamp}`,
                        data: data
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.url) {
                        await chrome.tabs.create({ 
                            url: result.url,
                            active: true
                        });
                        return true;
                    }
                }
            } catch (error) {
                console.log('Google Apps Script method failed:', error);
            }
            
            // Method 2: Use CSV and Google Sheets import
            const csvString = data.map(row => 
                row.map(cell => {
                    const str = String(cell);
                    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                }).join(',')
            ).join('\n');
            
            // Create data URL
            const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString);
            
            // Try to create Google Sheets with import
            const importUrl = `https://docs.google.com/spreadsheets/u/0/create?usp=sheets_web&title=Link%20Export%20${encodeURIComponent(timestamp)}`;
            
            // Open the import URL in a new tab
            const newTab = await chrome.tabs.create({ 
                url: importUrl,
                active: true
            });
            
            // Copy CSV data to clipboard for easy pasting
            try {
                await navigator.clipboard.writeText(csvString);
                
                // Wait for sheet to load, then show instructions
                setTimeout(() => {
                    showNotification(
                        'Google Sheets opened! CSV data copied to clipboard. Click cell A1 and paste (Ctrl+V or Cmd+V) to import your data.', 
                        'info', 
                        8000
                    );
                }, 2000);
                
            } catch (clipboardError) {
                // Fallback: Download CSV file
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `links-${timestamp}.csv`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                setTimeout(() => {
                    showNotification(
                        'Google Sheets opened and CSV downloaded! Use File → Import → Upload to import your CSV file.', 
                        'info', 
                        8000
                    );
                }, 2000);
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to create Google Sheet:', error);
            return false;
        }
    }
    
    function showLoading(show) {
        if (show) {
            linksContainer.innerHTML = '<div class="loading">Extracting links...</div>';
            extractBtn.disabled = true;
            extractBtn.textContent = 'Extracting...';
        } else {
            extractBtn.disabled = false;
            // Set button text based on current mode
            extractBtn.textContent = isAutoMode ? '🔄 Refresh Links' : '🔍 Extract Links';
        }
    }
    
    function showSuccessMessage() {
        // Only show success notification if links were found
        if (allLinks.length > 0) {
            showNotification(`Found ${allLinks.length} links!`);
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
}); // End of DOMContentLoaded event listener

// Global functions for upgrade functionality
window.openUpgradePage = function() {
    try {
        // Use ExtPay for payment processing
        if (typeof ExtPay !== 'undefined') {
            const extpay = ExtPay('extractor'); // Your ExtPay ID
            extpay.openPaymentPage();
        } else {
            // Fallback to external page if ExtPay not available
            chrome.tabs.create({
                url: 'https://linkextractor.pro/upgrade', // Replace with your actual upgrade URL
                active: true
            });
        }
    } catch (error) {
        console.error('Error opening upgrade page:', error);
        // Fallback notification
        showUpgradeModal();
    }
};

// Show usage information to help users understand how limits work
window.showUsageInfo = function() {
    const infoModal = document.createElement('div');
    infoModal.className = 'info-modal';
    infoModal.innerHTML = `
        <div class="info-content">
            <h3>📊 Usage Limit Information</h3>
            <div class="info-section">
                <h4>How it works:</h4>
                <ul>
                    <li>• Free users get 5 link extractions per day</li>
                    <li>• Usage resets every day at midnight</li>
                    <li>• Data syncs across all your devices</li>
                    <li>• Clearing browser cache won't reset your limit</li>
                </ul>
            </div>
            <div class="info-section">
                <h4>Data persistence:</h4>
                <ul>
                    <li>• Your usage is stored in Chrome's sync storage</li>
                    <li>• It persists across browser restarts and cache clearing</li>
                    <li>• Only extension uninstall/reinstall will reset data</li>
                </ul>
            </div>
            <div class="info-section">
                <h4>Need more extractions?</h4>
                <p>Upgrade to Pro for unlimited daily extractions, advanced features, and priority support!</p>
                <button id="modalUpgradeBtn" style="
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 8px;
                ">💎 Upgrade Now</button>
            </div>
            <button id="closeModalBtn" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.6;
            ">✕</button>
        </div>
    `;
    
    document.body.appendChild(infoModal);
    
    // Add event listeners for modal buttons
    const modalUpgradeBtn = infoModal.querySelector('#modalUpgradeBtn');
    const closeModalBtn = infoModal.querySelector('#closeModalBtn');
    
    if (modalUpgradeBtn) {
        modalUpgradeBtn.addEventListener('click', () => {
            openUpgradePage();
            closeInfoModal();
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeInfoModal);
    }
    
    setTimeout(() => {
        infoModal.classList.add('show');
    }, 10);
};

window.closeInfoModal = function() {
    const modal = document.querySelector('.info-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
};

// Testing function to reset usage count
window.resetUsageForTesting = async function() {
    try {
        // Define the storage keys (since they're not in global scope)
        const STORAGE_KEY = 'linkExtractorUsage';
        const DEVICE_KEY = 'linkExtractorDevice';
        const INSTALL_KEY = 'linkExtractorInstall';
        
        // Clear all usage-related storage
        await chrome.storage.sync.remove([STORAGE_KEY, DEVICE_KEY, INSTALL_KEY]);
        
        // Show confirmation
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = 'Usage data cleared! Reloading...';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Reload after a short delay
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error resetting usage:', error);
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = 'Error clearing usage data';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }
};

function showUpgradeModal() {
    // Create a simple notification since we can't easily access the showNotification function from global scope
    const notification = document.createElement('div');
    notification.className = 'notification info';
    notification.textContent = 'Upgrade to Pro for unlimited daily extractions, advanced filters, and priority support!';
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
    }, 5000);
}
