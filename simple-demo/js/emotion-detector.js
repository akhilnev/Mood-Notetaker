/**
 * Emotion Detector
 * Handles facial expression detection using face-api.js
 */

class EmotionDetector {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    this.videoElement = null;
    this.canvas = null;
    this.detectionInterval = null;
    this.onEmotionUpdate = null;
    this.lastEmotion = 'neutral';
    
    // Configuration
    this.detectionIntervalMs = config.emotionDetectionIntervalMs || 2000;
    this.detectionOptions = {
      minConfidence: config.emotionDetection?.minConfidence || 0.5,
    };
    
    // Simulation mode is used when face-api.js can't be loaded
    this.simulationMode = false;
  }
  
  /**
   * Load face-api.js models (assumes face-api.js is already loaded in the page)
   */
  async initialize(videoEl, canvasEl) {
    if (this.isInitialized) return true;
    
    this.videoElement = videoEl;
    this.canvas = canvasEl;
    
    try {
      console.log('Emotion Detector: Initializing');
      
      // Verify that face-api is loaded
      if (!faceapi) {
        console.error('Emotion Detector: face-api.js not loaded');
        this.simulationMode = true;
        this.isInitialized = true;
        return false;
      }
      
      // Load models - use the public path
      console.log('Emotion Detector: Loading models');
      const modelsPath = '/models'; // Public directory is served at root
      
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
        console.log('TinyFaceDetector loaded successfully');
        
        await faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
        console.log('FaceExpressionNet loaded successfully');
      } catch (e) {
        console.error('Emotion Detector: Failed to load models', e);
        this.simulationMode = true;
      }
      
      this.isInitialized = true;
      console.log('Emotion Detector: Initialization complete', 
                 this.simulationMode ? '(simulation mode)' : '');
      return true;
    } catch (error) {
      console.error('Emotion Detector: Initialization failed', error);
      this.simulationMode = true;
      this.isInitialized = true;
      return false;
    }
  }
  
  /**
   * Start webcam and begin emotion detection
   * @param {Function} callback - function to call with emotion updates
   */
  async start(callback) {
    if (!this.isInitialized || !this.videoElement) {
      console.error('Emotion Detector: Not initialized');
      return false;
    }
    
    if (this.isRunning) return true;
    
    this.onEmotionUpdate = callback;
    
    // Start detection loop
    this.isRunning = true;
    this.startDetectionLoop();
    
    console.log('Emotion Detector: Started');
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
    const emotions = ['Happy', 'Neutral', 'Sad', 'Surprised'];
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
      // Get the canvas context for drawing
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Detect face with expressions
      const detection = await faceapi
        .detectSingleFace(this.videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      
      if (!detection) {
        console.log('Emotion Detector: No face detected');
        return null;
      }
      
      // Draw face detection results
      if (config.emotionDetection.drawLandmarks) {
        // Draw the detection on the canvas
        const dims = faceapi.matchDimensions(this.canvas, this.videoElement, true);
        const resizedDetection = faceapi.resizeResults(detection, dims);
        
        // Draw box around face
        faceapi.draw.drawDetections(this.canvas, resizedDetection);
        
        // Draw expressions if requested
        if (config.emotionDetection.drawLabels) {
          faceapi.draw.drawFaceExpressions(this.canvas, resizedDetection);
        }
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
    
    console.log('Emotion Detector: Stopped');
  }
} 