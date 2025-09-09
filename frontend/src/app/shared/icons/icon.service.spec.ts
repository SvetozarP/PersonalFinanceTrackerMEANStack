import { TestBed } from '@angular/core/testing';
import { IconService } from './icon.service';

describe('IconService', () => {
  let service: IconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getIcon', () => {
    it('should return correct icon class for valid icon name', () => {
      expect(service.getIcon('download')).toBe('fas fa-download');
      expect(service.getIcon('refresh')).toBe('fas fa-redo');
      expect(service.getIcon('plus')).toBe('fas fa-plus');
      expect(service.getIcon('chart-line')).toBe('fas fa-chart-line');
      expect(service.getIcon('credit-card')).toBe('fas fa-credit-card');
    });

    it('should return default icon for invalid icon name', () => {
      expect(service.getIcon('invalid-icon')).toBe('fas fa-circle');
      expect(service.getIcon('')).toBe('fas fa-circle');
      expect(service.getIcon('non-existent')).toBe('fas fa-circle');
    });

    it('should handle case sensitivity', () => {
      expect(service.getIcon('Download')).toBe('fas fa-circle');
      expect(service.getIcon('DOWNLOAD')).toBe('fas fa-circle');
    });
  });

  describe('getIconClass', () => {
    it('should return the same result as getIcon', () => {
      const iconName = 'download';
      expect(service.getIconClass(iconName)).toBe(service.getIcon(iconName));
    });

    it('should work with all icon types', () => {
      expect(service.getIconClass('arrow-up')).toBe('fas fa-arrow-up');
      expect(service.getIconClass('chart-pie')).toBe('fas fa-chart-pie');
      expect(service.getIconClass('utensils')).toBe('fas fa-utensils');
    });
  });

  describe('hasIcon', () => {
    it('should return true for valid icon names', () => {
      expect(service.hasIcon('download')).toBe(true);
      expect(service.hasIcon('refresh')).toBe(true);
      expect(service.hasIcon('chart-line')).toBe(true);
      expect(service.hasIcon('credit-card')).toBe(true);
      expect(service.hasIcon('utensils')).toBe(true);
    });

    it('should return false for invalid icon names', () => {
      expect(service.hasIcon('invalid-icon')).toBe(false);
      expect(service.hasIcon('')).toBe(false);
      expect(service.hasIcon('non-existent')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(service.hasIcon('Download')).toBe(false);
      expect(service.hasIcon('DOWNLOAD')).toBe(false);
    });
  });

  describe('icon categories', () => {
    it('should have navigation and UI icons', () => {
      expect(service.hasIcon('download')).toBe(true);
      expect(service.hasIcon('refresh')).toBe(true);
      expect(service.hasIcon('plus')).toBe(true);
      expect(service.hasIcon('minus')).toBe(true);
      expect(service.hasIcon('times')).toBe(true);
      expect(service.hasIcon('check')).toBe(true);
      expect(service.hasIcon('cog')).toBe(true);
      expect(service.hasIcon('bell')).toBe(true);
      expect(service.hasIcon('trash')).toBe(true);
    });

    it('should have arrow and direction icons', () => {
      expect(service.hasIcon('arrow-up')).toBe(true);
      expect(service.hasIcon('arrow-down')).toBe(true);
      expect(service.hasIcon('arrow-left')).toBe(true);
      expect(service.hasIcon('arrow-right')).toBe(true);
      expect(service.hasIcon('chevron-right')).toBe(true);
    });

    it('should have chart and data icons', () => {
      expect(service.hasIcon('chart-line')).toBe(true);
      expect(service.hasIcon('chart-pie')).toBe(true);
      expect(service.hasIcon('chart-bar')).toBe(true);
      expect(service.hasIcon('balance-scale')).toBe(true);
      expect(service.hasIcon('percentage')).toBe(true);
      expect(service.hasIcon('tag')).toBe(true);
      expect(service.hasIcon('wallet')).toBe(true);
      expect(service.hasIcon('clock')).toBe(true);
    });

    it('should have status indicator icons', () => {
      expect(service.hasIcon('check-circle')).toBe(true);
      expect(service.hasIcon('times-circle')).toBe(true);
      expect(service.hasIcon('exclamation-circle')).toBe(true);
      expect(service.hasIcon('exclamation-triangle')).toBe(true);
      expect(service.hasIcon('info-circle')).toBe(true);
      expect(service.hasIcon('circle')).toBe(true);
    });

    it('should have financial icons', () => {
      expect(service.hasIcon('credit-card')).toBe(true);
      expect(service.hasIcon('piggy-bank')).toBe(true);
      expect(service.hasIcon('shopping-cart')).toBe(true);
      expect(service.hasIcon('shield-alt')).toBe(true);
      expect(service.hasIcon('star')).toBe(true);
      expect(service.hasIcon('plane')).toBe(true);
    });

    it('should have category icons', () => {
      expect(service.hasIcon('utensils')).toBe(true);
      expect(service.hasIcon('car')).toBe(true);
      expect(service.hasIcon('gamepad')).toBe(true);
      expect(service.hasIcon('folder')).toBe(true);
    });

    it('should have network and connectivity icons', () => {
      expect(service.hasIcon('wifi')).toBe(true);
      expect(service.hasIcon('wifi-slash')).toBe(true);
      expect(service.hasIcon('sync-alt')).toBe(true);
    });

    it('should have file type icons', () => {
      expect(service.hasIcon('file-image')).toBe(true);
      expect(service.hasIcon('file-pdf')).toBe(true);
      expect(service.hasIcon('image')).toBe(true);
      expect(service.hasIcon('vector-square')).toBe(true);
    });

    it('should have search and zoom icons', () => {
      expect(service.hasIcon('search-plus')).toBe(true);
      expect(service.hasIcon('search-minus')).toBe(true);
      expect(service.hasIcon('expand-arrows-alt')).toBe(true);
      expect(service.hasIcon('expand')).toBe(true);
    });

    it('should have list and report icons', () => {
      expect(service.hasIcon('list-alt')).toBe(true);
      expect(service.hasIcon('lightbulb')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined inputs', () => {
      expect(service.getIcon(null as any)).toBe('fas fa-circle');
      expect(service.getIcon(undefined as any)).toBe('fas fa-circle');
      expect(service.hasIcon(null as any)).toBe(false);
      expect(service.hasIcon(undefined as any)).toBe(false);
    });

    it('should handle special characters in icon names', () => {
      expect(service.getIcon('icon-with-dash')).toBe('fas fa-circle');
      expect(service.getIcon('icon_with_underscore')).toBe('fas fa-circle');
      expect(service.getIcon('icon.with.dots')).toBe('fas fa-circle');
    });

    it('should handle very long icon names', () => {
      const longName = 'a'.repeat(1000);
      expect(service.getIcon(longName)).toBe('fas fa-circle');
      expect(service.hasIcon(longName)).toBe(false);
    });
  });
});
