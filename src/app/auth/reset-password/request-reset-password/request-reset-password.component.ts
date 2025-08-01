import {HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/auth/auth.service';
import   {OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-request-reset-password',
  imports: [HttpClientModule,CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './request-reset-password.component.html',
  styleUrl: './request-reset-password.component.scss'
})
export class RequestResetPasswordComponent implements OnInit {
  requestResetForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

   constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.requestResetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  

  

  

  onSubmit(): void {
    if (this.requestResetForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
        
      const  email=this.requestResetForm.get('email')?.value;
      this.authService.requestResetPassword(email).subscribe({
      next: (response) => {
        this.successMessage = 'Email sent successfully! Please check your inbox.';
        this.isLoading = false;
        
      },
      error: () => {
        
        this.errorMessage = 'Reset Password Request failed. Please try again.';
        this.isLoading = false;
      }
    });
      // Simulate API call
    
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.requestResetForm.controls).forEach(key => {
        this.requestResetForm.get(key)?.markAsTouched();
      });
    }
  }

  

  // Utility method to check if a field has a specific error
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.requestResetForm.get(fieldName);
    return !!(field && field.hasError(errorType) && field.touched);
  }

  // Utility method to check if a field is invalid and touched
  isFieldInvalid(fieldName: string): boolean {
    const field = this.requestResetForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  
}
