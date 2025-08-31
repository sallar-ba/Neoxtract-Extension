document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractLinks');
    const copyAllBtn = document.getElementById('copyAll');
    const exportJsonBtn = document.getElementById('exportJson');
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
            
            // Try to send message to existing content script
            let response = await sendMessageWithRetry(tab.id, { action: 'extractLinks' });
            
            if (response.success) {
                allLinks = response.data.links;
                updateLinkCount(response.data);
                enableControls();
                filterAndDisplayLinks();
                showSuccessMessage();
            } else {
                showError('Failed to extract links: ' + response.error);
            }
        } catch (error) {
            showError('Error extracting links. Try refreshing the page if the issue persists.');
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
                
                if (attempt === maxRetries) {
                    // Last attempt - try injecting content script
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        });
                        
                        // Wait a bit for script to initialize
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Try one more time after injection
                        return await chrome.tabs.sendMessage(tabId, message);
                    } catch (injectionError) {
                        throw new Error('Could not communicate with page. Please refresh and try again.');
                    }
                } else {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 200 * attempt));
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
        
        const html = links.map(link => `
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
                    <button class="btn-small copy-link" data-url="${link.url}">Copy</button>
                    <button class="btn-small highlight-link" data-link-id="${link.id}">Highlight</button>
                </div>
            </div>
        `).join('');
        
        linksContainer.innerHTML = html;
        
        // Add event listeners for copy and highlight buttons
        document.querySelectorAll('.copy-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = btn.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    showNotification('Link copied!');
                }).catch(err => {
                    showError('Failed to copy link');
                });
            });
        });
        
        document.querySelectorAll('.highlight-link').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const linkId = parseInt(btn.dataset.linkId);
                
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    await chrome.tabs.sendMessage(tab.id, { 
                        action: 'highlightLink', 
                        linkId: linkId 
                    });
                    showNotification('Link highlighted on page!');
                } catch (error) {
                    showError('Failed to highlight link');
                }
            });
        });
    }
    
    function updateLinkCount(data) {
        linkCount.textContent = `${data.totalCount} links found (${data.internalCount} internal, ${data.externalCount} external)`;
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
        searchInput.disabled = false;
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
    
    function showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
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
        }, 2000);
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
