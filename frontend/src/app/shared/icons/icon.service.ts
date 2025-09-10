import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private iconMap = new Map<string, string>([
    // Navigation and UI
    ['download', 'fas fa-download'],
    ['refresh', 'fas fa-redo'],
    ['plus', 'fas fa-plus'],
    ['minus', 'fas fa-minus'],
    ['times', 'fas fa-times'],
    ['check', 'fas fa-check'],
    ['cog', 'fas fa-cog'],
    ['bell', 'fas fa-bell'],
    ['trash', 'fas fa-trash'],
    
    // Arrows and directions
    ['arrow-up', 'fas fa-arrow-up'],
    ['arrow-down', 'fas fa-arrow-down'],
    ['arrow-left', 'fas fa-arrow-left'],
    ['arrow-right', 'fas fa-arrow-right'],
    ['chevron-right', 'fas fa-chevron-right'],
    
    // Charts and data
    ['chart-line', 'fas fa-chart-line'],
    ['chart-pie', 'fas fa-chart-pie'],
    ['chart-bar', 'fas fa-chart-bar'],
    ['balance-scale', 'fas fa-balance-scale'],
    ['percentage', 'fas fa-percentage'],
    ['tag', 'fas fa-tag'],
    ['wallet', 'fas fa-wallet'],
    ['clock', 'fas fa-clock'],
    
    // Status indicators
    ['check-circle', 'fas fa-check-circle'],
    ['times-circle', 'fas fa-times-circle'],
    ['exclamation-circle', 'fas fa-exclamation-circle'],
    ['exclamation-triangle', 'fas fa-exclamation-triangle'],
    ['info-circle', 'fas fa-info-circle'],
    ['circle', 'fas fa-circle'],
    
    // Financial icons
    ['credit-card', 'fas fa-credit-card'],
    ['piggy-bank', 'fas fa-piggy-bank'],
    ['shopping-cart', 'fas fa-shopping-cart'],
    ['shield-alt', 'fas fa-shield-alt'],
    ['star', 'fas fa-star'],
    ['plane', 'fas fa-plane'],
    
    // Category icons
    ['utensils', 'fas fa-utensils'],
    ['car', 'fas fa-car'],
    ['gamepad', 'fas fa-gamepad'],
    ['folder', 'fas fa-folder'],
    
    // Network and connectivity
    ['wifi', 'fas fa-wifi'],
    ['wifi-slash', 'fas fa-wifi-slash'],
    ['sync-alt', 'fas fa-sync-alt'],
    
    // File types
    ['file-image', 'fas fa-file-image'],
    ['file-pdf', 'fas fa-file-pdf'],
    ['image', 'fas fa-image'],
    ['vector-square', 'fas fa-vector-square'],
    
    // Search and zoom
    ['search-plus', 'fas fa-search-plus'],
    ['search-minus', 'fas fa-search-minus'],
    ['expand-arrows-alt', 'fas fa-expand-arrows-alt'],
    ['expand', 'fas fa-expand'],
    
    // Lists and reports
    ['list-alt', 'fas fa-list-alt'],
    ['lightbulb', 'fas fa-lightbulb']
  ]);

  getIcon(iconName: string): string {
    return this.iconMap.get(iconName) || 'fas fa-circle';
  }

  getIconClass(iconName: string): string {
    return this.getIcon(iconName);
  }

  hasIcon(iconName: string): boolean {
    return this.iconMap.has(iconName);
  }
}

