import authRoutes from '../../../modules/auth/auth.routes';

describe('Auth Routes', () => {
  it('should export auth routes', () => {
    expect(authRoutes).toBeDefined();
  });

  it('should be a router function', () => {
    expect(typeof authRoutes).toBe('function');
  });

  it('should have correct route structure', () => {
    const routes = authRoutes;
    expect(routes).toBeDefined();
    
    // Check that routes is a function (router)
    expect(typeof routes).toBe('function');
  });

  it('should export router with proper methods', () => {
    const routes = authRoutes;
    
    // The router should have the standard Express router methods
    expect(routes).toHaveProperty('stack');
    expect(typeof routes).toBe('function');
  });

  it('should be an Express router instance', () => {
    const routes = authRoutes;
    
    // Check that it's a router instance
    expect(routes).toBeDefined();
    expect(typeof routes).toBe('function');
    
    // Basic router properties
    expect(routes).toHaveProperty('stack');
  });
});
