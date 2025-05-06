# Mood Notetaker | Emotion AI : Talk to me Buddy Simple Demo

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
- **Dual Mode Operation**: Switch between Practice Speaking and Mock Interview modes
- **AI-Powered Mock Interviews**: Conduct realistic interview simulations with an AI interviewer
- **Comprehensive Interview Reports**: Generate detailed evaluation reports with feedback and recommendations
- **Full Conversation Capture**: Record and analyze both user and AI responses in chronological order
- **Emotion-Timeline Analysis**: Track emotional patterns throughout the session
- **Interview Configuration**: Customize interview parameters (role, company, duration, focus areas)
- **ES Module Architecture**: Modern JavaScript module system for better code organization

## Architecture Overview

### Core Components

1. **Frontend UI (View Layer)**
   - HTML structure with responsive CSS styling
   - Modular component design for display panels
   - Adaptive layout with elegant glass-morphism effects
   - Mode toggle between Practice Speaking and Mock Interview

2. **Application Controller**
   - Main app.js script orchestrates all components
   - State management for application lifecycle
   - Event handling system for user interactions
   - Mode-specific initialization and processing

3. **ML Processing Modules**
   - Emotion detection engine using neural networks
   - Audio processing pipeline for speech recognition
   - Natural language processing for summarization
   - Full transcript collection and analysis

4. **Feature Modules**
   - Export functionality for session data
   - Document parsing for speaker notes
   - Emotion-based guidance system
   - Dynamic text highlighting
   - Interview agent integration with ElevenLabs
   - Report generation with OpenAI

### Workflow

1. **Initialization**
   - Load required libraries and neural network models
   - Set up canvas elements and video containers
   - Initialize configuration parameters
   - Determine operating mode (Practice or Interview)

2. **Data Acquisition**
   - Camera stream capture and video processing
   - Audio stream capture via browser APIs
   - Data normalization for ML processing
   - Synchronized capture of both user and AI responses in interview mode

3. **Processing Pipeline**
   - Real-time video frame analysis for emotion detection
   - Speech-to-text conversion of audio stream
   - Content analysis and summary generation
   - Comprehensive transcript collection and formatting

4. **Output Rendering**
   - Dynamic UI updates with detected emotions
   - Live transcript display with highlighting
   - Progressive summary generation and display
   - Post-session report generation for interviews

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
5. **Full Transcript Collection**: Storing complete conversation history with timestamps

The system is designed to handle continuous audio streams with dynamic adaptation to different speech patterns and environments.

### Interview System

The mock interview functionality includes:

1. **AI Interviewer**: Integration with ElevenLabs Conversation API
2. **Interview Configuration**: Customizable parameters for role, company, and topics
3. **Synchronized Transcript**: Capture both interviewer and candidate responses
4. **Comprehensive Evaluation**: AI-powered assessment of interview performance
5. **Detailed Reports**: Formatted feedback with strengths and areas for improvement

### Report Generation

The report generation system utilizes:

1. **OpenAI Integration**: Using GPT models for intelligent evaluation
2. **Structured Analysis**: Assessment of communication, content, and overall impression
3. **Action-Oriented Feedback**: Specific recommendations for improvement
4. **Professional Formatting**: Clean, well-organized report presentation
5. **Timeline Integration**: Correlation between emotional states and responses

### UI Implementation

The user interface follows modern design principles:

1. **Minimalist Aesthetic**: Clean black and white theme with subtle gray accents
2. **Glass-morphism**: Translucent overlay panels with subtle blur effects
3. **Responsive Layout**: Adapts to different screen sizes and orientations
4. **Dynamic Feedback**: Visual indicators of system status and processing
5. **Accessibility Considerations**: Contrast ratios and readability optimizations
6. **Mode-Specific UI**: Tailored interface elements for each operational mode

## Project Structure

```
simple-demo/
├── index.html               # Main application HTML
├── vite.config.js           # Vite bundler configuration
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
│   ├── index.js             # Module entry point and global exports
│   ├── interview-agent.js   # AI interviewer integration
│   ├── interview-setup.js   # Interview configuration handling
│   ├── report-generator.js  # Interview evaluation with OpenAI
│   ├── report-renderer.js   # Report display and formatting
│   └── lib/
│       ├── face-api.min.js  # Face detection library
│       └── recorder.js      # Audio recording utilities
├── models/                  # Neural network model files
│   ├── face_expression_model-weights_manifest.json
│   ├── face_landmark_68_model-weights_manifest.json
│   ├── face_landmark_68_tiny_model-weights_manifest.json
│   ├── face_recognition_model-weights_manifest.json
│   ├── ssd_mobilenetv1_model-weights_manifest.json
│   └── tiny_face_detector_model-weights_manifest.json
└── test/                    # Test files and fixtures
    └── feature-tests/       # Feature-specific test modules
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Machine Learning**: TensorFlow.js, face-api.js
- **Audio Processing**: Web Audio API, MediaRecorder API
- **Document Parsing**: PDF.js for PDF, Mammoth.js for DOCX
- **Speech Recognition**: Browser Speech API with ElevenLabs integration
- **Natural Language Processing**: OpenAI GPT API for summarization and evaluation
- **Module System**: ES Modules with optional Vite bundling
- **Conversational AI**: ElevenLabs Conversation API for interview simulation
- **Report Generation**: OpenAI GPT for interview assessment and feedback

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Webcam for emotion detection
- Microphone for audio recording
- Local development server
- API keys for enhanced features (optional)

### Setting Up a Local Server

#### Using Vite (for module bundling): ( Recommended )

```bash
# Install dependencies:
npm install

# Start development server:
npm run dev
```

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

### Practice Speaking Mode

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

### Mock Interview Mode

1. **Select Interview Mode**: Click the "Mock Interview" toggle in the header
2. **Configure Interview**: Fill in the form with:
   - Position/Role you're applying for
   - Company name
   - Interview duration
   - Focus areas for questions
   - Relevant resource links (optional)
3. **Start Interview**: Click "Start Interview" to begin the session
4. **Conduct Interview**: 
   - The AI interviewer will ask questions relevant to your role
   - Respond naturally through your microphone
   - Your responses and emotions are tracked in real-time
5. **End Interview**: Click "End Session" when the interview is complete
6. **Review Evaluation**: A comprehensive report will be generated with:
   - Overall impression and score
   - Content analysis of your answers
   - Communication style assessment
   - Key strengths identified
   - Areas for improvement
   - Recommended next steps

## Advanced Configuration

The system can be customized via the `config.js` file:

- **Emotion Detection**: Adjust confidence thresholds and update frequency
- **Audio Processing**: Configure sample rates and processing intervals
- **Transcription**: Set transcription parameters and chunk sizes
- **Summarization**: Adjust summary generation timing and content length
- **UI Behavior**: Customize animations and visual feedback settings
- **Interview Settings**: Default duration, model selection, and evaluation parameters

## API Integration

For enhanced capabilities:

1. **OpenAI API Integration**:
   - Obtain an API key from OpenAI
   - Add your API key to the `config.js` file
   - Enable advanced transcription with Whisper API
   - Enable more sophisticated summarization with GPT API
   - Unlock comprehensive interview evaluation reports

2. **ElevenLabs API Integration**:
   - Obtain an API key from ElevenLabs
   - Add your API key to the `config.js` file
   - Enable high-quality speech-to-text conversion
   - Access realistic AI interviewer voices and conversation abilities

## Performance Considerations

- The application performs best on devices with:
  - Modern CPU/GPU for neural network inference
  - Sufficient RAM (4GB+ recommended)
  - Stable internet connection (if using API features)
  - Modern browser with ES modules support

## Future Enhancements

- **Sentiment Analysis**: Enhanced emotion tracking with sentiment scoring
- **Multi-language Support**: Transcription and UI in multiple languages
- **Data Visualization**: Charts and graphs of emotional patterns
- **Session Recording**: Save and replay sessions with synchronized data
- **Collaboration Features**: Shared sessions for remote participants
- **Interview Templates**: Pre-configured interview scenarios for various industries
- **Personalized Coaching**: AI-driven interview improvement suggestions
- **Integration with ATS**: Applicant tracking system analysis compatibility

## License

This project is intended for educational and demonstration purposes.

---

*Mood Notetaker – Capturing emotions and ideas with AI-powered precision* 