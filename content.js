// Content script to extract links from the current page
(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.linkExtractorInjected) {
        return;
    }
    window.linkExtractorInjected = true;
    
    // Function to extract all links from the page
    function extractLinks() {
        const links = [];
        const currentDomain = window.location.hostname;
        
        // Get all anchor tags with href attributes
        const anchors = document.querySelectorAll('a[href]');
        
        anchors.forEach((anchor, index) => {
            const href = anchor.href;
            const text = anchor.textContent.trim() || anchor.title || href;
            
            // Skip javascript: and data: URLs
            if (href.startsWith('javascript:') || href.startsWith('data:')) {
                return;
            }
            
            let isExternal;
            try {
                const linkUrl = new URL(href);
                const currentUrl = new URL(window.location.href);
                isExternal = linkUrl.hostname !== currentUrl.hostname;
            } catch (e) {
                // If URL parsing fails, treat as internal
                isExternal = false;
            }
            
            let domain;
            try {
                domain = new URL(href).hostname || currentDomain;
            } catch (e) {
                domain = currentDomain;
            }
            
            const linkData = {
                id: index,
                url: href,
                text: text,
                title: anchor.title || '',
                isExternal: isExternal,
                domain: domain,
                element: {
                    tagName: anchor.tagName,
                    className: anchor.className,
                    id: anchor.id
                }
            };
            
            links.push(linkData);
        });
        
        return {
            links: links,
            totalCount: links.length,
            internalCount: links.filter(link => !link.isExternal).length,
            externalCount: links.filter(link => link.isExternal).length,
            currentUrl: window.location.href,
            pageTitle: document.title,
            extractedAt: new Date().toISOString()
        };
    }
    
    // Highlight links when requested
    let highlightedElements = [];
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            if (request.action === 'extractLinks') {
                // Ensure DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        try {
                            const result = extractLinks();
                            sendResponse({ success: true, data: result });
                        } catch (error) {
                            sendResponse({ success: false, error: error.message });
                        }
                    });
                } else {
                    const result = extractLinks();
                    sendResponse({ success: true, data: result });
                }
                return true; // Keep the message channel open for async response
            }
            
            if (request.action === 'highlightLink') {
                // Remove previous highlights
                highlightedElements.forEach(el => {
                    el.style.outline = '';
                    el.style.backgroundColor = '';
                });
                highlightedElements = [];
                
                // Highlight the requested link
                const anchors = document.querySelectorAll('a[href]');
                if (anchors[request.linkId]) {
                    const element = anchors[request.linkId];
                    element.style.outline = '2px solid #ff6b6b';
                    element.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    highlightedElements.push(element);
                }
                sendResponse({ success: true });
                return true;
            }
            
            if (request.action === 'clearHighlights') {
                highlightedElements.forEach(el => {
                    el.style.outline = '';
                    el.style.backgroundColor = '';
                });
                highlightedElements = [];
                sendResponse({ success: true });
                return true;
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
        
        return true; // Keep the message channel open
    });
    
    // Signal that the content script is ready
    window.linkExtractorReady = true;
    
    // Send ready signal to popup if it's listening
    try {
        chrome.runtime.sendMessage({ action: 'contentScriptReady' }).catch(() => {
            // Ignore errors if popup is not open
        });
    } catch (e) {
        // Ignore errors
    }
    
})();
