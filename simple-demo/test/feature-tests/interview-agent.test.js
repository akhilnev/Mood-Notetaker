/**
 * Feature Test: Interview Agent
 * Tests the functionality of the ElevenLabs interview agent
 */

describe('Interview Agent Feature', () => {
  // Mock API response data
  const mockVoiceId = 'voice_123456';
  const mockAgentId = 'agent_123456';
  
  // Setup mock ElevenLabs API for testing
  function setupMockApi() {
    // Mock fetch to simulate API calls
    window.originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (url.includes('/v1/voices/add')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ voice_id: mockVoiceId })
        });
      }
      
      if (url.includes('/v1/convai/agents/create')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ agent_id: mockAgentId })
        });
      }
      
      // Default case - pass through to original fetch
      return window.originalFetch(url, options);
    };
  }
  
  // Clean up after tests
  function cleanupMockApi() {
    if (window.originalFetch) {
      window.fetch = window.originalFetch;
      delete window.originalFetch;
    }
  }
  
  beforeEach(() => {
    setupMockApi();
  });
  
  afterEach(() => {
    cleanupMockApi();
  });

  it('should have a function to ensure or create a voice', async () => {
    // Check if the function exists
    expect(typeof window.ensureVoice).toBe('function');
    
    // Call the function and check result
    const voiceId = await window.ensureVoice('Software Engineer', 'Tech Corp');
    expect(voiceId).toBe(mockVoiceId);
  });

  it('should have a function to create an interview agent', async () => {
    // Check if the function exists
    expect(typeof window.createInterviewAgent).toBe('function');
    
    // Mock config
    const mockConfig = {
      role: 'Software Engineer',
      company: 'Tech Corp',
      duration: 900, // 15 minutes in seconds
      focus: 'JavaScript, React, Node.js',
      links: ['https://example.com/job', 'https://example.com/company']
    };
    
    // Call the function and check result
    const agentId = await window.createInterviewAgent(mockConfig, mockVoiceId);
    expect(agentId).toBe(mockAgentId);
  });

  it('should establish a WebSocket connection with the agent', async () => {
    // Mock WebSocket
    window.originalWebSocket = window.WebSocket;
    
    let wsUrl = null;
    window.WebSocket = function(url) {
      wsUrl = url;
      return {
        send: () => {},
        close: () => {},
        addEventListener: () => {}
      };
    };
    
    // Call the function that establishes the WebSocket
    if (typeof window.connectToAgent === 'function') {
      await window.connectToAgent(mockAgentId);
    }
    
    // Verify the WebSocket URL
    expect(wsUrl).not.toBe(null);
    expect(wsUrl.includes(`agent_id=${mockAgentId}`)).toBe(true);
    
    // Cleanup
    window.WebSocket = window.originalWebSocket;
    delete window.originalWebSocket;
  });

  it('should handle audio streaming through the WebSocket', () => {
    // Check if audio processing functions exist
    expect(typeof window.processAudioChunk).toBe('function');
    expect(typeof window.streamAudioToWebSocket).toBe('function');
    
    // Mock audio data
    const mockAudioChunk = new ArrayBuffer(1024);
    
    // Create a spy for WebSocket.send
    let dataSent = null;
    const mockSocket = {
      send: (data) => {
        dataSent = data;
      }
    };
    
    // Call the function
    window.streamAudioToWebSocket(mockSocket, mockAudioChunk);
    
    // Verify audio data was sent
    expect(dataSent).not.toBe(null);
  });

  it('should integrate with the 3D visualizer', () => {
    // Check if the visualizer functions exist
    expect(typeof window.initVisualizer).toBe('function');
    expect(typeof window.updateVisualizer).toBe('function');
    
    // Call init visualizer and check if it returns a visualizer object
    const visualizer = window.initVisualizer();
    expect(visualizer).not.toBe(null);
    
    // Mock audio data for visualization
    const mockAudioData = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      mockAudioData[i] = Math.random();
    }
    
    // Update visualizer and check if it doesn't throw an error
    let errorThrown = false;
    try {
      window.updateVisualizer(visualizer, mockAudioData);
    } catch (err) {
      errorThrown = true;
    }
    
    expect(errorThrown).toBe(false);
  });
}); 