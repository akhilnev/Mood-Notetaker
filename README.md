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

## Development Plan

### Phase 1: Foundation
- Extension scaffolding ✅
- UI overlay implementation ✅
- Communication between content and background scripts ✅

### Phase 2: Core Features
- Emotion detection using face-api.js (in progress)
- Audio capture and transcription with Whisper API (planned)
- Meeting summarization with GPT-4 (planned)

### Phase 3: Polish
- Performance optimization
- Error handling
- User customization options
