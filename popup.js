document.addEventListener('DOMContentLoaded', function() {
    // Original elements
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

    // Easter egg elements
    const easterEggTrigger = document.getElementById('easterEggTrigger');
    const secretTerminal = document.getElementById('secretTerminal');
    const closeTerminal = document.getElementById('closeTerminal');
    const terminalInput = document.getElementById('terminalInput');
    const terminalOutput = document.getElementById('terminalOutput');
    const easterEggModal = document.getElementById('easterEggModal');
    const closeEasterEgg = document.getElementById('closeEasterEgg');
    const easterEggBody = document.getElementById('easterEggBody');
    const headerTitle = document.getElementById('headerTitle');
    const headerSubtitle = document.getElementById('headerSubtitle');
    const tabHighlighter = document.querySelector('.tab-highlighter');

    // State variables
    let allLinks = [];
    let filteredLinks = [];
    let isExtracting = false;
    let extractionTimeout = null;
    let emailExtractionTimeout = null;
    let allEmails = [];
    let filteredEmails = [];
    let isExtractingEmails = false;
    let linksGlitchInterval = null;
    let currentTab = 'links';
    let konami = [];
    let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let terminalCommands = {
        'help': showHelpCommand,
        'clear': clearTerminal,
        'matrix': toggleMatrixRain,
        'theme': changeTheme,
        'hack': hackWebsite,
        'about': showAboutInfo,
        'ls': listCommands,
        'debug': toggleDebugMode,
        'stats': showStats,
        'flip': flipContent,
        'disco': toggleDiscoMode,
        '42': showAnswer,
        'exit': closeTerminalWindow
    };
    let debugMode = false;
    let discoMode = false;
    let matrixRainEnabled = true;
    let currentTheme = 'cyber';
    let easterEggs = {
        'konami': false,
        'terminal': false,
        'theme': false
    };
    let extractionCount = 0;
    let clickCount = 0;
    let lastHeaderClick = 0;

    // Initialize matrix rain animation (defer to idle for faster first paint)
    const startMatrix = () => {
        try { initMatrixRain(); } catch (e) {}
    };
    if ('requestIdleCallback' in window) {
        requestIdleCallback(startMatrix, { timeout: 1200 });
    } else {
        setTimeout(startMatrix, 300);
    }

    // Tab event listeners with animation
    linksTab.addEventListener('click', () => switchTab('links'));
    emailsTab.addEventListener('click', () => switchTab('emails'));

    // Extract links button click
    extractBtn.addEventListener('click', extractLinks);

    // Extract emails button click
    extractEmailsBtn.addEventListener('click', extractEmails);

    // Easter egg triggers
    easterEggTrigger.addEventListener('click', () => {
        showSecretTerminal();
        easterEggs.terminal = true;
        checkAllEasterEggs();
    });

    closeTerminal.addEventListener('click', closeTerminalWindow);

    terminalInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim().toLowerCase();
            processTerminalCommand(command);
            terminalInput.value = '';
        }
    });

    closeEasterEgg.addEventListener('click', () => {
        easterEggModal.classList.remove('show');
    });

    // Listen for Konami code
    document.addEventListener('keydown', checkKonamiCode);

    // Header easter egg (click title 3 times quickly)
    headerTitle.addEventListener('click', headerClickEasterEgg);

    // Copy all links button
    copyAllBtn.addEventListener('click', () => {
        const linkUrls = filteredLinks.map(link => link.url).join('\n');
        navigator.clipboard.writeText(linkUrls).then(() => {
            showNotification('LINKS COPIED TO CLIPBOARD');
        }).catch(err => {
            showError('COPY OPERATION FAILED: ' + err.message);
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

        showNotification('LINKS EXPORTED AS JSON');
    });

    // Export Excel button
    exportExcelBtn.addEventListener('click', async () => {
        try {
            exportExcelBtn.disabled = true;
            exportExcelBtn.innerHTML = '<span class="button-icon">⌛</span><span class="button-text">PROCESSING...</span>';

            // Lazy load XLSX only when needed
            await ensureXlsxLoaded();

            const worksheetData = [
                ['URL', 'TEXT', 'TYPE', 'DOMAIN', 'VISIBLE']
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

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);
            ws['!cols'] = [
                { wch: 50 },
                { wch: 30 },
                { wch: 10 },
                { wch: 20 },
                { wch: 10 }
            ];
            XLSX.utils.book_append_sheet(wb, ws, 'Links');
            XLSX.writeFile(wb, `links-${Date.now()}.xlsx`);

            showNotification('LINKS EXPORTED TO EXCEL');
        } catch (err) {
            showError('EXPORT FAILED: ' + err.message);
        } finally {
            exportExcelBtn.disabled = false;
            exportExcelBtn.innerHTML = '<span class="button-icon">〈📊〉</span><span class="button-text">EXCEL</span>';
        }
    });

    // Copy all emails button
    copyAllEmailsBtn.addEventListener('click', () => {
        const emailAddresses = filteredEmails.map(email => email.email).join('\n');
        navigator.clipboard.writeText(emailAddresses).then(() => {
            showNotification('EMAILS COPIED TO CLIPBOARD');
        }).catch(err => {
            showError('COPY OPERATION FAILED: ' + err.message);
        });
    });

    // Export Emails as JSON
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

        showNotification('EMAILS EXPORTED AS JSON');
    });

    // Export Emails to Excel
    exportEmailsExcelBtn.addEventListener('click', async () => {
        try {
            exportEmailsExcelBtn.disabled = true;
            exportEmailsExcelBtn.innerHTML = '<span class="button-icon">⌛</span><span class="button-text">PROCESSING...</span>';

            // Lazy load XLSX only when needed
            await ensureXlsxLoaded();

            const worksheetData = [
                ['EMAIL', 'DOMAIN', 'SOURCE', 'VISIBLE', 'CONTEXT']
            ];

            filteredEmails.forEach(email => {
                worksheetData.push([
                    email.email,
                    email.domain,
                    email.source || 'Page Content',
                    email.isVisible ? 'Yes' : 'No',
                    email.context || 'N/A'
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);
            ws['!cols'] = [
                { wch: 30 },
                { wch: 20 },
                { wch: 15 },
                { wch: 10 },
                { wch: 50 }
            ];
            XLSX.utils.book_append_sheet(wb, ws, 'Emails');
            XLSX.writeFile(wb, `emails-${Date.now()}.xlsx`);

            showNotification('EMAILS EXPORTED TO EXCEL');
        } catch (err) {
            showError('EXPORT FAILED: ' + err.message);
        } finally {
            exportEmailsExcelBtn.disabled = false;
            exportEmailsExcelBtn.innerHTML = '<span class="button-icon">〈📊〉</span><span class="button-text">EXCEL</span>';
        }
    });

    // Search functionality for links
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        if (query) {
            filteredLinks = allLinks.filter(link => {
                return link.url.toLowerCase().includes(query) || 
                       (link.text && link.text.toLowerCase().includes(query)) ||
                       link.domain.toLowerCase().includes(query);
            });
        } else {
            filteredLinks = [...allLinks];
        }
        
        applyLinkFilters();
        renderLinks();
    });

    // Search functionality for emails
    emailSearchInput.addEventListener('input', () => {
        const query = emailSearchInput.value.toLowerCase();
        if (query) {
            filteredEmails = allEmails.filter(email => {
                return email.email.toLowerCase().includes(query) || 
                       (email.context && email.context.toLowerCase().includes(query)) ||
                       email.domain.toLowerCase().includes(query);
            });
        } else {
            filteredEmails = [...allEmails];
        }
        
        applyEmailFilters();
        renderEmails();
    });

    // Filter functionality for links
    filterInternal.addEventListener('change', () => {
        applyLinkFilters();
        renderLinks();
    });

    filterExternal.addEventListener('change', () => {
        applyLinkFilters();
        renderLinks();
    });

    // Filter functionality for emails
    filterVisibleEmails.addEventListener('change', () => {
        applyEmailFilters();
        renderEmails();
    });

    filterHiddenEmails.addEventListener('change', () => {
        applyEmailFilters();
        renderEmails();
    });

    // Tab switching with animation
    function switchTab(tab) {
        if (tab === currentTab) return;
        
        currentTab = tab;
        
        if (tab === 'links') {
            linksTab.classList.add('active');
            emailsTab.classList.remove('active');
            linksTabContent.classList.add('active');
            emailsTabContent.classList.remove('active');
            tabHighlighter.style.transform = 'translateX(0)';
        } else {
            emailsTab.classList.add('active');
            linksTab.classList.remove('active');
            emailsTabContent.classList.add('active');
            linksTabContent.classList.remove('active');
            tabHighlighter.style.transform = 'translateX(100%)';
        }
    }

    // Extract links function
    function extractLinks() {
        if (isExtracting) return;
        
        isExtracting = true;
        extractionCount++;
        
        // Check for easter egg trigger
        if (extractionCount === 10) {
            setTimeout(() => {
                showEasterEgg('EXTRACTION MILESTONE', 'You have performed 10 extractions! You have unlocked the "Power User" achievement. Try the `stats` command in the terminal.');
            }, 1000);
        }
        
        linksContainer.innerHTML = '<div class="loading"></div>';
        extractBtn.disabled = true;
        extractBtn.innerHTML = '<span class="button-icon">⌛</span><span class="button-text">SCANNING...</span>';
        
        // Create a safety timeout in case the content script doesn't respond
        extractionTimeout = setTimeout(() => {
            if (isExtracting) {
                showError('EXTRACTION TIMED OUT');
                resetLinkExtractState();
            }
        }, 15000); // 15-second timeout
        
        // Get current tab
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs || tabs.length === 0) {
                showError('NO ACTIVE TAB FOUND');
                resetLinkExtractState();
                return;
            }
            
            const currentTab = tabs[0];
            
            // Get current domain for determining external links
            const currentDomain = new URL(currentTab.url).hostname;

            // Send message to content script to extract links
            chrome.tabs.sendMessage(currentTab.id, { action: "extractLinks" }, function(links) {
                if (chrome.runtime.lastError) {
                    // Content script might not be injected, try injecting it
                    console.log('Content script might not be injected, attempting injection...');
                    chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        files: ['content.js']
                    }, function() {
                        if (chrome.runtime.lastError) {
                            showError('SCRIPT INJECTION FAILED: ' + chrome.runtime.lastError.message);
                            resetLinkExtractState();
                            return;
                        }
                        
                        // Now try again to extract links
                        setTimeout(() => {
                            chrome.tabs.sendMessage(currentTab.id, { action: "extractLinks" }, function(links) {
                                if (chrome.runtime.lastError) {
                                    showError('EXTRACTION FAILED: ' + chrome.runtime.lastError.message);
                                    resetLinkExtractState();
                                    return;
                                }
                                
                                processExtractedLinks(links);
                            });
                        }, 500); // Give the script a moment to initialize
                    });
                } else {
                    processExtractedLinks(links);
                }
            });
            
            // Function to process extracted links
            function processExtractedLinks(links) {
                if (!links || links.length === 0) {
                    showError('NO LINKS FOUND');
                    resetLinkExtractState();
                    return;
                }
                
                allLinks = links;
                filteredLinks = [...links];
                
                // Apply filters
                applyLinkFilters();
                
                // Enable search
                searchInput.disabled = false;
                
                // Update UI
                renderLinks();
                resetLinkExtractState();
                
                // Show success notification
                showNotification(`EXTRACTED ${links.length} LINKS`);
                
                // Enable export buttons
                copyAllBtn.disabled = false;
                exportJsonBtn.disabled = false;
                exportExcelBtn.disabled = false;
            }
        });
    }

    // Extract emails function
    function extractEmails() {
        if (isExtractingEmails) return;
        
        isExtractingEmails = true;
        extractionCount++;
        
        emailsContainer.innerHTML = '<div class="loading"></div>';
        extractEmailsBtn.disabled = true;
        extractEmailsBtn.innerHTML = '<span class="button-icon">⌛</span><span class="button-text">SCANNING...</span>';
        
        // Create a safety timeout in case the content script doesn't respond
        emailExtractionTimeout = setTimeout(() => {
            if (isExtractingEmails) {
                showError('EXTRACTION TIMED OUT');
                resetEmailExtractState();
            }
        }, 15000); // 15-second timeout
        
        // Get current tab
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs || tabs.length === 0) {
                showError('NO ACTIVE TAB FOUND');
                resetEmailExtractState();
                return;
            }
            
            const currentTab = tabs[0];
            
            // Send message to content script to extract emails
            chrome.tabs.sendMessage(currentTab.id, { action: "extractEmails" }, function(emails) {
                if (chrome.runtime.lastError) {
                    // Content script might not be injected, try injecting it
                    console.log('Content script might not be injected, attempting injection...');
                    chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        files: ['content.js']
                    }, function() {
                        if (chrome.runtime.lastError) {
                            showError('SCRIPT INJECTION FAILED: ' + chrome.runtime.lastError.message);
                            resetEmailExtractState();
                            return;
                        }
                        
                        // Now try again to extract emails
                        setTimeout(() => {
                            chrome.tabs.sendMessage(currentTab.id, { action: "extractEmails" }, function(emails) {
                                if (chrome.runtime.lastError) {
                                    showError('EXTRACTION FAILED: ' + chrome.runtime.lastError.message);
                                    resetEmailExtractState();
                                    return;
                                }
                                
                                processExtractedEmails(emails);
                            });
                        }, 500); // Give the script a moment to initialize
                    });
                } else {
                    processExtractedEmails(emails);
                }
            });
            
            // Function to process extracted emails
            function processExtractedEmails(emails) {
                if (!emails || emails.length === 0) {
                    showError('NO EMAILS FOUND');
                    resetEmailExtractState();
                    return;
                }
                
                allEmails = emails;
                filteredEmails = [...emails];
                
                // Apply filters
                applyEmailFilters();
                
                // Enable search
                emailSearchInput.disabled = false;
                
                // Update UI
                renderEmails();
                resetEmailExtractState();
                
                // Show success notification
                showNotification(`EXTRACTED ${emails.length} EMAILS`);
                
                // Enable export buttons
                copyAllEmailsBtn.disabled = false;
                exportEmailsJsonBtn.disabled = false;
                exportEmailsExcelBtn.disabled = false;
            }
        });
    }

    function resetLinkExtractState() {
        isExtracting = false;
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<span class="button-icon">⟨⚡⟩</span><span class="button-text">EXTRACT LINKS</span>';
        if (extractionTimeout) {
            clearTimeout(extractionTimeout);
        }
    }

    function resetEmailExtractState() {
        isExtractingEmails = false;
        extractEmailsBtn.disabled = false;
        extractEmailsBtn.innerHTML = '<span class="button-icon">⟨✉⟩</span><span class="button-text">EXTRACT EMAILS</span>';
        if (emailExtractionTimeout) {
            clearTimeout(emailExtractionTimeout);
        }
    }

    function applyLinkFilters() {
        const showInternal = filterInternal.checked;
        const showExternal = filterExternal.checked;
        
        filteredLinks = allLinks.filter(link => {
            if (!showInternal && !link.isExternal) return false;
            if (!showExternal && link.isExternal) return false;
            return true;
        });
    }

    function applyEmailFilters() {
        const showVisible = filterVisibleEmails.checked;
        const showHidden = filterHiddenEmails.checked;
        
        filteredEmails = allEmails.filter(email => {
            if (!showVisible && email.isVisible) return false;
            if (!showHidden && !email.isVisible) return false;
            return true;
        });
    }

    function renderLinks() {
        if (!filteredLinks || filteredLinks.length === 0) {
            linksContainer.innerHTML = `
                <div class="placeholder">
                    <div class="placeholder-icon">〈🔍〉</div>
                    <div class="placeholder-text">NO LINKS FOUND</div>
                </div>
            `;
            linkCount.textContent = 'NO LINKS FOUND';
            // Clear any running interval
            if (linksGlitchInterval) {
                clearInterval(linksGlitchInterval);
                linksGlitchInterval = null;
            }
            return;
        }
        
        linkCount.textContent = `${filteredLinks.length} LINKS FOUND`;
        linksContainer.innerHTML = '';

        const linksToDisplay = filteredLinks.slice(0, 25);
        linksToDisplay.forEach(link => {
            const linkEl = document.createElement('div');
            linkEl.className = 'link-item';
            const isExternal = link.isExternal ? 'external' : 'internal';
            linkEl.innerHTML = `
                <div class="link-header">
                    <div class="link-type ${isExternal}">${isExternal.toUpperCase()}</div>
                    <div class="link-domain">${link.domain || 'unknown'}</div>
                </div>
                <a href="${link.url}" class="link-url" target="_blank" title="${link.url}">${link.url}</a>
                <div class="link-text">${link.text || ''}</div>
                <div class="link-actions">
                    <button class="btn-small copy-link">COPY</button>
                    <button class="btn-small highlight-link" ${!link.isVisible ? 'disabled' : ''}>HIGHLIGHT</button>
                </div>
            `;
            const copyBtn = linkEl.querySelector('.copy-link');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(link.url).then(() => {
                    showNotification('LINK COPIED');
                }).catch(() => {
                    showError('COPY FAILED');
                });
            });
            const highlightBtn = linkEl.querySelector('.highlight-link');
            if (link.isVisible) {
                highlightBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    highlightElementOnPage(link.selector);
                });
            }
            linksContainer.appendChild(linkEl);
        });

        // Clear existing interval before starting a new one
        if (linksGlitchInterval) {
            clearInterval(linksGlitchInterval);
        }
        linksGlitchInterval = setInterval(() => {
            const links = document.querySelectorAll('.link-item');
            if (links.length > 0) {
                const randomIndex = Math.floor(Math.random() * links.length);
                const randomLink = links[randomIndex];
                randomLink.style.animation = 'glitch 0.3s';
                setTimeout(() => {
                    randomLink.style.animation = '';
                }, 300);
            }
        }, 10000);

        if (filteredLinks.length > 25) {
            const paginationInfo = document.createElement('div');
            paginationInfo.className = 'pagination-info';
            paginationInfo.textContent = `Showing 25/${filteredLinks.length}`;
            paginationInfo.style.textAlign = 'center';
            paginationInfo.style.padding = '10px';
            paginationInfo.style.color = 'var(--neon-blue)';
            paginationInfo.style.fontFamily = 'Share Tech Mono, monospace';
            paginationInfo.style.fontSize = '14px';
            linksContainer.appendChild(paginationInfo);
        }
    }

    function renderEmails() {
        if (!filteredEmails || filteredEmails.length === 0) {
            emailsContainer.innerHTML = `
                <div class="placeholder">
                    <div class="placeholder-icon">⟨🔍⟩</div>
                    <div class="placeholder-text">NO EMAILS FOUND</div>
                </div>
            `;
            emailCount.textContent = 'NO EMAILS FOUND';
            return;
        }
        
        emailCount.textContent = `${filteredEmails.length} EMAILS FOUND`;
        
        emailsContainer.innerHTML = '';
        
        // Limit display to only 25 emails
        const emailsToDisplay = filteredEmails.slice(0, 25);
        
        emailsToDisplay.forEach(email => {
            const emailEl = document.createElement('div');
            emailEl.className = 'email-item';
            
            const isVisible = email.isVisible ? 'visible' : 'hidden';
            
            emailEl.innerHTML = `
                <div class="email-header">
                    <div class="email-source">${email.source || 'TEXT'}</div>
                    <div class="email-visibility">${isVisible.toUpperCase()}</div>
                </div>
                <div class="email-address">
                    <a href="mailto:${email.email}" class="email-link" title="${email.email}">${email.email}</a>
                </div>
                ${email.context ? `<div class="email-context">${email.context}</div>` : ''}
                <div class="email-actions">
                    <button class="btn-small copy-email">COPY</button>
                </div>
            `;
            
            const copyBtn = emailEl.querySelector('.copy-email');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(email.email).then(() => {
                    showNotification('EMAIL COPIED');
                }).catch(err => {
                    showError('COPY FAILED');
                });
            });
            
            emailsContainer.appendChild(emailEl);
        });
        
        // Add pagination info at the bottom
        if (filteredEmails.length > 25) {
            const paginationInfo = document.createElement('div');
            paginationInfo.className = 'pagination-info';
            paginationInfo.textContent = `Showing 25/${filteredEmails.length}`;
            paginationInfo.style.textAlign = 'center';
            paginationInfo.style.padding = '10px';
            paginationInfo.style.color = 'var(--neon-blue)';
            paginationInfo.style.fontFamily = 'Share Tech Mono, monospace';
            paginationInfo.style.fontSize = '14px';
            emailsContainer.appendChild(paginationInfo);
        }
    }

    function highlightElementOnPage(selector) {
        if (!selector) return;
        
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs || tabs.length === 0) return;
            
            chrome.tabs.sendMessage(tabs[0].id, { action: "highlightElement", selector: selector }, function(response) {
                if (chrome.runtime.lastError) {
                    showError('HIGHLIGHT FAILED: ' + chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    showNotification('ELEMENT HIGHLIGHTED');
                } else {
                    showError('ELEMENT NOT FOUND');
                }
            });
        });
    }

    function showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function showError(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notification.style.borderColor = '#ff00ff';
        notification.querySelector('.notification-icon').textContent = '⟨⚠️⟩';
        notification.querySelector('.notification-progress').style.background = '#ff00ff';
        
        notificationText.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            notification.style.borderColor = '';
            notification.querySelector('.notification-icon').textContent = '⟨ℹ️⟩';
            notification.querySelector('.notification-progress').style.background = '';
        }, 3000);
    }

    // Matrix Rain Animation
    function initMatrixRain() {
        const canvas = document.getElementById('matrixRain');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const matrix = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const drops = [];
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        function drawMatrixRain() {
            if (!matrixRainEnabled) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }
            
            ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "#0f0";
            ctx.font = fontSize + "px monospace";
            
            // Disco mode easter egg
            if (discoMode) {
                ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
            }
            
            for (let i = 0; i < drops.length; i++) {
                const text = matrix[Math.floor(Math.random() * matrix.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
            
            requestAnimationFrame(drawMatrixRain);
        }
        
        drawMatrixRain();
    }

    // Easter Egg Functions
    function checkKonamiCode(e) {
        konami.push(e.key);
        
        if (konami.length > konamiCode.length) {
            konami.shift();
        }
        
        if (konami.join('') === konamiCode.join('')) {
            showEasterEgg('KONAMI CODE ACTIVATED', 'You found a secret! The Konami Code has been activated. Enjoy the enhanced visuals and try the "disco" command in the terminal!');
            easterEggs.konami = true;
            toggleDiscoMode();
            checkAllEasterEggs();
        }
    }
    
    function headerClickEasterEgg() {
        const now = Date.now();
        if (now - lastHeaderClick < 500) {
            clickCount++;
        } else {
            clickCount = 1;
        }
        
        lastHeaderClick = now;
        
        if (clickCount === 3) {
            easterEggs.theme = true;
            changeTheme('retro');
            showEasterEgg('RETRO MODE ACTIVATED', 'You found a secret! Retro mode has been activated. Try clicking around for more secrets!');
            checkAllEasterEggs();
            clickCount = 0;
        }
    }
    
    function showEasterEgg(title, message) {
        const easterEggModal = document.getElementById('easterEggModal');
        const easterEggBody = document.getElementById('easterEggBody');
        
        easterEggBody.innerHTML = `
            <p>${message}</p>
            <div style="text-align: center; margin-top: 20px;">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxYTFhMWEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMCIgc3Ryb2tlPSIjZmYwMGZmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNDAgNTBMNjAgNzBNNDAgNzBMNjAgNTAiIHN0cm9rZT0iIzAwZjNmZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iNTAiIHk9IjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVhc3RlciBFZ2c8L3RleHQ+PC9zdmc+" alt="Easter Egg" style="width: 100px; height: 100px;">
            </div>
        `;
        
        easterEggModal.querySelector('.easter-egg-header h3').textContent = title;
        easterEggModal.classList.add('show');
        
        // Add achievement sound
        const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vm//lNuPXkQyM//Jnw//wH///iv/////3///+7/////cAAAA3QAAABfJy49Bd/HQkYAAAADCQdM7dm8LJJpavpakxLnLViiStS0nJ/JvGp+YcbzVO3ANYQg+Md0zKoYJ8yNKcaLm29vblSft61dMzpK0TzqqVrFYUnTZKfTpSk9TIOWBLY5LquNZk1IHTuZLTta9XnlW7V13Vd227ji+vu5O8r9crvquPq5RwP/un91dM3TZPT1uFff+9i20xq+vrRb7/2m8t1++ndnrc2TJV22ZdVVfcOfK3b9xwNl7quHn5em7TuWUqdW8v9o9urqpN6zrNa7ixbKbt1Vp3uufFaVu9Wfj1du6vTROt3V3WjvGv5Ss+V6nab6Ou+6HutW9J13Z7Ld9w/FtX+9yrW97vtpVvV1qK+7fvxb26O29D76uWd23WrZO7e3evM/f6vdt+3d/W3t5+/2/d72znf7933e9c/Pu77jt');
        audio.play();
    }
    
    function checkAllEasterEggs() {
        let foundCount = 0;
        for (const egg in easterEggs) {
            if (easterEggs[egg]) foundCount++;
        }
        
        if (foundCount === Object.keys(easterEggs).length) {
            setTimeout(() => {
                showEasterEgg('MASTER EGG HUNTER', 'Congratulations! You found all easter eggs in the extension. You are truly a digital explorer! Try the "42" command in the terminal for the answer to the ultimate question.');
                
                // Add a special theme
                document.body.style.background = `linear-gradient(135deg, #00f3ff 0%, #ff00ff 100%)`;
                document.querySelector('.neo-header').style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.5)';
                headerTitle.innerHTML = '<span class="neo" style="color: gold; text-shadow: 0 0 10px gold;">NEO</span><span class="xtract">XTRACT</span>';
            }, 1000);
        }
    }

    // Terminal Commands
    function showSecretTerminal() {
        secretTerminal.classList.remove('hidden');
        terminalInput.focus();
        addTerminalLine('> TERMINAL ACCESS GRANTED');
        addTerminalLine('> TYPE "help" FOR AVAILABLE COMMANDS');
    }
    
    function closeTerminalWindow() {
        secretTerminal.classList.add('hidden');
    }
    
    function processTerminalCommand(command) {
        addTerminalLine(`$ ${command}`);
        
        if (command === '') {
            return;
        }
        
        // Check if command exists
        const commandFn = terminalCommands[command];
        if (commandFn) {
            commandFn();
        } else {
            // Handle command not found
            addTerminalLine(`> COMMAND NOT RECOGNIZED: "${command}"`);
            addTerminalLine('> TYPE "help" FOR AVAILABLE COMMANDS');
        }
    }
    
    function addTerminalLine(text) {
        const line = document.createElement('p');
        line.textContent = text;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
    
    function showHelpCommand() {
        addTerminalLine('> AVAILABLE COMMANDS:');
        addTerminalLine('  help        - Show this help message');
        addTerminalLine('  clear       - Clear terminal');
        addTerminalLine('  matrix      - Toggle matrix rain effect');
        addTerminalLine('  theme       - Change theme (cyber/retro/neon/dark)');
        addTerminalLine('  hack        - "Hack" the current website (joke)');
        addTerminalLine('  about       - Show extension info');
        addTerminalLine('  ls          - List all commands');
        addTerminalLine('  debug       - Toggle debug mode');
        addTerminalLine('  stats       - Show your usage statistics');
        addTerminalLine('  flip        - Flip the UI upside down');
        addTerminalLine('  disco       - Toggle disco mode');
        addTerminalLine('  exit        - Close terminal');
        addTerminalLine('> THERE MAY BE HIDDEN COMMANDS...');
    }
    
    function clearTerminal() {
        terminalOutput.innerHTML = '';
    }
    
    function toggleMatrixRain() {
        matrixRainEnabled = !matrixRainEnabled;
        addTerminalLine(`> MATRIX RAIN EFFECT: ${matrixRainEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    function changeTheme(themeName) {
        if (!themeName) {
            addTerminalLine('> AVAILABLE THEMES:');
            addTerminalLine('  cyber  - Default cyberpunk theme');
            addTerminalLine('  retro  - Retro computing theme');
            addTerminalLine('  neon   - Bright neon colors');
            addTerminalLine('  dark   - Low-light dark theme');
            addTerminalLine('> USAGE: theme neon');
            return;
        }
        
        const body = document.body;
        const root = document.documentElement;
        
        switch(themeName) {
            case 'cyber':
                root.style.setProperty('--neon-blue', '#00f3ff');
                root.style.setProperty('--neon-pink', '#ff00ff');
                root.style.setProperty('--bg-dark', '#0f0f1a');
                root.style.setProperty('--bg-darker', '#080812');
                currentTheme = 'cyber';
                addTerminalLine('> THEME SET TO: CYBER');
                break;
            case 'retro':
                root.style.setProperty('--neon-blue', '#39ff14');
                root.style.setProperty('--neon-pink', '#ff6b35');
                root.style.setProperty('--bg-dark', '#222222');
                root.style.setProperty('--bg-darker', '#111111');
                currentTheme = 'retro';
                addTerminalLine('> THEME SET TO: RETRO');
                break;
            case 'neon':
                root.style.setProperty('--neon-blue', '#fe00fe');
                root.style.setProperty('--neon-pink', '#00fefe');
                root.style.setProperty('--bg-dark', '#0a0a0a');
                root.style.setProperty('--bg-darker', '#050505');
                currentTheme = 'neon';
                addTerminalLine('> THEME SET TO: NEON');
                break;
            case 'dark':
                root.style.setProperty('--neon-blue', '#4d5bce');
                root.style.setProperty('--neon-pink', '#915c83');
                root.style.setProperty('--bg-dark', '#151515');
                root.style.setProperty('--bg-darker', '#101010');
                currentTheme = 'dark';
                addTerminalLine('> THEME SET TO: DARK');
                break;
            default:
                addTerminalLine(`> UNKNOWN THEME: ${themeName}`);
                return;
        }
    }
    
    function hackWebsite() {
        addTerminalLine('> INITIALIZING HACK SEQUENCE...');
        
        setTimeout(() => addTerminalLine('> BYPASSING SECURITY...'), 500);
        setTimeout(() => addTerminalLine('> ACCESSING MAINFRAME...'), 1200);
        setTimeout(() => addTerminalLine('> DOWNLOADING DATA...'), 1800);
        setTimeout(() => addTerminalLine('> HACK COMPLETE!'), 2500);
        setTimeout(() => addTerminalLine('> JK THIS IS JUST A FUN EASTER EGG :)'), 3200);
        
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs || tabs.length === 0) return;
            
            // Add a fun visual effect to the page
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    // Create an overlay
                    const overlay = document.createElement('div');
                    overlay.style.position = 'fixed';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.right = '0';
                    overlay.style.bottom = '0';
                    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    overlay.style.zIndex = '9999';
                    overlay.style.display = 'flex';
                    overlay.style.flexDirection = 'column';
                    overlay.style.alignItems = 'center';
                    overlay.style.justifyContent = 'center';
                    overlay.style.fontFamily = 'monospace';
                    overlay.style.color = '#39ff14';
                    overlay.style.fontSize = '24px';
                    overlay.style.textAlign = 'center';
                    
                    overlay.innerHTML = `
                        <div>SYSTEM HACKED</div>
                        <div style="font-size: 50px; margin: 20px 0;">☠️</div>
                        <div>THIS IS JUST A HARMLESS EASTER EGG</div>
                        <div style="margin-top: 40px; font-size: 16px;">Click anywhere to dismiss</div>
                    `;
                    
                    document.body.appendChild(overlay);
                    
                    // Remove after click
                    overlay.addEventListener('click', () => {
                        overlay.remove();
                    });
                    
                    // Auto-remove after 5 seconds
                    setTimeout(() => {
                        overlay.remove();
                    }, 5000);
                }
            });
        });
    }
    
    function showAboutInfo() {
        addTerminalLine('> NEO-XTRACT v3.7');
        addTerminalLine('> DATA EXTRACTION UTILITY');
        addTerminalLine('> COPYRIGHT 2025');
        addTerminalLine('> THIS EXTENSION EXTRACTS LINKS AND EMAILS FROM WEB PAGES');
        addTerminalLine('> CONTAINS MULTIPLE EASTER EGGS AND HIDDEN FEATURES');
    }
    
    function listCommands() {
        addTerminalLine('> COMMAND LIST:');
        
        Object.keys(terminalCommands).forEach(cmd => {
            addTerminalLine(`  ${cmd}`);
        });
    }
    
    function toggleDebugMode() {
        debugMode = !debugMode;
        addTerminalLine(`> DEBUG MODE: ${debugMode ? 'ENABLED' : 'DISABLED'}`);
        
        if (debugMode) {
            addTerminalLine('> EXTRACTION COUNT: ' + extractionCount);
            addTerminalLine('> THEME: ' + currentTheme);
            addTerminalLine('> EASTER EGGS FOUND: ' + Object.values(easterEggs).filter(e => e).length + '/' + Object.keys(easterEggs).length);
        }
    }
    
    function showStats() {
        addTerminalLine('> USER STATISTICS:');
        addTerminalLine(`> EXTRACTION COUNT: ${extractionCount}`);
        addTerminalLine(`> LINKS EXTRACTED: ${allLinks.length}`);
        addTerminalLine(`> EMAILS EXTRACTED: ${allEmails.length}`);
        addTerminalLine(`> CURRENT THEME: ${currentTheme.toUpperCase()}`);
        addTerminalLine(`> ACHIEVEMENTS: ${Object.values(easterEggs).filter(e => e).length}/${Object.keys(easterEggs).length}`);
        
        if (extractionCount >= 10) {
            addTerminalLine('> ACHIEVEMENT UNLOCKED: POWER USER 🏆');
        }
    }
    
    function flipContent() {
        document.querySelector('.neo-content').style.transform = 
            document.querySelector('.neo-content').style.transform === 'rotate(180deg)' ? '' : 'rotate(180deg)';
            
        addTerminalLine('> CONTENT FLIPPED');
    }
    
    function toggleDiscoMode() {
        discoMode = !discoMode;
        addTerminalLine(`> DISCO MODE: ${discoMode ? 'ENABLED' : 'DISABLED'}`);
        
        if (discoMode) {
            const interval = setInterval(() => {
                if (!discoMode) {
                    clearInterval(interval);
                    document.documentElement.style.setProperty('--neon-blue', '#00f3ff');
                    document.documentElement.style.setProperty('--neon-pink', '#ff00ff');
                    return;
                }
                
                // Generate random neon colors
                const randomColor1 = `hsl(${Math.random() * 360}, 100%, 50%)`;
                const randomColor2 = `hsl(${Math.random() * 360}, 100%, 50%)`;
                
                document.documentElement.style.setProperty('--neon-blue', randomColor1);
                document.documentElement.style.setProperty('--neon-pink', randomColor2);
            }, 1000);
        } else {
            document.documentElement.style.setProperty('--neon-blue', '#00f3ff');
            document.documentElement.style.setProperty('--neon-pink', '#ff00ff');
        }
    }
    
    function showAnswer() {
        addTerminalLine("> THE ANSWER TO THE ULTIMATE QUESTION OF LIFE, THE UNIVERSE, AND EVERYTHING IS...");
        
        setTimeout(() => {
            addTerminalLine("> 42");
        }, 2000);
    }

    // Ensure XLSX is loaded only when requested
    async function ensureXlsxLoaded() {
        if (window.XLSX) return;
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'lib/xlsx.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load XLSX library'));
            document.head.appendChild(script);
        });
    }
});

// Note: All content script functions (extractLinksFromPage, extractEmailsFromPage, etc.)
// are defined in content.js and we communicate with them using Chrome messaging API
