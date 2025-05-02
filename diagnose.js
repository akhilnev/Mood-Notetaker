/**
 * Diagnostic Script for Mood Notetaker
 * 
 * This script helps diagnose issues with face-api loading and overlay visibility.
 * Add this script to content_scripts in manifest.json temporarily for debugging.
 */

console.log('[DIAGNOSE] Script loaded for diagnostics');

// Wait for page load
window.addEventListener('load', function() {
  console.log('[DIAGNOSE] Page loaded');
  
  // Check if we're in a Zoom meeting
  const isZoomMeeting = window.location.href.includes('zoom.us/wc/');
  console.log('[DIAGNOSE] Is Zoom meeting:', isZoomMeeting);
  console.log('[DIAGNOSE] Current URL:', window.location.href);
  
  // Check for face-api script
  const faceApiPath = chrome.runtime.getURL('content/face-api/face-api.min.js');
  console.log('[DIAGNOSE] face-api.js path:', faceApiPath);
  
  // Check if our content scripts are loaded
  const emotionDetectorLoaded = typeof EmotionDetector !== 'undefined';
  const audioCaptureLoaded = typeof AudioCapturer !== 'undefined';
  console.log('[DIAGNOSE] EmotionDetector loaded:', emotionDetectorLoaded);
  console.log('[DIAGNOSE] AudioCapturer loaded:', audioCaptureLoaded);
  
  // Test creating a script element without executing it
  const testScript = document.createElement('script');
  testScript.setAttribute('data-test', 'face-api-test');
  document.head.appendChild(testScript);
  console.log('[DIAGNOSE] Test script added:', 
              document.querySelector('script[data-test="face-api-test"]') !== null);
  
  // Check overlay visibility
  setTimeout(() => {
    const overlay = document.getElementById('mood-notetaker-overlay');
    console.log('[DIAGNOSE] Overlay exists:', overlay !== null);
    if (overlay) {
      console.log('[DIAGNOSE] Overlay display:', window.getComputedStyle(overlay).display);
      console.log('[DIAGNOSE] Overlay position:', window.getComputedStyle(overlay).position);
      console.log('[DIAGNOSE] Overlay z-index:', window.getComputedStyle(overlay).zIndex);
    }
    
    // Check meeting container
    const zoomMeetingContainer = document.querySelector('.meeting-client');
    console.log('[DIAGNOSE] Zoom meeting container:', zoomMeetingContainer !== null);
    
    // List all iframes on the page
    const iframes = document.querySelectorAll('iframe');
    console.log('[DIAGNOSE] Number of iframes:', iframes.length);
    
    // Print all z-indices of major elements
    console.log('[DIAGNOSE] Z-index hierarchy:');
    document.querySelectorAll('body > *').forEach(el => {
      console.log(`${el.tagName}#${el.id}.${el.className}: z-index=${window.getComputedStyle(el).zIndex}`);
    });
  }, 5000); // Wait 5 seconds to ensure everything is loaded
});

// Try loading face-api.js in a safer way
function safeLoadFaceApi() {
  try {
    const scriptUrl = chrome.runtime.getURL('content/face-api/face-api.min.js');
    console.log('[DIAGNOSE] Attempting to load face-api from:', scriptUrl);
    
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = () => {
      console.log('[DIAGNOSE] Face API successfully loaded');
      if (window.faceapi) {
        console.log('[DIAGNOSE] faceapi global object available');
      } else {
        console.log('[DIAGNOSE] faceapi global object NOT available');
      }
    };
    script.onerror = (e) => {
      console.error('[DIAGNOSE] Error loading Face API script:', e);
    };
    
    // Inject into document
    document.head.appendChild(script);
    console.log('[DIAGNOSE] Script element added to head');
  } catch (e) {
    console.error('[DIAGNOSE] Exception during face-api load attempt:', e);
  }
}

// Run diagnosis after a delay
setTimeout(safeLoadFaceApi, 3000); 