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
  selector: 'app-hash-enrichment',
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './hash-enrichment.component.html',
  styleUrls: ['./hash-enrichment.component.scss']
})
export class HashEnrichmentComponent {
  currentPath: string;
  hashValue: string = '';
  response: EnrichmentResponse | null = null;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;
  jobIdCopied: boolean = false;
  detectedHashType: string = '';
  recentSubmissions: Array<{
    hash: string;
    hashType: string;
    jobId: string;
    status: string;
    timestamp: string;
  }> = [];

  

  constructor(private http: HttpClient,private threatService: ThreatService,private router: Router) {
     this.currentPath = this.router.url;
  }

  ngOnInit(): void {
    this.loadRecentSubmissions();
  }

  onHashChange(): void {
    this.detectedHashType = this.detectHashType(this.hashValue);
  }

  private detectHashType(hash: string): string {
    if (!hash) return '';
    
    const cleanHash = hash.replace(/[^a-fA-F0-9]/g, '');
    
    if (cleanHash.length === 32) return 'md5';
    if (cleanHash.length === 40) return 'sha1';
    if (cleanHash.length === 64) return 'sha256';
    
    return '';
  }

  onSubmit(): void {
    if (!this.hashValue.trim()) return;

    this.isLoading = true;
    this.response = null;
    this.error = null;
    this.detectedHashType = this.detectHashType(this.hashValue);

    const payload: EnrichmentRequest = {
      ioc: this.hashValue.trim().toLowerCase(),
      ioc_type: 'hash'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.threatService.analyseIOC(payload).pipe(
        catchError((error) => {
          console.error('API Error:', error);
          this.error = {
            error: error.error?.message || 'Failed to submit hash for analysis',
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
      hash: this.hashValue.trim().toLowerCase(),
      hashType: this.detectedHashType || 'unknown',
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
    const saved = localStorage.getItem('hash_enrichment_recent');
    if (saved) {
      try {
        this.recentSubmissions = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load recent submissions:', e);
      }
    }
  }

  private saveRecentSubmissions(): void {
    localStorage.setItem('hash_enrichment_recent', JSON.stringify(this.recentSubmissions));
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