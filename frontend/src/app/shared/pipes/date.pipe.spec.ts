import { DatePipe, DateFormat } from './date.pipe';

describe('DatePipe', () => {
  let pipe: DatePipe;

  beforeEach(() => {
    pipe = new DatePipe();
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

  describe('invalid date values', () => {
    it('should return empty string for invalid date string', () => {
      expect(pipe.transform('invalid-date')).toBe('');
    });

    it('should return empty string for NaN number', () => {
      expect(pipe.transform(NaN)).toBe('');
    });

    it('should return empty string for invalid date object', () => {
      const invalidDate = new Date('invalid');
      expect(pipe.transform(invalidDate)).toBe('');
    });
  });

  describe('date format types', () => {
    const testDate = new Date('2023-12-25T15:30:45.123Z');

    it('should format as short', () => {
      const result = pipe.transform(testDate, 'short');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should format as medium', () => {
      const result = pipe.transform(testDate, 'medium');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2023');
      expect(result).toContain('3');
      expect(result).toContain('30');
    });

    it('should format as long', () => {
      const result = pipe.transform(testDate, 'long');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
      expect(result).toContain('3');
      expect(result).toContain('30');
      expect(result).toContain('45');
    });

    it('should format as full', () => {
      const result = pipe.transform(testDate, 'full');
      expect(result).toContain('Monday');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should format as date only', () => {
      const result = pipe.transform(testDate, 'date');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should format as time only', () => {
      const result = pipe.transform(testDate, 'time');
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should format as datetime', () => {
      const result = pipe.transform(testDate, 'datetime');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/);
    });

    it('should format as relative time', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const result = pipe.transform(oneHourAgo, 'relative');
      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });

    it('should format as custom with format string', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'YYYY-MM-DD HH:mm:ss');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should fallback to relative for custom without format', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const result = pipe.transform(oneHourAgo, 'custom');
      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });

    it('should use default format for unknown format', () => {
      const result = pipe.transform(testDate, 'unknown' as DateFormat);
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });
  });

  describe('different input types', () => {
    const testDate = new Date('2023-12-25T15:30:45.123Z');

    it('should handle Date object', () => {
      const result = pipe.transform(testDate, 'short');
      expect(result).toContain('Dec');
    });

    it('should handle date string', () => {
      const result = pipe.transform('2023-12-25T15:30:45.123Z', 'short');
      expect(result).toContain('Dec');
    });

    it('should handle timestamp number', () => {
      const result = pipe.transform(testDate.getTime(), 'short');
      expect(result).toContain('Dec');
    });
  });

  describe('locale support', () => {
    const testDate = new Date('2023-12-25T15:30:45.123Z');

    it('should use default locale (en-US)', () => {
      const result = pipe.transform(testDate, 'short');
      expect(result).toContain('Dec');
    });

    it('should use custom locale', () => {
      const result = pipe.transform(testDate, 'short', undefined, 'fr-FR');
      expect(result).toContain('déc');
    });
  });

  describe('timezone support', () => {
    const testDate = new Date('2023-12-25T15:30:45.123Z');

    it('should handle timezone parameter', () => {
      const result = pipe.transform(testDate, 'full', 'America/New_York');
      expect(result).toContain('December');
    });
  });

  describe('relative time formatting', () => {
    it('should show "Just now" for recent dates', () => {
      const now = new Date();
      const result = pipe.transform(now, 'relative');
      expect(result).toBe('Just now');
    });

    it('should show minutes ago', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const result = pipe.transform(fiveMinutesAgo, 'relative');
      expect(result).toBe('5 minutes ago');
    });

    it('should show singular minute', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      const result = pipe.transform(oneMinuteAgo, 'relative');
      expect(result).toBe('1 minute ago');
    });

    it('should show hours ago', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const result = pipe.transform(twoHoursAgo, 'relative');
      expect(result).toBe('2 hours ago');
    });

    it('should show singular hour', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      const result = pipe.transform(oneHourAgo, 'relative');
      expect(result).toBe('1 hour ago');
    });

    it('should show days ago', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const result = pipe.transform(threeDaysAgo, 'relative');
      expect(result).toBe('3 days ago');
    });

    it('should show singular day', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const result = pipe.transform(oneDayAgo, 'relative');
      expect(result).toBe('1 day ago');
    });

    it('should show months ago', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);
      const result = pipe.transform(twoMonthsAgo, 'relative');
      expect(result).toBe('2 months ago');
    });

    it('should show singular month', () => {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 1 * 30 * 24 * 60 * 60 * 1000);
      const result = pipe.transform(oneMonthAgo, 'relative');
      expect(result).toBe('1 month ago');
    });

    it('should show years ago', () => {
      const now = new Date();
      const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      const result = pipe.transform(twoYearsAgo, 'relative');
      expect(result).toBe('2 years ago');
    });

    it('should show singular year', () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 1 * 365 * 24 * 60 * 60 * 1000);
      const result = pipe.transform(oneYearAgo, 'relative');
      expect(result).toBe('1 year ago');
    });
  });

  describe('custom format parsing', () => {
    const testDate = new Date('2023-12-25T15:30:45.123Z');

    it('should replace YYYY with year', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'YYYY');
      expect(result).toBe('2023');
    });

    it('should replace MM with month', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'MM');
      expect(result).toBe('12');
    });

    it('should replace DD with day', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'DD');
      expect(result).toBe('25');
    });

    it('should replace HH with hour', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'HH');
      expect(result).toBe('15');
    });

    it('should replace mm with minutes', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'mm');
      expect(result).toBe('30');
    });

    it('should replace ss with seconds', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'ss');
      expect(result).toBe('45');
    });

    it('should handle complex format', () => {
      const result = pipe.transform(testDate, 'custom', undefined, 'en-US', 'YYYY-MM-DD HH:mm:ss');
      expect(result).toBe('2023-12-25 15:30:45');
    });
  });

  describe('error handling', () => {
    it('should fallback to basic formatting on Intl error', () => {
      // Mock Intl.DateTimeFormat to throw an error
      const originalIntl = (window as any).Intl;
      (window as any).Intl = {
        ...originalIntl,
        DateTimeFormat: jasmine.createSpy('DateTimeFormat').and.throwError('Intl.DateTimeFormat error')
      } as any;

      const testDate = new Date('2023-12-25T15:30:45.123Z');
      const result = pipe.transform(testDate, 'short');
      
      expect(result).toBe(testDate.toLocaleDateString('en-US'));

      // Restore original Intl
      (window as any).Intl = originalIntl;
    });
  });
});
