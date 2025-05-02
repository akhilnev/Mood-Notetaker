# Mood Notetaker Simple Demo

A sophisticated AI-powered application for real-time emotion analysis, speech transcription, and content summarization. This browser-based tool processes facial expressions and speech simultaneously to provide immediate feedback on emotional states while creating intelligent transcripts and summaries.

## Features

- **Real-time Emotion Detection**: Advanced facial expression analysis using TensorFlow.js and face-api.js
- **Live Speech Transcription**: Accurate speech-to-text conversion with interim results
- **Intelligent Content Summarization**: AI-generated summaries of spoken content
- **Sleek, Modern Interface**: Minimalist black and white design with translucent elements
- **Export Session**: Download session data (emotions, transcript, summary) as a formatted Markdown file
- **Speaker Notes Uploader**: Upload and display PDF, DOCX, and TXT files as reference materials
- **Emotion-Aware Nudges**: Smart suggestions based on detected emotional patterns
- **Text Highlighting**: Visual emphasis on recently spoken words in the transcript
- **Responsive Layout**: Adapts seamlessly to different screen sizes and orientations
- **High-Resolution Video Processing**: Optimized for HD webcam streams
- **Smooth Animations**: Elegant transitions and feedback animations
- **Native Browser Support**: No plugins or extensions required

## Architecture Overview

### Core Components

1. **Frontend UI (View Layer)**
   - HTML structure with responsive CSS styling
   - Modular component design for display panels
   - Adaptive layout with elegant glass-morphism effects

2. **Application Controller**
   - Main app.js script orchestrates all components
   - State management for application lifecycle
   - Event handling system for user interactions

3. **ML Processing Modules**
   - Emotion detection engine using neural networks
   - Audio processing pipeline for speech recognition
   - Natural language processing for summarization

4. **Feature Modules**
   - Export functionality for session data
   - Document parsing for speaker notes
   - Emotion-based guidance system
   - Dynamic text highlighting

### Workflow

1. **Initialization**
   - Load required libraries and neural network models
   - Set up canvas elements and video containers
   - Initialize configuration parameters

2. **Data Acquisition**
   - Camera stream capture and video processing
   - Audio stream capture via browser APIs
   - Data normalization for ML processing

3. **Processing Pipeline**
   - Real-time video frame analysis for emotion detection
   - Speech-to-text conversion of audio stream
   - Content analysis and summary generation

4. **Output Rendering**
   - Dynamic UI updates with detected emotions
   - Live transcript display with highlighting
   - Progressive summary generation and display

## Technical Implementation

### Emotion Detection

The emotion detection system leverages a combination of convolutional neural networks to:

1. Detect faces within the video stream
2. Identify facial landmarks (68 key points)
3. Extract features relevant to emotional expressions
4. Classify emotions into 7 categories:
   - Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral

The system is optimized for performance, running inference on the client-side browser without requiring server-round trips, enabling real-time feedback.

### Audio Processing

The audio pipeline includes:

1. **Audio Capture**: Using MediaRecorder API for high-quality audio
2. **Stream Processing**: Chunking audio data for efficient processing
3. **Speech Recognition**: Converting speech to text in real-time
4. **Text Analysis**: Processing and formatting transcript data

The system is designed to handle continuous audio streams with dynamic adaptation to different speech patterns and environments.

### UI Implementation

The user interface follows modern design principles:

1. **Minimalist Aesthetic**: Clean black and white theme with subtle gray accents
2. **Glass-morphism**: Translucent overlay panels with subtle blur effects
3. **Responsive Layout**: Adapts to different screen sizes and orientations
4. **Dynamic Feedback**: Visual indicators of system status and processing
5. **Accessibility Considerations**: Contrast ratios and readability optimizations

## Project Structure

```
simple-demo/
├── index.html               # Main application HTML
├── css/
│   └── style.css            # Styling and animations
├── js/
│   ├── app.js               # Main application controller
│   ├── emotion-detector.js  # Facial emotion analysis module
│   ├── audio-processor.js   # Speech processing module
│   ├── exporter.js          # Session data export module
│   ├── notes-uploader.js    # Speaker notes document parser
│   ├── nudge-engine.js      # Emotion-aware guidance system
│   ├── text-highlighter.js  # Transcript highlighting module
│   ├── config.js            # Application configuration
│   ├── face-api.min.js      # Face detection library
│   └── lib/
│       └── recorder.js      # Audio recording utilities
└── models/                  # Neural network model files
    ├── face_expression_model-weights_manifest.json
    ├── face_landmark_68_model-weights_manifest.json
    ├── face_landmark_68_tiny_model-weights_manifest.json
    ├── face_recognition_model-weights_manifest.json
    ├── ssd_mobilenetv1_model-weights_manifest.json
    └── tiny_face_detector_model-weights_manifest.json
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Machine Learning**: TensorFlow.js, face-api.js
- **Audio Processing**: Web Audio API, MediaRecorder API
- **Document Parsing**: PDF.js for PDF, Mammoth.js for DOCX
- **Speech Recognition**: Browser Speech API (with OpenAI Whisper API option)
- **Natural Language Processing**: Text analysis for summarization (with OpenAI GPT API option)

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Webcam for emotion detection
- Microphone for audio recording
- Local development server

### Setting Up a Local Server

#### Using Python:

```bash
# Navigate to the simple-demo directory and run:
python -m http.server 8000
```

Then open your browser and go to `http://localhost:8000`

#### Using Node.js:

```bash
# Install the http-server package:
npm install -g http-server

# Then navigate to the simple-demo directory and run:
http-server
```

## Using the Application

1. **Start a Session**: Click the "Start Session" button in the header
2. **Grant Permissions**: Allow access to your camera and microphone when prompted
3. **Interact Naturally**: Speak while facing the camera
4. **View Real-time Analysis**:
   - The right panel shows your detected emotions
   - Live transcription appears as you speak
   - Summaries are generated automatically
5. **Upload Speaker Notes**: Use the uploader in the left panel to add PDF, DOCX, or TXT files
6. **See Contextual Nudges**: Receive helpful suggestions based on your emotional patterns
7. **Export Your Session**: Click the "Export Session" button to download a Markdown file with all data
8. **End Session**: Click "End Session" when finished

## Advanced Configuration

The system can be customized via the `config.js` file:

- **Emotion Detection**: Adjust confidence thresholds and update frequency
- **Audio Processing**: Configure sample rates and processing intervals
- **Transcription**: Set transcription parameters and chunk sizes
- **Summarization**: Adjust summary generation timing and content length
- **UI Behavior**: Customize animations and visual feedback settings

## API Integration (Optional)

For enhanced capabilities:

1. **OpenAI API Integration**:
   - Obtain an API key from OpenAI
   - Add your API key to the `config.js` file
   - Enable advanced transcription with Whisper API
   - Enable more sophisticated summarization with GPT API

2. **ElevenLabs API Integration**:
   - Obtain an API key from ElevenLabs
   - Add your API key to the `config.js` file
   - Enable high-quality speech-to-text conversion

## Performance Considerations

- The application performs best on devices with:
  - Modern CPU/GPU for neural network inference
  - Sufficient RAM (4GB+ recommended)
  - Stable internet connection (if using API features)

## Future Enhancements

- **Sentiment Analysis**: Enhanced emotion tracking with sentiment scoring
- **Multi-language Support**: Transcription and UI in multiple languages
- **Data Visualization**: Charts and graphs of emotional patterns
- **Session Recording**: Save and replay sessions with synchronized data
- **Collaboration Features**: Shared sessions for remote participants

## License

This project is intended for educational and demonstration purposes.

---

*Mood Notetaker – Capturing emotions and ideas with AI-powered precision* 