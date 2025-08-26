import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currency',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    currencyCode: string = 'USD',
    display: 'symbol' | 'code' | 'symbol-narrow' = 'symbol',
    digitsInfo: string = '1.2-2',
    locale: string = 'en-US'
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numericValue)) {
      return '';
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: display,
        minimumFractionDigits: this.getMinFractionDigits(digitsInfo),
        maximumFractionDigits: this.getMaxFractionDigits(digitsInfo)
      }).format(numericValue);
    } catch (error) {
      // Fallback to basic formatting if Intl.NumberFormat fails
      return `${currencyCode} ${numericValue.toFixed(2)}`;
    }
  }

  private getMinFractionDigits(digitsInfo: string): number {
    const match = digitsInfo.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 2;
  }

  private getMaxFractionDigits(digitsInfo: string): number {
    const match = digitsInfo.match(/(\d+)$/);
    return match ? parseInt(match[1]) : 2;
  }
}
