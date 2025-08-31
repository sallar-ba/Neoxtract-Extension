/**
 * Sound manager for the CyberExtractor
 * - Provides audio feedback for actions and easter eggs
 * - All sounds are generated programmatically using Web Audio API
 * - No external files needed
 */

class CyberSounds {
  constructor() {
    this.ctx = null;
    this.sounds = {};
    this.initialized = false;
    
    // Try to initialize on first user interaction to comply with autoplay policies
    document.addEventListener('click', () => this.init(), { once: true });
  }
  
  init() {
    if (this.initialized) return;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      this.createSounds();
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }
  
  createSounds() {
    // Create sound effects
    this.sounds = {
      click: this.createClickSound(),
      success: this.createSuccessSound(),
      error: this.createErrorSound(),
      glitch: this.createGlitchSound(),
      achievement: this.createAchievementSound(),
      terminal: this.createTerminalSound(),
      secretCmd: this.createSecretCommandSound(),
      unlock: this.createUnlockSound(),
      voice: this.createVoiceCommandSound(),
      themeChange: this.createThemeChangeSound(),
      activate: this.createActivateSound(),
      masterAchievement: this.createMasterAchievementSound()
    };
  }
  
  // Utility function to create an oscillator
  createOscillator(type, freq, startTime, duration, gain = 1.0) {
    if (!this.initialized) return null;
    
    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gainNode.gain.value = gain;
    
    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    oscillator.start(startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    oscillator.stop(startTime + duration);
    
    return { oscillator, gainNode };
  }
  
  // Create various sound effects
  createClickSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      this.createOscillator('square', 800, now, 0.05, 0.1);
    };
  }
  
  createSuccessSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      this.createOscillator('sine', 1200, now, 0.1, 0.2);
      this.createOscillator('sine', 1800, now + 0.1, 0.1, 0.2);
    };
  }
  
  createErrorSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      this.createOscillator('sawtooth', 200, now, 0.2, 0.3);
      this.createOscillator('sawtooth', 150, now + 0.1, 0.2, 0.3);
    };
  }
  
  createGlitchSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Create random glitchy sounds
      for (let i = 0; i < 10; i++) {
        const time = now + i * 0.05;
        const freq = 100 + Math.random() * 900;
        this.createOscillator('sawtooth', freq, time, 0.05, Math.random() * 0.2);
      }
    };
  }
  
  createAchievementSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Achievement jingle
      this.createOscillator('sine', 800, now, 0.1, 0.5);
      this.createOscillator('sine', 1000, now + 0.1, 0.1, 0.5);
      this.createOscillator('sine', 1200, now + 0.2, 0.2, 0.5);
    };
  }
  
  createTerminalSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Terminal boot sound
      for (let i = 0; i < 8; i++) {
        const time = now + i * 0.05;
        const freq = 400 - i * 30;
        this.createOscillator('square', freq, time, 0.05, 0.1);
      }
    };
  }
  
  createSecretCommandSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Secret command execution sound
      this.createOscillator('sine', 300, now, 0.1, 0.3);
      this.createOscillator('sine', 600, now + 0.1, 0.1, 0.3);
      this.createOscillator('sine', 900, now + 0.2, 0.2, 0.3);
      this.createOscillator('sine', 400, now + 0.4, 0.3, 0.3);
    };
  }
  
  createUnlockSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Unlock sound - ascending tones
      for (let i = 0; i < 5; i++) {
        const time = now + i * 0.1;
        const freq = 400 + i * 100;
        this.createOscillator('triangle', freq, time, 0.1, 0.2);
      }
    };
  }
  
  createVoiceCommandSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Futuristic voice recognition sound
      this.createOscillator('sine', 800, now, 0.5, 0.3);
      
      // Add some warble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.value = 0.3;
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      
      // Create frequency modulation
      for (let i = 0; i < 10; i++) {
        const time = now + i * 0.05;
        osc.frequency.setValueAtTime(600 + Math.sin(i) * 100, time);
      }
      
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.stop(now + 0.5);
    };
  }
  
  createThemeChangeSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Theme change sound - sweeping tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 200;
      gain.gain.value = 0.2;
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.stop(now + 0.4);
    };
  }
  
  createActivateSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Activation sound
      this.createOscillator('sine', 880, now, 0.1, 0.2);
      this.createOscillator('sine', 587.33, now + 0.1, 0.1, 0.2);
      this.createOscillator('sine', 698.46, now + 0.2, 0.2, 0.2);
    };
  }
  
  createMasterAchievementSound() {
    return () => {
      if (!this.initialized) this.init();
      const now = this.ctx.currentTime;
      
      // Grand achievement fanfare
      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.2 },  // C5
        { freq: 659.25, time: 0.2, duration: 0.2 },  // E5
        { freq: 783.99, time: 0.4, duration: 0.2 },  // G5
        { freq: 1046.50, time: 0.6, duration: 0.4 }, // C6
        { freq: 783.99, time: 1.0, duration: 0.2 },  // G5
        { freq: 1046.50, time: 1.2, duration: 0.6 }  // C6
      ];
      
      notes.forEach(note => {
        this.createOscillator(
          'triangle',
          note.freq,
          now + note.time,
          note.duration,
          0.3
        );
      });
    };
  }
  
  // Play a sound by name
  static play(soundName) {
    // Sounds disabled
    return;
    
    // The following code is disabled
    /*
    if (!window.cyberSounds) {
      window.cyberSounds = new CyberSounds();
    }
    
    const sound = window.cyberSounds.sounds[soundName];
    if (sound) {
      sound();
    }
    */
  }
}

// Initialize singleton on load
document.addEventListener('DOMContentLoaded', () => {
  window.cyberSounds = new CyberSounds();
});

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { CyberSounds };
}
