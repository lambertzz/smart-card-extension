import { jest } from '@jest/globals';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// @ts-ignore
global.chrome = mockChrome;

// Mock DOM methods
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'example.com',
    href: 'https://example.com',
    pathname: '/',
    search: ''
  },
  writable: true
});

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

export { mockChrome };