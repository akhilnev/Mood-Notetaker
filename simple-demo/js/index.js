/**
 * Mood Notetaker Main Entry Point
 * This file imports and exports all modules to ensure proper loading order
 */

// Import all modules in the correct order
import config from './config.js';
import './emotion-detector.js';
import './audio-processor.js';
import './exporter.js';
import './notes-uploader.js';
import './nudge-engine.js';
import './text-highlighter.js';
import './report-renderer.js';
import './report-generator.js';
import './interview-setup.js';
import { interviewAgentState, startInterviewAgent, stopInterviewAgent, generateInterviewReport } from './interview-agent.js';
import './app.js';

// Make all required objects globally accessible
window.interviewAgentState = interviewAgentState;
window.startInterviewAgent = startInterviewAgent;
window.stopInterviewAgent = stopInterviewAgent;
window.generateInterviewReport = generateInterviewReport;

// Ensure AudioProcessor and EmotionDetector are available globally
if (typeof AudioProcessor === 'function' && !window.AudioProcessor) {
  window.AudioProcessor = AudioProcessor;
}

if (typeof EmotionDetector === 'function' && !window.EmotionDetector) {
  window.EmotionDetector = EmotionDetector;
}

// Log that all modules are loaded
console.log('Mood Notetaker: All modules loaded successfully');

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Mood Notetaker: Initializing application');
  
  // Check for required elements
  const startButton = document.getElementById('startBtn');
  if (startButton) {
    console.log('Mood Notetaker: UI elements found, ready to start');
  } else {
    console.error('Mood Notetaker: UI elements not found, check your HTML');
  }
}); 