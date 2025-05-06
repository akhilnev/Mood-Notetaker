/**
 * Interview Agent Module for Mood Notetaker
 * Handles creating and interacting with ElevenLabs interview agent
 * 
 * Uses ElevenLabs JavaScript SDK for WebSocket communication
 * while maintaining custom agent creation logic.
 */

import { Conversation } from '@11labs/client';
import config from './config.js';

// State for the interview agent
const interviewAgentState = {
  agentId: null,
  voiceId: null,
  conversation: null,
  isConnected: false,
  interviewConfig: null
};

/**
 * Ensure a voice exists or create a new one for the interviewer
 * @param {string} role The role for the interview
 * @param {string} company The company for the interview
 * @returns {Promise<string>} The voice ID
 */
async function ensureVoice(role, company) {
  console.log(`Setting up voice for ${role} at ${company}`);
  
  // Use a default ElevenLabs voice ID
  // List of default voice IDs from ElevenLabs
  const defaultVoices = [
    '21m00Tcm4TlvDq8ikWAM', // Adam - male
    'AZnzlk1XvdvUeBnXmlld', // Domi - female
    'EXAVITQu4vr4xnSDxMaL', // Bella - female
    'ErXwobaYiN019PkySvjV', // Antoni - male
    'MF3mGyEYCl7XYWbV9V6O', // Elli - female
    'TxGEqnHWrfWFTfGW9XjX'  // Josh - male
  ];
  
  // Select a random voice from the default list
  const voiceId = defaultVoices[Math.floor(Math.random() * defaultVoices.length)];
  
  console.log(`Using default ElevenLabs voice ID: ${voiceId}`);
  return voiceId;
}

/**
 * Create an interview agent
 * @param {Object} cfg The interview configuration
 * @param {string} voice_id The voice ID to use
 * @returns {Promise<string>} The agent ID
 */
async function createInterviewAgent(cfg, voice_id) {
  console.log('Creating interview agent');
  
  // Check if API key is configured
  if (!config.elevenLabsApiKey) {
    console.warn('ElevenLabs API key not configured in config.js - using mock agent');
    return 'mock_agent_123456';
  }
  
  try {
    // Prepare the request body following ElevenLabs API structure exactly
    // This structure is based on the ElevenLabs API documentation
    const body = {
      name: `${cfg.company} Interviewer`,
      conversation_config: {
        agent: {
          first_message: `Let's begin your ${cfg.role} interview at ${cfg.company}.`,
        prompt: {
          prompt: `You are a tough but fair interviewer for a ${cfg.role} role at ${cfg.company}.
Ask concise questions focused on: ${cfg.focus}. 
Reference these links when relevant: ${cfg.links.join(', ')}.
Warn the candidate when 20% of the time remains, and end exactly at ${cfg.duration} seconds.`,
          llm: "gpt-4o-mini"
        },
        conversation: {
          max_duration_seconds: cfg.duration
        }
      },
      tts: {
        voice_id: voice_id
      }
      }
    };
    
    console.log('Sending agent creation request with voice ID:', voice_id);
    
    // Make the API request
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenLabsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Agent creation failed:', errorText);
      throw new Error(`Failed to create agent: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    if (!data.agent_id) {
      throw new Error('No agent ID returned from ElevenLabs API');
    }
    
    console.log(`Created new agent ID: ${data.agent_id}`);
    return data.agent_id;
  } catch (error) {
    console.error('Error creating agent:', error);
    // For testing without API, return a mock agent ID
    return 'mock_agent_123456';
  }
}

/**
 * Connect to an interview agent
 * @param {string} agentId The agent ID to connect to
 */
async function connectToAgent(agentId) {
  console.log(`Connecting to agent: ${agentId}`);
  
  try {
    // Update transcript to show connection is being established
    if (typeof updateTranscript === 'function') {
      updateTranscript('[System]: Connecting to interview agent. Please wait...');
    }
    
    // Request microphone access first (as shown in the template)
    await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Start the conversation with the agent ID - using the Conversation directly 
    const conversation = await Conversation.startSession({
      agentId: agentId,
      onConnect: () => {
        console.log('Connected to agent');
        interviewAgentState.isConnected = true;
        if (typeof updateStatus === 'function') {
          updateStatus('Connected to interview agent');
        }
      },
      onDisconnect: () => {
        console.log('Disconnected from agent');
        interviewAgentState.isConnected = false;
        if (typeof updateStatus === 'function') {
          updateStatus('Disconnected from interview agent');
        }
      },
      onMessage: (message) => {
        console.log('Received message:', message);
        if (message && message.text) {
          updateTranscript(`[Interviewer]: ${message.text}`);
        }
      },
      onError: (error) => {
        console.error('Conversation error:', error);
        updateTranscript(`[System Error]: ${error.message || 'Connection error'}`);
      },
      onStatusChange: (status) => {
        console.log('Status changed:', status);
      },
      onModeChange: (mode) => {
        console.log('Mode changed:', mode);
        
        // Update UI based on agent mode
        const agentStatus = document.getElementById('agentStatus');
        if (agentStatus) {
          agentStatus.classList.toggle('active', mode === 'speaking');
        }
        
        // Update agent status text
        const agentStatusText = document.getElementById('agentStatusText');
        if (agentStatusText) {
          agentStatusText.textContent = mode === 'speaking' ? 'Interviewer is speaking...' : 'Interviewer is listening...';
        }
        
        // Make visualizer pulse when agent speaks
        const visualizerContainer = document.getElementById('visualizer-container');
        if (visualizerContainer) {
          visualizerContainer.classList.toggle('pulse-animation', mode === 'speaking');
        }
      }
    });
    
    // Store the conversation in state
    interviewAgentState.conversation = conversation;
    interviewAgentState.isConnected = true;
    
    // Update transcript
    updateTranscript('[System]: Interview is starting. The interviewer will speak shortly.');
    
    return conversation;
  } catch (error) {
    console.error('Error connecting to agent:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Show error in transcript
    if (typeof updateTranscript === 'function') {
      updateTranscript(`[System Error]: Failed to connect: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Verify that the agent ID is valid
 * @param {string} agentId The agent ID to verify
 * @returns {Promise<boolean>} Whether the agent ID is valid
 */
async function verifyAgentId(agentId) {
  if (!config.elevenLabsApiKey) {
    console.warn('No API key configured - skipping agent verification');
    return true;
  }
  
  if (agentId === 'mock_agent_123456') {
    console.log('Using mock agent - skipping verification');
    return true;
  }
  
  console.log(`Verifying agent ID: ${agentId}`);
  
  try {
    // Make API request to check the agent
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': config.elevenLabsApiKey
      }
    });
    
    if (!response.ok) {
      console.error(`Agent verification failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Agent verification successful:', data);
    return true;
  } catch (error) {
    console.error('Error verifying agent:', error);
    return false;
  }
}

/**
 * Verify the API key is valid
 * @returns {Promise<boolean>} Whether the API key is valid
 */
async function verifyApiKey() {
  if (!config.elevenLabsApiKey) {
    console.warn('No API key configured');
    return false;
  }
  
  try {
    console.log('Verifying API key validity');
    
    // Make a simple request to check if the API key is valid
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': config.elevenLabsApiKey
      }
    });
    
    if (!response.ok) {
      console.error(`API key validation failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('API key is valid, user info:', data.subscription?.tier || 'unknown tier');
    return true;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}

/**
 * Start the interview agent
 * @param {Object} config The interview configuration
 * @param {Function} statusCallback Function to call with status updates
 * @param {Function} transcriptCallback Function to call with transcript updates
 * @param {Function} summaryCallback Function to call with summary updates
 */
async function startInterviewAgent(config, statusCallback, transcriptCallback, summaryCallback) {
  // Store the callbacks for later use
  window.updateStatus = statusCallback;
  window.updateTranscript = transcriptCallback;
  window.updateSummary = summaryCallback;
  
  try {
    // Update status
    updateStatus('Setting up interview agent...');
    
    // Store the config
    interviewAgentState.interviewConfig = config;
    
    // Verify API key validity
    updateStatus('Verifying API key...');
    const isApiKeyValid = await verifyApiKey();
    
    if (!isApiKeyValid && config.elevenLabsApiKey) {
      updateStatus('API key verification failed. Check your API key in config.js');
      updateTranscript('[System Error]: API key verification failed. Please check your API key in config.js');
      return false;
    }
    
    // Create or get a voice for the interviewer
    updateStatus('Setting up interviewer voice...');
    try {
      const voiceId = await ensureVoice(config.role, config.company);
      interviewAgentState.voiceId = voiceId;
    } catch (voiceError) {
      console.error('Voice setup error:', voiceError);
      updateStatus(`Voice setup error: ${voiceError.message}. Using fallback voice.`);
      // Use a default voice ID if voice creation fails
      interviewAgentState.voiceId = '21m00Tcm4TlvDq8ikWAM'; // Adam voice
    }
    
    // Create the interview agent
    updateStatus('Creating interview agent...');
    try {
      const agentId = await createInterviewAgent(config, interviewAgentState.voiceId);
      interviewAgentState.agentId = agentId;
      
      // Verify the agent was created successfully
      updateStatus('Verifying agent creation...');
      const isValid = await verifyAgentId(agentId);
      
      if (!isValid && agentId !== 'mock_agent_123456') {
        throw new Error('Agent verification failed');
      }
      
      // Connect to the agent
      updateStatus('Connecting to interview agent...');
      await connectToAgent(agentId);
      
      // Initialize the visualizer if available
      if (typeof initVisualizer === 'function') {
        updateStatus('Initializing visualizer...');
        const visualizer = initVisualizer();
        if (visualizer) {
          console.log('Visualizer initialized successfully');
        } else {
          console.warn('Visualizer initialization returned null');
        }
      }
      
      // Update status
      updateStatus('Interview started');
      updateTranscript('[System]: Interview started. Speak clearly when responding to questions.');
      
      return true;
    } catch (agentError) {
      console.error('Agent creation error:', agentError);
      updateStatus(`Interview agent error: ${agentError.message}. Please check your API key in config.js`);
      
      // If it's a mock agent (when no API key), show a helpful message
      if (interviewAgentState.agentId === 'mock_agent_123456') {
        updateTranscript('[System]: Running in mock mode. To use the real interview agent, add your ElevenLabs API key to config.js');
        updateSummary('This is a simulated interview. The full agent experience requires an ElevenLabs API key.');
        return true; // Return true to continue in mock mode
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error starting interview agent:', error);
    updateStatus(`Error starting interview: ${error.message}`);
    return false;
  }
}

/**
 * Stop the interview agent
 */
async function stopInterviewAgent() {
  console.log('Stopping interview agent');
  
  // End the conversation session if connected
  if (interviewAgentState.conversation) {
    try {
      await interviewAgentState.conversation.endSession();
      console.log('Interview session ended successfully');
    } catch (error) {
      console.error('Error ending conversation session:', error);
    }
    
    interviewAgentState.conversation = null;
  }
  
  // Reset the connection status
  interviewAgentState.isConnected = false;
  
  // Reset UI elements
  const agentStatus = document.getElementById('agentStatus');
  if (agentStatus) {
    agentStatus.classList.remove('active');
  }
  
  const agentStatusText = document.getElementById('agentStatusText');
  if (agentStatusText) {
    agentStatusText.textContent = 'Interview ended';
  }
  
  const visualizerContainer = document.getElementById('visualizer-container');
  if (visualizerContainer) {
    visualizerContainer.classList.remove('pulse-animation');
  }
  
  // Update transcript
  if (typeof updateTranscript === 'function') {
    updateTranscript('[System]: Interview session ended.');
  }
  
  // Enable any end interview buttons that might be disabled
  const endInterviewButtons = document.querySelectorAll('.end-interview-btn');
  endInterviewButtons.forEach(button => {
    button.disabled = false;
  });
  
  // Update UI to reflect the stopped state
  if (typeof updateStatus === 'function') {
    updateStatus('Interview ended');
  }
  
  console.log('Interview agent stopped successfully');
  return true;
}

/**
 * Generate a report for the interview
 */
async function generateInterviewReport() {
  console.log('Generating interview report');
  
  // Check if generateReport function is available
  if (typeof generateReport === 'function') {
    generateReport(interviewAgentState.interviewConfig);
  } else {
    console.log('Report generator not available');
  }
}

// Export functions for use in other modules
export {
  ensureVoice,
  createInterviewAgent,
  connectToAgent,
  startInterviewAgent,
  stopInterviewAgent,
  generateInterviewReport
}; 