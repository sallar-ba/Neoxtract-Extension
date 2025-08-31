/**
 * CYBER EFFECTS MODULE
 * For the CyberExtractor extension - Adds interactive cyber effects
 * and Easter eggs to enhance user experience.
 */

// Main Cyber Effects Controller
class CyberEffects {
  constructor() {
    // Easter egg tracking
    this.easterEggsFound = 0;
    this.totalEasterEggs = 4; // Reduced from 5 as voice command easter egg was removed
    this.easterEggStates = {
      konami: false,
      terminalAccess: false,
      secretCommand: false,
      clickPattern: false
      // Voice command removed per user request
    };
    
    // Visual effects state
    this.glitchIntensity = 1;
    this.matrixRainActive = true;
    this.cyberTheme = 'default';
    
    // Sound effects permanently disabled
    this.soundEnabled = false; // This will never change - sounds permanently disabled
    this.init();
  }
  
  init() {
    console.log('%c CyberEffects Initialized ', 'background: #000; color: #0f0; padding: 5px; border: 1px solid #0f0; font-family: monospace;');
    
    // Check for saved preferences
    this.loadPreferences();
    this.setupListeners();
    
    // Add secret comment only visible in dev tools
    console.log('%c SECRET: Try typing "sudo unlock --force" in the terminal ', 'color: rgba(0,0,0,0.01);');
  }
  
  setupListeners() {
    // Listen for Konami code sequence
    let konamiSequence = [];
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    
    document.addEventListener('keydown', (e) => {
      konamiSequence.push(e.key);
      if (konamiSequence.length > konamiCode.length) {
        konamiSequence.shift();
      }
      
      if (this.arrayEquals(konamiSequence, konamiCode)) {
        this.triggerEasterEgg('konami');
      }
    });
    
    // Voice functionality removed per user request
  }
  
  // Voice command functionality removed per user request
  
  // Apply a glitch effect to the interface
  applyGlitchEffect(intensity = 1, duration = 1000) {
    const elements = document.querySelectorAll('.can-glitch');
    
    elements.forEach(element => {
      element.classList.add('glitching');
      element.style.setProperty('--glitch-intensity', intensity);
    });
    
    setTimeout(() => {
      elements.forEach(element => {
        element.classList.remove('glitching');
      });
    }, duration);
    
    // Sound disabled
    // if (this.soundEnabled) {
    //   CyberSounds.play('glitch');
    // }
  }
  
  // Trigger Matrix Rain effect
  toggleMatrixRain() {
    this.matrixRainActive = !this.matrixRainActive;
    
    const matrixCanvas = document.getElementById('matrixRain');
    if (!matrixCanvas) return;
    
    if (this.matrixRainActive) {
      matrixCanvas.style.opacity = '1';
    } else {
      matrixCanvas.style.opacity = '0';
    }
    
    return this.matrixRainActive;
  }
  
  // Change the cyber theme
  setCyberTheme(theme) {
    // Valid themes: default, neon, retro, dark, hacker
    const validThemes = ['default', 'neon', 'retro', 'dark', 'hacker'];
    
    if (!validThemes.includes(theme)) {
      theme = 'default';
    }
    
    this.cyberTheme = theme;
    document.body.className = ''; // Clear existing themes
    document.body.classList.add(theme);
    
    // Save preference
    this.savePreferences();
    
    // Sound disabled
    // if (this.soundEnabled) {
    //   CyberSounds.play('themeChange');
    // }
    
    return theme;
  }
  
  // Toggle sound effects - disabled
  toggleSounds() {
    // Sounds permanently disabled, this function does nothing now
    this.soundEnabled = false; // Always keep sounds disabled
    this.savePreferences();
    
    // No sound will ever play
    
    return false; // Always return false to indicate sounds are disabled
  }
  
  // Save user preferences
  savePreferences() {
    const preferences = {
      cyberTheme: this.cyberTheme,
      soundEnabled: this.soundEnabled,
      matrixRainActive: this.matrixRainActive,
      easterEggStates: this.easterEggStates
    };
    
    localStorage.setItem('cyberExtractorPrefs', JSON.stringify(preferences));
  }
  
  // Load saved preferences
  loadPreferences() {
    try {
      const saved = localStorage.getItem('cyberExtractorPrefs');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.cyberTheme = prefs.cyberTheme || 'default';
        this.soundEnabled = false; // Always false, regardless of saved preferences (sounds permanently disabled)
        this.matrixRainActive = prefs.matrixRainActive !== undefined ? prefs.matrixRainActive : true;
        this.easterEggStates = prefs.easterEggStates || this.easterEggStates;
        
        // Apply saved theme
        document.body.classList.add(this.cyberTheme);
      }
    } catch (e) {
      console.error('Error loading preferences:', e);
    }
  }
  
  // Trigger an easter egg
  triggerEasterEgg(eggName) {
    if (this.easterEggStates[eggName]) return; // Already found
    
    this.easterEggStates[eggName] = true;
    this.easterEggsFound++;
    this.savePreferences();
    
    // Each easter egg has different effects
    switch(eggName) {
      case 'konami':
        this.applyGlitchEffect(3, 2000);
        this.showEasterEggMessage('GOD MODE ACTIVATED', 'You found the Konami Code Easter Egg! Special abilities unlocked.');
        document.body.classList.add('konami-active');
        // Sound disabled
        // if (this.soundEnabled) {
        //   CyberSounds.play('achievement');
        // }
        break;
        
      case 'terminalAccess':
        this.showEasterEggMessage('TERMINAL ACCESS GRANTED', 'You discovered the secret terminal! Type "help" to see available commands.');
        // Sound disabled
        // if (this.soundEnabled) {
        //   CyberSounds.play('terminal');
        // }
        break;
        
      case 'secretCommand':
        this.applyGlitchEffect(2, 1500);
        this.showEasterEggMessage('OVERRIDE ACCEPTED', 'Secret command executed successfully. New functions available.');
        // Sound disabled
        // if (this.soundEnabled) {
        //   CyberSounds.play('secretCmd');
        // }
        break;
        
      case 'clickPattern':
        this.showEasterEggMessage('PATTERN RECOGNIZED', 'You found the secret click pattern! Secret theme activated.');
        this.setCyberTheme('hacker');
        // Sound disabled
        // if (this.soundEnabled) {
        //   CyberSounds.play('unlock');
        // }
        break;
        
      // Voice command case removed per user request
    }
    
    // Check if all easter eggs have been found
    if (this.easterEggsFound === this.totalEasterEggs) {
      setTimeout(() => {
        this.showMasterEasterEgg();
      }, 3000);
    }
  }
  
  // Display a message when an easter egg is found
  showEasterEggMessage(title, message) {
    // Check if the easter egg modal exists
    let modal = document.getElementById('easterEggModal');
    
    if (!modal) {
      // Create modal if it doesn't exist
      modal = document.createElement('div');
      modal.id = 'easterEggModal';
      modal.className = 'cyber-modal';
      
      modal.innerHTML = `
        <div class="cyber-modal-content">
          <div class="cyber-modal-header">
            <h3 id="easterEggTitle"></h3>
            <button class="cyber-close">&times;</button>
          </div>
          <div class="cyber-modal-body">
            <p id="easterEggMessage"></p>
            <div class="cyber-achievement">
              <div class="achievement-icon">🏆</div>
              <div class="achievement-progress">
                <div class="progress-text">
                  <span id="eggsFound">${this.easterEggsFound}</span>/<span>${this.totalEasterEggs}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${(this.easterEggsFound / this.totalEasterEggs) * 100}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Set up close button
      modal.querySelector('.cyber-close').addEventListener('click', () => {
        modal.classList.remove('show');
      });
    }
    
    // Update modal content and show it
    document.getElementById('easterEggTitle').textContent = title;
    document.getElementById('easterEggMessage').textContent = message;
    document.getElementById('eggsFound').textContent = this.easterEggsFound;
    modal.querySelector('.progress-fill').style.width = `${(this.easterEggsFound / this.totalEasterEggs) * 100}%`;
    
    modal.classList.add('show');
  }
  
  // Display special message when all easter eggs are found
  showMasterEasterEgg() {
    this.showEasterEggMessage('MASTER EGG HUNTER', 'Congratulations! You found all the easter eggs in CyberExtractor! You are a true digital explorer.');
    
    // Apply special effects
    document.body.classList.add('master-hunter');
    this.applyGlitchEffect(5, 5000);
    
    // Sound disabled
    // if (this.soundEnabled) {
    //   CyberSounds.play('masterAchievement');
    // }
    
    // Add special visual effect to the UI
    const specialElement = document.createElement('div');
    specialElement.className = 'master-effect';
    document.body.appendChild(specialElement);
  }
  
  // Helper function to compare arrays
  arrayEquals(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }
  
  // Create hidden command pattern detector
  createClickPatternDetector(selector, pattern, callback) {
    let clickSequence = [];
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
      el.addEventListener('click', (e) => {
        // Add identifier to sequence (could be index, id, class, etc)
        const identifier = e.target.dataset.id || e.target.id || Date.now();
        clickSequence.push(identifier);
        
        // Only keep the last n clicks where n is the pattern length
        if (clickSequence.length > pattern.length) {
          clickSequence.shift();
        }
        
        // Check if pattern matches
        if (this.arrayEquals(clickSequence, pattern)) {
          callback();
          clickSequence = []; // Reset after match
        }
      });
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cyberEffects = new CyberEffects();
});

// Export the class for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { CyberEffects };
}
