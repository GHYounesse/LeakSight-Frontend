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
interface DomainInfo {
  tld: string;
  creation_date: string;
  expiration_date: string;
  last_analysis_date: string;
  registrar: string;
  reputation: number;
  ip_addresses: string[];
}

interface SecurityDetails {
  malicious_detections: number;
  suspicious_detections: number;
  harmless_detections: number;
  undetected: number;
  total_engines: number;
  tags: string[];
  categories: string[];
  related_adversaries: string[];
  related_malware: string[];
  related_industries: string[];
}

interface Certificates {
  subject_cn: string;
  issuer: string;
  issuer_organization: string;
  valid_from: string;
  valid_until: string;
  serial_number: string;
  signature_algorithm: string;
  key_algorithm: string;
  certificate_size: number;
  thumbprint: string;
  alternative_names: string[];
}

interface DnsRecord {
  type: string;
  ttl: number;
  value: string;
}

interface WhoisInfo {
  creation_date: string;
  expiry_date: string;
  registrar: string;
  registrar_abuse_email: string;
  registrar_abuse_phone: string;
  name_servers: string[];
  domain_status: string;
  dnssec: string;
}

interface ScanResults {
  urlscan_uuid: string;
  result_url: string;
  api_url: string;
  visibility: string;
  scan_country: string;
  scanned_url: string;
  submission_successful: boolean;
}

export interface DomainEnrichmentResult {
  reputation_score: number;
  confidence_score: number;
  severity: string;
  sources: string[];
  threat_indicators: string[];
  domain_info: DomainInfo;
  security_details: SecurityDetails;
  certificates: Certificates;
  dns_records: DnsRecord[];
  whois_info: WhoisInfo;
  scan_results: ScanResults;
  risk_factors: string[];
}

interface DomainEnrichment {
  job_id: string;
  status: string;
  progress: number;
  total_iocs: number;
  completed_iocs: number;
  results: DomainEnrichmentResult[];
  error: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-domain-enrichment',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './domain-enrichment.component.html',
  styleUrls: ['./domain-enrichment.component.scss']
})
export class DomainEnrichmentComponent {
  domainValue: string = '';
  result: DomainEnrichmentResult | null = null;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;
  // jobIdCopied: boolean = false;
  detectedDomainInfo: { tld: string; isSubdomain: boolean } | null = null;
  // recentSubmissions: Array<{
  //   domain: string;
  //   domainInfo: string;
  //   jobId: string;
  //   status: string;
  //   timestamp: string;
  // }> = [];

  //private readonly apiUrl = 'http://localhost:8000/api/v1/enrichment/analyze';

  constructor(private http: HttpClient, private threatService: ThreatService) {}

  ngOnInit(): void {
    //this.loadRecentSubmissions();
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
    this.result = null;
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
          this.result = response.result;
          //this.addToRecentSubmissions(response);
        }
      }); 
  }
  getSeverityClass(severity: string): string {
    return severity.toLowerCase();
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
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

  hasAdditionalSecurityInfo(securityDetails: SecurityDetails): boolean {
    return securityDetails.categories.length > 0 || 
           securityDetails.related_malware.length > 0 || 
           securityDetails.related_adversaries.length > 0;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }
  // private addToRecentSubmissions(response: EnrichmentResponse): void {
  //   const domainInfo = this.detectedDomainInfo;
  //   let infoString = 'Domain';
    
  //   if (domainInfo) {
  //     infoString = domainInfo.isSubdomain ? `Subdomain (.${domainInfo.tld})` : `Root Domain (.${domainInfo.tld})`;
  //   }

  //   const submission = {
  //     domain: this.domainValue.trim().toLowerCase(),
  //     domainInfo: infoString,
  //     jobId: response.job_id,
  //     status: response.status,
  //     timestamp: new Date().toISOString()
  //   };

  //   this.recentSubmissions.unshift(submission);
    
  //   // Keep only the last 5 submissions
  //   if (this.recentSubmissions.length > 5) {
  //     this.recentSubmissions = this.recentSubmissions.slice(0, 5);
  //   }

  //   this.saveRecentSubmissions();
  // }

  // private loadRecentSubmissions(): void {
  //   const saved = localStorage.getItem('domain_enrichment_recent');
  //   if (saved) {
  //     try {
  //       this.recentSubmissions = JSON.parse(saved);
  //     } catch (e) {
  //       console.warn('Failed to load recent submissions:', e);
  //     }
  //   }
  // }

  // private saveRecentSubmissions(): void {
  //   localStorage.setItem('domain_enrichment_recent', JSON.stringify(this.recentSubmissions));
  // }

  // copyJobId(): void {
  //   if (this.response?.job_id) {
  //     navigator.clipboard.writeText(this.response.job_id).then(() => {
  //       this.jobIdCopied = true;
  //       setTimeout(() => {
  //         this.jobIdCopied = false;
  //       }, 2000);
  //     }).catch(() => {
  //       // Fallback for older browsers
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
}