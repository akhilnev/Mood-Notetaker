/**
 * Mood Notetaker Configuration
 * 
 * Copy this file to config.js and add your API keys.
 * config.js is in .gitignore and won't be committed to version control.
 */

const config = {
  // OpenAI API key for Whisper and GPT
  // You can get one at https://platform.openai.com/api-keys
  openaiApiKey: "your-openai-api-key-here",
  
  // API endpoints (don't change these unless OpenAI changes their URLs)
  whisperEndpoint: "https://api.openai.com/v1/audio/transcriptions",
  gptEndpoint: "https://api.openai.com/v1/chat/completions",
  
  // Model settings
  whisperModel: "whisper-1",
  gptModel: "gpt-3.5-turbo",
  
  // Intervals (in milliseconds)
  emotionDetectionIntervalMs: 2000,
  transcriptionChunkMs: 5000,
  summarizationIntervalMs: 20000
};

// Don't modify below this line
if (typeof module !== 'undefined') {
  module.exports = config;
} 