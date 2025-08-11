import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  const tokenService = inject(TokenService);

  // Skip token for public auth endpoints (login, register, refresh-token)
  // But allow protected auth endpoints (profile, logout) to get tokens
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh-token')) {
    return next(req);
  }

  const token = tokenService.getAccessToken();
  
  if (token) {
    req = addToken(req, token);
  }

  return next(req);
};

function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}