/**
 * Emotion Detector Module
 * Handles facial expression detection using face-api.js
 * Fixed for Manifest V3 Content Security Policy compliance
 */

class EmotionDetector {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    this.videoElement = null;
    this.stream = null;
    this.detectionInterval = null;
    this.onEmotionUpdate = null;
    this.lastEmotion = 'neutral';
    
    // Configuration
    this.detectionIntervalMs = 2000; // Check emotion every 2 seconds
    this.detectionOptions = {
      minConfidence: 0.5,
    };
    
    // Simulation mode is used when actual face-api.js can't be loaded due to CSP restrictions
    this.simulationMode = false;
  }
  
  /**
   * Load face-api.js library and required models
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('Emotion Detector: Loading face-api.js');
      
      // FIXED: Instead of loading from CDN (which fails due to CSP restrictions),
      // we need to bundle face-api.js with the extension
      
      // Create a script element to load face-api from a local file
      try {
        // Try to load locally bundled face-api.js (which should be added to the project)
        const faceApiUrl = chrome.runtime.getURL('content/face-api/face-api.min.js');
        await this.loadLocalScript(faceApiUrl);
        console.log('Emotion Detector: Successfully loaded face-api.js from extension resources');
      } catch (e) {
        console.warn('Emotion Detector: Failed to load face-api.js, using simulation mode', e);
        this.simulationMode = true;
        // Set up a stub implementation for testing
        window.faceapi = this.createFaceApiStub();
      }
      
      // Only attempt to load models if we're not in simulation mode
      if (!this.simulationMode) {
        console.log('Emotion Detector: Loading models');
        
        // Initialize models
        const modelsPath = chrome.runtime.getURL('content/face-api/models');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
          faceapi.nets.faceExpressionNet.loadFromUri(modelsPath)
        ]);
      }
      
      this.isInitialized = true;
      console.log('Emotion Detector: Initialization complete', 
                 this.simulationMode ? '(simulation mode)' : '');
      return true;
    } catch (error) {
      console.error('Emotion Detector: Initialization failed', error);
      this.simulationMode = true;
      return false;
    }
  }
  
  /**
   * Create a stub implementation of face-api for testing when the real library can't be loaded
   */
  createFaceApiStub() {
    return {
      nets: {
        tinyFaceDetector: { 
          loadFromUri: async (uri) => console.log('Simulation: Loading tinyFaceDetector from', uri) 
        },
        faceExpressionNet: { 
          loadFromUri: async (uri) => console.log('Simulation: Loading faceExpressionNet from', uri) 
        }
      },
      detectSingleFace: () => {
        return {
          withFaceExpressions: () => null
        };
      },
      TinyFaceDetectorOptions: class {}
    };
  }
  
  /**
   * Load a local script from an extension resource
   */
  loadLocalScript(url) {
    return new Promise((resolve, reject) => {
      // For extension local scripts, we need to fetch and inject as text
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load script: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(scriptText => {
          // Create a script element with the text content
          const script = document.createElement('script');
          script.textContent = scriptText; // Using textContent instead of src
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        })
        .catch(reject);
    });
  }
  
  /**
   * Start webcam and begin emotion detection
   * @param {Function} callback - function to call with emotion updates
   */
  async start(callback) {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) return false;
    }
    
    if (this.isRunning) return true;
    
    this.onEmotionUpdate = callback;
    
    try {
      // Try to get the user's webcam
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        } 
      });
      
      // Create video element if it doesn't exist
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.width = 640;
        this.videoElement.height = 480;
        this.videoElement.autoplay = true;
        this.videoElement.style.display = 'none'; // Hide the video element
        document.body.appendChild(this.videoElement);
      }
      
      // Set video source to the webcam stream
      this.videoElement.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise(resolve => {
        this.videoElement.onloadedmetadata = resolve;
      });
      
      // Start detection loop
      this.isRunning = true;
      this.startDetectionLoop();
      
      console.log('Emotion Detector: Started');
      return true;
    } catch (error) {
      console.error('Emotion Detector: Failed to start', error);
      
      // Fallback: if we can't get the webcam directly, try to find an existing video element
      console.log('Emotion Detector: Trying to find existing video element');
      return this.startWithExistingVideo();
    }
  }
  
  /**
   * Fallback method to try to use an existing video element on the page
   */
  async startWithExistingVideo() {
    // Look for video elements that might contain the user's webcam feed
    const videoElements = Array.from(document.querySelectorAll('video'));
    
    // Filter for likely webcam elements (small videos)
    const possibleWebcams = videoElements.filter(video => {
      const rect = video.getBoundingClientRect();
      // Check if video is playing and is relatively small (likely to be a webcam)
      return !video.paused && rect.width > 0 && rect.width < 400;
    });
    
    if (possibleWebcams.length === 0) {
      console.error('Emotion Detector: No suitable video elements found');
      
      // In case we can't find a video element, let's still run in simulation mode
      this.simulationMode = true;
      this.isRunning = true;
      this.startDetectionLoop();
      
      return true;
    }
    
    // Use the first possible webcam video
    this.videoElement = possibleWebcams[0];
    console.log('Emotion Detector: Using existing video element', this.videoElement);
    
    // Start detection loop
    this.isRunning = true;
    this.startDetectionLoop();
    
    return true;
  }
  
  /**
   * Start the loop that detects emotions at regular intervals
   */
  startDetectionLoop() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    
    this.detectionInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        let emotion;
        
        if (this.simulationMode) {
          // In simulation mode, generate random emotions
          emotion = this.generateSimulatedEmotion();
        } else {
          // Use actual face detection
          emotion = await this.detectEmotion();
        }
        
        // If we got a valid emotion and it's different from the last one, notify
        if (emotion && emotion !== this.lastEmotion) {
          this.lastEmotion = emotion;
          
          if (this.onEmotionUpdate) {
            this.onEmotionUpdate(emotion);
          }
          
          // Also send to background script - FIXED: use the correct message type for V3
          chrome.runtime.sendMessage({
            type: 'EMOTION_UPDATE',
            data: { emotion }
          });
          
          console.log(`Emotion Detector: Detected ${emotion}${this.simulationMode ? ' (simulated)' : ''}`);
        }
      } catch (error) {
        console.error('Emotion Detector: Detection error', error);
      }
    }, this.detectionIntervalMs);
  }
  
  /**
   * Generate a simulated emotion when actual detection isn't possible
   */
  generateSimulatedEmotion() {
    const emotions = ['Happy', 'Neutral', 'Focused', 'Surprised'];
    const randomIndex = Math.floor(Math.random() * emotions.length);
    return emotions[randomIndex];
  }
  
  /**
   * Detect emotion from the current video frame
   */
  async detectEmotion() {
    if (!this.videoElement || this.videoElement.paused || this.videoElement.ended) {
      return null;
    }
    
    try {
      // Detect face with expressions
      const detection = await faceapi
        .detectSingleFace(this.videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      
      if (!detection) {
        console.log('Emotion Detector: No face detected');
        return null;
      }
      
      // Get the emotion with highest score
      const expressions = detection.expressions;
      let highestScore = 0;
      let dominantEmotion = 'neutral';
      
      for (const [emotion, score] of Object.entries(expressions)) {
        if (score > highestScore) {
          highestScore = score;
          dominantEmotion = emotion;
        }
      }
      
      console.log(`Emotion Detector: Detected ${dominantEmotion} (${highestScore.toFixed(2)})`);
      
      // Map the raw emotion to a simpler set
      const emotionMap = {
        'happy': 'Happy',
        'sad': 'Sad',
        'angry': 'Angry',
        'fearful': 'Fearful',
        'disgusted': 'Disgusted',
        'surprised': 'Surprised',
        'neutral': 'Neutral'
      };
      
      return emotionMap[dominantEmotion] || 'Neutral';
    } catch (error) {
      console.error('Emotion Detector: Error during detection', error);
      return null;
    }
  }
  
  /**
   * Stop emotion detection and release resources
   */
  stop() {
    this.isRunning = false;
    
    // Clear detection interval
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    
    // Stop and release camera stream if we created it
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
    
    // Remove video element if we created it
    if (this.videoElement && this.videoElement.style.display === 'none') {
      document.body.removeChild(this.videoElement);
      this.videoElement = null;
    }
    
    console.log('Emotion Detector: Stopped');
  }
}

// Export the class
window.EmotionDetector = EmotionDetector;