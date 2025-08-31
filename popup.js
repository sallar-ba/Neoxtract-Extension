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
    
    // Extract links button
    extractBtn.addEventListener('click', async () => {
        try {
            extractBtn.textContent = 'Extracting...';
            extractBtn.disabled = true;
            
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can access this tab
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                showError('Cannot extract links from browser pages. Please navigate to a regular website.');
                return;
            }
            
            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractLinks' });
            
            if (response && response.success) {
                allLinks = response.data.links || [];
                
                linkCount.textContent = `${allLinks.length} links found`;
                enableControls();
                filterAndDisplayLinks();
                
                showSuccess(`Found ${allLinks.length} links!`);
            } else {
                showError('Failed to extract links: ' + (response?.error || 'Unknown error'));
            }
        } catch (error) {
            if (error.message.includes('Could not establish connection')) {
                showError('Could not connect to the page. Please refresh the page and try again.');
            } else {
                showError('Error: ' + error.message);
            }
        } finally {
            extractBtn.textContent = 'Extract Links';
            extractBtn.disabled = false;
        }
    });
    
    // Copy all links
    copyAllBtn.addEventListener('click', () => {
        const linkUrls = filteredLinks.map(link => link.url).join('\n');
        navigator.clipboard.writeText(linkUrls).then(() => {
            showSuccess('Links copied to clipboard!');
        }).catch(err => {
            showError('Failed to copy links');
        });
    });
    
    // Export JSON
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
        
        showSuccess('Links exported as JSON!');
    });
    
    // Search and filter
    searchInput.addEventListener('input', filterAndDisplayLinks);
    filterInternal.addEventListener('change', filterAndDisplayLinks);
    filterExternal.addEventListener('change', filterAndDisplayLinks);
    
    function filterAndDisplayLinks() {
        const searchTerm = searchInput.value.toLowerCase();
        const showInternal = filterInternal.checked;
        const showExternal = filterExternal.checked;
        
        filteredLinks = allLinks.filter(link => {
            const matchesSearch = link.url.toLowerCase().includes(searchTerm) || 
                                (link.text && link.text.toLowerCase().includes(searchTerm));
            const matchesFilter = (link.isExternal && showExternal) || 
                                (!link.isExternal && showInternal);
            
            return matchesSearch && matchesFilter;
        });
        
        displayLinks(filteredLinks);
        
        const total = allLinks.length;
        const filtered = filteredLinks.length;
        if (filtered !== total) {
            linkCount.textContent = `Showing ${filtered} of ${total} links`;
        } else {
            linkCount.textContent = `${total} links found`;
        }
    }
    
    function displayLinks(links) {
        if (links.length === 0) {
            linksContainer.innerHTML = '<div class="placeholder">No links match your criteria</div>';
            return;
        }
        
        const html = links.slice(0, 50).map(link => `
            <div class="link-item">
                <a href="${link.url}" target="_blank" class="link-url">${link.url}</a>
                <div class="link-text">${link.text || 'No text'} ${link.isExternal ? '🌐' : '🏠'}</div>
            </div>
        `).join('');
        
        linksContainer.innerHTML = html;
        
        if (links.length > 50) {
            linksContainer.innerHTML += '<div class="placeholder">Showing first 50 links...</div>';
        }
    }
    
    function enableControls() {
        copyAllBtn.disabled = false;
        exportJsonBtn.disabled = false;
        searchInput.disabled = false;
    }
    
    function showSuccess(message) {
        showNotification(message, 'success');
    }
    
    function showError(message) {
        showNotification(message, 'error');
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
});
