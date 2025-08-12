import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private tokenService: TokenService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token for public auth endpoints (login, register, refresh-token)
    // But allow protected auth endpoints (profile, logout) to get tokens
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh-token')) {
      return next.handle(req);
    }

    const token = this.tokenService.getAccessToken();
    
    if (token) {
      req = this.addToken(req, token);
    }

    return next.handle(req);
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}

// Functional interceptor for use with provideHttpClient
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  // Skip token for public auth endpoints (login, register, refresh-token)
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh-token')) {
    return next(req);
  }

  // Get token from localStorage directly for functional interceptor
  const token = localStorage.getItem('access_token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};