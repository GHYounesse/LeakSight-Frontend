import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ThreatService} from '../../../../service/threat/threat.service';
import { ActivatedRoute } from '@angular/router';

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
  selector: 'app-domain-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './domain-results.component.html',
  styleUrls: ['./domain-results.component.scss']
})
export class DomainResultsComponent implements OnInit {
  enrichmentData: DomainEnrichment | null = null;
  job_id: string | null = null;

  constructor(private threatService: ThreatService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.job_id = this.route.snapshot.paramMap.get('jobId')!;
    this.threatService.getEnrichment(this.job_id).subscribe({
      next: (data) => this.enrichmentData = data,
      error: (err) => console.error('Error fetching domain enrichment data', err)
    });
  }

  getStatusClass(): string {
    return this.enrichmentData!.status.toLowerCase();
  }

  getSeverityClass(severity: string): string {
    return severity.toLowerCase();
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
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
}