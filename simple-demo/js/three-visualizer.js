/**
 * 3D Visualizer Module for Mood Notetaker
 * Creates a 3D sphere that reacts to audio
 */

// Visualizer state
const visualizerState = {
  scene: null,
  camera: null,
  renderer: null,
  sphere: null,
  analyser: null,
  isInitialized: false,
  container: null,
  animationFrame: null
};

/**
 * Load Three.js library dynamically
 * @returns {Promise} Promise that resolves when Three.js is loaded
 */
function loadThreeJs() {
  return new Promise((resolve, reject) => {
    if (window.THREE) {
      console.log('THREE already loaded, using existing instance');
      resolve(window.THREE);
      return;
    }
    
    // Try loading locally first (if included in HTML)
    if (typeof THREE !== 'undefined') {
      console.log('THREE found in global scope');
      window.THREE = THREE;
      resolve(window.THREE);
      return;
    }
    
    console.log('Attempting to load THREE.js from CDN');
    const script = document.createElement('script');
    // Use a specific version instead of latest to avoid breaking changes
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.min.js';
    
    // Add onload handler
    script.onload = () => {
      console.log('THREE.js loaded successfully');
      resolve(window.THREE);
    };
    
    // Add onerror handler with more detailed error info
    script.onerror = (error) => {
      console.error('Failed to load THREE.js library:', error);
      // Provide mock THREE object to prevent further errors
      window.THREE = createMockTHREE();
      resolve(window.THREE);
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Create a mock THREE object to prevent further errors if loading fails
 */
function createMockTHREE() {
  console.warn('Using mock THREE.js implementation');
  return {
    Scene: function() { return { add: function() {} }; },
    PerspectiveCamera: function() { return { position: { set: function() {} } }; },
    WebGLRenderer: function() { 
      return { 
        setSize: function() {}, 
        setClearColor: function() {},
        render: function() {},
        domElement: document.createElement('div')
      }; 
    },
    SphereGeometry: function() { return {}; },
    MeshBasicMaterial: function() { return {}; },
    Mesh: function() { 
      return { 
        rotation: { x: 0, y: 0 },
        scale: { set: function() {} },
        material: { color: {} }
      }; 
    },
    Color: function() { return {}; }
  };
}

/**
 * Initialize the 3D visualizer
 * @returns {Object} The visualizer state
 */
async function initVisualizer() {
  console.log('Starting visualizer initialization');
  
  // Create a container for the visualizer if it doesn't exist
  let container = document.getElementById('visualizer-container');
  if (!container) {
    console.log('Creating visualizer container');
    container = document.createElement('div');
    container.id = 'visualizer-container';
    container.style.position = 'fixed'; // Use fixed instead of absolute for more reliable positioning
    container.style.bottom = '100px'; // Position at bottom of screen instead of center
    container.style.right = '50%'; // Center horizontally
    container.style.transform = 'translateX(50%)'; // Center horizontally
    container.style.width = '200px'; // Smaller size
    container.style.height = '200px';
    container.style.zIndex = '50';
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.5s ease';
    container.style.border = '1px solid rgba(255, 255, 255, 0.2)'; // Add subtle border
    container.style.borderRadius = '50%'; // Make it circular
    container.style.pointerEvents = 'none'; // Don't interfere with clicks
    
    document.body.appendChild(container);
    console.log('Visualizer container added to DOM');
    
    // Fade in with slight delay
    setTimeout(() => {
      container.style.opacity = '0.6'; // More visible
      console.log('Visualizer container now visible');
    }, 500);
  }
  
  visualizerState.container = container;
  
  try {
    // Load Three.js if not already loaded
    await loadThreeJs();
    
    if (!window.THREE) {
      throw new Error('THREE.js not available after loading attempt');
    }
    
    console.log('THREE.js loaded, creating scene');
    
    // Create scene
    const scene = new THREE.Scene();
    visualizerState.scene = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 2;
    visualizerState.camera = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    visualizerState.renderer = renderer;
    
    // Add renderer to container
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // Create sphere geometry - reduce complexity for better performance
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    
    // Create material - make it more visible
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x4287f5,
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    
    // Create sphere
    const sphere = new THREE.Mesh(geometry, material);
    visualizerState.sphere = sphere;
    
    // Add sphere to scene
    scene.add(sphere);
    
    // Start animation loop
    animate();
    
    visualizerState.isInitialized = true;
    console.log('Visualizer initialized successfully');
    
    return visualizerState;
  } catch (error) {
    console.error('Error initializing visualizer:', error);
    // Create a fallback visualizer container with a message
    container.innerHTML = '<div style="color: white; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; text-align: center;">Visualizer unavailable</div>';
    container.style.opacity = '1'; // Make sure it's visible even if there's an error
    
    // Return null but don't break the functionality
    visualizerState.isInitialized = false;
    return null;
  }
}

/**
 * Animation loop for the visualizer
 */
function animate() {
  if (!visualizerState.isInitialized) return;
  
  visualizerState.animationFrame = requestAnimationFrame(animate);
  
  // Slowly rotate the sphere
  if (visualizerState.sphere) {
    visualizerState.sphere.rotation.x += 0.005;
    visualizerState.sphere.rotation.y += 0.01;
  }
  
  // Render the scene
  if (visualizerState.renderer && visualizerState.scene && visualizerState.camera) {
    visualizerState.renderer.render(visualizerState.scene, visualizerState.camera);
  }
}

/**
 * Update the visualizer based on audio data
 * @param {Float32Array} audioData The audio data to visualize
 */
function updateVisualizer(audioData) {
  // Make sure we have valid input
  if (!audioData || !Array.isArray(audioData) && !(audioData instanceof Float32Array)) {
    console.warn('Invalid audio data provided to updateVisualizer');
    return;
  }
  
  // Check if visualizer is initialized
  if (!visualizerState.isInitialized || !visualizerState.sphere) {
    // If not initialized, don't try to update it
    return;
  }
  
  try {
    // Calculate the average volume from the audio data
    let sum = 0;
    let validSamples = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      // Make sure we have valid data
      if (!isNaN(audioData[i])) {
        // Convert from dB to linear scale (roughly)
        const value = (audioData[i] + 140) / 140;
        if (value > 0) {
          sum += value;
          validSamples++;
        }
      }
    }
    
    // Only proceed if we have valid samples
    if (validSamples === 0) {
      return;
    }
    
    const average = sum / validSamples;
    
    // Scale the sphere based on the average volume
    const scaleFactor = 1 + Math.min(0.5, Math.max(0, average * 0.2));
    visualizerState.sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // Update color based on intensity (blue to red)
    const intensity = Math.min(1, Math.max(0, average));
    const color = new THREE.Color(intensity, 0.3, 1 - intensity);
    visualizerState.sphere.material.color = color;
  } catch (error) {
    console.error('Error updating visualizer:', error);
    // If we encounter an error, mark the visualizer as not initialized
    // to prevent further errors
    visualizerState.isInitialized = false;
  }
}

/**
 * Clean up the visualizer
 */
function cleanupVisualizer() {
  if (!visualizerState.isInitialized) return;
  
  // Stop animation loop
  if (visualizerState.animationFrame) {
    cancelAnimationFrame(visualizerState.animationFrame);
  }
  
  // Remove container
  if (visualizerState.container) {
    visualizerState.container.style.opacity = '0';
    setTimeout(() => {
      if (visualizerState.container.parentNode) {
        visualizerState.container.parentNode.removeChild(visualizerState.container);
      }
    }, 500);
  }
  
  // Clean up Three.js objects
  if (visualizerState.sphere) {
    visualizerState.scene.remove(visualizerState.sphere);
    visualizerState.sphere.geometry.dispose();
    visualizerState.sphere.material.dispose();
  }
  
  if (visualizerState.renderer) {
    visualizerState.renderer.dispose();
  }
  
  // Reset state
  visualizerState.isInitialized = false;
}

// Export functions for use in other modules
window.initVisualizer = initVisualizer;
window.updateVisualizer = updateVisualizer;
window.cleanupVisualizer = cleanupVisualizer; 