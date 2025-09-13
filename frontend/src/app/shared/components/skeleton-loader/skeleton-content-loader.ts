import { Component, Input, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from './skeleton-loader';

export type SkeletonLayout = 'card' | 'list' | 'form' | 'table' | 'chart' | 'metrics';

@Component({
  selector: 'app-skeleton-content-loader',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-content-loader" [ngClass]="'layout-' + layout">
      <!-- Card Layout -->
      <div *ngIf="layout === 'card'" class="skeleton-card-layout">
        <div class="skeleton-card" *ngFor="let item of skeletonItems; trackBy: trackByIndex">
          <div class="skeleton-card-header">
            <app-skeleton-loader type="avatar" width="3rem" height="3rem"></app-skeleton-loader>
            <div class="skeleton-card-title-group">
              <app-skeleton-loader type="title" width="60%" height="1.25rem"></app-skeleton-loader>
              <app-skeleton-loader type="text" width="40%" height="0.875rem"></app-skeleton-loader>
            </div>
          </div>
          <div class="skeleton-card-content">
            <app-skeleton-loader type="text" width="100%" height="0.875rem"></app-skeleton-loader>
            <app-skeleton-loader type="text" width="80%" height="0.875rem"></app-skeleton-loader>
            <app-skeleton-loader type="text" width="60%" height="0.875rem"></app-skeleton-loader>
          </div>
          <div class="skeleton-card-actions">
            <app-skeleton-loader type="button" width="5rem" height="2rem"></app-skeleton-loader>
            <app-skeleton-loader type="button" width="5rem" height="2rem"></app-skeleton-loader>
          </div>
        </div>
      </div>

      <!-- List Layout -->
      <div *ngIf="layout === 'list'" class="skeleton-list-layout">
        <div class="skeleton-list-item" *ngFor="let item of skeletonItems; trackBy: trackByIndex">
          <app-skeleton-loader type="avatar" width="2.5rem" height="2.5rem"></app-skeleton-loader>
          <div class="skeleton-list-content">
            <app-skeleton-loader type="title" width="70%" height="1rem"></app-skeleton-loader>
            <app-skeleton-loader type="text" width="50%" height="0.75rem"></app-skeleton-loader>
          </div>
          <app-skeleton-loader type="text" width="4rem" height="1rem"></app-skeleton-loader>
        </div>
      </div>

      <!-- Form Layout -->
      <div *ngIf="layout === 'form'" class="skeleton-form-layout">
        <div class="skeleton-form-group" *ngFor="let item of skeletonItems; trackBy: trackByIndex">
          <app-skeleton-loader type="text" width="30%" height="0.875rem"></app-skeleton-loader>
          <app-skeleton-loader type="button" width="100%" height="2.5rem"></app-skeleton-loader>
        </div>
        <div class="skeleton-form-actions">
          <app-skeleton-loader type="button" width="6rem" height="2.5rem"></app-skeleton-loader>
          <app-skeleton-loader type="button" width="6rem" height="2.5rem"></app-skeleton-loader>
        </div>
      </div>

      <!-- Table Layout -->
      <div *ngIf="layout === 'table'" class="skeleton-table-layout">
        <div class="skeleton-table-header">
          <app-skeleton-loader type="text" width="20%" height="1rem"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="30%" height="1rem"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="25%" height="1rem"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="25%" height="1rem"></app-skeleton-loader>
        </div>
        <div class="skeleton-table-row" *ngFor="let item of skeletonItems; trackBy: trackByIndex">
          <app-skeleton-loader type="text" width="20%" height="0.875rem"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="30%" height="0.875rem"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="25%" height="0.875rem"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="25%" height="0.875rem"></app-skeleton-loader>
        </div>
      </div>

      <!-- Chart Layout -->
      <div *ngIf="layout === 'chart'" class="skeleton-chart-layout">
        <div class="skeleton-chart-header">
          <app-skeleton-loader type="title" width="40%" height="1.25rem"></app-skeleton-loader>
          <app-skeleton-loader type="button" width="6rem" height="2rem"></app-skeleton-loader>
        </div>
        <app-skeleton-loader type="chart" width="100%" height="12rem"></app-skeleton-loader>
      </div>

      <!-- Metrics Layout -->
      <div *ngIf="layout === 'metrics'" class="skeleton-metrics-layout">
        <div class="skeleton-metric" *ngFor="let item of skeletonItems; trackBy: trackByIndex">
          <app-skeleton-loader type="text" width="60%" height="0.875rem"></app-skeleton-loader>
          <app-skeleton-loader type="title" width="80%" height="1.5rem"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="40%" height="0.75rem"></app-skeleton-loader>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./skeleton-content-loader.scss']
})
export class SkeletonContentLoaderComponent {
  @Input() layout: SkeletonLayout = 'card';
  @Input() count: number = 3;

  get safeCount(): number {
    return this.count && this.count > 0 ? this.count : 0;
  }

  get skeletonItems(): number[] {
    const count = this.safeCount;
    return Array.from({ length: count }, (_, i) => i);
  }

  trackByIndex: TrackByFunction<number> = (index: number) => index;
}
