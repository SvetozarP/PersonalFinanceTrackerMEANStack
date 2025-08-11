import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Initialize auth service if not already done
    this.authService.initializeAuth();
    
    return this.authService.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          this.router.navigate(['/auth/login']);
          return false;
        }
      })
    );
  }
}
