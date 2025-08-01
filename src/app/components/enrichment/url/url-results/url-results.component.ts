import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreatService } from '../../../../service/threat/threat.service';
import { ActivatedRoute } from '@angular/router';

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

interface URLEnrichment {
  job_id: string;
  status: string;
  progress: number;
  total_iocs: number;
  completed_iocs: number;
  results: URLEnrichmentResult[];
  error: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-url-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './url-results.component.html',
  styleUrls: ['./url-results.component.scss']
  
})
export class UrlResultsComponent implements OnInit {
  @Input() enrichmentData: URLEnrichment | null = null;
  objectKeys = Object.keys;
  constructor(
    private threatService: ThreatService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // If no data provided via input, try to get from route params
    if (!this.enrichmentData) {
      const jobId = this.route.snapshot.paramMap.get('jobId');
      if (jobId) {
        this.loadEnrichmentData(jobId);
      }
    }
  }

  private loadEnrichmentData(jobId: string) {
    this.threatService.getEnrichment(jobId).subscribe({
      next: (data) => {
        this.enrichmentData = data;
      },
      error: (error) => {
        console.error('Error loading enrichment data:', error);
      }
    });
  }

  // Utility Methods
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
  getStatusClass(): string {
    if (!this.enrichmentData) return 'bg-secondary';
    
    switch (this.enrichmentData.status.toLowerCase()) {
      case 'completed': return 'bg-success';
      case 'processing': return 'bg-info';
      case 'failed': return 'bg-danger';
      case 'queued': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

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
}