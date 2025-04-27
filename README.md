# Mood Notetaker

A Chrome extension that tracks facial expressions and generates real-time meeting notes for video calls.

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

1. Open the `background/background.js` file
2. Replace `'your-api-key-here'` with your actual OpenAI API key
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

## Future Enhancements

- Save meeting notes to a file or copy to clipboard
- Improved emotion detection with more emotion categories
- Full meeting audio capture (with participant consent)
- Meeting insights with emotion and topic correlation
- Customizable UI themes and positions
