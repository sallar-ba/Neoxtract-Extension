/**
 * CYBER HACK MINI-GAME
 * An easter egg hacking simulation game for CyberExtractor
 */

class CyberHackGame {
  constructor() {
    this.gameContainer = document.getElementById('cyberHackGame');
    this.gameContent = this.gameContainer.querySelector('.game-content');
    this.closeButton = document.getElementById('closeGame');
    this.active = false;
    this.level = 1;
    this.score = 0;
    this.timeLeft = 30;
    this.timer = null;
    this.targetCode = '';
    this.attempts = 0;
    this.maxAttempts = 3;
    
    this.setupListeners();
  }
  
  setupListeners() {
    if (!this.closeButton) return;
    
    this.closeButton.addEventListener('click', () => {
      this.hideGame();
    });
    
    // Listen for terminal command to start game
    document.addEventListener('cyberhack', () => {
      this.showGame();
    });
  }
  
  showGame() {
    if (this.active) return;
    
    this.gameContainer.classList.remove('hidden');
    this.active = true;
    this.initGame();
    
    // Play activation sound if available
    if (window.CyberSounds) {
      CyberSounds.play('activate');
    }
  }
  
  hideGame() {
    this.gameContainer.classList.add('hidden');
    this.active = false;
    this.stopTimer();
  }
  
  initGame() {
    this.level = 1;
    this.score = 0;
    this.attempts = this.maxAttempts;
    this.timeLeft = 30;
    
    this.renderGameUI();
    this.startLevel();
  }
  
  renderGameUI() {
    this.gameContent.innerHTML = `
      <div class="game-stats">
        <div class="game-stat">LEVEL: <span id="gameLevel">${this.level}</span></div>
        <div class="game-stat">SCORE: <span id="gameScore">${this.score}</span></div>
        <div class="game-stat">TIME: <span id="gameTime">${this.timeLeft}</span></div>
        <div class="game-stat">ATTEMPTS: <span id="gameAttempts">${this.attempts}</span></div>
      </div>
      
      <div class="game-display">
        <div class="target-code-container">
          <div class="target-label">TARGET CODE</div>
          <div class="target-code" id="targetCode"></div>
        </div>
        
        <div class="code-matrix">
          <div class="matrix-row" id="codeMatrix"></div>
        </div>
        
        <div class="user-input-container">
          <div class="input-label">ENTER CODE</div>
          <input type="text" id="codeInput" class="code-input" maxlength="8" autocomplete="off" placeholder="ENTER CODE">
          <button id="submitCode" class="submit-code">EXECUTE</button>
        </div>
      </div>
      
      <div class="game-message" id="gameMessage">
        Hack the system by entering the correct code. Find the code in the matrix above.
      </div>
    `;
    
    // Setup submit button
    const submitButton = document.getElementById('submitCode');
    const codeInput = document.getElementById('codeInput');
    
    if (submitButton) {
      submitButton.addEventListener('click', () => this.checkCode());
    }
    
    if (codeInput) {
      codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.checkCode();
        }
      });
      
      // Focus the input
      setTimeout(() => codeInput.focus(), 300);
    }
  }
  
  startLevel() {
    // Generate target code based on level
    this.generateTargetCode();
    
    // Generate code matrix
    this.generateCodeMatrix();
    
    // Start timer
    this.startTimer();
    
    // Update UI
    document.getElementById('gameLevel').textContent = this.level;
    document.getElementById('gameScore').textContent = this.score;
    document.getElementById('gameAttempts').textContent = this.attempts;
    document.getElementById('targetCode').textContent = this.targetCode;
    
    // Show game message
    this.showMessage(`LEVEL ${this.level} - Find and enter the code`);
  }
  
  generateTargetCode() {
    const codeLength = Math.min(4 + Math.floor(this.level / 2), 8);
    const characters = '0123456789ABCDEF';
    let code = '';
    
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    this.targetCode = code;
  }
  
  generateCodeMatrix() {
    const matrixContainer = document.getElementById('codeMatrix');
    if (!matrixContainer) return;
    
    // Clear previous matrix
    matrixContainer.innerHTML = '';
    
    // Generate matrix size based on level
    const matrixSize = 10 + (this.level * 5);
    let matrix = '';
    
    // Characters to use in the matrix
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*(){}[]<>~';
    
    // Insert the target code at a random position
    const targetPosition = Math.floor(Math.random() * (matrixSize - this.targetCode.length));
    
    // Generate the code matrix
    for (let i = 0; i < matrixSize; i++) {
      // If we're at the target position, insert the actual code
      if (i === targetPosition) {
        matrix += `<span class="code-target">${this.targetCode}</span>`;
        i += this.targetCode.length - 1; // Skip ahead by code length
        continue;
      }
      
      // Otherwise insert a random character
      const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
      matrix += `<span class="code-char">${randomChar}</span>`;
    }
    
    matrixContainer.innerHTML = matrix;
    
    // Add decoy codes that look similar
    if (this.level > 1) {
      this.addDecoyCodes(matrixContainer);
    }
  }
  
  addDecoyCodes(container) {
    // Number of decoys increases with level
    const decoyCount = Math.min(this.level, 5);
    
    // Create decoy codes by changing a character or two
    for (let i = 0; i < decoyCount; i++) {
      const targetChars = this.targetCode.split('');
      
      // Change 1-2 characters
      const changeCount = Math.min(Math.ceil(this.level / 3), 2);
      for (let j = 0; j < changeCount; j++) {
        const posToChange = Math.floor(Math.random() * targetChars.length);
        const newChar = '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
        targetChars[posToChange] = newChar;
      }
      
      const decoyCode = targetChars.join('');
      
      // Find all spans
      const spans = container.querySelectorAll('span');
      
      // Insert decoy at a random position
      if (spans.length > 10) {
        const randomPos = Math.floor(Math.random() * (spans.length - 2)) + 1;
        const span = spans[randomPos];
        
        if (span && !span.classList.contains('code-target')) {
          span.textContent = decoyCode.substring(0, 1);
          span.className = 'code-decoy';
          
          // Add the rest of the decoy
          if (decoyCode.length > 1) {
            for (let k = 1; k < decoyCode.length; k++) {
              if (randomPos + k < spans.length) {
                spans[randomPos + k].textContent = decoyCode.substring(k, k + 1);
                spans[randomPos + k].className = 'code-decoy';
              }
            }
          }
        }
      }
    }
  }
  
  startTimer() {
    // Clear any existing timer
    this.stopTimer();
    
    // Update timer every second
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      if (document.getElementById('gameTime')) {
        document.getElementById('gameTime').textContent = this.timeLeft;
      }
      
      // Flash timer when low
      if (this.timeLeft <= 5) {
        document.getElementById('gameTime').classList.add('time-critical');
      }
      
      // Time's up
      if (this.timeLeft <= 0) {
        this.timeUp();
      }
    }, 1000);
  }
  
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  checkCode() {
    const input = document.getElementById('codeInput');
    if (!input) return;
    
    const userCode = input.value.toUpperCase();
    
    if (userCode === this.targetCode) {
      // Success!
      this.levelComplete();
    } else {
      // Failed attempt
      this.attempts--;
      
      if (this.attempts <= 0) {
        this.gameOver();
      } else {
        // Show feedback
        this.showMessage(`INCORRECT CODE! ${this.attempts} ATTEMPTS REMAINING`, 'error');
        
        // Update attempts counter
        document.getElementById('gameAttempts').textContent = this.attempts;
        
        // Highlight the matrix to help the player
        if (this.attempts === 1) {
          this.highlightCodeInMatrix();
        }
        
        // Clear input
        input.value = '';
        input.focus();
        
        // Play error sound if available
        if (window.CyberSounds) {
          CyberSounds.play('error');
        }
      }
    }
  }
  
  levelComplete() {
    // Stop timer
    this.stopTimer();
    
    // Calculate score based on time left and level
    const levelScore = (this.timeLeft * 10) + (this.level * 50);
    this.score += levelScore;
    
    // Show success message
    this.showMessage(`LEVEL ${this.level} COMPLETE! +${levelScore} POINTS`, 'success');
    
    // Update score display
    document.getElementById('gameScore').textContent = this.score;
    
    // Play success sound if available
    if (window.CyberSounds) {
      CyberSounds.play('success');
    }
    
    // Start next level after a delay
    setTimeout(() => {
      this.level++;
      this.attempts = this.maxAttempts;
      this.timeLeft = Math.max(30 - (this.level * 2), 10); // Decrease time for higher levels
      
      // Reset input
      const input = document.getElementById('codeInput');
      if (input) input.value = '';
      
      // Start next level
      this.startLevel();
    }, 2000);
  }
  
  timeUp() {
    this.stopTimer();
    this.showMessage('TIME\'S UP! SYSTEM LOCKED', 'error');
    
    // Play error sound if available
    if (window.CyberSounds) {
      CyberSounds.play('error');
    }
    
    setTimeout(() => {
      this.gameOver();
    }, 2000);
  }
  
  gameOver() {
    this.stopTimer();
    
    // Show game over screen
    this.gameContent.innerHTML = `
      <div class="game-over">
        <h2>SYSTEM BREACH FAILED</h2>
        <div class="final-score">FINAL SCORE: ${this.score}</div>
        <div class="final-level">LEVEL REACHED: ${this.level}</div>
        <button id="restartGame" class="restart-button">RETRY</button>
      </div>
    `;
    
    // Add restart button listener
    const restartButton = document.getElementById('restartGame');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        this.initGame();
      });
    }
    
    // Play game over sound if available
    if (window.CyberSounds) {
      CyberSounds.play('glitch');
    }
  }
  
  showMessage(message, type = 'info') {
    const messageElement = document.getElementById('gameMessage');
    if (!messageElement) return;
    
    // Remove previous classes
    messageElement.className = 'game-message';
    
    // Add new class based on type
    messageElement.classList.add(`message-${type}`);
    
    // Set message text
    messageElement.textContent = message;
    
    // Add pulse animation
    messageElement.classList.add('pulse');
    
    // Remove pulse after animation completes
    setTimeout(() => {
      messageElement.classList.remove('pulse');
    }, 500);
  }
  
  highlightCodeInMatrix() {
    // Find the target code in the matrix and make it pulse
    const targetElement = document.querySelector('.code-target');
    if (targetElement) {
      targetElement.classList.add('hint-pulse');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cyberHackGame = new CyberHackGame();
  
  // Add command to terminal commands if it exists
  if (window.terminalCommands) {
    window.terminalCommands['hack'] = () => {
      const event = new CustomEvent('cyberhack');
      document.dispatchEvent(event);
      return 'INITIATING CYBER HACK...';
    };
  }
});
