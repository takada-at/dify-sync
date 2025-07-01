import 'vitest';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toHaveStyle(style: string | Record<string, any>): T;
  }
  interface AsymmetricMatchersContaining {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toBeInTheDocument(): any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toHaveStyle(style: string | Record<string, any>): any;
  }
}
