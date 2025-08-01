import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThreatService } from '../../../service/threat/threat.service';

interface ThreatIntelligence {
  id?: string;
  value: string;
  type: string;
  threat_level: string;
  status: string;
  description: string;
  source: string;
  confidence: number;
  tags: string[];
  metadata: {
    first_seen: string;
    last_seen: string;
    asn: string;
    country: string;
  };
  expiration_date: string;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-view-ioc',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid" *ngIf="!isLoading && ioc">
      
      <!-- Header Section -->
      <div class="ioc-header-section">
        <div class="row align-items-center">
          <div class="col-md-8">
            <div class="breadcrumb-nav">
              <button 
                class="btn btn-link text-info p-0 me-3"
                (click)="goBack()"
              >
                <i class="fas fa-arrow-left me-2"></i>
                Back to IOCs
              </button>
            </div>
            <h1 class="ioc-title">
              <i [class]="getTypeIcon(ioc.type)" class="me-3"></i>
              IOC Details
            </h1>
            <p class="ioc-subtitle">Comprehensive threat intelligence information</p>
          </div>
          <div class="col-md-4 text-end">
            <div class="action-buttons">
              <button 
                class="btn btn-outline-info me-2"
                (click)="copyToClipboard(ioc.value)"
                title="Copy IOC Value"
              >
                <i class="fas fa-copy me-1"></i>
                Copy
              </button>
              <button 
                class="btn btn-warning me-2"
                (click)="editIOC()"
                title="Edit IOC"
              >
                <i class="fas fa-edit me-1"></i>
                Edit
              </button>
              <button 
                class="btn btn-danger"
                (click)="deleteIOC()"
                title="Delete IOC"
              >
                <i class="fas fa-trash me-1"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="row">
        
        <!-- Left Column - Primary Information -->
        <div class="col-lg-8">
          
          <!-- IOC Value Card -->
          <div class="detail-card primary-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-fingerprint me-2"></i>
                IOC Value
              </h3>
              <div class="header-badges">
                <span class="ioc-type-badge" [class]="'type-' + ioc.type">
                  <i [class]="getTypeIcon(ioc.type)" class="me-1"></i>
                  {{ ioc.type.toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="card-body">
              <div class="ioc-value-display">
                <div class="value-container">
                  <span class="value-text" [title]="ioc.value">{{ ioc.value }}</span>
                  <button 
                    class="btn btn-sm btn-outline-info copy-btn"
                    (click)="copyToClipboard(ioc.value)"
                  >
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Description Card -->
          <div class="detail-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-info-circle me-2"></i>
                Description
              </h3>
            </div>
            <div class="card-body">
              <p class="description-text">{{ ioc.description }}</p>
            </div>
          </div>

          <!-- Tags Card -->
          <div class="detail-card" *ngIf="ioc.tags && ioc.tags.length > 0">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-tags me-2"></i>
                Tags
              </h3>
            </div>
            <div class="card-body">
              <div class="tags-container">
                <span 
                  *ngFor="let tag of ioc.tags"
                  class="tag-badge"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Timeline Card -->
          <div class="detail-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-clock me-2"></i>
                Timeline
              </h3>
            </div>
            <div class="card-body">
              <div class="timeline-container">
                <div class="timeline-item">
                  <div class="timeline-icon created">
                    <i class="fas fa-plus-circle"></i>
                  </div>
                  <div class="timeline-content">
                    <h4>Created</h4>
                    <p>{{ formatDateTime(ioc.created_at) }}</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-icon first-seen">
                    <i class="fas fa-eye"></i>
                  </div>
                  <div class="timeline-content">
                    <h4>First Seen</h4>
                    <p>{{ formatDateTime(ioc.metadata.first_seen) }}</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-icon last-seen">
                    <i class="fas fa-clock"></i>
                  </div>
                  <div class="timeline-content">
                    <h4>Last Seen</h4>
                    <p>{{ formatDateTime(ioc.metadata.last_seen) }}</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-icon expiration">
                    <i class="fas fa-calendar-times"></i>
                  </div>
                  <div class="timeline-content">
                    <h4>Expires</h4>
                    <p>{{ formatDateTime(ioc.expiration_date) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column - Status & Metadata -->
        <div class="col-lg-4">
          
          <!-- Status Card -->
          <div class="detail-card status-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-shield-alt me-2"></i>
                Status & Risk
              </h3>
            </div>
            <div class="card-body">
              <div class="status-grid">
                <div class="status-item">
                  <label>Threat Level</label>
                  <span class="threat-level-badge" [class]="'level-' + ioc.threat_level">
                    <i [class]="getThreatIcon(ioc.threat_level)" class="me-1"></i>
                    {{ ioc.threat_level.toUpperCase() }}
                  </span>
                </div>
                <div class="status-item">
                  <label>Status</label>
                  <span class="status-badge" [class]="'status-' + ioc.status">
                    <i [class]="getStatusIcon(ioc.status)" class="me-1"></i>
                    {{ ioc.status.toUpperCase() }}
                  </span>
                </div>
                <div class="status-item">
                  <label>Confidence</label>
                  <div class="confidence-display">
                    <div class="confidence-bar">
                      <div 
                        class="confidence-fill" 
                        [style.width.%]="ioc.confidence"
                        [class]="getConfidenceClass(ioc.confidence)"
                      ></div>
                    </div>
                    <span class="confidence-text">{{ ioc.confidence }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Source Information -->
          <div class="detail-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-database me-2"></i>
                Source Information
              </h3>
            </div>
            <div class="card-body">
              <div class="source-info">
                <div class="info-item">
                  <label>Source</label>
                  <span class="value">{{ ioc.source }}</span>
                </div>
                <div class="info-item" *ngIf="ioc.updated_at">
                  <label>Last Updated</label>
                  <span class="value">{{ formatDateTime(ioc.updated_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Geolocation & Network -->
          <div class="detail-card" *ngIf="ioc.metadata.country || ioc.metadata.asn">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-globe me-2"></i>
                Location & Network
              </h3>
            </div>
            <div class="card-body">
              <div class="geo-info">
                <div class="info-item" *ngIf="ioc.metadata.country">
                  <label>Country</label>
                  <span class="value">
                    <i class="fas fa-flag me-1"></i>
                    {{ ioc.metadata.country }}
                  </span>
                </div>
                <div class="info-item" *ngIf="ioc.metadata.asn">
                  <label>ASN</label>
                  <span class="value">
                    <i class="fas fa-network-wired me-1"></i>
                    {{ ioc.metadata.asn }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Assessment -->
          <div class="detail-card risk-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Risk Assessment
              </h3>
            </div>
            <div class="card-body">
              <div class="risk-score">
                <div class="score-circle" [class]="getRiskClass(ioc.threat_level, ioc.confidence)">
                  <span class="score-text">{{ calculateRiskScore(ioc.threat_level, ioc.confidence) }}</span>
                  <small>Risk Score</small>
                </div>
              </div>
              <div class="risk-factors">
                <div class="factor-item">
                  <span class="factor-label">Threat Level Impact:</span>
                  <span class="factor-value">{{ getThreatImpact(ioc.threat_level) }}</span>
                </div>
                <div class="factor-item">
                  <span class="factor-label">Data Reliability:</span>
                  <span class="factor-value">{{ getReliabilityLevel(ioc.confidence) }}</span>
                </div>
                <div class="factor-item">
                  <span class="factor-label">Status Impact:</span>
                  <span class="factor-value">{{ getStatusImpact(ioc.status) }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoading" class="loading-container">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="loading-text">Loading IOC details...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="!isLoading && !ioc" class="error-container">
      <div class="error-content">
        <i class="fas fa-exclamation-circle error-icon"></i>
        <h3>IOC Not Found</h3>
        <p>The requested threat intelligence indicator could not be found.</p>
        <button class="btn btn-info" (click)="goBack()">
          <i class="fas fa-arrow-left me-1"></i>
          Back to IOCs
        </button>
      </div>
    </div>
  `,
  styles: [`
    :root {
      --primary-color: #1a1a2e;
      --secondary-color: #16213e;
      --accent-color: #0f3460;
      --danger-color: #e94560;
      --warning-color: #f39c12;
      --success-color: #27ae60;
      --info-color: #7de6e7;
      --text-light: #f8f9fa;
      --text-muted: #6c757d;
    }

    .container-fluid {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      min-height: 100vh;
      padding: 2rem;
    }

    .ioc-header-section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
      padding: 2rem;
      margin-bottom: 2rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(125, 230, 231, 0.2);
    }

    .breadcrumb-nav {
      margin-bottom: 1rem;
    }

    .btn-link {
      text-decoration: none;
      font-weight: 500;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .ioc-title {
      color: var(--info-color);
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .ioc-subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin: 0;
    }

    .action-buttons .btn {
      margin-left: 0.5rem;
    }

    .detail-card {
      background: var(--secondary-color);
      border-radius: 12px;
      border: 1px solid var(--accent-color);
      margin-bottom: 2rem;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .detail-card:hover {
      border-color: var(--info-color);
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    }

    .primary-card {
      border-left: 4px solid var(--info-color);
    }

    .status-card {
      border-left: 4px solid var(--warning-color);
    }

    .risk-card {
      border-left: 4px solid var(--danger-color);
    }

    .card-header {
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid var(--accent-color);
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      color: var(--text-light);
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .header-badges {
      display: flex;
      gap: 0.5rem;
    }

    .card-body {
      padding: 1.5rem;
    }

    .ioc-value-display {
      background: var(--accent-color);
      border-radius: 8px;
      padding: 1rem;
    }

    .value-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .value-text {
      color: var(--info-color);
      font-family: 'Courier New', monospace;
      font-size: 1.1rem;
      font-weight: 600;
      word-break: break-all;
      flex-grow: 1;
      margin-right: 1rem;
    }

    .copy-btn {
      flex-shrink: 0;
    }

    .description-text {
      color: var(--text-light);
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag-badge {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      background: rgba(125, 230, 231, 0.2);
      color: var(--info-color);
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .timeline-container {
      position: relative;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 2rem;
      position: relative;
    }

    .timeline-item:last-child {
      margin-bottom: 0;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: 22px;
      top: 45px;
      bottom: -20px;
      width: 2px;
      background: var(--accent-color);
    }

    .timeline-item:last-child::before {
      display: none;
    }

    .timeline-icon {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      flex-shrink: 0;
    }

    .timeline-icon.created {
      background: var(--success-color);
      color: white;
    }

    .timeline-icon.first-seen {
      background: var(--info-color);
      color: var(--primary-color);
    }

    .timeline-icon.last-seen {
      background: var(--warning-color);
      color: var(--primary-color);
    }

    .timeline-icon.expiration {
      background: var(--danger-color);
      color: white;
    }

    .timeline-content h4 {
      color: var(--text-light);
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .timeline-content p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0;
    }

    .status-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .status-item label {
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .ioc-type-badge {
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary-color);
    }

    .type-ip {
      background: var(--info-color);
    }

    .type-domain {
      background: var(--warning-color);
    }

    .type-url {
      background: var(--warning-color);
    }

    .type-hash {
      background: var(--success-color);
    }

    .type-email {
      background: var(--danger-color);
    }

    .threat-level-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
    }

    .level-critical {
      background: var(--danger-color);
      color: white;
    }

    .level-high {
      background: var(--danger-color);
      color: white;
    }

    .level-medium {
      background: var(--warning-color);
      color: var(--primary-color);
    }

    .level-low {
      background: var(--success-color);
      color: white;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
    }

    .status-active {
      background: var(--success-color);
      color: white;
    }

    .status-inactive {
      background: var(--text-muted);
      color: white;
    }

    .status-pending {
      background: var(--warning-color);
      color: var(--primary-color);
    }

    .status-expired {
      background: var(--danger-color);
      color: white;
    }

    .confidence-display {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .confidence-bar {
      flex-grow: 1;
      height: 8px;
      background: var(--accent-color);
      border-radius: 4px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .confidence-fill.high {
      background: var(--success-color);
    }

    .confidence-fill.medium {
      background: var(--warning-color);
    }

    .confidence-fill.low {
      background: var(--danger-color);
    }

    .confidence-text {
      color: var(--text-light);
      font-weight: 600;
      min-width: 40px;
    }

    .source-info,
    .geo-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item label {
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .info-item .value {
      color: var(--text-light);
      font-size: 0.95rem;
      font-weight: 500;
    }

    .risk-score {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 4px solid;
      position: relative;
    }

    .score-circle.high-risk {
      border-color: var(--danger-color);
      background: rgba(233, 69, 96, 0.1);
    }

    .score-circle.medium-risk {
      border-color: var(--warning-color);
      background: rgba(243, 156, 18, 0.1);
    }

    .score-circle.low-risk {
      border-color: var(--success-color);
      background: rgba(39, 174, 96, 0.1);
    }

    .score-text {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-light);
    }

    .score-circle small {
      color: var(--text-muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .risk-factors {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .factor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }

    .factor-label {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .factor-value {
      color: var(--text-light);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      color: var(--text-light);
    }

    .loading-text {
      margin-top: 1rem;
      font-size: 1.1rem;
    }

    .error-content {
      text-align: center;
    }

    .error-icon {
      font-size: 4rem;
      color: var(--danger-color);
      margin-bottom: 1rem;
    }

    .error-content h3 {
      color: var(--text-light);
      margin-bottom: 1rem;
    }

    .error-content p {
      color: var(--text-muted);
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .container-fluid {
        padding: 1rem;
      }

      .ioc-header-section {
        padding: 1.5rem;
      }

      .ioc-title {
        font-size: 2rem;
      }

      .action-buttons {
        margin-top: 1rem;
      }

      .action-buttons .btn {
        margin-left: 0;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .status-grid {
        gap: 1rem;
      }

      .confidence-display {
        flex-direction: column;
        gap: 0.5rem;
        align-items: stretch;
      }

      .score-circle {
        width: 100px;
        height: 100px;
      }

      .score-text {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ViewIOCComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ioc: ThreatIntelligence | null = null;
  isLoading = true;
  iocId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private threatService: ThreatService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.iocId = params['id'];
      if (this.iocId) {
        this.loadIOCDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadIOCDetails(): void {
    if (!this.iocId) return;
    
    this.isLoading = true;
    
    this.threatService.getIOCById(this.iocId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ioc = response;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load IOC details:', error);
          this.isLoading = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['iocs']);
  }

  editIOC(): void {
    if (this.ioc?.id) {
      this.router.navigate(['/iocs/edit', this.ioc.id]);
    }
  }

  deleteIOC(): void {
    if (!this.ioc?.id) return;
    
    if (confirm(`Are you sure you want to delete IOC: ${this.ioc.value}?`)) {
      this.threatService.deleteIOC(this.ioc.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('IOC deleted successfully');
            this.router.navigate(['/threat-intelligence']);
          },
          error: (error) => {
            console.error('Failed to delete IOC:', error);
          }
        });
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
      // You can add a toast notification here
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'ip': 'fas fa-network-wired',
      'domain': 'fas fa-globe',
      'url': 'fas fa-link',
      'hash': 'fas fa-fingerprint',
      'email': 'fas fa-envelope'
    };
    return icons[type] || 'fas fa-question-circle';
  }

 getThreatIcon(threatLevel: string): string {
    const icons: { [key: string]: string } = {
      'critical': 'fas fa-skull-crossbones',
      'high': 'fas fa-fire',
      'medium': 'fas fa-shield-alt',
      'low': 'fas fa-info-circle'
    };
    return icons[threatLevel] || 'fas fa-question-circle';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'active': 'fas fa-check-circle',
      'inactive': 'fas fa-times-circle',
      'pending': 'fas fa-clock',
      'expired': 'fas fa-exclamation-triangle'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
  }

  calculateRiskScore(threatLevel: string, confidence: number): number {
    const threatWeights: { [key: string]: number } = {
      'critical': 100,
      'high': 80,
      'medium': 60,
      'low': 40
    };
    
    const threatScore = threatWeights[threatLevel] || 40;
    const confidenceMultiplier = confidence / 100;
    
    return Math.round(threatScore * confidenceMultiplier);
  }

  getRiskClass(threatLevel: string, confidence: number): string {
    const riskScore = this.calculateRiskScore(threatLevel, confidence);
    
    if (riskScore >= 80) return 'high-risk';
    if (riskScore >= 50) return 'medium-risk';
    return 'low-risk';
  }

  getThreatImpact(threatLevel: string): string {
    const impacts: { [key: string]: string } = {
      'critical': 'Severe',
      'high': 'High',
      'medium': 'Moderate',
      'low': 'Low'
    };
    return impacts[threatLevel] || 'Unknown';
  }

  getReliabilityLevel(confidence: number): string {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 75) return 'High';
    if (confidence >= 50) return 'Medium';
    if (confidence >= 25) return 'Low';
    return 'Very Low';
  }

  getStatusImpact(status: string): string {
    const impacts: { [key: string]: string } = {
      'active': 'Immediate Concern',
      'inactive': 'Monitoring Only',
      'pending': 'Under Review',
      'expired': 'Historical Data'
    };
    return impacts[status] || 'Unknown';
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'Not Available';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Date';
    }
  }
}