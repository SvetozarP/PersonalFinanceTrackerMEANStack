import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <mat-card class="welcome-card">
        <mat-card-header>
          <mat-card-title>Welcome to Finance Tracker!</mat-card-title>
          <mat-card-subtitle>Your personal finance management dashboard</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>You are successfully logged in!</p>
          <p>User: {{ (authService.currentUser$ | async)?.firstName }} {{ (authService.currentUser$ | async)?.lastName }}</p>
          <p>Email: {{ (authService.currentUser$ | async)?.email }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="warn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .welcome-card {
      margin-top: 20px;
    }
    
    mat-card-actions {
      padding: 16px;
    }
  `]
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
