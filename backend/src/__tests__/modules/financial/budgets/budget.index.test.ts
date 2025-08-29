import { Budget } from '../../../../modules/financial/budgets';

describe('Budget Index', () => {
  it('should export Budget model', () => {
    expect(Budget).toBeDefined();
    expect(typeof Budget).toBe('function');
  });

  it('should have Budget model properties', () => {
    expect(Budget.modelName).toBe('Budget');
  });
});

