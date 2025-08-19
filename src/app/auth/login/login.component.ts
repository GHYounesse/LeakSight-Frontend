import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { WebSocketService } from '../../service/websocket/websocket.service';
// Interface for login request
interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Interface for login response
interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  message?: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,CommonModule, HttpClientModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private websocketService: WebSocketService

  ) {
    this.loginForm = this.fb.group({
      email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
      password: [{ value: '', disabled: false }, [Validators.required, Validators.minLength(6)]],
      rememberMe: [{ value: false, disabled: true }]
    });
  }

  ngOnInit(): void {
    
    this.clearAuthData();
    
    
    
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {

    if (this.loginForm.valid) {
      this.clearMessages();
      this.loginForm.get('email')?.disable();
      this.loginForm.get('password')?.disable();
      this.loginForm.get('rememberMe')?.disable();
      this.isLoading = true;
      
      const loginData= {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
        
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('Login response:', response);
          this.successMessage = 'Login successful! Redirecting...';
          this.isLoading = false;
          if (response.access_token && response.refresh_token) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            localStorage.setItem('username', response.username);
          }
          // if (response.user) {
          //   localStorage.setItem('username', response.user.name);
          // }
          this.websocketService.connect();
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: () => {
          this.errorMessage = 'Login failed. Please try again.';
          this.isLoading = false;
          this.loginForm.get('email')?.enable();
          this.loginForm.get('password')?.enable();
          this.loginForm.get('rememberMe')?.enable();
        }
      });
    
    } else {
      this.markFormGroupTouched();
    }
  }

 

  /**
   * Handle successful login response
   */
 

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  }

  /**
   * Mark all form fields as touched to trigger validation
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Clear error and success messages
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
  /**
   * Navigate to the registration page
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  
  
}