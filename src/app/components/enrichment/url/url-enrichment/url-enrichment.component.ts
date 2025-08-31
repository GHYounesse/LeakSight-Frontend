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
interface GeographicInfo {
  country: string;
  location: string | null;
}

interface NetworkInfo {
  domain: string;
  hostname: string;
  tld: string;
  ip_addresses: string[];
  asn_info: any;
  urlscan_uuid?: string;
  urlscan_result?: string;
  urlscan_api?: string;
  urlscan_visibility?: string;
  urlscan_options?: any;
  alexa_info?: string;
  whois_info?: string;
  related_indicators?: {
    alienvault_count: number;
    other_sources_count: number;
  };
}

interface DetectionEngines {
  total: number;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout: number;
}

interface HttpInfo {
  response_code: number;
  content_length: number;
  content_sha256: string;
  headers: { [key: string]: string };
  title: string;
}

interface SubmissionInfo {
  first_submission: string;
  last_analysis: string;
  times_submitted: number;
}

interface Pulse {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  tags: string[];
  references: string[];
  malware_families: string[];
  adversary: string;
  targeted_countries: string[];
  industries: string[];
  tlp: string;
  author: string;
}

interface URLEnrichmentResult {
  sources: string[];
  url: string;
  final_url: string;
  redirection_chain: string[];
  geographic_info: GeographicInfo;
  threat_actors: string[];
  severity: string;
  confidence_score: number;
  reputation_score: number;
  malware_families: string[];
  threat_types: string[];
  network_info: NetworkInfo;
  detection_engines: DetectionEngines;
  tags: string[];
  categories: { [key: string]: string };
  threat_names: string[];
  http_info: HttpInfo;
  submission_info: SubmissionInfo;
  pulses: Pulse[];
  outgoing_links: string[];
  last_seen: string;
  verdict: string;
}

@Component({
  selector: 'app-url-enrichment',
  imports: [ReactiveFormsModule,CommonModule,  FormsModule],
  templateUrl: './url-enrichment.component.html',
  styleUrls: ['./url-enrichment.component.scss']
})
export class UrlEnrichmentComponent {
  currentPath: string;
  urlValue: string = '';
  result: URLEnrichmentResult | null = null;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;
  objectKeys = Object.keys;
  // jobIdCopied: boolean = false;
  urlPreview: any = null;
  // recentSubmissions: Array<{
  //   url: string;
  //   jobId: string;
  //   status: string;
  //   timestamp: string;
  // }> = [];

  

  constructor( private threatService: ThreatService, private router: Router) {
    this.currentPath = this.router.url;
  }

  ngOnInit(): void {
    // this.loadRecentSubmissions();
  }



  onSubmit(): void {
    console.log("this.urlValue.trim()")
    if (!this.urlValue.trim()) return;

    this.isLoading = true;
    this.result = null;
    // this.error = null;

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
          this.result = response.result;
          //this.addToRecentSubmissions(response, processedUrl);
        }
      });
  }
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatLastSeen(lastSeen: string): string {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays}d ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}w ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}m ago`;
    return `${Math.ceil(diffDays / 365)}y ago`;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatThreatName(threat: string): string {
    return threat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatSourceName(source: string): string {
    return source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatTag(tag: string): string {
    return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Status and Class Methods
  

  getSeverityIcon(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      case 'low': return '🟡';
      default: return '❓';
    }
  }

  getSeverityClass(severity: string): string {
    return `threat-level ${severity.toLowerCase()}`;
  }

  getVerdictClass(verdict: string): string {
    switch (verdict.toLowerCase()) {
      case 'malicious': return 'bg-danger';
      case 'suspicious': return 'bg-warning';
      case 'clean': return 'bg-success';
      case 'unknown': return 'bg-secondary';
      default: return 'bg-info';
    }
  }

  getHttpStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'bg-success';
    if (status >= 300 && status < 400) return 'bg-info';
    if (status >= 400 && status < 500) return 'bg-warning';
    if (status >= 500) return 'bg-danger';
    return 'bg-secondary';
  }

  getTLPClass(tlp: string): string {
    switch (tlp.toLowerCase()) {
      case 'red': return 'bg-danger';
      case 'amber': return 'bg-warning';
      case 'green': return 'bg-success';
      case 'white': return 'bg-light text-dark';
      default: return 'bg-secondary';
    }
  }

  getTagClass(tag: string): string {
    const lowercaseTag = tag.toLowerCase();
    if (lowercaseTag.includes('malware') || lowercaseTag.includes('trojan')) return 'bg-danger';
    if (lowercaseTag.includes('phishing') || lowercaseTag.includes('suspicious')) return 'bg-warning';
    if (lowercaseTag.includes('clean') || lowercaseTag.includes('safe')) return 'bg-success';
    return 'bg-info';
  }

  getSourceIcon(source: string): string {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('virustotal')) return '🦠';
    if (lowerSource.includes('urlscan')) return '🔍';
    if (lowerSource.includes('alienvault') || lowerSource.includes('otx')) return '👽';
    if (lowerSource.includes('malwaredomainlist')) return '🚫';
    if (lowerSource.includes('phishtank')) return '🎣';
    if (lowerSource.includes('google')) return '🔍';
    return '🔎';
  }

  getCountryFlag(country: string): string {
    const countryFlags: { [key: string]: string } = {
      'US': '🇺🇸', 'United States': '🇺🇸',
      'CN': '🇨🇳', 'China': '🇨🇳',
      'RU': '🇷🇺', 'Russia': '🇷🇺',
      'DE': '🇩🇪', 'Germany': '🇩🇪',
      'GB': '🇬🇧', 'United Kingdom': '🇬🇧',
      'FR': '🇫🇷', 'France': '🇫🇷',
      'JP': '🇯🇵', 'Japan': '🇯🇵',
      'CA': '🇨🇦', 'Canada': '🇨🇦',
      'AU': '🇦🇺', 'Australia': '🇦🇺',
      'NL': '🇳🇱', 'Netherlands': '🇳🇱'
    };
    return countryFlags[country] || '🌍';
  }

  // Data Processing Methods
  getImportantHeaders(headers: { [key: string]: string }): { name: string, value: string }[] {
    const importantHeaders = [
      'server', 'content-type', 'content-encoding', 'x-frame-options',
      'x-content-type-options', 'strict-transport-security', 'content-security-policy'
    ];
    
    return Object.entries(headers)
      .filter(([name]) => importantHeaders.includes(name.toLowerCase()))
      .map(([name, value]) => ({ name, value }));
  }

  getCategories(categories: { [key: string]: string }): { source: string, value: string }[] {
    return Object.entries(categories).map(([source, value]) => ({ source, value }));
  }

  // Action Methods
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }

  // getJobUrl(jobId: string): string {
  //   return `${window.location.origin}${this.currentPath}/${jobId}`;
  // }

  // private addToRecentSubmissions(response: EnrichmentResponse, url: string): void {
  //   const submission = {
  //     url: url,
  //     jobId: response.job_id,
  //     status: response.status,
  //     timestamp: new Date().toISOString()
  //   };
  //   this.recentSubmissions.unshift(submission);
  //   if (this.recentSubmissions.length > 5) {
  //     this.recentSubmissions = this.recentSubmissions.slice(0, 5);
  //   }
  //   this.saveRecentSubmissions();
  // }

  // private loadRecentSubmissions(): void {
  //   const saved = localStorage.getItem('url_enrichment_recent');
  //   if (saved) {
  //     try {
  //       this.recentSubmissions = JSON.parse(saved);
  //     } catch (e) {
  //       console.warn('Failed to load recent URL submissions:', e);
  //     }
  //   }
  // }

  // private saveRecentSubmissions(): void {
  //   localStorage.setItem('url_enrichment_recent', JSON.stringify(this.recentSubmissions));
  // }

  // copyJobId(jobId?: string): void {
  //   const idToCopy = jobId || this.response?.job_id;
  //   if (idToCopy) {
  //     navigator.clipboard.writeText(idToCopy).then(() => {
  //       this.jobIdCopied = true;
  //       setTimeout(() => {
  //         this.jobIdCopied = false;
  //       }, 2000);
  //     }).catch(() => {
  //       const textArea = document.createElement('textarea');
  //       textArea.value = idToCopy;
  //       document.body.appendChild(textArea);
  //       textArea.select();
  //       document.execCommand('copy');
  //       document.body.removeChild(textArea);
  //       this.jobIdCopied = true;
  //       setTimeout(() => {
  //         this.jobIdCopied = false;
  //       }, 2000);
  //     });
  //   }
  // }

  // navigateToResults(): void {
  //   if (this.response?.job_id) {
  //     this.router.navigate([`${this.currentPath}/${this.response.job_id}`]);
  //   }
  // }

  // checkStatus(): void {
  //   if (this.response?.job_id) {
  //     // Implement status checking logic here
  //     console.log('Checking status for job:', this.response.job_id);
  //   }
  // }

  // formatDate(dateString: string): string {
  //   const date = new Date(dateString);
  //   return date.toLocaleString();
  // }

  // getTimeRemaining(dateString: string): string {
  //   const now = new Date();
  //   const target = new Date(dateString);
  //   const diffMs = target.getTime() - now.getTime();
  //   if (diffMs <= 0) return 'Overdue';
  //   const diffMins = Math.ceil(diffMs / (1000 * 60));
  //   if (diffMins < 60) {
  //     return `~${diffMins} minute${diffMins !== 1 ? 's' : ''} remaining`;
  //   }
  //   const diffHours = Math.ceil(diffMins / 60);
  //   return `~${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
  // }

  // trackByJobId(index: number, item: any): string {
  //   return item.jobId;
  // }
}