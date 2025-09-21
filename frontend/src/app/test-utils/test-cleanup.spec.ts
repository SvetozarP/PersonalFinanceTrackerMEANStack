import { TestCleanup, createSpyWithCleanup, createWindowSpyWithCleanup } from './test-cleanup';

describe('TestCleanup', () => {
  let mockSpy: jasmine.Spy;

  beforeEach(() => {
    // Reset the spies array before each test
    (TestCleanup as any).spies = [];
    mockSpy = jasmine.createSpy('mockSpy');
  });

  afterEach(() => {
    // Clean up after each test
    TestCleanup.cleanup();
  });

  describe('registerSpy', () => {
    it('should register a spy for cleanup', () => {
      TestCleanup.registerSpy(mockSpy);
      
      expect((TestCleanup as any).spies).toContain(mockSpy);
    });

    it('should register multiple spies', () => {
      const spy1 = jasmine.createSpy('spy1');
      const spy2 = jasmine.createSpy('spy2');
      
      TestCleanup.registerSpy(spy1);
      TestCleanup.registerSpy(spy2);
      
      expect((TestCleanup as any).spies).toContain(spy1);
      expect((TestCleanup as any).spies).toContain(spy2);
    });
  });

  describe('cleanupSpies', () => {
    it('should restore all registered spies', () => {
      const spy1 = jasmine.createSpy('spy1');
      const spy2 = jasmine.createSpy('spy2');
      
      spy1.and = { restore: jasmine.createSpy('restore1') } as any;
      spy2.and = { restore: jasmine.createSpy('restore2') } as any;
      
      TestCleanup.registerSpy(spy1);
      TestCleanup.registerSpy(spy2);
      
      TestCleanup.cleanupSpies();
      
      expect((spy1.and as any).restore).toHaveBeenCalled();
      expect((spy2.and as any).restore).toHaveBeenCalled();
      expect((TestCleanup as any).spies).toEqual([]);
    });

    it('should handle spies without restore method', () => {
      const spy1 = jasmine.createSpy('spy1');
      spy1.and = {} as any; // No restore method
      
      TestCleanup.registerSpy(spy1);
      
      expect(() => TestCleanup.cleanupSpies()).not.toThrow();
      expect((TestCleanup as any).spies).toEqual([]);
    });

    it('should handle spies with restore errors', () => {
      const spy1 = jasmine.createSpy('spy1');
      spy1.and = { 
        restore: jasmine.createSpy('restore').and.throwError('Restore error')
      } as any;
      
      TestCleanup.registerSpy(spy1);
      
      expect(() => TestCleanup.cleanupSpies()).not.toThrow();
      expect((TestCleanup as any).spies).toEqual([]);
    });

    it('should handle null spies', () => {
      TestCleanup.registerSpy(null as any);
      
      expect(() => TestCleanup.cleanupSpies()).not.toThrow();
      expect((TestCleanup as any).spies).toEqual([]);
    });

    it('should handle undefined spies', () => {
      TestCleanup.registerSpy(undefined as any);
      
      expect(() => TestCleanup.cleanupSpies()).not.toThrow();
      expect((TestCleanup as any).spies).toEqual([]);
    });
  });

  describe('cleanupWindowSpies', () => {
    it('should clean up window.confirm spy', () => {
      const originalConfirm = window.confirm;
      const mockConfirm = jasmine.createSpy('confirm');
      mockConfirm.and = { restore: jasmine.createSpy('restore') } as any;
      (window as any).confirm = mockConfirm;
      
      TestCleanup.cleanupWindowSpies();
      
      expect((mockConfirm.and as any).restore).toHaveBeenCalled();
      
      // Restore original
      window.confirm = originalConfirm;
    });

    it('should clean up window.alert spy', () => {
      const originalAlert = window.alert;
      const mockAlert = jasmine.createSpy('alert');
      mockAlert.and = { restore: jasmine.createSpy('restore') } as any;
      (window as any).alert = mockAlert;
      
      TestCleanup.cleanupWindowSpies();
      
      expect((mockAlert.and as any).restore).toHaveBeenCalled();
      
      // Restore original
      window.alert = originalAlert;
    });

    it('should clean up window.prompt spy', () => {
      const originalPrompt = window.prompt;
      const mockPrompt = jasmine.createSpy('prompt');
      mockPrompt.and = { restore: jasmine.createSpy('restore') } as any;
      (window as any).prompt = mockPrompt;
      
      TestCleanup.cleanupWindowSpies();
      
      expect((mockPrompt.and as any).restore).toHaveBeenCalled();
      
      // Restore original
      window.prompt = originalPrompt;
    });

    it('should handle window methods without and property', () => {
      const originalConfirm = window.confirm;
      (window as any).confirm = function() { return true; };
      
      expect(() => TestCleanup.cleanupWindowSpies()).not.toThrow();
      
      // Restore original
      window.confirm = originalConfirm;
    });

    it('should handle restore errors gracefully', () => {
      const originalConfirm = window.confirm;
      const mockConfirm = jasmine.createSpy('confirm');
      mockConfirm.and = { 
        restore: jasmine.createSpy('restore').and.throwError('Restore error')
      } as any;
      (window as any).confirm = mockConfirm;
      
      expect(() => TestCleanup.cleanupWindowSpies()).not.toThrow();
      
      // Restore original
      window.confirm = originalConfirm;
    });
  });

  describe('cleanupStorage', () => {
    it('should clear localStorage and sessionStorage', () => {
      spyOn(localStorage, 'clear');
      spyOn(sessionStorage, 'clear');
      
      TestCleanup.cleanupStorage();
      
      expect(localStorage.clear).toHaveBeenCalled();
      expect(sessionStorage.clear).toHaveBeenCalled();
    });
  });

  describe('cleanupGlobalState', () => {
    it('should reset location hash', () => {
      const originalHash = window.location.hash;
      window.location.hash = 'test-hash';
      
      TestCleanup.cleanupGlobalState();
      
      expect(window.location.hash).toBe('');
      
      // Restore original
      window.location.hash = originalHash;
    });

    it('should delete testState from window', () => {
      (window as any).testState = { test: 'data' };
      
      TestCleanup.cleanupGlobalState();
      
      expect((window as any).testState).toBeUndefined();
    });

    it('should handle missing testState gracefully', () => {
      expect(() => TestCleanup.cleanupGlobalState()).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should call all cleanup methods', () => {
      spyOn(TestCleanup, 'cleanupSpies');
      spyOn(TestCleanup, 'cleanupWindowSpies');
      spyOn(TestCleanup, 'cleanupStorage');
      spyOn(TestCleanup, 'cleanupGlobalState');
      
      TestCleanup.cleanup();
      
      expect(TestCleanup.cleanupSpies).toHaveBeenCalled();
      expect(TestCleanup.cleanupWindowSpies).toHaveBeenCalled();
      expect(TestCleanup.cleanupStorage).toHaveBeenCalled();
      expect(TestCleanup.cleanupGlobalState).toHaveBeenCalled();
    });
  });
});

describe('createSpyWithCleanup', () => {
  let mockObject: any;

  beforeEach(() => {
    mockObject = {
      testMethod: jasmine.createSpy('testMethod')
    };
    (TestCleanup as any).spies = [];
  });

  afterEach(() => {
    TestCleanup.cleanup();
  });

  it('should create a spy and register it for cleanup', () => {
    // Clean up any existing spies first
    TestCleanup.cleanup();
    
    // Create a fresh mock object for this test
    const freshMockObject = { testMethod: () => {} };
    
    const spy = createSpyWithCleanup(freshMockObject, 'testMethod');
    
    expect(spy).toBeDefined();
    expect((TestCleanup as any).spies).toContain(spy);
  });

  it('should return the same spy as spyOn', () => {
    // Clean up any existing spies first
    TestCleanup.cleanup();
    
    // Create a fresh mock object to avoid spy conflicts
    const freshMockObject = { testMethod: () => {} };
    
    const spy = createSpyWithCleanup(freshMockObject, 'testMethod');
    
    // Verify the spy is properly created and registered
    expect(spy).toBeDefined();
    expect((TestCleanup as any).spies).toContain(spy);
    expect(spy).toBe(freshMockObject.testMethod);
  });
});

describe('createWindowSpyWithCleanup', () => {
  beforeEach(() => {
    (TestCleanup as any).spies = [];
  });

  afterEach(() => {
    TestCleanup.cleanup();
  });

  it('should create a spy on window.confirm and register it', () => {
    const spy = createWindowSpyWithCleanup('confirm');
    
    expect(spy).toBeDefined();
    expect((TestCleanup as any).spies).toContain(spy);
  });

  it('should handle already spied upon methods', () => {
    // First spy
    const spy1 = createWindowSpyWithCleanup('confirm');
    
    // Second spy should restore the first one
    const spy2 = createWindowSpyWithCleanup('confirm');
    
    expect(spy2).toBeDefined();
    expect((TestCleanup as any).spies).toContain(spy2);
  });

  it('should handle restore errors by resetting function', () => {
    // Mock a spy that throws on restore
    const originalConfirm = window.confirm;
    (window as any).confirm = function() { return true; };
    (window as any).confirm.and = {
      restore: jasmine.createSpy('restore').and.throwError('Restore error')
    };
    
    const spy = createWindowSpyWithCleanup('confirm');
    
    expect(spy).toBeDefined();
    expect((TestCleanup as any).spies).toContain(spy);
    
    // Restore original
    window.confirm = originalConfirm;
  });

  it('should work with different window methods', () => {
    const confirmSpy = createWindowSpyWithCleanup('confirm');
    const alertSpy = createWindowSpyWithCleanup('alert');
    const promptSpy = createWindowSpyWithCleanup('prompt');
    
    expect(confirmSpy).toBeDefined();
    expect(alertSpy).toBeDefined();
    expect(promptSpy).toBeDefined();
    
    expect((TestCleanup as any).spies).toContain(confirmSpy);
    expect((TestCleanup as any).spies).toContain(alertSpy);
    expect((TestCleanup as any).spies).toContain(promptSpy);
  });
});
