# Mood Notetaker 

A Chrome extension that tracks facial expressions and generates real-time meeting notes for video calls. ( Future Vision on complete implementation )

## Features

- **Emotion Detection**: Analyzes facial expressions to detect your current mood in real-time
- **Automatic Transcription**: Captures meeting audio and converts it to text
- **AI Summarization**: Creates concise bullet-point summaries of the conversation
- **Live Overlay**: Displays your current mood and meeting notes directly on the call interface

## Installation (Development Mode)

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the project directory
5. The extension should now appear in your browser toolbar

## Configuration

For full functionality with real API calls (optional):

1. Open the `config.js` file
2. Replace `'your-openai-api-key-here'` with your actual OpenAI API key
3. Reload the extension

If you don't add an API key, the extension will use simulated data for demonstration purposes.

## Usage

1. Join a Zoom, Google Meet, or Microsoft Teams meeting
2. Click the Mood Notetaker extension icon in your browser toolbar
3. Click "Start Tracking" to begin analyzing your expressions and the conversation
4. The overlay will appear on the meeting page showing your current mood and automatically generated notes
5. Click "Stop" when you want to end the session

## Privacy Note

- All processing happens in your browser or through OpenAI API calls
- No data is stored on servers or shared with other meeting participants
- Only you can see the overlay and your emotion data

## Development Progress

### Phase 1: Foundation ✅
- Extension scaffolding ✅
- UI overlay implementation ✅
- Communication between content and background scripts ✅

### Phase 2: Core Features ✅
- Emotion detection using face-api.js ✅
- Audio capture and transcription ✅
- Meeting summarization with GPT-4 ✅

### Phase 3: Polish (In Progress)
- Performance optimization
- Error handling improvements
- User customization options

## Version 1 Testing & Fixes

During the initial testing phase, we encountered and fixed the following issues:

1. **Content Security Policy (CSP) Error**: Due to Chrome's strict CSP in Manifest V3, the extension couldn't load the face-api.js library from a CDN. Fixed by:
   - Implementing a local face-api.js loading strategy
   - Adding a simulation mode fallback when face detection can't be initialized
   - Properly handling script loading to comply with CSP restrictions

2. **System Audio Capture Error**: The system audio capture attempt was failing with "System audio capture not implemented in this version". Fixed by:
   - Removing the system audio capture attempt to avoid the error
   - Going directly to microphone-only mode for reliable audio capture
   - Updating message types to match the background service worker expectations

These fixes ensure the extension runs properly on Chrome with Manifest V3's security restrictions while providing graceful fallbacks when needed.

## Version 2 Testing & Fixes

During additional testing, we identified and fixed more issues:

1. **Face-API Script Loading CSP Error**: Chrome's Content Security Policy was blocking face-api.js from executing as an inline script with the error:
   ```
   Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules'..."
   ```
   Fixed by:
   - Using a proper script element with src attribute instead of inline script injection
   - Properly loading face-api.js as a web accessible resource with chrome.runtime.getURL()
   - Adding proper error handling and fallback mechanisms when the script can't be loaded

## Project Structure

- `manifest.json` - Extension configuration
- `background/` - Background service worker for API calls
- `content/` - Content scripts for page injection and UI
  - `emotion-detector.js` - Face detection and emotion classification
  - `audio-capturer.js` - Audio recording and processing
  - `content.js` - Main content script and UI management
  - `content.css` - Styles for the overlay UI
  - `face-api/` - Face detection models
- `popup/` - Extension popup UI
- `icons/` - Extension icons
- `config.js` - API configuration (gitignored)
- `config.template.js` - Template for API configuration

## Future Enhancements

- Save meeting notes to a file or copy to clipboard
- Improved emotion detection with more emotion categories
- Full meeting audio capture (with participant consent)
- Meeting insights with emotion and topic correlation
- Customizable UI themes and positions
