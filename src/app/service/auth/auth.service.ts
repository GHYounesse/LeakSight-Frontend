import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { jwtDecode } from 'jwt-decode';


interface JwtPayload {
    sub: string;
    exp: number;
    iat: number;
    
  }
@Injectable({
    providedIn: 'root'})

export class AuthService {
    private apiUrl = 'http://localhost:8080/auth';
    private currentUserSubject=new BehaviorSubject<string | null>(null);

    private loggedIn$ = new BehaviorSubject<boolean>(false);

    isLoggedIn$: Observable<boolean> = this.loggedIn$.asObservable();

    constructor(private http:HttpClient) {
        const token = localStorage.getItem('access_token');
        if (token) {
            const decoded = jwtDecode<JwtPayload>(token);
            this.currentUserSubject.next(decoded.sub);
            this.loggedIn$.next(false);
    }
}
    login(data:{email:string;password:string}): Observable<any> {
        //return this.http.post(`${this.apiUrl}/login`, data);
        return this.http.post(`${this.apiUrl}/login`, data).pipe(
        tap((response: any) => {
        if (response.access_token && response.refresh_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('username', response.username);
          this.loggedIn$.next(true); // 🔑 tell navbar we’re logged in
        }
      })
    );
    }
    register(data:{username: string;email: string;password: string}): Observable<any> {
        console.log('Registering user:', data);
        console.log(`${this.apiUrl}/register`);
        return this.http.post(`${this.apiUrl}/register`, data);
    }

    requestResetPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/request_reset_password`, { email });
    }
    logout(): void {
        // localStorage.removeItem('token');
        this.loggedIn$.next(false);
        this.currentUserSubject.next(null);
    }
    saveToken(token: string): void {
        localStorage.setItem('token', token);
        const decoded = jwtDecode<JwtPayload>(token);
        this.currentUserSubject.next(decoded.sub);
    }
    getCurrentUser(): Observable<string | null> {
        return this.currentUserSubject.asObservable();
    }
    getUser():string{
        const user=localStorage.getItem('user');
        if(user){
            return JSON.parse(user).username;
        }
        return '';
    }
    isLoggedIn(): boolean {
        const token = localStorage.getItem('token');
        return !!token;
    }
    checkEmailCreateToken(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/request_reset_password`, { email });
    }
    resetPassword(token: string, new_password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset_password`, { token, new_password });
    }
    
}