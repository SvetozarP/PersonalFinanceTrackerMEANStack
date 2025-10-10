import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthService } from '../../../features/auth/services/auth.service';
import { User } from '../../../core/models/auth.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals for reactive state
  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);
  currentRoute = signal('');
  isMenuOpen = signal(false);

  // Navigation items
  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/financial/transactions', label: 'Transactions', icon: '💳' },
    { path: '/financial/categories', label: 'Categories', icon: '📂' },
    { path: '/financial/budgets', label: 'Budgets', icon: '💰' },
    { path: '/financial/reports', label: 'Reports', icon: '📈' }
  ];

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuth => {
      this.isAuthenticated.set(isAuth);
    });

    // Subscribe to current user
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser.set(user);
    });

    // Track current route for active navigation highlighting
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute.set(event.url);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation methods
  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMobileMenu(): void {
    this.isMenuOpen.set(false);
  }

  // Authentication methods
  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  // Utility methods
  isActiveRoute(path: string): boolean {
    return this.currentRoute().startsWith(path);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.email) {
      return user.email;
    }
    
    return 'User';
  }
}


