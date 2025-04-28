/**
 * Audio Processor
 * Handles audio recording, transcription, and summarization
 */
class AudioProcessor {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    this.stream = null;
    this.recorder = null; // Recorder.js instance instead of MediaRecorder
    this.audioContext = null;
    this.transcriptionBuffer = [];
    this.onStatusUpdate = null;
    this.onTranscriptUpdate = null;
    this.onSummaryUpdate = null;
    this.chunkIntervalMs = config.transcriptionChunkMs || 5000;
    this.summarizationIntervalMs = config.summarizationIntervalMs || 20000;
    this.processingChunks = false;
    this.summarizationTimer = null;
    this.recordingTimer = null;
  }
  
  /**
   * Initialize audio processor
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    // Create audio context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isInitialized = true;
    return true;
  }
  
  /**
   * Start capturing audio
   * @param {Function} statusCallback - function to call with status updates
   * @param {Function} transcriptCallback - function to call with transcript updates
   * @param {Function} summaryCallback - function to call with summary updates
   */
  async start(statusCallback, transcriptCallback, summaryCallback) {
    if (!this.isInitialized) await this.initialize();
    if (this.isRunning) return true;
    
    this.onStatusUpdate = statusCallback;
    this.onTranscriptUpdate = transcriptCallback;
    this.onSummaryUpdate = summaryCallback;
    this.updateStatus('Requesting microphone access...');
    
    try {
      // Get access to the microphone
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a audio source from the stream
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Set up Recorder.js
      console.log('Creating Recorder.js instance with source');
      this.recorder = new Recorder(source, {
        workerPath: 'js/lib/recorderWorker.js',
        numChannels: 1 // Mono is better for speech recognition
      });
      
      // Start recording
      this.recorder.record();
      
      // Set up interval to chunk recordings
      this.recordingTimer = setInterval(() => {
        this.processAudioChunk();
      }, this.chunkIntervalMs);
      
      // Start summarization timer
      this.startSummarizationTimer();
      
      this.isRunning = true;
      this.updateStatus('Recording audio...');
      
      return true;
    } catch (error) {
      console.error('Failed to start audio processor:', error);
      this.updateStatus('Failed to access microphone');
      return false;
    }
  }
  
  /**
   * Start the timer that triggers summarization at regular intervals
   */
  startSummarizationTimer() {
    if (this.summarizationTimer) clearInterval(this.summarizationTimer);
    this.summarizationTimer = setInterval(() => {
      if (this.transcriptionBuffer.length > 0) this.generateSummary();
    }, this.summarizationIntervalMs);
  }
  
  /**
   * Process audio chunk for transcription
   */
  async processAudioChunk() {
    if (this.processingChunks || !this.isRunning) return;
    this.processingChunks = true;
    console.log('Processing audio chunk...');
    
    try {
      // Temporarily stop recording to get current chunk
      this.recorder.stop();
      
      // Export to WAV and transcribe
      this.recorder.exportWAV(async (wavBlob) => {
        try {
          // Send to ElevenLabs for transcription
          await this.transcribeWithElevenLabs(wavBlob);
        } catch (error) {
          console.error('Transcription error:', error);
          this.updateStatus('Transcription error: ' + error.message);
        } finally {
          // Clear the recording and start a new one
          this.recorder.clear();
          if (this.isRunning) {
            this.recorder.record();
          }
          this.processingChunks = false;
        }
      }, 'audio/wav');
      
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      this.updateStatus('Error processing audio: ' + error.message);
      this.processingChunks = false;
      // Restart recording for next chunk
      if (this.isRunning) {
        this.recorder.record();
      }
    }
  }
  
  /**
   * Transcribe audio using ElevenLabs Speech-to-Text API
   */
  async transcribeWithElevenLabs(wavBlob) {
    if (!config.elevenLabsApiKey) throw new Error('No ElevenLabs API key set');
    console.log('Calling ElevenLabs API with WAV blob of size:', wavBlob.size);
    
    const formData = new FormData();
    // Required by ElevenLabs API: model_id and file
    formData.append('model_id', 'scribe_v1');
    formData.append('file', wavBlob, 'audio.wav');
    
    const response = await fetch(config.elevenLabsEndpoint, {
      method: 'POST',
      headers: { 'xi-api-key': config.elevenLabsApiKey },
      body: formData
    });
    
    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); } catch { errorData = {}; }
      console.error('ElevenLabs API error:', errorData);
      throw new Error(errorData.detail || response.statusText);
    }
    
    const data = await response.json();
    if (data.text) {
      this.transcriptionBuffer.push({ text: data.text, timestamp: new Date().toISOString() });
      if (this.onTranscriptUpdate) this.onTranscriptUpdate(data.text);
      this.updateStatus('Transcribed audio with ElevenLabs');
    } else {
      throw new Error('No transcription returned from ElevenLabs API');
    }
  }
  
  /**
   * Generate summary from transcriptions
   */
  async generateSummary() {
    const transcriptionText = this.transcriptionBuffer.map(t => t.text).join(' ');
    if (!transcriptionText || transcriptionText.length < 50) return;
    this.updateStatus('Generating summary...');
    try {
      if (config.openaiApiKey) {
        const summary = await this.summarizeWithOpenAI(transcriptionText);
        if (this.onSummaryUpdate) this.onSummaryUpdate(summary);
        this.transcriptionBuffer = [];
        this.updateStatus('Summary generated');
      } else {
        this.updateStatus('No OpenAI API key for summarization');
      }
    } catch (error) {
      this.updateStatus('Summary error: ' + error.message);
    }
  }
  
  /**
   * Summarize transcriptions using OpenAI GPT API
   */
  async summarizeWithOpenAI(transcriptionText) {
    const response = await fetch(config.openaiEndpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that summarizes conversation transcripts concisely.' },
          { role: 'user', content: `Please summarize the following transcript in a single paragraph of no more than ${config.maxSummaryTokens} tokens: ${transcriptionText}` }
        ],
        max_tokens: config.maxSummaryTokens
      })
    });
    
    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); } catch { errorData = {}; }
      throw new Error(errorData.error?.message || response.statusText);
    }
    
    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('No summary returned from OpenAI');
    }
  }
  
  /**
   * Update status via callback if available
   * @param {string} status - status message
   */
  updateStatus(status) {
    if (this.onStatusUpdate) this.onStatusUpdate(status);
  }
  
  /**
   * Stop audio processing and release resources
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Stop recording
    if (this.recorder) {
      this.recorder.stop();
    }
    
    // Clear recording timer
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Stop and release stream tracks
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clear intervals
    if (this.summarizationTimer) {
      clearInterval(this.summarizationTimer);
      this.summarizationTimer = null;
    }
    
    // Process any remaining audio
    if (this.recorder) {
      this.recorder.exportWAV(async (wavBlob) => {
        try {
          await this.transcribeWithElevenLabs(wavBlob);
        } catch (error) {
          console.error('Error transcribing final chunk:', error);
        }
        this.recorder.clear();
      });
    }
    
    // Generate a final summary if needed
    if (this.transcriptionBuffer.length > 0) {
      this.generateSummary();
    }
    
    console.log('Audio Processor: Stopped');
    this.updateStatus('Audio recording stopped');
  }
} 
