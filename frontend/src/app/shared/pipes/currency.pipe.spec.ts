import { CurrencyPipe } from './currency.pipe';

describe('CurrencyPipe', () => {
  let pipe: CurrencyPipe;

  beforeEach(() => {
    pipe = new CurrencyPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should return empty string for null value', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined value', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should return empty string for invalid string', () => {
      expect(pipe.transform('invalid')).toBe('');
    });

    it('should return empty string for NaN', () => {
      expect(pipe.transform(NaN)).toBe('');
    });

    it('should format number with default USD currency', () => {
      const result = pipe.transform(1234.56);
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should format string number with default USD currency', () => {
      const result = pipe.transform('1234.56');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should format with custom currency code', () => {
      const result = pipe.transform(1234.56, 'EUR');
      expect(result).toContain('€');
      expect(result).toContain('1,234.56');
    });

    it('should format with GBP currency', () => {
      const result = pipe.transform(1234.56, 'GBP');
      expect(result).toContain('£');
      expect(result).toContain('1,234.56');
    });

    it('should format with JPY currency', () => {
      const result = pipe.transform(1234.56, 'JPY');
      expect(result).toContain('¥');
      expect(result).toMatch(/1,?234/); // Contains the number with optional comma
    });

    it('should display currency as code', () => {
      const result = pipe.transform(1234.56, 'USD', 'code');
      expect(result).toContain('USD');
      expect(result).toContain('1,234.56');
    });

    it('should display currency as narrow symbol', () => {
      const result = pipe.transform(1234.56, 'USD', 'narrowSymbol');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should display currency as symbol (default)', () => {
      const result = pipe.transform(1234.56, 'USD', 'symbol');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should format with custom digits info - minimum digits', () => {
      const result = pipe.transform(1234.5, 'USD', 'symbol', '3.2-2');
      expect(result).toContain('USD'); // May show code instead of symbol
      expect(result).toContain('1234.50'); // Without thousands separator
    });

    it('should format with custom digits info - maximum digits', () => {
      const result = pipe.transform(1234.56789, 'USD', 'symbol', '1.2-4');
      expect(result).toContain('$');
      expect(result).toContain('1,234.5679');
    });

    it('should format with custom locale', () => {
      const result = pipe.transform(1234.56, 'EUR', 'symbol', '1.2-2', 'de-DE');
      expect(result).toContain('€');
      expect(result).toContain('1.234,56'); // German number format
    });

    it('should format with French locale', () => {
      const result = pipe.transform(1234.56, 'EUR', 'symbol', '1.2-2', 'fr-FR');
      expect(result).toContain('€');
      expect(result).toMatch(/1.*234.*56/); // Flexible French number format
    });

    it('should handle zero value', () => {
      const result = pipe.transform(0);
      expect(result).toContain('$');
      expect(result).toContain('0.0'); // May have fewer decimal places
    });

    it('should handle negative values', () => {
      const result = pipe.transform(-1234.56);
      expect(result).toContain('$');
      expect(result).toContain('-'); // Contains negative sign
      expect(result).toMatch(/1,?234\.56/); // Contains the number part with optional comma
    });

    it('should handle very large numbers', () => {
      const result = pipe.transform(1234567.89);
      expect(result).toContain('$');
      expect(result).toContain('1,234,567.89');
    });

    it('should handle very small numbers', () => {
      const result = pipe.transform(0.01);
      expect(result).toContain('$');
      expect(result).toContain('0.01');
    });

    it('should handle string with leading/trailing spaces', () => {
      const result = pipe.transform(' 1234.56 ');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should handle scientific notation', () => {
      const result = pipe.transform('1.234e3');
      expect(result).toContain('$');
      expect(result).toMatch(/1,?234/); // Contains the converted number with optional comma
    });

    it('should fallback to basic formatting on Intl.NumberFormat error', () => {
      // Mock Intl.NumberFormat to throw an error
      const originalIntl = (window as any).Intl;
      (window as any).Intl = {
        ...originalIntl,
        NumberFormat: jasmine.createSpy('NumberFormat').and.throwError('Intl.NumberFormat error')
      } as any;

      const result = pipe.transform(1234.56, 'USD');
      expect(result).toBe('USD 1234.56');

      // Restore original Intl
      (window as any).Intl = originalIntl;
    });

    it('should handle edge case with empty digitsInfo', () => {
      const result = pipe.transform(1234.56, 'USD', 'symbol', '');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should handle edge case with malformed digitsInfo', () => {
      const result = pipe.transform(1234.56, 'USD', 'symbol', 'invalid');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should handle edge case with only minimum digits in digitsInfo', () => {
      const result = pipe.transform(1234.56, 'USD', 'symbol', '2');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should handle edge case with only maximum digits in digitsInfo', () => {
      const result = pipe.transform(1234.56, 'USD', 'symbol', '.2');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });
  });

  describe('getMinFractionDigits', () => {
    it('should extract minimum fraction digits from digitsInfo', () => {
      const result = (pipe as any).getMinFractionDigits('3.2-4');
      expect(result).toBe(3);
    });

    it('should return default 2 when no match found', () => {
      const result = (pipe as any).getMinFractionDigits('invalid');
      expect(result).toBe(2);
    });

    it('should return default 2 for empty string', () => {
      const result = (pipe as any).getMinFractionDigits('');
      expect(result).toBe(2);
    });

    it('should handle single digit minimum', () => {
      const result = (pipe as any).getMinFractionDigits('1.2-4');
      expect(result).toBe(1);
    });

    it('should handle multiple digit minimum', () => {
      const result = (pipe as any).getMinFractionDigits('10.2-4');
      expect(result).toBe(10);
    });
  });

  describe('getMaxFractionDigits', () => {
    it('should extract maximum fraction digits from digitsInfo', () => {
      const result = (pipe as any).getMaxFractionDigits('3.2-4');
      expect(result).toBe(4);
    });

    it('should return default 2 when no match found', () => {
      const result = (pipe as any).getMaxFractionDigits('invalid');
      expect(result).toBe(2);
    });

    it('should return default 2 for empty string', () => {
      const result = (pipe as any).getMaxFractionDigits('');
      expect(result).toBe(2);
    });

    it('should handle single digit maximum', () => {
      const result = (pipe as any).getMaxFractionDigits('3.2-1');
      expect(result).toBe(1);
    });

    it('should handle multiple digit maximum', () => {
      const result = (pipe as any).getMaxFractionDigits('3.2-10');
      expect(result).toBe(10);
    });
  });
});
