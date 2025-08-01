import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreatService } from '../../../../service/threat/threat.service';
import { ActivatedRoute } from '@angular/router';

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

interface IPEnrichment {
  job_id: string;
  status: string;
  progress: number;
  total_iocs: number;
  completed_iocs: number;
  results: IPEnrichmentResult[];
  error: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-ip-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ip-results.component.html',
  styleUrls: ['./ip-results.component.scss']

})
export class IPResultsComponent implements OnInit {
  enrichmentData: IPEnrichment | null = null;
  job_id: string | null = null;

  constructor(private threatService: ThreatService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.job_id = this.route.snapshot.paramMap.get('jobId')!;
    this.threatService.getEnrichment(this.job_id).subscribe({
      next: (data) => this.enrichmentData = data,
      error: (err) => console.error('Error fetching enrichment data', err)
    });
  }

  getStatusClass(): string {
    return this.enrichmentData!.status.toLowerCase();
  }

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