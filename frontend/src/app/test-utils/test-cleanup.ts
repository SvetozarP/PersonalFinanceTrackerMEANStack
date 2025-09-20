/**
 * Test cleanup utilities to prevent test interference
 */

export class TestCleanup {
  private static spies: jasmine.Spy[] = [];

  /**
   * Register a spy for cleanup
   */
  static registerSpy(spy: jasmine.Spy): void {
    this.spies.push(spy);
  }

  /**
   * Clean up all registered spies
   */
  static cleanupSpies(): void {
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
    localStorage.clear();
    sessionStorage.clear();
  }

  /**
   * Clean up global state
   */
  static cleanupGlobalState(): void {
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
    this.cleanupSpies();
    this.cleanupWindowSpies();
    this.cleanupStorage();
    this.cleanupGlobalState();
  }
}

/**
 * Jasmine helper to create spies with automatic cleanup
 */
export function createSpyWithCleanup<T>(object: any, method: string): jasmine.Spy {
  const spy = spyOn(object, method);
  TestCleanup.registerSpy(spy);
  return spy;
}

/**
 * Jasmine helper to create spies on window object with automatic cleanup
 */
export function createWindowSpyWithCleanup(method: keyof Window): jasmine.Spy {
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
  
  const spy = spyOn(window, method);
  TestCleanup.registerSpy(spy);
  return spy;
}
