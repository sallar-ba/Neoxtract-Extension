// CyberExtractor content script - enhanced with easter eggs and cyber effects
(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.linkExtractorInjected) {
        console.log('CyberExtractor already injected');
        return;
    }
    window.linkExtractorInjected = true;
    
    console.log('%c CyberExtractor initialized ', 'background: #000; color: #0f0; padding: 5px; border: 1px solid #0f0; font-family: monospace;');
    
    // Secret console message only visible to developers
    console.log('%c ⚡ Secret: Type "hackmode" in any input field and press Alt+X ⚡ ', 'color: rgba(0,0,0,0.01);');
    
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
        
        // Check if element is within viewport
        return rect.top < window.innerHeight && rect.bottom > 0 &&
               rect.left < window.innerWidth && rect.right > 0;
    }

    // Generate a unique selector for an element
    function generateUniqueSelector(element) {
        if (!element) return '';
        if (element.id) return '#' + CSS.escape(element.id);
        
        // If it has a class, use the first class
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(c => c);
            if (classes.length > 0) {
                const selector = '.' + CSS.escape(classes[0]);
                // Check if this selector is unique
                if (document.querySelectorAll(selector).length === 1) {
                    return selector;
                }
            }
        }
        
        // Use tag name and child index
        let path = [];
        let current = element;
        
        while (current && current !== document.body) {
            let tag = current.tagName.toLowerCase();
            let siblings = Array.from(current.parentNode.children).filter(child => child.tagName === current.tagName);
            
            if (siblings.length > 1) {
                let index = siblings.indexOf(current) + 1;
                tag += ':nth-of-type(' + index + ')';
            }
            
            path.unshift(tag);
            current = current.parentNode;
            
            // Limit path length for performance
            if (path.length > 5) break;
        }
        
        return path.join(' > ');
    }

    // Easter egg detection - listen for konami code
    let konamiSequence = [];
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    
    document.addEventListener('keydown', (e) => {
        konamiSequence.push(e.key);
        if (konamiSequence.length > konamiCode.length) {
            konamiSequence.shift();
        }
        
        if (konamiSequence.join('') === konamiCode.join('')) {
            triggerKonamiEasterEgg();
        }
    });
    
    // Secret input detection
    let hackInput = '';
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const value = e.target.value.toLowerCase();
            
            if (value.includes('hackmode')) {
                hackInput = 'hackmode';
                
                // Reset after 5 seconds
                setTimeout(() => {
                    hackInput = '';
                }, 5000);
            }
        }
    });
    
    // Detect Alt+X when hackmode is active
    document.addEventListener('keydown', (e) => {
        if (hackInput === 'hackmode' && e.altKey && e.key === 'x') {
            triggerHackModeEasterEgg();
        }
    });
    
    // Konami code easter egg effect
    function triggerKonamiEasterEgg() {
        console.log('Konami code activated!');
        
        // Create a temporary overlay with matrix effect
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = '#0f0';
        overlay.style.fontSize = '24px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.zIndex = '2147483647';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.overflow = 'hidden';
        
        overlay.innerHTML = `
            <div style="text-align:center; margin-bottom: 20px;">
                <h2 style="color:#0f0; text-shadow: 0 0 10px #0f0;">GOD MODE ACTIVATED</h2>
                <p>You found the Konami Code Easter Egg!</p>
                <p>Click anywhere to dismiss</p>
            </div>
            <canvas id="matrixCanvas" width="500" height="400"></canvas>
        `;
        
        document.body.appendChild(overlay);
        
        // Initialize matrix rain
        initMatrixRain();
        
        // Remove overlay on click
        overlay.addEventListener('click', () => {
            overlay.remove();
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                overlay.remove();
            }
        }, 10000);
        
        // Send message to extension popup if open
        chrome.runtime.sendMessage({
            action: 'easterEggFound',
            eggName: 'konami'
        }).catch(err => {
            // Extension popup might not be open, ignore error
        });
    }
    
    // Hack mode easter egg
    function triggerHackModeEasterEgg() {
        console.log('Hack mode activated!');
        
        // Create text elements that look like "hacking"
        const hackingOverlay = document.createElement('div');
        hackingOverlay.style.position = 'fixed';
        hackingOverlay.style.top = '0';
        hackingOverlay.style.left = '0';
        hackingOverlay.style.width = '100%';
        hackingOverlay.style.height = '100%';
        hackingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        hackingOverlay.style.color = '#0f0';
        hackingOverlay.style.fontSize = '14px';
        hackingOverlay.style.fontFamily = 'monospace';
        hackingOverlay.style.padding = '20px';
        hackingOverlay.style.boxSizing = 'border-box';
        hackingOverlay.style.overflow = 'auto';
        hackingOverlay.style.zIndex = '2147483647';
        
        document.body.appendChild(hackingOverlay);
        
        // Generate "hacking" text
        const hackingText = [
            '> INITIALIZING CYBEREXTRACTOR HACK MODULE...',
            '> ACCESSING TARGET DOMAIN: ' + window.location.hostname,
            '> BYPASSING SECURITY PROTOCOLS...',
            '> SCANNING FOR VULNERABILITIES...',
            '> EXPLOITING ACCESS POINTS...',
            '> ACCESSING MAINFRAME...',
            '> DOWNLOADING DATA STREAMS...',
            '> EXTRACTING INFORMATION...',
            '> CLEANING TRACES...',
            '> HACK COMPLETE!'
        ];
        
        // Display text with typing effect
        let textIndex = 0;
        let charIndex = 0;
        
        const typeInterval = setInterval(() => {
            if (textIndex >= hackingText.length) {
                clearInterval(typeInterval);
                
                // Add completion message
                const completionDiv = document.createElement('div');
                completionDiv.style.marginTop = '50px';
                completionDiv.style.color = '#ff00ff';
                completionDiv.style.textAlign = 'center';
                completionDiv.innerHTML = `
                    <h2>EASTER EGG ACTIVATED!</h2>
                    <p>You found the secret hack mode.</p>
                    <p>Click anywhere to dismiss.</p>
                `;
                hackingOverlay.appendChild(completionDiv);
                
                // Send message to extension popup if open
                chrome.runtime.sendMessage({
                    action: 'easterEggFound',
                    eggName: 'hackMode'
                }).catch(err => {
                    // Extension popup might not be open, ignore error
                });
                
                return;
            }
            
            const currentLine = hackingText[textIndex];
            
            if (!hackingOverlay[`line${textIndex}`]) {
                hackingOverlay[`line${textIndex}`] = document.createElement('div');
                hackingOverlay[`line${textIndex}`].style.marginBottom = '10px';
                hackingOverlay.appendChild(hackingOverlay[`line${textIndex}`]);
            }
            
            if (charIndex < currentLine.length) {
                hackingOverlay[`line${textIndex}`].textContent += currentLine[charIndex];
                charIndex++;
            } else {
                textIndex++;
                charIndex = 0;
                
                // Add some random technical-looking output after certain lines
                if (textIndex === 3 || textIndex === 5 || textIndex === 7) {
                    const techOutput = document.createElement('div');
                    techOutput.style.color = '#888';
                    techOutput.style.fontSize = '12px';
                    techOutput.style.margin = '5px 0 15px 20px';
                    techOutput.style.fontFamily = 'monospace';
                    
                    // Generate some random tech-looking text
                    const lines = Math.floor(Math.random() * 10) + 5;
                    for (let i = 0; i < lines; i++) {
                        techOutput.innerHTML += generateTechOutput() + '<br>';
                    }
                    
                    hackingOverlay.appendChild(techOutput);
                }
            }
        }, 50);
        
        // Remove overlay on click
        hackingOverlay.addEventListener('click', () => {
            hackingOverlay.remove();
            clearInterval(typeInterval);
        });
        
        // Auto-remove after 20 seconds
        setTimeout(() => {
            if (document.body.contains(hackingOverlay)) {
                hackingOverlay.remove();
                clearInterval(typeInterval);
            }
        }, 20000);
    }
    
    // Generate random tech output lines
    function generateTechOutput() {
        const prefixes = ['0x', 'cmd_', 'mem_', 'proc_', 'sys_', 'data_', 'addr_'];
        const hex = '0123456789ABCDEF';
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        let output = prefix;
        
        // Generate random hex
        for (let i = 0; i < 8; i++) {
            output += hex[Math.floor(Math.random() * 16)];
        }
        
        output += ': ';
        
        // Add some content
        const statuses = ['OK', 'VERIFIED', 'COMPLETE', 'FOUND', 'ACCESSED', 'BYPASSED'];
        output += statuses[Math.floor(Math.random() * statuses.length)];
        
        // Sometimes add a percentage
        if (Math.random() > 0.5) {
            output += ' (' + Math.floor(Math.random() * 100) + '%)';
        }
        
        return output;
    }
    
    // Matrix rain animation
    function initMatrixRain() {
        const canvas = document.getElementById('matrixCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Matrix characters
        const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];
        
        // Initialize drops
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        function draw() {
            // Black BG with opacity for trail effect
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "#0f0"; // Green text
            ctx.font = fontSize + "px monospace";
            
            // Loop through drops
            for (let i = 0; i < drops.length; i++) {
                // Random character
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                // Reset drop when it reaches bottom
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
        }
        
        // Run animation
        setInterval(draw, 33);
    }
    
    // Message handler for communication with popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        if (request.action === 'extractLinks') {
            console.log('Extracting links...');
            const links = extractLinks();
            console.log('Found links:', links);
            sendResponse(links);
            return true;
        } else if (request.action === 'extractEmails') {
            console.log('Extracting emails...');
            const emails = extractEmails();
            console.log('Found emails:', emails);
            sendResponse(emails);
            return true;
        } else if (request.action === 'highlightElement') {
            const result = highlightElement(request.selector);
            sendResponse({ success: result });
            return true;
        } else if (request.action === 'testContentScript') {
            console.log('Test message received');
            sendResponse({ success: true, message: 'Content script is working' });
            return true;
        }
    });
    
    // Extract all links from the page
    function extractLinks() {
        const linkElements = document.querySelectorAll('a');
        const links = [];
        const seenUrls = new Set();
        const currentDomain = window.location.hostname;
        
        linkElements.forEach(link => {
            try {
                let url = link.href;
                
                // Skip empty, javascript: and # links
                if (!url || url === 'javascript:void(0)' || url === '#' || url.startsWith('mailto:')) {
                    return;
                }
                
                // Skip duplicates
                if (seenUrls.has(url)) {
                    return;
                }
                seenUrls.add(url);
                
                // Check if link is visible
                const isVisible = isElementVisible(link);
                
                // Get link text
                const text = link.textContent.trim();
                
                // Get link domain
                let domain = '';
                try {
                    domain = new URL(url).hostname;
                } catch (e) {
                    domain = 'unknown';
                }
                
                // Check if link is external
                const isExternal = domain !== currentDomain && domain !== '';
                
                // Save link with a unique selector for later highlighting
                const selector = generateUniqueSelector(link);
                
                links.push({
                    url,
                    text,
                    domain,
                    isExternal,
                    isVisible,
                    selector
                });
            } catch (error) {
                console.error('Error processing link:', error);
            }
        });
        
        return links;
    }
    
    // Extract all emails from the page
    function extractEmails() {
        const emails = [];
        const seenEmails = new Set();
        
        // Regular expression to match email addresses
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        
        // Extract emails from text content
        const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        
        let node;
        while (node = textWalker.nextNode()) {
            const text = node.textContent;
            let match;
            
            while ((match = emailRegex.exec(text)) !== null) {
                const email = match[0];
                
                if (seenEmails.has(email)) continue;
                seenEmails.add(email);
                
                // Get context around the email
                const context = text.substring(Math.max(0, match.index - 50), match.index + email.length + 50);
                
                // Check if email is visible
                const isVisible = isElementVisible(node.parentElement);
                
                // Get domain from email
                const domain = email.split('@')[1];
                
                emails.push({
                    email: email,
                    context: context,
                    domain: domain,
                    isVisible: isVisible,
                    source: 'Content'
                });
            }
        }
        
        // Extract emails from input fields
        const inputs = document.querySelectorAll('input[type="email"], input[type="text"], textarea');
        inputs.forEach(input => {
            const value = input.value;
            
            if (value && emailRegex.test(value)) {
                const email = value.match(emailRegex)[0];
                
                if (seenEmails.has(email)) return;
                seenEmails.add(email);
                
                emails.push({
                    email: email,
                    domain: email.split('@')[1],
                    isVisible: isElementVisible(input),
                    source: 'Input'
                });
            }
        });
        
        return emails;
    }
    
    // Highlight an element on the page
    function highlightElement(selector) {
        if (!selector) return false;
        
        try {
            const el = document.querySelector(selector);
            if (!el) return false;
            
            // Save original styles
            const originalOutline = el.style.outline;
            const originalBgColor = el.style.backgroundColor;
            const originalPosition = el.style.position;
            const originalZIndex = el.style.zIndex;
            
            // Apply highlight styles
            el.style.outline = '3px solid #ff00ff';
            el.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
            el.style.position = 'relative';
            el.style.zIndex = '9999';
            
            // Scroll into view with smooth animation
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Reset after 3 seconds
            setTimeout(() => {
                el.style.outline = originalOutline;
                el.style.backgroundColor = originalBgColor;
                el.style.position = originalPosition;
                el.style.zIndex = originalZIndex;
            }, 3000);
            
            return true;
        } catch (error) {
            console.error('Error highlighting element:', error);
            return false;
        }
    }
    
    // Add cyberpunk easter egg styles
    const cyberStyles = document.createElement('style');
    cyberStyles.textContent = `
        /* CyberExtractor easter egg styles */
        .cyberExtractor-highlight {
            outline: 3px solid #ff00ff !important;
            background-color: rgba(255, 0, 255, 0.1) !important;
            position: relative !important;
            z-index: 9999 !important;
            transition: all 0.3s ease !important;
        }
        
        @keyframes cyber-pulse {
            0% {
                box-shadow: 0 0 5px #00f3ff;
            }
            50% {
                box-shadow: 0 0 15px #00f3ff, 0 0 30px #00f3ff;
            }
            100% {
                box-shadow: 0 0 5px #00f3ff;
            }
        }
        
        @keyframes cyber-glitch {
            0% {
                transform: translate(0);
            }
            20% {
                transform: translate(-5px, 5px);
            }
            40% {
                transform: translate(-5px, -5px);
            }
            60% {
                transform: translate(5px, 5px);
            }
            80% {
                transform: translate(5px, -5px);
            }
            100% {
                transform: translate(0);
            }
        }
    `;
    document.head.appendChild(cyberStyles);
})();
