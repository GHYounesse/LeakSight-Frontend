

import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenInterceptor: HttpInterceptorFn = (
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  // Skip auth endpoints
  const authEndpoints = ['/auth/login', '/auth/register', '/auth/reset_password', '/auth/request_reset_password','/auth/refresh'];
  if (authEndpoints.some(endpoint => request.url.includes(endpoint))) {
    return next(request);
  }

  // Attach token
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);
          const refreshToken = localStorage.getItem('refresh_token');

          if (!refreshToken) {
            logout(router);
            return throwError(() => new Error('No refresh token'));
          }

          return refreshAccessToken(refreshToken).pipe(
            switchMap((data: any) => {
              const newToken = data.access_token;
              localStorage.setItem('access_token', newToken);
              refreshTokenSubject.next(newToken);
              isRefreshing = false;
              return next(request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
            }),
            catchError(err => {
              isRefreshing = false;
              logout(router);
              return throwError(() => err);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(newToken =>
              next(request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
            )
          );
        }
      }
      return throwError(() => error);
    })
  );
};

function logout(router: Router) {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('current_user');
  router.navigate(['/login']);
}

function refreshAccessToken(refreshToken: string): Observable<any> {
  return new Observable(observer => {
    fetch('http://localhost:8080/auth/refresh', {
      method: 'POST',
      headers: {
        // Authorization: `Bearer ${refreshToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Token refresh failed');
      })
      .then(data => {
        observer.next(data);
        observer.complete();
      })
      .catch(error => observer.error(error));
  });
}

