// import { Injectable } from '@angular/core';
// import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse,HttpHeaders } from '@angular/common/http';
// import { Observable, throwError, BehaviorSubject } from 'rxjs';
// import { catchError, filter, take, switchMap } from 'rxjs/operators';
// import { Router } from '@angular/router';

// @Injectable()
// export class TokenInterceptor implements HttpInterceptor {
//   private isRefreshing = false;
//   private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

//   constructor(private router: Router) {}

//   intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
//     // Skip adding token for authentication endpoints
//     if (this.isAuthEndpoint(request.url)) {
//       return next.handle(request);
//     }

//     // Add token to all other requests
//     const authRequest = this.addTokenHeader(request);
    
//     return next.handle(authRequest).pipe(
//       catchError(error => {
//         if (error instanceof HttpErrorResponse && error.status === 401) {
//           return this.handle401Error(authRequest, next);
//         }
//         return throwError(() => error);
//       })
//     );
//   }

//   private isAuthEndpoint(url: string): boolean {
//     const authEndpoints = ['/auth/login', '/auth/register','/auth/reset_password','/auth/request_reset_password'];
//     return authEndpoints.some(endpoint => url.includes(endpoint));
//   }

//   private addTokenHeader(request: HttpRequest<any>): HttpRequest<any> {
//     const token = this.getToken();
    
//     if (token) {
//       return request.clone({
//         setHeaders: {
//           Authorization: `Bearer ${token}`
//         }
//       });
//     }
    
//     return request;
//   }

//   private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     if (!this.isRefreshing) {
//       this.isRefreshing = true;
//       this.refreshTokenSubject.next(null);

//       const refreshToken = this.getRefreshToken();
      
//       if (refreshToken) {
//         return this.refreshToken(refreshToken).pipe(
//           switchMap((tokenResponse: any) => {
//             this.isRefreshing = false;
//             this.refreshTokenSubject.next(tokenResponse.access_token);
            
//             // Store new access token
//             localStorage.setItem('access_token', tokenResponse.access_token);
            
//             // Retry original request with new token
//             return next.handle(this.addTokenHeader(request));
//           }),
//           catchError((error) => {
//             this.isRefreshing = false;
//             this.logout();
//             return throwError(() => error);
//           })
//         );
//       } else {
//         this.logout();
//         return throwError(() => new Error('No refresh token available'));
//       }
//     } else {
//       // If already refreshing, wait for the new token
//       return this.refreshTokenSubject.pipe(
//         filter(token => token != null),
//         take(1),
//         switchMap(() => {
//           return next.handle(this.addTokenHeader(request));
//         })
//       );
//     }
//   }

//   private refreshToken(refreshToken: string): Observable<any> {
//     // Make HTTP request to refresh endpoint
//     const refreshRequest = new HttpRequest('POST',
//        'http://localhost:8080/auth/refresh',
//         {},
//          {
//     headers: new HttpHeaders({
//       'Authorization': `Bearer ${refreshToken}`
//     })
//   });

//     return new Observable(observer => {
//       // You can inject HttpClient here or use a service
//       // For simplicity, using fetch API
//       fetch('http://localhost:8080/auth/refresh', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${refreshToken}`,
//           'Content-Type': 'application/json'
//         }
//       })
//       .then(response => {
//         if (response.ok) {
//           return response.json();
//         }
//         throw new Error('Token refresh failed');
//       })
//       .then(data => {
//         observer.next(data);
//         observer.complete();
//       })
//       .catch(error => {
//         observer.error(error);
//       });
//     });
//   }

//   private getToken(): string | null {
//     return localStorage.getItem('access_token');
//   }

//   private getRefreshToken(): string | null {
//     return localStorage.getItem('refresh_token');
//   }

//   private logout(): void {
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('refresh_token');
//     localStorage.removeItem('current_user');
//     this.router.navigate(['/login']);
//   }
// }

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

