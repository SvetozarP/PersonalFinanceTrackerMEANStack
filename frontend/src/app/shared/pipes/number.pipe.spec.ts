import { NumberPipe, NumberFormat } from './number.pipe';

describe('NumberPipe', () => {
  let pipe: NumberPipe;

  beforeEach(() => {
    pipe = new NumberPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('null and undefined values', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(pipe.transform('')).toBe('');
    });
  });

  describe('invalid number values', () => {
    it('should return empty string for invalid string', () => {
      expect(pipe.transform('invalid-number')).toBe('');
    });

    it('should return empty string for NaN', () => {
      expect(pipe.transform(NaN)).toBe('');
    });
  });

  describe('number format types', () => {
    it('should format as decimal', () => {
      const result = pipe.transform(1234.567, 'decimal');
      expect(result).toMatch(/\d{1,3}(,\d{3})*\.\d{2}/);
    });

    it('should format as percent', () => {
      const result = pipe.transform(25, 'percent');
      expect(result).toContain('%');
    });

    it('should format as scientific', () => {
      const result = pipe.transform(1234567, 'scientific');
      expect(result).toContain('E');
    });

    it('should format as compact', () => {
      const result = pipe.transform(1234567, 'compact');
      expect(result).toMatch(/\d+[KMB]/);
    });

    it('should format as ordinal', () => {
      const result = pipe.transform(1, 'ordinal');
      expect(result).toContain('st');
    });

    it('should format as spellout', () => {
      const result = pipe.transform(123, 'spellout');
      expect(result).toMatch(/\d+/);
    });

    it('should use default format for unknown format', () => {
      const result = pipe.transform(1234.567, 'unknown' as NumberFormat);
      expect(result).toMatch(/\d{1,3}(,\d{3})*\.\d{2}/);
    });
  });

  describe('different input types', () => {
    it('should handle number input', () => {
      const result = pipe.transform(1234.567, 'decimal');
      expect(result).toMatch(/\d{1,3}(,\d{3})*\.\d{2}/);
    });

    it('should handle string input', () => {
      const result = pipe.transform('1234.567', 'decimal');
      expect(result).toMatch(/\d{1,3}(,\d{3})*\.\d{2}/);
    });
  });

  describe('digitsInfo parsing', () => {
    it('should parse minimum fraction digits', () => {
      const result = pipe.transform(1234.5, 'decimal', '2.2-2');
      expect(result).toMatch(/\d+\.\d{2}/);
    });

    it('should parse maximum fraction digits', () => {
      const result = pipe.transform(1234.56789, 'decimal', '1.2-3');
      expect(result).toMatch(/\d+\.\d{3}/);
    });

    it('should handle default digitsInfo', () => {
      const result = pipe.transform(1234.5, 'decimal');
      expect(result).toMatch(/\d+,\d+\.\d+/);
    });
  });

  describe('locale support', () => {
    it('should use default locale (en-US)', () => {
      const result = pipe.transform(1234.567, 'decimal');
      expect(result).toMatch(/\d{1,3}(,\d{3})*\.\d{2}/);
    });

    it('should use custom locale', () => {
      const result = pipe.transform(1234.567, 'decimal', '1.2-2', 'de-DE');
      expect(result).toMatch(/\d{1,3}(\.\d{3})*,\d{2}/);
    });
  });

  describe('options parameter', () => {
    it('should apply custom options', () => {
      const result = pipe.transform(1234.567, 'decimal', '1.2-2', 'en-US', { 
        minimumIntegerDigits: 6 
      });
      expect(result).toMatch(/^\d{3},\d{3}/);
    });
  });

  describe('ordinal suffix logic', () => {
    it('should add "st" for 1', () => {
      const result = pipe.transform(1, 'ordinal');
      expect(result).toContain('st');
    });

    it('should add "nd" for 2', () => {
      const result = pipe.transform(2, 'ordinal');
      expect(result).toContain('nd');
    });

    it('should add "rd" for 3', () => {
      const result = pipe.transform(3, 'ordinal');
      expect(result).toContain('rd');
    });

    it('should add "th" for 4', () => {
      const result = pipe.transform(4, 'ordinal');
      expect(result).toContain('th');
    });

    it('should add "th" for 11 (special case)', () => {
      const result = pipe.transform(11, 'ordinal');
      expect(result).toContain('th');
    });

    it('should add "th" for 12 (special case)', () => {
      const result = pipe.transform(12, 'ordinal');
      expect(result).toContain('th');
    });

    it('should add "th" for 13 (special case)', () => {
      const result = pipe.transform(13, 'ordinal');
      expect(result).toContain('th');
    });

    it('should add "st" for 21', () => {
      const result = pipe.transform(21, 'ordinal');
      expect(result).toContain('st');
    });

    it('should add "nd" for 22', () => {
      const result = pipe.transform(22, 'ordinal');
      expect(result).toContain('nd');
    });

    it('should add "rd" for 23', () => {
      const result = pipe.transform(23, 'ordinal');
      expect(result).toContain('rd');
    });

    it('should add "th" for 24', () => {
      const result = pipe.transform(24, 'ordinal');
      expect(result).toContain('th');
    });
  });

  describe('percent formatting', () => {
    it('should divide by 100 for percent format', () => {
      const result = pipe.transform(25, 'percent');
      expect(result).toContain('25.0%');
    });

    it('should handle decimal percentages', () => {
      const result = pipe.transform(25.5, 'percent');
      expect(result).toContain('25.5%');
    });
  });

  describe('compact formatting', () => {
    it('should format large numbers compactly', () => {
      const result = pipe.transform(1234567, 'compact');
      expect(result).toMatch(/\d+[KMB]/);
    });

    it('should handle very large numbers', () => {
      const result = pipe.transform(1234567890, 'compact');
      expect(result).toMatch(/\d+[KMB]/);
    });
  });

  describe('scientific formatting', () => {
    it('should format in scientific notation', () => {
      const result = pipe.transform(1234567, 'scientific');
      expect(result).toContain('E');
    });

    it('should handle small numbers in scientific notation', () => {
      const result = pipe.transform(0.000123, 'scientific');
      expect(result).toContain('E');
    });
  });

  describe('error handling', () => {
    it('should fallback to basic formatting on Intl error', () => {
      // Mock Intl.NumberFormat to throw an error
      const originalIntl = (window as any).Intl;
      (window as any).Intl = {
        ...originalIntl,
        NumberFormat: jasmine.createSpy('NumberFormat').and.throwError('Intl.NumberFormat error')
      } as any;

      const result = pipe.transform(1234.567, 'decimal', '1.2-2');
      
      expect(result).toBe('1234.57');

      // Restore original Intl
      (window as any).Intl = originalIntl;
    });
  });

  describe('edge cases', () => {
    it('should handle zero', () => {
      const result = pipe.transform(0, 'decimal');
      expect(result).toContain('0');
    });

    it('should handle negative numbers', () => {
      const result = pipe.transform(-1234.567, 'decimal');
      expect(result).toContain('-');
    });

    it('should handle very small numbers', () => {
      const result = pipe.transform(0.000001, 'decimal');
      expect(result).toMatch(/\d+\.\d+/);
    });

    it('should handle very large numbers', () => {
      const result = pipe.transform(999999999, 'decimal');
      expect(result).toMatch(/\d{1,3}(,\d{3})*/);
    });
  });
});
