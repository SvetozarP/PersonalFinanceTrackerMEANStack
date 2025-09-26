/**
 * Test cleanup utilities to prevent test interference
 * This file is only used in test environments
 */

/// <reference path="./types.d.ts" />

// Type guard to check if we're in a test environment
function isTestEnvironment(): boolean {
  return typeof (globalThis as any).jasmine !== 'undefined' && typeof (globalThis as any).beforeEach !== 'undefined';
}

export class TestCleanup {
  private static spies: jasmine.Spy[] = [];

  /**
   * Register a spy for cleanup
   */
  static registerSpy(spy: jasmine.Spy): void {
    if (isTestEnvironment()) {
      this.spies.push(spy);
    }
  }

  /**
   * Clean up all registered spies
   */
  static cleanupSpies(): void {
    if (!isTestEnvironment()) return;
    
    this.spies.forEach(spy => {
      try {
        if (spy && typeof spy.and !== 'undefined' && (spy.and as any).restore) {
          (spy.and as any).restore();
        }
      } catch (e) {
        // Ignore restore errors
      }
    });
    this.spies = [];
  }

  /**
   * Clean up window object spies
   */
  static cleanupWindowSpies(): void {
    if (!isTestEnvironment()) return;
    
    // Clean up window.confirm
    if (window.confirm && (window.confirm as any).and) {
      try {
        (window.confirm as any).and.restore();
      } catch (e) {
        // Ignore restore errors
      }
    }

    // Clean up window.alert
    if (window.alert && (window.alert as any).and) {
      try {
        (window.alert as any).and.restore();
      } catch (e) {
        // Ignore restore errors
      }
    }

    // Clean up window.prompt
    if (window.prompt && (window.prompt as any).and) {
      try {
        (window.prompt as any).and.restore();
      } catch (e) {
        // Ignore restore errors
      }
    }
  }

  /**
   * Clean up storage
   */
  static cleanupStorage(): void {
    if (!isTestEnvironment()) return;
    
    localStorage.clear();
    sessionStorage.clear();
  }

  /**
   * Clean up global state
   */
  static cleanupGlobalState(): void {
    if (!isTestEnvironment()) return;
    
    // Reset location hash
    if (window.location) {
      window.location.hash = '';
    }

    // Reset any global variables that might interfere
    if ((window as any).testState) {
      delete (window as any).testState;
    }
  }

  /**
   * Comprehensive cleanup
   */
  static cleanup(): void {
    if (!isTestEnvironment()) return;
    
    this.cleanupSpies();
    this.cleanupWindowSpies();
    this.cleanupStorage();
    this.cleanupGlobalState();
  }
}

/**
 * Jasmine helper to create spies with automatic cleanup
 */
export function createSpyWithCleanup<T>(object: any, method: string): jasmine.Spy | null {
  if (!isTestEnvironment()) return null;
  
  // Use dynamic import to avoid Jasmine types in production
  const spy = (globalThis as any).spyOn?.(object, method);
  if (spy) {
    TestCleanup.registerSpy(spy);
  }
  return spy || null;
}

/**
 * Jasmine helper to create spies on window object with automatic cleanup
 */
export function createWindowSpyWithCleanup(method: keyof Window): jasmine.Spy | null {
  if (!isTestEnvironment()) return null;
  
  // Check if already spied upon and restore first
  if ((window[method] as any).and) {
    try {
      (window[method] as any).and.restore();
    } catch (e) {
      // If restore fails, reset to original function
      (window as any)[method] = function(message?: string): boolean {
        return true; // Default to true for tests
      };
    }
  }
  
  const spy = (globalThis as any).spyOn?.(window, method);
  if (spy) {
    TestCleanup.registerSpy(spy);
  }
  return spy || null;
}
