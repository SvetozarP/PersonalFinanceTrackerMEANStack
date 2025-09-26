/**
 * Type declarations for test utilities
 * This file provides type definitions for Jasmine and test globals
 */

declare global {
  namespace jasmine {
    interface Spy {
      and: {
        restore: () => void;
      };
    }
  }

  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function spyOn<T>(object: T, method: keyof T): jasmine.Spy;
}

export {};
