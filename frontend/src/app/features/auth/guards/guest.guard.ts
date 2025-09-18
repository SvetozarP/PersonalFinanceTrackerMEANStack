import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('GuestGuard: canActivate called');
    
    return this.authService.isAuthenticated$.pipe(
      map(isAuthenticated => {
        console.log('GuestGuard: Authentication check result:', isAuthenticated);
        if (!isAuthenticated) {
          return true;
        } else {
          try {
            const navigationResult = this.router.navigate(['/dashboard']);
            if (navigationResult && typeof navigationResult.catch === 'function') {
              navigationResult.catch(error => {
                console.error('GuestGuard navigation error:', error);
                // If navigation fails, still return false to prevent access
              });
            }
          } catch (error) {
            console.error('GuestGuard navigation error:', error);
            // If navigation fails, still return false to prevent access
          }
          return false;
        }
      }),
      catchError(error => {
        console.error('GuestGuard error:', error);
        // On error, allow access (fail open for guest routes)
        return of(true);
      })
    );
  }
}
