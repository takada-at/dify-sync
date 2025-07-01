// Global test setup
import { vi, expect } from 'vitest';

// Mock environment variables
globalThis.process.env.DIFY_API_URL = 'https://test-api.dify.ai/v1';
globalThis.process.env.DIFY_API_KEY = 'test-api-key';
globalThis.process.env.DIFY_DATASET_ID = 'test-dataset-id';
globalThis.process.env.LOG_LEVEL = 'silent';

// Mock console.log to reduce noise in tests
globalThis.console = {
  ...globalThis.console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Add basic DOM matchers
expect.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toBeInTheDocument(received: any) {
    if (received && received.nodeType === 1) {
      return {
        pass: true,
        message: () => 'Element is in the document',
      };
    }
    return {
      pass: false,
      message: () => 'Element is not in the document',
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toHaveStyle(received: any, expected: string | Record<string, any>) {
    if (!received || !received.style) {
      return {
        pass: false,
        message: () => 'Element does not have style property',
      };
    }

    const styles = expected;
    const pass = Object.entries(styles).every(([property, value]) => {
      return received.style[property] === value;
    });

    return {
      pass,
      message: () => (pass ? 'Styles match' : 'Styles do not match'),
    };
  },
});
