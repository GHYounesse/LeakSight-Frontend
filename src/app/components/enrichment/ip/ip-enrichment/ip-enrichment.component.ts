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

// interface EnrichmentResponse {
//   job_id: string;
//   status: string;
//   message: string;
//   estimated_completion: string;
// }
interface GeographicInfo {
  country: string;
  continent: string;
  network: string;
  asn: number;
  as_owner: string;
  regional_internet_registry: string;
}

interface CertificateInfo {
  subject: string;
  issuer: string;
  validity_not_after: string;
  validity_not_before: string;
  serial_number: string;
  thumbprint: string;
}

interface DetectionEngines {
  total: number;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}

interface AbuseIPDBInfo {
  confidence_score: number;
  total_reports: number;
  distinct_users: number;
  last_reported: string;
  is_whitelisted: boolean;
  usage_type: string;
  isp: string;
  domain: string;
  is_tor: boolean;
}

interface AbuseReports {
  abuseipdb: AbuseIPDBInfo;
}

interface IPEnrichmentResult {
  sources: string[];
  geographic_info: GeographicInfo;
  threat_actors: string[];
  severity: string;
  confidence_score: number;
  reputation_score: number;
  malware_families: string[];
  threat_types: string[];
  network_info: any;
  certificate_info: CertificateInfo;
  detection_engines: DetectionEngines;
  abuse_reports: AbuseReports;
  tags: string[];
  last_seen: number;
  verdict: string;
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
  result: IPEnrichmentResult | null = null;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;
  // jobIdCopied: boolean = false;
  detectedIpType: string = '';
  // recentSubmissions: Array<{
  //   ip: string;
  //   jobId: string;
  //   status: string;
  //   timestamp: string;
  // }> = [];

  

  constructor(private http: HttpClient, private threatService: ThreatService, private router: Router) {
    this.currentPath = this.router.url;
  }

  ngOnInit(): void {
    // this.loadRecentSubmissions();
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
    this.result = null;
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
          this.result = response.result;
          //this.addToRecentSubmissions(response);
        }
      });
  }

  // getJobUrl(jobId: string): string {
  //   return `${window.location.origin}${this.currentPath}/${jobId}`;
  // }

  // private addToRecentSubmissions(response: EnrichmentResponse): void {
  //   const submission = {
  //     ip: this.ipValue.trim(),
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
  //   const saved = localStorage.getItem('ip_enrichment_recent');
  //   if (saved) {
  //     try {
  //       this.recentSubmissions = JSON.parse(saved);
  //     } catch (e) {
  //       console.warn('Failed to load recent IP submissions:', e);
  //     }
  //   }
  // }

  // private saveRecentSubmissions(): void {
  //   localStorage.setItem('ip_enrichment_recent', JSON.stringify(this.recentSubmissions));
  // }

  // copyJobId(): void {
  //   if (this.response?.job_id) {
  //     navigator.clipboard.writeText(this.response.job_id).then(() => {
  //       this.jobIdCopied = true;
  //       setTimeout(() => {
  //         this.jobIdCopied = false;
  //       }, 2000);
  //     }).catch(() => {
  //       const textArea = document.createElement('textarea');
  //       textArea.value = this.response!.job_id;
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
  // getStatusClass(): string {
  //   return this.enrichmentData!.status.toLowerCase();
  // }

  getSeverityClass(severity: string): string {
    return severity.toLowerCase();
  }

  getSeverityIcon(severity: string): string {
    const icons: { [key: string]: string } = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '🔶',
      'low': '🟡',
      'info': 'ℹ️'
    };
    return icons[severity.toLowerCase()] || '❓';
  }

  getVerdictClass(verdict: string): string {
    return verdict.toLowerCase();
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatLastSeen(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
    return `${Math.round(diffDays / 365)} years`;
  }

  getCountryFlag(countryCode: string): string {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵',
      'CN': '🇨🇳', 'RU': '🇷🇺', 'CA': '🇨🇦', 'AU': '🇦🇺', 'BR': '🇧🇷',
      'IN': '🇮🇳', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪'
    };
    return flags[countryCode] || '🌍';
  }

  getThreatTypeClass(threatType: string): string {
    const lowerType = threatType.toLowerCase();
    if (lowerType.includes('phishing')) return 'phishing';
    if (lowerType.includes('malware')) return 'malware';
    if (lowerType.includes('suspicious')) return 'suspicious';
    return 'default';
  }

  formatThreatType(threatType: string): string {
    return threatType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getSourceIcon(source: string): string {
    const icons: { [key: string]: string } = {
      'virustotal': '🛡️',
      'alienvault': '👁️',
      'abuseipdb': '🚨',
      'malwarebytes': '🦠',
      'cisco': '🔒',
      'fortinet': '🏰',
      'paloalto': '🔥',
      'crowdstrike': '👑'
    };
    return icons[source.toLowerCase()] || '🔍';
  }

  formatSourceName(source: string): string {
    const names: { [key: string]: string } = {
      'virustotal': 'VirusTotal',
      'alienvault': 'AlienVault OTX',
      'abuseipdb': 'AbuseIPDB',
      'malwarebytes': 'Malwarebytes',
      'cisco': 'Cisco Talos',
      'fortinet': 'FortiGuard',
      'paloalto': 'Palo Alto',
      'crowdstrike': 'CrowdStrike'
    };
    return names[source.toLowerCase()] || source.charAt(0).toUpperCase() + source.slice(1);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }
}