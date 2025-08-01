import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log("Made it here")
    if (this.isAuthenticated()) {
      // Check for required roles if specified in route data
    //   const requiredRoles = route.data['roles'] as string[];
    //   if (requiredRoles && requiredRoles.length > 0) {
    //     if (!this.hasRequiredRole(requiredRoles)) {
    //       this.router.navigate(['/unauthorized']);
    //       return false;
    //     }
    //   }
      return true;
    }

    // Not authenticated, redirect to login with return URL
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  private isAuthenticated(): boolean {

    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      console.log("isLogged:",payload.exp > currentTime)
      return payload.exp > currentTime;

    } catch {
      return false;
    }
  }

//   private hasRequiredRole(requiredRoles: string[]): boolean {
//     const userStr = localStorage.getItem('current_user');
//     if (!userStr) return false;

//     try {
//       const user = JSON.parse(userStr);
//       return requiredRoles.includes(user.role);
//     } catch {
//       return false;
//     }
//   }
}
