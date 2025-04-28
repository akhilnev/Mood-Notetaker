/**
 * Audio Processor
 * Handles audio recording, transcription, and summarization
 */
class AudioProcessor {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    this.stream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingInterval = null;
    this.summarizationInterval = null;
    this.transcriptionBuffer = [];
    this.onStatusUpdate = null;
    this.onTranscriptUpdate = null;
    this.onSummaryUpdate = null;
    
    // Configuration
    this.chunkIntervalMs = config.transcriptionChunkMs || 5000;
    this.summarizationIntervalMs = config.summarizationIntervalMs || 20000;
    this.audioMimeType = null; // Will be determined during initialization
    this.processingChunks = false;
  }
  
  /**
   * Initialize audio processor
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Prioritize formats that are most compatible with Whisper API
      const mimeTypes = [
        'audio/wav',  // WAV is very reliable for transcription
        'audio/mp3',  // MP3 is well supported
        'audio/m4a',  // M4A is listed in OpenAI docs
        'audio/mp4',  // MP4 is listed in OpenAI docs
        'audio/webm', // Fallback to webm
        'audio/ogg'   // Last resort
      ];
      
      // Find the first supported MIME type
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          this.audioMimeType = type;
          console.log(`Audio Processor: Using MIME type ${type}`);
          break;
        }
      }
      
      if (!this.audioMimeType) {
        // If none of our preferred types are supported, try codec-specific types
        const codecTypes = [
          'audio/webm;codecs=opus',
          'audio/ogg;codecs=opus'
        ];
        
        for (const type of codecTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            this.audioMimeType = type;
            console.log(`Audio Processor: Using codec MIME type ${type}`);
            break;
          }
        }
      }
      
      if (!this.audioMimeType) {
        console.error('Audio Processor: No supported MIME type found');
        return false;
      }
      
      this.isInitialized = true;
      console.log('Audio Processor: Initialized');
      return true;
    } catch (error) {
      console.error('Audio Processor: Initialization failed', error);
      return false;
    }
  }
  
  /**
   * Start capturing audio
   * @param {Function} statusCallback - function to call with status updates
   * @param {Function} transcriptCallback - function to call with transcript updates
   * @param {Function} summaryCallback - function to call with summary updates
   */
  async start(statusCallback, transcriptCallback, summaryCallback) {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) return false;
    }
    
    if (this.isRunning) return true;
    
    this.onStatusUpdate = statusCallback;
    this.onTranscriptUpdate = transcriptCallback;
    this.onSummaryUpdate = summaryCallback;
    this.updateStatus('Requesting microphone access...');
    
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.updateStatus('Microphone access granted');
      
      // Create and set up MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.audioMimeType });
      
      // Handle data available events
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.processAudioChunk();
        }
      };
      
      // Start recording in chunks
      this.mediaRecorder.start(this.chunkIntervalMs);
      
      // Set up summarization timer
      this.startSummarizationTimer();
      
      this.isRunning = true;
      console.log('Audio Processor: Started recording');
      this.updateStatus('Recording audio...');
      
      return true;
    } catch (error) {
      console.error('Audio Processor: Failed to start', error);
      this.updateStatus('Failed to access microphone');
      return false;
    }
  }
  
  /**
   * Start the timer that triggers summarization at regular intervals
   */
  startSummarizationTimer() {
    if (this.summarizationInterval) {
      clearInterval(this.summarizationInterval);
    }
    
    this.summarizationInterval = setInterval(() => {
      if (this.isRunning && this.transcriptionBuffer.length > 0) {
        this.generateSummary();
      }
    }, this.summarizationIntervalMs);
  }
  
  /**
   * Process audio chunk for transcription
   */
  async processAudioChunk() {
    if (this.processingChunks || this.audioChunks.length === 0) return;
    
    this.processingChunks = true;
    
    try {
      // Determine which transcription service to use
      if (config.transcriptionService === "elevenlabs" && config.elevenLabsApiKey) {
        this.updateStatus('Transcribing audio with ElevenLabs...');
        await this.transcribeWithElevenLabs();
      } else if (config.openaiApiKey) {
        this.updateStatus('Transcribing audio with Whisper...');
        await this.transcribeWithWhisper();
      } else {
        this.simulateTranscription();
      }
    } catch (error) {
      console.error('Audio Processor: Transcription error', error);
      this.updateStatus('Transcription error: ' + error.message);
      // Fall back to simulation if API fails
      this.simulateTranscription();
    } finally {
      this.audioChunks = []; // Clear processed chunks
      this.processingChunks = false;
    }
  }
  
  /**
   * Simulate transcription for demo purposes
   */
  simulateTranscription() {
    // Simulate processing delay
    setTimeout(() => {
      // Demo transcription texts
      const demoTexts = [
        "I think we should focus on improving the user experience.",
        "The deadline for this project is next Friday.",
        "I'm concerned about the performance issues we're seeing.",
        "Let's schedule another meeting to discuss the details.",
        "I agree with that approach, it makes sense to proceed this way.",
        "We need to prioritize fixing the critical bugs before release.",
        "The new design looks much better than the previous version.",
        "I'm not sure if we have enough resources for this task.",
        "The client requested some changes to the homepage layout.",
        "We've made significant progress since our last meeting."
      ];
      
      // Select a random text
      const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
      
      // Add to transcription buffer
      this.transcriptionBuffer.push({
        text: randomText,
        timestamp: new Date().toISOString()
      });
      
      // Update transcript display
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(randomText);
      }
      
      this.updateStatus('Transcribed audio chunk');
    }, 1000);
  }
  
  /**
   * Transcribe audio using OpenAI Whisper API
   */
  async transcribeWithWhisper() {
    try {
      console.log(`----------------AUDIO TRANSCRIPTION----------------`);
      console.log(`Original MIME type: ${this.audioMimeType}`);
      console.log(`Chunks count: ${this.audioChunks.length}`);
      console.log(`--------------------------------------------------`);
      
      // Convert audio to a format that OpenAI can accept
      const simplifiedBlob = await this.convertToWavFormat(this.audioChunks);
      
      console.log(`Converted blob size: ${simplifiedBlob.size} bytes`);
      console.log(`Converted blob type: ${simplifiedBlob.type}`);
      
      // Create form data for the API request
      const formData = new FormData();
      
      // Add the file with explicit filename and WAV type
      formData.append('file', simplifiedBlob, 'audio.wav');
      
      // Try using a newer model which might be more format-tolerant
      formData.append('model', 'gpt-4o-mini-transcribe');
      
      // Make the API request
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: formData
      });
      
      // Check for non-OK response and log the error
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: { message: response.statusText } };
        }
        
        console.error('OpenAI API error details:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.text) {
        // Add to transcription buffer
        this.transcriptionBuffer.push({
          text: data.text,
          timestamp: new Date().toISOString()
        });
        
        // Update transcript display
        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate(data.text);
        }
        
        this.updateStatus('Transcribed audio');
        console.log('Transcription successful:', data.text.substring(0, 50) + '...');
      } else {
        throw new Error('No transcription returned from API');
      }
    } catch (error) {
      console.error('Transcription API error:', error);
      throw error;
    }
  }
  
  /**
   * Convert audio chunks to WAV format for ElevenLabs API
   * @param {Array} audioChunks - Array of audio chunks
   * @returns {Blob} - WAV format audio blob
   */
  async convertToWavFormat(audioChunks) {
    try {
      // If we already have WAV audio, just combine the chunks
      if (this.audioMimeType === 'audio/wav') {
        return new Blob(audioChunks, { type: 'audio/wav' });
      }
      
      // Otherwise, we need to convert using AudioContext
      // Combine audio chunks into a single Blob
      const audioBlob = new Blob(audioChunks, { type: this.audioMimeType });

      // Create a FileReader to read the blob as an ArrayBuffer
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Decode the audio data
            const audioBuffer = await audioContext.decodeAudioData(event.target.result);
            
            // Convert to WAV
            const wavBlob = this.audioBufferToWav(audioBuffer);
            
            resolve(wavBlob);
          } catch (error) {
            console.error('Error converting audio format:', error);
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading audio data'));
        };
        
        reader.readAsArrayBuffer(audioBlob);
      });
    } catch (error) {
      console.error('Error in convertToWavFormat:', error);
      // If conversion fails, return the original audio as a fallback
      return new Blob(audioChunks, { type: this.audioMimeType });
    }
  }
  
  /**
   * Convert AudioBuffer to WAV format
   * @param {AudioBuffer} audioBuffer - The audio buffer to convert
   * @returns {Blob} - WAV format audio blob
   */
  audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM format
    const bitDepth = 16; // 16-bit
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data
    const channelData = [];
    for (let channel = 0; channel < numChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }
    
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }
    
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  /**
   * Convert audio blob to WAV format (not currently used, but kept for future reference)
   * @param {Blob} audioBlob - The audio blob to convert
   * @returns {Promise<Blob>} - A promise that resolves to a WAV blob
   */
  async convertAudioToWav(audioBlob) {
    // This is a placeholder for a proper audio conversion if needed in the future
    // Proper audio conversion in the browser requires Web Audio API and is complex
    return audioBlob;
  }
  
  /**
   * Generate summary from transcriptions
   */
  async generateSummary() {
    if (this.transcriptionBuffer.length === 0) return;
    
    const transcriptionTexts = this.transcriptionBuffer.map(t => t.text).join(' ');
    
    if (transcriptionTexts.length < 50) return;
    
    this.updateStatus('Generating summary...');
    
    try {
      if (config.openaiApiKey) {
        await this.summarizeWithGPT(transcriptionTexts);
      } else {
        this.simulateSummary(transcriptionTexts);
      }
    } catch (error) {
      console.error('Audio Processor: Summarization error', error);
      this.updateStatus('Summary error: ' + error.message);
      // Fall back to simulation if API fails
      this.simulateSummary(transcriptionTexts);
    }
  }
  
  /**
   * Summarize transcriptions using OpenAI GPT API
   */
  async summarizeWithGPT(transcriptionText) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.models?.gpt || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes conversation transcripts concisely.'
            },
            {
              role: 'user',
              content: `Please summarize the following transcript in a single paragraph of no more than ${config.maxSummaryTokens || 200} tokens: ${transcriptionText}`
            }
          ],
          max_tokens: config.maxSummaryTokens || 200
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const summary = data.choices[0].message.content.trim();
        
        // Update summary display
        if (this.onSummaryUpdate) {
          this.onSummaryUpdate(summary);
        }
        
        // Clear transcription buffer after summarization
        this.transcriptionBuffer = [];
        
        this.updateStatus('Summary generated');
      } else {
        throw new Error('No summary returned from API');
      }
    } catch (error) {
      console.error('GPT API error:', error);
      throw error;
    }
  }
  
  /**
   * Simulate summary generation for demo purposes
   */
  simulateSummary(transcriptionText) {
    // Simulate processing delay
    setTimeout(() => {
      // Demo summaries
      const demoSummaries = [
        "The team discussed UI improvements and set a deadline for next Friday.",
        "There are concerns about performance issues that need to be addressed.",
        "Progress was made on the project, but resource constraints were mentioned.",
        "The team agreed on a new approach and prioritized fixing critical bugs.",
        "Client requested homepage changes, and the team reviewed the new design."
      ];
      
      // Select a random summary
      const randomSummary = demoSummaries[Math.floor(Math.random() * demoSummaries.length)];
      
      // Update summary display
      if (this.onSummaryUpdate) {
        this.onSummaryUpdate(randomSummary);
      }
      
      // Clear transcription buffer after summarization (in real app, 
      // you might want to keep a longer history)
      this.transcriptionBuffer = [];
      
      this.updateStatus('Summary generated');
    }, 2000);
  }
  
  /**
   * Update status via callback if available
   * @param {string} status - status message
   */
  updateStatus(status) {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(status);
    }
  }
  
  /**
   * Stop audio processing and release resources
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Stop and release stream tracks
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clear intervals
    if (this.summarizationInterval) {
      clearInterval(this.summarizationInterval);
      this.summarizationInterval = null;
    }
    
    // Process any remaining audio and generate final summary
    if (this.audioChunks.length > 0) {
      this.processAudioChunk();
    }
    
    if (this.transcriptionBuffer.length > 0) {
      this.generateSummary();
    }
    
    // Clear data
    this.audioChunks = [];
    this.mediaRecorder = null;
    
    console.log('Audio Processor: Stopped');
    this.updateStatus('Audio recording stopped');
  }
  
  /**
   * Transcribe audio using ElevenLabs Speech-to-Text API
   */
  async transcribeWithElevenLabs() {
    try {
      console.log(`----------------ELEVENLABS TRANSCRIPTION----------------`);
      console.log(`Original MIME type: ${this.audioMimeType}`);
      console.log(`Chunks count: ${this.audioChunks.length}`);
      console.log(`------------------------------------------------------`);
      
      // Convert audio to a format that ElevenLabs can accept
      const audioBlob = await this.convertToWavFormat(this.audioChunks);
      
      console.log(`Converted blob size: ${audioBlob.size} bytes`);
      console.log(`Converted blob type: ${audioBlob.type}`);
      
      // Create form data for the API request
      const formData = new FormData();
      
      // Add the file
      formData.append('audio', audioBlob, 'audio.wav');
      
      // Add the model if provided in config
      if (config.elevenLabsModel) {
        formData.append('model_id', config.elevenLabsModel);
      }
      
      // Make the API request to ElevenLabs
      const response = await fetch(config.elevenLabsEndpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenLabsApiKey
        },
        body: formData
      });
      
      // Check for non-OK response and log the error
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { detail: response.statusText };
        }
        
        console.error('ElevenLabs API error details:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.detail || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.text) {
        // Add to transcription buffer
        this.transcriptionBuffer.push({
          text: data.text,
          timestamp: new Date().toISOString()
        });
        
        // Update transcript display
        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate(data.text);
        }
        
        this.updateStatus('Transcribed audio with ElevenLabs');
        console.log('ElevenLabs transcription successful:', data.text.substring(0, 50) + '...');
      } else {
        throw new Error('No transcription returned from ElevenLabs API');
      }
    } catch (error) {
      console.error('ElevenLabs Transcription API error:', error);
      throw error;
    }
  }
} 
