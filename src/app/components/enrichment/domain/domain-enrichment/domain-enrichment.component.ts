import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
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
  selector: 'app-domain-enrichment',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './domain-enrichment.component.html',
  styleUrls: ['./domain-enrichment.component.scss']
})
export class DomainEnrichmentComponent {
  domainValue: string = '';
  response: EnrichmentResponse | null = null;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;
  jobIdCopied: boolean = false;
  detectedDomainInfo: { tld: string; isSubdomain: boolean } | null = null;
  recentSubmissions: Array<{
    domain: string;
    domainInfo: string;
    jobId: string;
    status: string;
    timestamp: string;
  }> = [];

  private readonly apiUrl = 'http://localhost:8000/api/v1/enrichment/analyze';

  constructor(private http: HttpClient, private threatService: ThreatService) {}

  ngOnInit(): void {
    this.loadRecentSubmissions();
  }

  onDomainChange(): void {
    this.detectedDomainInfo = this.analyzeDomain(this.domainValue);
  }

  private analyzeDomain(domain: string): { tld: string; isSubdomain: boolean } | null {
    if (!domain || !domain.includes('.')) return null;
    
    const cleanDomain = domain.trim().toLowerCase();
    const parts = cleanDomain.split('.');
    
    if (parts.length < 2) return null;
    
    const tld = parts[parts.length - 1];
    const isSubdomain = parts.length > 2;
    
    return { tld, isSubdomain };
  }

  onSubmit(): void {
    if (!this.domainValue.trim()) return;

    this.isLoading = true;
    this.response = null;
    this.error = null;
    this.detectedDomainInfo = this.analyzeDomain(this.domainValue);

    const payload: EnrichmentRequest = {
      ioc: this.domainValue.trim().toLowerCase(),
      ioc_type: 'domain'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.threatService.analyseIOC(payload).pipe(
        catchError((error) => {
          console.error('API Error:', error);
          this.error = {
            error: error.error?.message || 'Failed to submit domain for analysis',
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

  private addToRecentSubmissions(response: EnrichmentResponse): void {
    const domainInfo = this.detectedDomainInfo;
    let infoString = 'Domain';
    
    if (domainInfo) {
      infoString = domainInfo.isSubdomain ? `Subdomain (.${domainInfo.tld})` : `Root Domain (.${domainInfo.tld})`;
    }

    const submission = {
      domain: this.domainValue.trim().toLowerCase(),
      domainInfo: infoString,
      jobId: response.job_id,
      status: response.status,
      timestamp: new Date().toISOString()
    };

    this.recentSubmissions.unshift(submission);
    
    // Keep only the last 5 submissions
    if (this.recentSubmissions.length > 5) {
      this.recentSubmissions = this.recentSubmissions.slice(0, 5);
    }

    this.saveRecentSubmissions();
  }

  private loadRecentSubmissions(): void {
    const saved = localStorage.getItem('domain_enrichment_recent');
    if (saved) {
      try {
        this.recentSubmissions = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load recent submissions:', e);
      }
    }
  }

  private saveRecentSubmissions(): void {
    localStorage.setItem('domain_enrichment_recent', JSON.stringify(this.recentSubmissions));
  }

  copyJobId(): void {
    if (this.response?.job_id) {
      navigator.clipboard.writeText(this.response.job_id).then(() => {
        this.jobIdCopied = true;
        setTimeout(() => {
          this.jobIdCopied = false;
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
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