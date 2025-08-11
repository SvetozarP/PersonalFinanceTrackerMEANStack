import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
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
    
    // Initialize auth service if not already done
    this.authService.initializeAuth();
    
    return this.authService.isAuthenticated$.pipe(
      map(isAuthenticated => {
        console.log('GuestGuard: Authentication check result:', isAuthenticated);
        if (!isAuthenticated) {
          return true;
        } else {
          this.router.navigate(['/dashboard']);
          return false;
        }
      })
    );
  }
}
