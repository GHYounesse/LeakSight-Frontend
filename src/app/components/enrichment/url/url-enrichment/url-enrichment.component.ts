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
  selector: 'app-url-enrichment',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './url-enrichment.component.html',
  styleUrls: ['./url-enrichment.component.scss']
})
export class UrlEnrichmentComponent {
  currentPath: string;
  urlValue: string = '';
  response: EnrichmentResponse | null = null;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;
  jobIdCopied: boolean = false;
  urlPreview: any = null;
  recentSubmissions: Array<{
    url: string;
    jobId: string;
    status: string;
    timestamp: string;
  }> = [];

  

  constructor( private threatService: ThreatService, private router: Router) {
    this.currentPath = this.router.url;
  }

  ngOnInit(): void {
    this.loadRecentSubmissions();
  }



  onSubmit(): void {
    console.log("this.urlValue.trim()")
    if (!this.urlValue.trim()) return;

    this.isLoading = true;
    this.response = null;
    this.error = null;

    // Ensure URL has protocol
    let processedUrl = this.urlValue.trim();
    if (!processedUrl.match(/^https?:\/\//)) {
      processedUrl = 'http://' + processedUrl;
    }

    const payload: EnrichmentRequest = {
      ioc: processedUrl,
      ioc_type: 'url'
    };

    this.threatService.analyseIOC(payload)
      .pipe(
        catchError((error) => {
          console.error('API Error:', error);
          this.error = {
            error: error.error?.message || 'Failed to submit URL for analysis',
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
          this.addToRecentSubmissions(response, processedUrl);
        }
      });
  }

  getJobUrl(jobId: string): string {
    return `${window.location.origin}${this.currentPath}/${jobId}`;
  }

  private addToRecentSubmissions(response: EnrichmentResponse, url: string): void {
    const submission = {
      url: url,
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
    const saved = localStorage.getItem('url_enrichment_recent');
    if (saved) {
      try {
        this.recentSubmissions = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load recent URL submissions:', e);
      }
    }
  }

  private saveRecentSubmissions(): void {
    localStorage.setItem('url_enrichment_recent', JSON.stringify(this.recentSubmissions));
  }

  copyJobId(jobId?: string): void {
    const idToCopy = jobId || this.response?.job_id;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy).then(() => {
        this.jobIdCopied = true;
        setTimeout(() => {
          this.jobIdCopied = false;
        }, 2000);
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = idToCopy;
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

  navigateToResults(): void {
    if (this.response?.job_id) {
      this.router.navigate([`${this.currentPath}/${this.response.job_id}`]);
    }
  }

  checkStatus(): void {
    if (this.response?.job_id) {
      // Implement status checking logic here
      console.log('Checking status for job:', this.response.job_id);
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