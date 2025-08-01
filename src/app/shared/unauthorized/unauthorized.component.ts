
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-required',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-required-container">
      <div class="welcome-card">
        <!-- Welcome Header -->
        <div class="welcome-header">
          <div class="welcome-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h1 class="welcome-title">Welcome Back!</h1>
          <p class="welcome-subtitle">Please sign in to access your account</p>
        </div>

        <!-- Main Content -->
        <div class="card-content">
          <div class="login-prompt">
            <h2>Authentication Required</h2>
            <p class="prompt-description">
              To access this content, you'll need to sign in to your account. 
              We keep your data secure and your experience personalized.
            </p>
            
            <div class="benefits-list">
              <div class="benefit-item">
                <div class="benefit-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <span>Secure and encrypted access</span>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span>Personalized experience</span>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                  </svg>
                </div>
                <span>Access to all features</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="btn btn-primary" (click)="goToLogin()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign In
            </button>
            <button class="btn btn-secondary" (click)="goToSignup()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Create Account
            </button>
          </div>

          <!-- Help Section -->
          <div class="help-section">
            <p class="help-text">
              Need help accessing your account?
              <button class="link-button" (click)="contactSupport()">Contact Support</button>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          <div class="footer-links">
            <a href="#" class="footer-link">Privacy Policy</a>
            <a href="#" class="footer-link">Terms of Service</a>
            <a href="#" class="footer-link">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-required-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--background-dark) 0%, var(--primary-color) 100%);
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .welcome-card {
      background: var(--secondary-color);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: var(--shadow-hover);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .welcome-header {
      background: linear-gradient(135deg, var(--accent-color) 0%, var(--info-color) 100%);
      color: var(--text-primary);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .welcome-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(125, 230, 231, 0.1) 50%, transparent 70%);
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }

    .welcome-icon {
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }

    .welcome-icon svg {
      filter: drop-shadow(0 4px 8px rgba(0, 212, 255, 0.3));
      color: var(--info-color);
    }

    .welcome-title {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }

    .welcome-subtitle {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
      color: var(--text-light);
      position: relative;
      z-index: 1;
    }

    .card-content {
      padding: 40px 30px;
      background: var(--secondary-color);
    }

    .login-prompt h2 {
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      text-align: center;
    }

    .prompt-description {
      margin: 0 0 32px 0;
      font-size: 16px;
      color: var(--text-secondary);
      text-align: center;
      line-height: 1.6;
    }

    .benefits-list {
      margin-bottom: 32px;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding: 12px;
      background: var(--primary-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .benefit-item:hover {
      background: var(--accent-color);
      border-color: var(--info-color);
      transform: translateX(4px);
      box-shadow: var(--shadow);
    }

    .benefit-icon {
      margin-right: 12px;
      color: var(--info-color);
      flex-shrink: 0;
    }

    .benefit-item span {
      font-size: 14px;
      color: var(--text-light);
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent-color) 0%, var(--info-color) 100%);
      color: var(--primary-color);
      font-weight: 700;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }

    .btn-secondary {
      background: var(--primary-color);
      color: var(--text-light);
      border: 2px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--accent-color);
      border-color: var(--info-color);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }

    .help-section {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .help-text {
      margin: 0;
      font-size: 14px;
      color: var(--text-muted);
    }

    .link-button {
      background: none;
      border: none;
      color: var(--info-color);
      cursor: pointer;
      text-decoration: underline;
      font-size: 14px;
      padding: 0;
      margin-left: 4px;
    }

    .link-button:hover {
      color: var(--text-light);
    }

    .card-footer {
      background: var(--primary-color);
      padding: 20px 30px;
      border-top: 1px solid var(--border-color);
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .footer-link {
      font-size: 13px;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: var(--info-color);
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .login-required-container {
        padding: 10px;
      }
      
      .welcome-header {
        padding: 30px 20px;
      }
      
      .card-content {
        padding: 30px 20px;
      }
      
      .welcome-title {
        font-size: 24px;
      }
      
      .action-buttons {
        gap: 8px;
      }
      
      .footer-links {
        gap: 16px;
      }
    }
  `]
})
export class UnauthorizedComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Component initialization if needed
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    this.router.navigate(['/register']);
  }

  contactSupport(): void {
    // Implement your support contact logic here
    // This could open a modal, navigate to support page, or open email client
    console.log('Opening support contact options');
    // Example: window.open('mailto:support@yourcompany.com');
  }
}
