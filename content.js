// Content script to extract links and emails from the current page
(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.linkExtractorInjected) {
        console.log('Link extractor already injected');
        return;
    }
    window.linkExtractorInjected = true;
    
    console.log('Link extractor content script initialized');
    
    // Function to check if an element is visible
    function isElementVisible(element) {
        if (!element) return false;
        
        // Check if element is in the DOM
        if (!document.contains(element)) return false;
        
        // Check basic visibility
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || 
            style.visibility === 'hidden' || 
            style.opacity === '0') {
            return false;
        }
        
        // Check if element has dimensions
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        
        // Check if element is within viewport or scrollable area
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        
        // Element is considered visible if it's within the document bounds
        // (even if not currently in viewport, since user can scroll to it)
        return rect.top < documentHeight && rect.bottom > 0 && 
               rect.left < viewportWidth && rect.right > 0;
    }
    
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
            
            // Check if the link is visible on the page
            const isVisible = isElementVisible(anchor);
            
            const linkData = {
                id: index,
                url: href,
                text: text,
                title: anchor.title || '',
                isExternal: isExternal,
                domain: domain,
                isVisible: isVisible,
                element: {
                    tagName: anchor.tagName,
                    className: anchor.className,
                    id: anchor.id
                }
            };
            
            links.push(linkData);
        });
        
        const visibleCount = links.filter(link => link.isVisible).length;
        const hiddenCount = links.length - visibleCount;
        
        return {
            links: links,
            totalCount: links.length,
            visibleCount: visibleCount,
            hiddenCount: hiddenCount,
            internalCount: links.filter(link => !link.isExternal).length,
            externalCount: links.filter(link => link.isExternal).length,
            currentUrl: window.location.href,
            pageTitle: document.title,
            extractedAt: new Date().toISOString()
        };
    }
    
    // Function to extract all emails from the page
    function extractEmails() {
        const emails = [];
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const processedEmails = new Set();
        
        // Extract from text content
        const textNodes = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = textNodes.nextNode()) {
            const matches = node.textContent.match(emailRegex);
            if (matches) {
                matches.forEach(email => {
                    if (!processedEmails.has(email.toLowerCase())) {
                        processedEmails.add(email.toLowerCase());
                        
                        // Check if email is visible
                        const range = document.createRange();
                        range.selectNodeContents(node);
                        const rect = range.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0 && 
                                        rect.top < window.innerHeight && rect.bottom > 0;
                        
                        emails.push({
                            id: emails.length,
                            email: email,
                            source: 'text',
                            isVisible: isVisible,
                            context: node.textContent.substring(
                                Math.max(0, node.textContent.indexOf(email) - 50),
                                node.textContent.indexOf(email) + email.length + 50
                            ).trim()
                        });
                    }
                });
            }
        }
        
        // Extract from mailto links
        const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
        mailtoLinks.forEach((link, index) => {
            const href = link.href;
            const email = href.replace('mailto:', '').split('?')[0]; // Remove query params
            
            if (email && !processedEmails.has(email.toLowerCase())) {
                processedEmails.add(email.toLowerCase());
                
                emails.push({
                    id: emails.length,
                    email: email,
                    source: 'mailto',
                    isVisible: isElementVisible(link),
                    context: link.textContent.trim() || email,
                    linkText: link.textContent.trim()
                });
            }
        });
        
        // Extract from input fields (common email inputs)
        const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
        emailInputs.forEach(input => {
            const email = input.value.trim();
            if (email && emailRegex.test(email) && !processedEmails.has(email.toLowerCase())) {
                processedEmails.add(email.toLowerCase());
                
                emails.push({
                    id: emails.length,
                    email: email,
                    source: 'input',
                    isVisible: isElementVisible(input),
                    context: `Input field: ${input.name || input.id || 'email'}`,
                    fieldName: input.name || input.id
                });
            }
        });
        
        return {
            emails: emails,
            totalCount: emails.length,
            visibleCount: emails.filter(email => email.isVisible).length,
            hiddenCount: emails.length - emails.filter(email => email.isVisible).length,
            currentUrl: window.location.href,
            pageTitle: document.title,
            extractedAt: new Date().toISOString()
        };
    }
    
    // Highlight links when requested
    let highlightedElements = [];
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        try {
            if (request.action === 'extractLinks') {
                // Ensure DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        try {
                            const result = extractLinks();
                            console.log('Links extracted:', result);
                            sendResponse({ success: true, data: result });
                        } catch (error) {
                            console.error('Error extracting links:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    });
                } else {
                    const result = extractLinks();
                    console.log('Links extracted:', result);
                    sendResponse({ success: true, data: result });
                }
                return true; // Keep the message channel open for async response
            }
            
            if (request.action === 'extractEmails') {
                // Ensure DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        try {
                            const result = extractEmails();
                            console.log('Emails extracted:', result);
                            sendResponse({ success: true, data: result });
                        } catch (error) {
                            console.error('Error extracting emails:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                    });
                } else {
                    const result = extractEmails();
                    console.log('Emails extracted:', result);
                    sendResponse({ success: true, data: result });
                }
                return true; // Keep the message channel open for async response
            }
            
            if (request.action === 'highlightLink') {
                console.log('Highlighting link with ID:', request.linkId);
                
                // Remove previous highlights
                highlightedElements.forEach(el => {
                    el.style.outline = '';
                    el.style.backgroundColor = '';
                    el.style.boxShadow = '';
                });
                highlightedElements = [];
                
                // Highlight the requested link
                const anchors = document.querySelectorAll('a[href]');
                console.log(`Found ${anchors.length} anchor elements`);
                
                if (request.linkId >= 0 && request.linkId < anchors.length) {
                    const element = anchors[request.linkId];
                    console.log('Element to highlight:', element);
                    
                    // Check if element is visible before highlighting
                    if (!isElementVisible(element)) {
                        console.log('Element is not visible');
                        sendResponse({ 
                            success: false, 
                            error: 'Link is not visible on the page' 
                        });
                        return true;
                    }
                    
                    // Apply enhanced highlight styling
                    element.style.outline = '3px solid #ff6b6b';
                    element.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';
                    element.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.5)';
                    element.style.borderRadius = '4px';
                    element.style.transition = 'all 0.3s ease';
                    
                    // Scroll element into view with smooth animation
                    element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                    
                    highlightedElements.push(element);
                    console.log('Element highlighted successfully');
                    
                    // Auto-remove highlight after 5 seconds
                    setTimeout(() => {
                        if (highlightedElements.includes(element)) {
                            element.style.outline = '';
                            element.style.backgroundColor = '';
                            element.style.boxShadow = '';
                            element.style.borderRadius = '';
                            const index = highlightedElements.indexOf(element);
                            if (index > -1) {
                                highlightedElements.splice(index, 1);
                            }
                            console.log('Highlight removed automatically');
                        }
                    }, 5000);
                    
                    sendResponse({ success: true });
                } else {
                    console.log('Invalid link ID:', request.linkId);
                    sendResponse({ 
                        success: false, 
                        error: 'Link not found' 
                    });
                }
                return true;
            }
            
            if (request.action === 'clearHighlights') {
                highlightedElements.forEach(el => {
                    el.style.outline = '';
                    el.style.backgroundColor = '';
                    el.style.boxShadow = '';
                    el.style.borderRadius = '';
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
