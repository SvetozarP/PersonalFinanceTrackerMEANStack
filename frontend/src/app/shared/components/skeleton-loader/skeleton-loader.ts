import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'title' | 'avatar' | 'button' | 'card' | 'list-item' | 'chart' | 'table-row';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton-loader"
      [class]="'skeleton-' + type"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius">
    </div>
  `,
  styleUrls: ['./skeleton-loader.scss']
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width: string = '100%';
  @Input() height: string = '1rem';
  @Input() borderRadius: string = '4px';
}
