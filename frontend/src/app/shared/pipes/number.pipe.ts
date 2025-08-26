import { Pipe, PipeTransform } from '@angular/core';

export type NumberFormat = 
  | 'decimal'
  | 'percent'
  | 'scientific'
  | 'compact'
  | 'ordinal'
  | 'spellout';

@Pipe({
  name: 'number',
  standalone: true
})
export class NumberPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    format: NumberFormat = 'decimal',
    digitsInfo: string = '1.2-2',
    locale: string = 'en-US',
    options?: Intl.NumberFormatOptions
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numericValue)) {
      return '';
    }

    try {
      switch (format) {
        case 'decimal':
          return new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits: this.getMinFractionDigits(digitsInfo),
            maximumFractionDigits: this.getMaxFractionDigits(digitsInfo),
            ...options
          }).format(numericValue);

        case 'percent':
          return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: this.getMinFractionDigits(digitsInfo),
            maximumFractionDigits: this.getMaxFractionDigits(digitsInfo),
            ...options
          }).format(numericValue / 100);

        case 'scientific':
          return new Intl.NumberFormat(locale, {
            notation: 'scientific',
            minimumFractionDigits: this.getMinFractionDigits(digitsInfo),
            maximumFractionDigits: this.getMaxFractionDigits(digitsInfo),
            ...options
          }).format(numericValue);

        case 'compact':
          return new Intl.NumberFormat(locale, {
            notation: 'compact',
            compactDisplay: 'short',
            minimumFractionDigits: this.getMinFractionDigits(digitsInfo),
            maximumFractionDigits: this.getMaxFractionDigits(digitsInfo),
            ...options
          }).format(numericValue);

        case 'ordinal':
          return new Intl.NumberFormat(locale, {
            style: 'decimal',
            numberingSystem: 'latn',
            ...options
          }).format(numericValue) + this.getOrdinalSuffix(numericValue);

        case 'spellout':
          return new Intl.NumberFormat(locale, {
            style: 'decimal',
            numberingSystem: 'latn',
            ...options
          }).format(numericValue);

        default:
          return new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits: this.getMinFractionDigits(digitsInfo),
            maximumFractionDigits: this.getMaxFractionDigits(digitsInfo),
            ...options
          }).format(numericValue);
      }
    } catch (error) {
      // Fallback to basic formatting
      return numericValue.toFixed(this.getMaxFractionDigits(digitsInfo));
    }
  }

  private getMinFractionDigits(digitsInfo: string): number {
    const match = digitsInfo.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private getMaxFractionDigits(digitsInfo: string): number {
    const match = digitsInfo.match(/(\d+)$/);
    return match ? parseInt(match[1]) : 2;
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  }
}
