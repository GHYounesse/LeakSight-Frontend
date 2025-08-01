import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ThreatService } from '../../../../service/threat/threat.service';

interface EnrichmentRequest {
  ioc: string;
  ioc_type: string;
}

interface EnrichmentResponse {
  job_id: string;
  status: string;
  message: string;
  estimated_completion: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

@Component({
  selector: 'app-ip-enrichment',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './ip-enrichment.component.html',
  styleUrls: ['./ip-enrichment.component.scss']
})
export class IpEnrichmentComponent {
  currentPath: string;
  ipValue: string = '';
  response: EnrichmentResponse | null = null;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;
  jobIdCopied: boolean = false;
  detectedIpType: string = '';
  recentSubmissions: Array<{
    ip: string;
    jobId: string;
    status: string;
    timestamp: string;
  }> = [];

  

  constructor(private http: HttpClient, private threatService: ThreatService, private router: Router) {
    this.currentPath = this.router.url;
  }

  ngOnInit(): void {
    this.loadRecentSubmissions();
  }

  onIpChange(): void {
    this.detectedIpType = this.detectIpType(this.ipValue);
  }

  private detectIpType(ip: string): string {
    if (!ip) return '';
    const parts = ip.split('.').map(Number);
    if (parts.some(p => p < 0 || p > 255)) return 'Invalid';
    // You can extend this with logic for private, reserved, etc.
    return 'IPv4';
  }

  onSubmit(): void {
    if (!this.ipValue.trim()) return;

    this.isLoading = true;
    this.response = null;
    this.error = null;
    this.detectedIpType = this.detectIpType(this.ipValue);

    const payload: EnrichmentRequest = {
      ioc: this.ipValue.trim(),
      ioc_type: 'ip'  // Updated to 'ip'
    };

    this.threatService.analyseIOC(payload)
      .pipe(
        catchError((error) => {
          console.error('API Error:', error);
          this.error = {
            error: error.error?.message || 'Failed to submit IP for analysis',
            details: error.error?.details || `HTTP ${error.status}: ${error.statusText}`
          };
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          this.response = response;
          this.addToRecentSubmissions(response);
        }
      });
  }

  getJobUrl(jobId: string): string {
    return `${window.location.origin}${this.currentPath}/${jobId}`;
  }

  private addToRecentSubmissions(response: EnrichmentResponse): void {
    const submission = {
      ip: this.ipValue.trim(),
      jobId: response.job_id,
      status: response.status,
      timestamp: new Date().toISOString()
    };
    this.recentSubmissions.unshift(submission);
    if (this.recentSubmissions.length > 5) {
      this.recentSubmissions = this.recentSubmissions.slice(0, 5);
    }
    this.saveRecentSubmissions();
  }

  private loadRecentSubmissions(): void {
    const saved = localStorage.getItem('ip_enrichment_recent');
    if (saved) {
      try {
        this.recentSubmissions = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load recent IP submissions:', e);
      }
    }
  }

  private saveRecentSubmissions(): void {
    localStorage.setItem('ip_enrichment_recent', JSON.stringify(this.recentSubmissions));
  }

  copyJobId(): void {
    if (this.response?.job_id) {
      navigator.clipboard.writeText(this.response.job_id).then(() => {
        this.jobIdCopied = true;
        setTimeout(() => {
          this.jobIdCopied = false;
        }, 2000);
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = this.response!.job_id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.jobIdCopied = true;
        setTimeout(() => {
          this.jobIdCopied = false;
        }, 2000);
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  getTimeRemaining(dateString: string): string {
    const now = new Date();
    const target = new Date(dateString);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return 'Overdue';
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    if (diffMins < 60) {
      return `~${diffMins} minute${diffMins !== 1 ? 's' : ''} remaining`;
    }
    const diffHours = Math.ceil(diffMins / 60);
    return `~${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
  }

  trackByJobId(index: number, item: any): string {
    return item.jobId;
  }
}