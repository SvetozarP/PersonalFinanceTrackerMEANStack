import authRoutes from '../../../modules/auth/auth.routes';

describe('Auth Routes', () => {
  it('should export auth routes', () => {
    expect(authRoutes).toBeDefined();
  });

  it('should be a router function', () => {
    expect(typeof authRoutes).toBe('function');
  });
});
