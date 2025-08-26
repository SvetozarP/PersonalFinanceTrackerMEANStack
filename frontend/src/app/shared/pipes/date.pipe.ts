import { Pipe, PipeTransform } from '@angular/core';

export type DateFormat = 
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'date'
  | 'time'
  | 'datetime'
  | 'relative'
  | 'custom';

@Pipe({
  name: 'date',
  standalone: true
})
export class DatePipe implements PipeTransform {
  transform(
    value: Date | string | number | null | undefined,
    format: DateFormat = 'medium',
    timezone?: string,
    locale: string = 'en-US',
    customFormat?: string
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    let date: Date;
    
    if (typeof value === 'string') {
      date = new Date(value);
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else {
      date = value;
    }

    if (isNaN(date.getTime())) {
      return '';
    }

    try {
      switch (format) {
        case 'short':
          return new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(date);

        case 'medium':
          return new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
          }).format(date);

        case 'long':
          return new Intl.DateTimeFormat(locale, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
          }).format(date);

        case 'full':
          return new Intl.DateTimeFormat(locale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'long'
          }).format(date);

        case 'date':
          return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(date);

        case 'time':
          return new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).format(date);

        case 'datetime':
          return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).format(date);

        case 'relative':
          return this.getRelativeTimeString(date, locale);

        case 'custom':
          if (customFormat) {
            return this.formatCustom(date, customFormat, locale);
          }
          return this.getRelativeTimeString(date, locale);

        default:
          return new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }).format(date);
      }
    } catch (error) {
      // Fallback to basic formatting
      return date.toLocaleDateString(locale);
    }
  }

  private getRelativeTimeString(date: Date, locale: string): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }

  private formatCustom(date: Date, format: string, locale: string): string {
    // Simple custom format implementation
    return format
      .replace('YYYY', date.getFullYear().toString())
      .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
      .replace('DD', date.getDate().toString().padStart(2, '0'))
      .replace('HH', date.getHours().toString().padStart(2, '0'))
      .replace('mm', date.getMinutes().toString().padStart(2, '0'))
      .replace('ss', date.getSeconds().toString().padStart(2, '0'));
  }
}
