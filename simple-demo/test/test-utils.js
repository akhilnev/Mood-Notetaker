/**
 * Test Utilities for Mood Notetaker feature tests
 */

// Simple test framework
function describe(description, testFn) {
  console.log(`\n🧪 ${description}`);
  testFn();
}

function it(description, testFn) {
  try {
    testFn();
    console.log(`  ✅ ${description}`);
  } catch (error) {
    console.error(`  ❌ ${description}`);
    console.error(`    ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toBeVisible() {
      if (!actual || actual.style.display === 'none' || actual.style.visibility === 'hidden') {
        throw new Error('Element is not visible');
      }
    },
    toHaveClass(className) {
      if (!actual.classList.contains(className)) {
        throw new Error(`Expected element to have class ${className}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    }
  };
}

// DOM test helpers
function simulateClick(element) {
  element.click();
}

function waitForElement(selector, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkExistence = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(checkExistence, 100);
      }
    };
    checkExistence();
  });
}

// Export test utilities
window.describe = describe;
window.it = it;
window.expect = expect;
window.simulateClick = simulateClick;
window.waitForElement = waitForElement; 