import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-not-found',
  imports:[DatePipe,CommonModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <!-- Animated Error Icon -->
        <div class="error-icon">
          <div class="shield-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" 
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="warning-overlay">⚠️</div>
        </div>

        <!-- Error Code -->
        <div class="error-code">404</div>
        
        <!-- Error Message -->
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-description">
          The requested intelligence endpoint could not be located in our monitoring systems.
          This could indicate a compromised route or an invalid intelligence path.
        </p>

        <!-- Current Path Display -->
        <div class="current-path" *ngIf="currentPath">
          <span class="path-label">Attempted Path:</span>
          <code class="path-code">{{ currentPath }}</code>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn btn-primary" (click)="goHome()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" 
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Return to Command Center
          </button>
          
          <button class="btn btn-secondary" (click)="goBack()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" stroke-width="2" 
                    stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" 
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Go Back
          </button>
          
          <button class="btn btn-outline" (click)="reportIssue()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13" stroke="currentColor" stroke-width="2" 
                    stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" 
                    stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            </svg>
            Report Security Issue
          </button>
        </div>

        <!-- Quick Navigation -->
        <div class="quick-nav">
          <div class="nav-title">Quick Access Points:</div>
          <div class="nav-links">
            <a (click)="navigateTo('/dashboard')" class="nav-link">
              📊 Dashboard
            </a>
            <a (click)="navigateTo('/monitoring')" class="nav-link">
              🔍 Monitoring
            </a>
            <a (click)="navigateTo('/alerts')" class="nav-link">
              🚨 Alerts
            </a>
            <a (click)="navigateTo('/analytics')" class="nav-link">
              📈 Analytics
            </a>
          </div>
        </div>

        <!-- System Status -->
        <div class="system-status">
          <div class="status-indicator">
            <div class="status-dot online"></div>
            <span>Monitoring Systems: ONLINE</span>
          </div>
          <div class="timestamp">{{ currentTime | date:'medium' }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    

    .not-found-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--background-dark) 0%, var(--primary-color) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }

    .not-found-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(233, 69, 96, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    .not-found-content {
      text-align: center;
      max-width: 600px;
      z-index: 1;
      position: relative;
    }

    .error-icon {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 2rem;
      animation: pulse 2s infinite;
    }

    .shield-icon {
      width: 100%;
      height: 100%;
      color: var(--info-color);
      opacity: 0.8;
    }

    .shield-icon svg {
      width: 100%;
      height: 100%;
    }

    .warning-overlay {
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 2rem;
      animation: bounce 1s infinite alternate;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 900;
      color: var(--danger-color);
      margin-bottom: 1rem;
      text-shadow: 0 0 30px rgba(233, 69, 96, 0.5);
      animation: glow 2s ease-in-out infinite alternate;
    }

    .error-title {
      font-size: 2.5rem;
      color: var(--text-primary);
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .error-description {
      color: var(--text-secondary);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .current-path {
      background: var(--secondary-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .path-label {
      display: block;
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .path-code {
      color: var(--warning-color);
      background: var(--background-dark);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      word-break: break-all;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 3rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      font-size: 0.95rem;
    }

    .btn-icon {
      width: 18px;
      height: 18px;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--info-color), var(--accent-color));
      color: var(--background-dark);
      box-shadow: var(--shadow);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }

    .btn-secondary {
      background: var(--secondary-color);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--accent-color);
      transform: translateY(-2px);
    }

    .btn-outline {
      background: transparent;
      color: var(--warning-color);
      border: 1px solid var(--warning-color);
    }

    .btn-outline:hover {
      background: var(--warning-color);
      color: var(--background-dark);
      transform: translateY(-2px);
    }

    .quick-nav {
      margin-bottom: 2rem;
    }

    .nav-title {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .nav-links {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .nav-link:hover {
      color: var(--info-color);
      background: var(--secondary-color);
      border-color: var(--border-color);
      transform: translateY(-1px);
    }

    .system-status {
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse-dot 1.5s infinite;
    }

    .status-dot.online {
      background: var(--success-color);
      box-shadow: 0 0 10px var(--success-color);
    }

    .timestamp {
      color: var(--text-muted);
      font-size: 0.85rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-10px); }
    }

    @keyframes glow {
      0% { text-shadow: 0 0 30px rgba(233, 69, 96, 0.5); }
      100% { text-shadow: 0 0 50px rgba(233, 69, 96, 0.8); }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 768px) {
      .error-code {
        font-size: 5rem;
      }
      
      .error-title {
        font-size: 1.8rem;
      }
      
      .action-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .btn {
        width: 100%;
        max-width: 280px;
        justify-content: center;
      }
      
      .nav-links {
        flex-direction: column;
        align-items: center;
      }
      
      .system-status {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class NotFoundComponent {
  currentPath: string = '';
  currentTime: Date = new Date();

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.currentPath = this.router.url;
    
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.location.back();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  reportIssue(): void {
    // Implement your issue reporting logic here
    console.log('Reporting security issue for path:', this.currentPath);
    
    // Example: Open a modal, navigate to support page, or send analytics event
    // You could also integrate with your threat intelligence system to log this as a potential security event
    alert('Security issue reported. Our threat intelligence team has been notified.');
  }
}