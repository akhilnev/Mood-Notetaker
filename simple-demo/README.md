# Mood Notetaker Simple Demo

A simplified version of the Mood Notetaker that runs locally in the browser without the need for a Chrome extension.

## Features

- Real-time emotion detection using your webcam
- Audio recording and transcription
- Summary generation of your speech
- Clean, modern UI for displaying emotions, transcripts, and summaries

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A webcam for emotion detection
- A microphone for audio recording

### Running the Demo

1. Clone this repository or download the files
2. Open the `index.html` file in your web browser
   - Note: For security reasons, many browsers require this to be served over HTTP rather than opening the file directly. You can use a simple local server for this.

### Setting Up a Local Server

#### Using Python:

```bash
# If you have Python installed, navigate to the simple-demo directory and run:
python -m http.server 8000
```

Then open your browser and go to `http://localhost:8000`

#### Using Node.js:

```bash
# If you have Node.js installed, install the http-server package:
npm install -g http-server

# Then navigate to the simple-demo directory and run:
http-server
```

Then open your browser and go to the URL provided by http-server.

## Using the Demo

1. Click the "Start" button to begin the session
2. Grant permission for webcam and microphone access when prompted
3. Speak naturally while facing the camera
4. Your current emotion will be displayed in real-time
5. Transcripts of your speech will appear as you speak
6. Summaries will be generated periodically
7. Click "Stop" to end the session and release camera/microphone access

## API Key (Optional)

For actual transcription and summarization (instead of simulation):

1. Get an OpenAI API key
2. Add your API key to the `config.js` file in the `openaiApiKey` field

## How It Works

- **Emotion Detection**: Uses face-api.js to detect facial expressions
- **Audio Processing**: Uses the MediaRecorder API to capture audio
- **Transcription**: Simulates transcription (or uses OpenAI Whisper API with a key)
- **Summarization**: Simulates summarization (or uses OpenAI GPT API with a key)

## Customization

You can adjust the settings in `config.js` to change:

- Detection intervals
- Summarization timing
- Audio chunk size
- Model settings
- UI behavior

## Project Structure

- `index.html` - Main HTML structure
- `css/style.css` - Styling for the app
- `js/app.js` - Main application logic
- `js/emotion-detector.js` - Emotion detection module
- `js/audio-processor.js` - Audio recording and processing
- `js/config.js` - Configuration settings
- `js/face-api.min.js` - Face API library
- `models/` - Face detection models

## Notes

This demo is for local testing and educational purposes only. For a production application:

- Use secure API key management
- Implement proper error handling
- Add data persistence
- Optimize for performance
- Add more robust features like session recording 