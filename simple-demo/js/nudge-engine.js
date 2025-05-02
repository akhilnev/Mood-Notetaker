/**
 * Nudge Engine Module for Mood Notetaker
 * Provides emotion-aware nudges based on detected emotional states
 */

class NudgeEngine {
  constructor() {
    this.recentEmotions = [];
    this.maxEmotionsToTrack = 5;
    this.lastNudgeTime = 0;
    this.nudgeCooldown = 15000; // 15 seconds minimum between nudges
    this.nudgeShowing = false;
    this.nudgeTimeout = null;
    
    this.createNudgeContainer();
  }
  
  /**
   * Create the nudge container for displaying nudges
   */
  createNudgeContainer() {
    // Check if container already exists
    if (document.getElementById('nudge-container')) return;
    
    const nudgeContainer = document.createElement('div');
    nudgeContainer.id = 'nudge-container';
    nudgeContainer.className = 'nudge-container';
    document.body.appendChild(nudgeContainer);
  }
  
  /**
   * Track an emotion and potentially trigger a nudge
   * @param {string} emotion The detected emotion
   */
  trackEmotion(emotion) {
    // Add the emotion to the recent emotions array
    this.recentEmotions.push(emotion.toLowerCase());
    
    // Keep the array at a fixed size
    if (this.recentEmotions.length > this.maxEmotionsToTrack) {
      this.recentEmotions.shift();
    }
    
    // Check if we should trigger a nudge
    this.checkForNudge();
  }
  
  /**
   * Check if we should display a nudge based on recent emotions
   */
  checkForNudge() {
    // Only check if we have enough emotions tracked
    if (this.recentEmotions.length < this.maxEmotionsToTrack) return;
    
    // Don't check if we've shown a nudge recently
    if (Date.now() - this.lastNudgeTime < this.nudgeCooldown) return;
    
    // Don't check if a nudge is currently showing
    if (this.nudgeShowing) return;
    
    // Count occurrences of emotions that might trigger a nudge
    const concerns = ['sad', 'angry', 'fearful', 'disgusted'];
    const confusionIndicators = ['surprised', 'fearful'];
    
    const concernedCount = this.recentEmotions.filter(e => concerns.includes(e)).length;
    const confusedCount = this.recentEmotions.filter(e => confusionIndicators.includes(e)).length;
    
    // Check if we have enough of a pattern to show a nudge
    if (concernedCount >= 4) {
      this.showNudge('concerned');
    } else if (confusedCount >= 3) {
      this.showNudge('confused');
    }
  }
  
  /**
   * Show a nudge based on the detected emotional pattern
   * @param {string} type The type of nudge to show
   */
  showNudge(type) {
    // Set the last nudge time
    this.lastNudgeTime = Date.now();
    this.nudgeShowing = true;
    
    // Clear any existing nudge timeouts
    if (this.nudgeTimeout) {
      clearTimeout(this.nudgeTimeout);
    }
    
    // Get nudge content
    const nudgeContent = this.getNudgeContent(type);
    
    // Show the nudge
    const nudgeContainer = document.getElementById('nudge-container');
    if (nudgeContainer) {
      nudgeContainer.innerHTML = `
        <div class="nudge-card ${type}">
          <div class="nudge-icon">
            <i class="${nudgeContent.icon}"></i>
          </div>
          <div class="nudge-content">
            <h3>${nudgeContent.title}</h3>
            <p>${nudgeContent.message}</p>
          </div>
          <div class="nudge-close">×</div>
        </div>
      `;
      
      // Add event listener to close button
      const closeButton = nudgeContainer.querySelector('.nudge-close');
      if (closeButton) {
        closeButton.addEventListener('click', () => this.hideNudge());
      }
      
      // Add class to animate in
      setTimeout(() => {
        nudgeContainer.classList.add('visible');
      }, 10);
      
      // Auto-hide after a delay
      this.nudgeTimeout = setTimeout(() => {
        this.hideNudge();
      }, 8000);
    }
  }
  
  /**
   * Hide the currently displayed nudge
   */
  hideNudge() {
    const nudgeContainer = document.getElementById('nudge-container');
    if (nudgeContainer) {
      nudgeContainer.classList.remove('visible');
      
      // Reset the nudge showing flag after animation completes
      setTimeout(() => {
        this.nudgeShowing = false;
        nudgeContainer.innerHTML = '';
      }, 300);
    }
  }
  
  /**
   * Get nudge content based on the type of nudge
   * @param {string} type The type of nudge to get content for
   * @returns {Object} The nudge content
   */
  getNudgeContent(type) {
    const nudges = {
      concerned: {
        icon: 'fas fa-heart',
        title: 'Take a moment',
        message: 'Your expressions suggest stress. Try taking a deep breath and resetting your focus.'
      },
      confused: {
        icon: 'fas fa-question-circle',
        title: 'Need clarification?',
        message: 'You appear uncertain. Consider asking for clarification or taking a different approach.'
      }
    };
    
    return nudges[type] || nudges.concerned;
  }
  
  /**
   * Reset the nudge engine state
   */
  reset() {
    this.recentEmotions = [];
    this.lastNudgeTime = 0;
    this.hideNudge();
  }
}

// Export the NudgeEngine class
window.NudgeEngine = NudgeEngine; 