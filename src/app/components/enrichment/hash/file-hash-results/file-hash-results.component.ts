import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreatService } from '../../../../service/threat/threat.service';
import { ActivatedRoute } from '@angular/router';

interface MalwareFamily {
  id: string;
  display_name: string;
  target: string | null;
}

interface AttackTechnique {
  id: string;
  name: string;
  display_name: string;
}

interface Hashes {
  sha256: string;
  sha3_384: string;
  sha1: string;
  md5: string;
}

interface FileInfo {
  file_name: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  reporter: string;
  origin_country: string;
  anonymous: boolean;
}

interface HashTools {
  imphash: string;
  tlsh: string;
  telfhash: string | null;
  gimphash: string | null;
  ssdeep: string;
  dhash_icon: string;
  magika: string;
}

interface Timestamps {
  first_seen: string;
  last_seen: string | null;
}

interface CodeSigning {
  subject_cn: string;
  issuer_cn: string;
  algorithm: string;
  valid_from: string;
  valid_to: string;
  serial_number: string;
  thumbprint_algorithm: string;
  thumbprint: string;
  cscb_listed: boolean;
  cscb_reason: string | null;
}

interface YaraRule {
  name: string;
  author: string;
  description: string | null;
}



interface VendorIntel {
  [key: string]: any; // to handle deeply nested or varying vendor formats like Triage, Intezer, etc.
}

interface Report {
  report_id: string;
  environment: string;
  verdict: string;
  state: string;
}

export interface EnrichmentResult {
  sources: string[];
  malware_signatures: string[];
  severity: string;
  confidence_score: number;
  reputation_score: number;
  malware_families: MalwareFamily[];
  attack_techniques: AttackTechnique[];
  targeted_countries: string[];
  name: string[];
  description: string[];
  references: string[];
  tags: string[];
  hashes: Hashes;
  signatures: string[];
  file_info: FileInfo;
  hash_tools: HashTools;
  trid: string[];
  timestamps: Timestamps;
  code_signing: CodeSigning[];
  delivery_method: string | null;
  intelligence: any;
  file_info_links: string[];
  yara_rules: YaraRule[];
  vendor_intel: VendorIntel;
  reports: Report[];
}


interface FileHashEnrichment {
  job_id: string;
  status: string;
  progress: number;
  total_iocs: number;
  completed_iocs: number;
  results: EnrichmentResult[];
  error: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-file-hash-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-hash-results.component.html',
  styleUrls: ['./file-hash-results.component.scss']
})
export class FileHashResultsComponent implements OnInit {
  enrichmentData: FileHashEnrichment| null = null;
  job_id: string | null = null;
  objectKeys = Object.keys;
  constructor(private threatService: ThreatService,private route:ActivatedRoute) {
    
  }
  ngOnInit(): void {
    this.job_id = this.route.snapshot.paramMap.get('jobId')!;
      this.threatService.getEnrichment(this.job_id).subscribe({
        next: (data) => this.enrichmentData = data,
        error: (err) => console.error('Error fetching enrichment data', err)
            
      })
  }

  getStatusClass(): string {
    return this.enrichmentData!.status.toLowerCase();
  }

  getSeverityClass(severity: string): string {
    return severity.toLowerCase();
  }

  getVerdictClass(verdict: string): string {
    return verdict.toLowerCase();
  }

  getStateClass(state: string): string {
    return state.toUpperCase();
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  hasAdditionalInfo(result: EnrichmentResult): boolean {
    return result.malware_families.length > 0 || 
           result.attack_techniques.length > 0 || 
           result.targeted_countries.length > 0;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }
}