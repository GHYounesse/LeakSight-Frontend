import {HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import   {OnInit} from '@angular/core';
import { AuthService } from '../../../service/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [HttpClientModule,CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
    
  }

  ngOnInit(): void {
    // Clear messages when form values change
    this.resetPasswordForm.valueChanges.subscribe(() => {
      this.errorMessage = '';
      this.successMessage = '';
    });
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    // If no token is provided, redirect to login or show error
    if (!this.token) {
      this.errorMessage = 'Invalid or missing reset token. Please request a new password reset.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
  }
    
  }
  // Custom validator for password requirements
  passwordValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
    
    if (!valid) {
      return { pattern: true };
    }
    
    return null;
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(formGroup: AbstractControl): { [key: string]: any } | null {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      // Remove mismatch error if passwords match
      if (confirmPassword.errors && confirmPassword.errors['mismatch']) {
        delete confirmPassword.errors['mismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrengthPercentage(): number {
    const password = this.resetPasswordForm.get('password')?.value || '';
    if (!password) return 0;

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];

    strength = checks.filter(check => check).length;
    return (strength / 5) * 100;
  }

  getPasswordStrengthClass(): string {
    const percentage = this.getPasswordStrengthPercentage();
    
    if (percentage < 40) return 'bg-danger';
    if (percentage < 60) return 'bg-warning';
    if (percentage < 80) return 'bg-info';
    return 'bg-success';
  }

  getPasswordStrengthText(): string {
    const percentage = this.getPasswordStrengthPercentage();
    
    if (percentage === 0) return 'Enter a password';
    if (percentage < 40) return 'Weak';
    if (percentage < 60) return 'Fair';
    if (percentage < 80) return 'Good';
    return 'Strong';
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      
      const  new_password=this.resetPasswordForm.get('password')?.value;
      const token=this.token!;
      this.authService.resetPassword(token, new_password).subscribe({
        next: (response) => {
          this.successMessage = 'Password updated successfully!';
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to update password. Please try again.';
          this.isLoading = false;
        }
      });
      
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        const control = this.resetPasswordForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

 

  
}
