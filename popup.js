document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractLinks');
    const copyAllBtn = document.getElementById('copyAll');
    const exportJsonBtn = document.getElementById('exportJson');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportGoogleSheetsBtn = document.getElementById('exportGoogleSheets');
    const searchInput = document.getElementById('searchInput');
    const filterInternal = document.getElementById('filterInternal');
    const filterExternal = document.getElementById('filterExternal');
    const linksContainer = document.getElementById('linksContainer');
    const linkCount = document.getElementById('linkCount');
    
    let allLinks = [];
    let filteredLinks = [];
    let isExtracting = false;
    
    // Auto-extract links when popup opens
    autoExtractLinks();
    
    // Extract links function (can be called manually or automatically)
    async function extractLinks() {
        if (isExtracting) return;
        
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
    
    // Auto-extract links when popup opens
    async function autoExtractLinks() {
        try {
            // Small delay to ensure popup is fully loaded
            await new Promise(resolve => setTimeout(resolve, 100));
            await extractLinks();
        } catch (error) {
            // Don't show error for auto-extract, just leave the manual button available
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
    
    // Export to Google Sheets button
    exportGoogleSheetsBtn.addEventListener('click', async () => {
        try {
            // Show loading state
            exportGoogleSheetsBtn.disabled = true;
            exportGoogleSheetsBtn.innerHTML = '⏳ Preparing...';
            
            // Prepare data for Google Sheets
            const csvData = prepareCSVData(filteredLinks);
            
            // Create a CSV file
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            a.download = `links-${timestamp}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Create Google Sheets import URL
            const sheetsUrl = 'https://docs.google.com/spreadsheets/create';
            
            // Open Google Sheets in a new tab
            await chrome.tabs.create({ 
                url: sheetsUrl,
                active: true
            });
            
            // Show detailed instructions
            setTimeout(() => {
                showNotification('CSV downloaded! In Google Sheets: File → Import → Upload → Select your CSV file', 'info', 5000);
            }, 1000);
            
        } catch (error) {
            console.error('Error preparing Google Sheets export:', error);
            showError('Failed to prepare Google Sheets export: ' + error.message);
        } finally {
            // Reset button state
            setTimeout(() => {
                exportGoogleSheetsBtn.disabled = false;
                exportGoogleSheetsBtn.innerHTML = '📈 Export to Google Sheets';
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
        exportGoogleSheetsBtn.disabled = false;
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
    
    function showLoading(show) {
        if (show) {
            linksContainer.innerHTML = '<div class="loading">Extracting links...</div>';
            extractBtn.disabled = true;
            extractBtn.textContent = 'Extracting...';
        } else {
            extractBtn.disabled = false;
            extractBtn.textContent = '🔄 Refresh Links';
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
});
