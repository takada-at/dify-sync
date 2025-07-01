import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveStyle(style: string | Record<string, any>): T;
  }
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): any;
    toHaveStyle(style: string | Record<string, any>): any;
  }
}
