import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ThreatService } from '../../../service/threat/threat.service';
import { Router } from '@angular/router';
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

interface FilterOptions {
  search: string;
  type: string;
  threat_level: string;
  status: string;
  source: string;
  confidence_min: number;
  confidence_max: number;
  date_range: string;
}

@Component({
  selector: 'app-ioc-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="container-fluid">
      <!-- Header Section -->
      <div class="dashboard-header">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h2 class="dashboard-title">
              <i class="fas fa-shield-virus me-3"></i>
              Threat Intelligence Database
            </h2>
            <p class="dashboard-subtitle">
              Monitor and manage your cybersecurity indicators of compromise
            </p>
          </div>
          <div class="col-md-4 text-end">
            <div class="stats-summary">
              <div class="stat-item">
                <span class="stat-number">{{ totalIOCs }}</span>
                <span class="stat-label">Total IOCs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="filter-panel">
        <form [formGroup]="filterForm" class="row g-3">
          <!-- Search Bar -->
          <div class="col-md-4">
            <div class="search-container">
              <i class="fas fa-search search-icon"></i>
              <input
                type="text"
                class="form-control search-input"
                formControlName="search"
                placeholder="Search IOCs, domains, IPs..."
              />
            </div>
          </div>

          <!-- Type Filter -->
          <div class="col-md-2">
            <select class="form-select filter-select" formControlName="type">
              <option value="">All Types</option>
              <option value="ip">IP Address</option>
              <option value="domain">Domain</option>
              <option value="url">URL</option>
              <option value="hash">File Hash</option>
              <option value="email">Email</option>
            </select>
          </div>

          <!-- Threat Level Filter -->
          <div class="col-md-2">
            <select class="form-select filter-select" formControlName="threat_level">
              <option value="">All Levels</option>
              
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="col-md-2">
            <select class="form-select filter-select" formControlName="status">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="col-md-2">
            <button
              type="button"
              class="btn btn-outline-light btn-sm me-2"
              (click)="resetFilters()"
            >
              <i class="fas fa-undo me-1"></i>
              Reset
            </button>
            <button
              type="button"
              class="btn btn-info btn-sm"
              (click)="exportIOCs()"
            >
              <i class="fas fa-download me-1"></i>
              Export
            </button>
          </div>
        </form>
      </div>

      <!-- Threat Level Summary Cards -->
      <div class="threat-summary">
        <div class="row">
          
          <div class="col-md-4">
            <div class="threat-card high">
              <div class="threat-icon">
                <i class="fas fa-fire"></i>
              </div>
              <div class="threat-info">
                <span class="threat-count">{{ threatCounts.high }}</span>
                <span class="threat-label">High</span>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="threat-card medium">
              <div class="threat-icon">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div class="threat-info">
                <span class="threat-count">{{ threatCounts.medium }}</span>
                <span class="threat-label">Medium</span>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="threat-card low">
              <div class="threat-icon">
                <i class="fas fa-info-circle"></i>
              </div>
              <div class="threat-info">
                <span class="threat-count">{{ threatCounts.low }}</span>
                <span class="threat-label">Low</span>
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
        <p class="loading-text">Loading threat intelligence data...</p>
      </div>

      <!-- IOC Cards Grid -->
      <div *ngIf="!isLoading" class="ioc-grid">
        <div class="row">
          <div
            *ngFor="let ioc of filteredIOCs; trackBy: trackByIOC"
            class="col-lg-6 col-xl-4 mb-4"
          >
            <div class="ioc-card" [class]="'threat-' + ioc.threat_level">
              <!-- Card Header -->
              <div class="ioc-header">
                <div class="ioc-type-badge" [class]="'type-' + ioc.type">
                  <i [class]="getTypeIcon(ioc.type)"></i>
                  {{ ioc.type.toUpperCase() }}
                </div>
                <div class="threat-level-indicator" [class]="'level-' + ioc.threat_level">
                  {{ ioc.threat_level.toUpperCase() }}
                </div>
              </div>

              <!-- IOC Value -->
              <div class="ioc-value">
                <span class="value-text" [title]="ioc.value">{{ truncateValue(ioc.value) }}</span>
                <button
                  class="btn btn-sm btn-copy"
                  (click)="copyToClipboard(ioc.value)"
                  title="Copy to clipboard"
                >
                  <i class="fas fa-copy"></i>
                </button>
              </div>

              <!-- Description -->
              <div class="ioc-description">
                {{ truncateDescription(ioc.description) }}
              </div>

              <!-- Metadata Row -->
              <div class="ioc-metadata">
                <div class="metadata-item">
                  <i class="fas fa-chart-line"></i>
                  <span>{{ ioc.confidence }}% confidence</span>
                </div>
                <div class="metadata-item">
                  <i class="fas fa-globe"></i>
                  <span>{{ ioc.metadata.country || 'Unknown' }}</span>
                </div>
                <div class="metadata-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatDate(ioc.metadata.last_seen) }}</span>
                </div>
              </div>

              <!-- Tags -->
              <div class="ioc-tags" *ngIf="ioc.tags && ioc.tags.length > 0">
                <span
                  *ngFor="let tag of ioc.tags.slice(0, 3)"
                  class="tag-badge"
                >
                  {{ tag }}
                </span>
                <span *ngIf="ioc.tags.length > 3" class="tag-more">
                  +{{ ioc.tags.length - 3 }} more
                </span>
              </div>

              <!-- Status and Source -->
              <div class="ioc-footer">
                <div class="status-badge" [class]="'status-' + ioc.status">
                  <i [class]="getStatusIcon(ioc.status)"></i>
                  {{ ioc.status.toUpperCase() }}
                </div>
                <div class="source-info">
                  <small>{{ ioc.source }}</small>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="ioc-actions">
                <button
                  class="btn btn-sm btn-info"
                  (click)="viewDetails(ioc)"
                  title="View Details"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button
                  class="btn btn-sm btn-warning"
                  (click)="editIOC(ioc)"
                  title="Edit IOC"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  (click)="deleteIOC(ioc)"
                  title="Delete IOC"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredIOCs.length === 0" class="empty-state">
          <i class="fas fa-search-minus empty-icon"></i>
          <h4>No IOCs Found</h4>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalPages > 1" class="pagination-container">
        <nav>
          <ul class="pagination justify-content-center">
            <li class="page-item" [class.disabled]="currentPage === 1">
              <button class="page-link" (click)="changePage(currentPage - 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
            </li>
            <li
              *ngFor="let page of getPageNumbers()"
              class="page-item"
              [class.active]="page === currentPage"
            >
              <button class="page-link" (click)="changePage(page)">
                {{ page }}
              </button>
            </li>
            <li class="page-item" [class.disabled]="currentPage === totalPages">
              <button class="page-link" (click)="changePage(currentPage + 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `,
  styles: [`
  



.container-fluid {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  min-height: 100vh;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(125, 230, 231, 0.2);
}

.dashboard-title {
  color: var(--info-color);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  color: var(--text-light);
  font-size: 1.1rem;
  margin: 0;
}

.stats-summary {
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--info-color);
}

.stat-label {
  color: var(--text-light);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.filter-panel {
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--accent-color);
}

.search-container {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  z-index: 5;
}

.search-input {
  background: var(--accent-color) !important;
  border: 2px solid var(--accent-color) !important;
  color: var(--text-light) !important;
  padding-left: 45px !important;
  border-radius: 8px;
}

.search-input:focus {
  border-color: var(--info-color) !important;
  box-shadow: 0 0 0 0.2rem rgba(125, 230, 231, 0.25) !important;
}

.filter-select {
  background: var(--accent-color) !important;
  border: 2px solid var(--accent-color) !important;
  color: var(--text-light) !important;
  border-radius: 8px;
}

.filter-select:focus {
  border-color: var(--info-color) !important;
  box-shadow: 0 0 0 0.2rem rgba(125, 230, 231, 0.25) !important;
}

.threat-summary {
  margin-bottom: 2rem;
}

.threat-card {
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border-left: 4px solid;
}



.threat-card.high {
  border-left-color: var(--danger-color);
}

.threat-card.medium {
  border-left-color: var(--warning-color);
}

.threat-card.low {
  border-left-color: var(--success-color);
}

.threat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.threat-icon {
  font-size: 2rem;
  margin-right: 1rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}



.threat-card.high .threat-icon {
  color: var(--danger-color);
}

.threat-card.medium .threat-icon {
  color: var(--warning-color);
}

.threat-card.low .threat-icon {
  color: var(--success-color);
}

.threat-info {
  display: flex;
  flex-direction: column;
}

.threat-count {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-light);
}

.threat-label {
  color: var(--text-light);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.loading-container {
  text-align: center;
  padding: 4rem;
  color: var(--text-light);
}

.loading-text {
  margin-top: 1rem;
  font-size: 1.1rem;
}

.ioc-card {
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  border: 1px solid var(--accent-color);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ioc-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  border-color: var(--info-color);
}



.ioc-card.threat-high {
  border-left: 4px solid var(--danger-color);
}

.ioc-card.threat-medium {
  border-left: 4px solid var(--warning-color);
}

.ioc-card.threat-low {
  border-left: 4px solid var(--success-color);
}

.ioc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.ioc-type-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
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

.threat-level-indicator {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}



.level-high {
  background: var(--danger-color);
}

.level-medium {
  background: var(--warning-color);
  color: var(--primary-color);
}

.level-low {
  background: var(--success-color);
}

.ioc-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: var(--accent-color);
  border-radius: 8px;
}

.value-text {
  color: var(--info-color);
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.9rem;
  flex-grow: 1;
  margin-right: 1rem;
}

.btn-copy {
  background: transparent;
  border: 1px solid var(--info-color);
  color: var(--info-color);
  padding: 0.2rem 0.5rem;
}

.btn-copy:hover {
  background: var(--info-color);
  color: var(--primary-color);
}

.ioc-description {
  color: var(--text-light);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  flex-grow: 1;
}

.ioc-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  color: var(--text-light);
}

.metadata-item i {
  margin-right: 0.5rem;
  color: var(--info-color);
}

.ioc-tags {
  margin-bottom: 1rem;
}

.tag-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(125, 230, 231, 0.2);
  color: var(--info-color);
  border-radius: 12px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag-more {
  color: var(--text-light);
  font-size: 0.75rem;
}

.ioc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--accent-color);
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.status-badge i {
  margin-right: 0.3rem;
}

.status-active {
  background: var(--success-color);
  color: white;
}

.status-inactive {
  background: var(--text-light);
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

.source-info {
  color: var(--text-light);
}

.ioc-actions {
  display: flex;
  gap: 0.5rem;
}

.ioc-actions .btn {
  flex: 1;
  padding: 0.4rem;
  border-radius: 6px;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--text-light);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.pagination-container {
  margin-top: 3rem;
}

.pagination .page-link {
  background: var(--secondary-color);
  border: 1px solid var(--accent-color);
  color: var(--text-light);
}

.pagination .page-link:hover {
  background: var(--accent-color);
  border-color: var(--info-color);
  color: var(--info-color);
}

.pagination .page-item.active .page-link {
  background: var(--info-color);
  border-color: var(--info-color);
  color: var(--primary-color);
}

.btn-info {
  background-color: var(--info-color);
  border-color: var(--info-color);
  color: var(--primary-color);
}

.btn-info:hover {
  background-color: #6bcbcc;
  border-color: #6bcbcc;
}

.btn-outline-light:hover {
  background-color: var(--text-light);
  color: var(--primary-color);
}
  `]

})
export class IOCListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  iocs: ThreatIntelligence[] = [];
  filteredIOCs: ThreatIntelligence[] = [];
  totalIOCs = 0;
  isLoading = true;

  // Threat level counts
  threatCounts = {
    
    high: 0,
    medium: 0,
    low: 0
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  // Filter form
  filterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private threatService: ThreatService,
    private router: Router
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadIOCs();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      type: [''],
      threat_level: [''],
      status: [''],
      source: [''],
      confidence_min: [0],
      confidence_max: [100]
    });
  }

  setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
        this.currentPage = 1;
      });
  }

  loadIOCs(): void {
    this.isLoading = true;
    
    this.threatService.getAllIOCs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response ) {
            console.log(response);
            
            console.log(response.iocs);
            this.iocs = response.iocs;
            this.totalIOCs = response.total;
            this.updateThreatCounts();
            this.applyFilters();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load IOCs:', error);
          this.isLoading = false;
        }
      });
  }

  updateThreatCounts(): void {
    this.threatCounts = {
      
      high: this.iocs.filter(ioc => ioc.threat_level === 'high').length,
      medium: this.iocs.filter(ioc => ioc.threat_level === 'medium').length,
      low: this.iocs.filter(ioc => ioc.threat_level === 'low').length
    };
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredIOCs = this.iocs.filter(ioc => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          ioc.value.toLowerCase().includes(searchLower) ||
          ioc.description.toLowerCase().includes(searchLower) ||
          ioc.source.toLowerCase().includes(searchLower) ||
          ioc.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type && ioc.type !== filters.type) return false;

      // Threat level filter
      if (filters.threat_level && ioc.threat_level !== filters.threat_level) return false;

      // Status filter
      if (filters.status && ioc.status !== filters.status) return false;

      // Source filter
      if (filters.source && !ioc.source.toLowerCase().includes(filters.source.toLowerCase())) return false;

      // Confidence filter
      if (ioc.confidence < filters.confidence_min || ioc.confidence > filters.confidence_max) return false;

      return true;
    });

    this.totalPages = Math.ceil(this.filteredIOCs.length / this.itemsPerPage);
    this.updatePaginatedResults();
  }

  updatePaginatedResults(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredIOCs = this.filteredIOCs.slice(startIndex, endIndex);
  }
  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      type: '',
      threat_level: '',
      status: '',
      source: '',
      confidence_min: 0,
      confidence_max: 100
    });
    this.currentPage = 1;
  }

  exportIOCs(): void {
    const csvData = this.convertToCSV(this.iocs);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat-intelligence-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: ThreatIntelligence[]): string {
    const headers = [
      'Value', 'Type', 'Threat Level', 'Status', 'Description', 'Source',
      'Confidence', 'Tags', 'Country', 'ASN', 'First Seen', 'Last Seen', 'Expiration Date'
    ];
    
    const csvRows = [headers.join(',')];
    
    data.forEach(ioc => {
      const row = [
        `"${ioc.value}"`,
        `"${ioc.type}"`,
        `"${ioc.threat_level}"`,
        `"${ioc.status}"`,
        `"${ioc.description.replace(/"/g, '""')}"`,
        `"${ioc.source}"`,
        ioc.confidence,
        `"${ioc.tags.join('; ')}"`,
        `"${ioc.metadata.country || ''}"`,
        `"${ioc.metadata.asn || ''}"`,
        `"${ioc.metadata.first_seen}"`,
        `"${ioc.metadata.last_seen}"`,
        `"${ioc.expiration_date}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  trackByIOC(index: number, ioc: ThreatIntelligence): string {
    return ioc.id || ioc.value;
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

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'active': 'fas fa-check-circle',
      'inactive': 'fas fa-times-circle',
      'pending': 'fas fa-clock',
      'expired': 'fas fa-exclamation-triangle'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  truncateValue(value: string): string {
    return value.length > 30 ? value.substring(0, 30) + '...' : value;
  }

  truncateDescription(description: string): string {
    return description.length > 100 ? description.substring(0, 100) + '...' : description;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a toast notification here
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  viewDetails(ioc: ThreatIntelligence): void {
    // Navigate to details view or open modal
    console.log('View details for:', ioc.value);
    this.router.navigate(['/iocs/', ioc.id]);
    // You can implement navigation to a details component
    // this.router.navigate(['/threat-intelligence/details', ioc._id]);
  }

  editIOC(ioc: ThreatIntelligence): void {
    // Navigate to edit form or open modal
    console.log('Edit IOC:', ioc.value);
    
    // You can implement navigation to edit component
     this.router.navigate(['/iocs/edit', ioc.id]);
  }

  deleteIOC(ioc: ThreatIntelligence): void {
    console.log("ioc id:",ioc.id)
    if (confirm(`Are you sure you want to delete IOC: ${ioc.value}?`)) {
      this.threatService.deleteIOC(ioc.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('IOC deleted successfully');
            this.loadIOCs(); // Reload the list
          },
          error: (error) => {
            console.error('Failed to delete IOC:', error);
          }
        });
    }
  }
}

