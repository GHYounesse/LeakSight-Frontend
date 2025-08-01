import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ThreatService } from '../../../service/threat/threat.service';

interface ThreatIntelligence {
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  value: string;
  type: string;
  threat_level: string;
  status: string;
  description: string;
  source: string;
  confidence: number;
  tags: string[];
  metadata: {
    [key: string]: any;
    first_detected?: string;
    registrar?: string;
    whois_status?: string;
    country?: string;
    asn?: string;
    first_seen?: string;
    last_seen?: string;
  };
  expiration_date: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-ioc-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-lg-10 col-xl-8">
          <div class="threat-form-container">
            <div class="form-header">
              <h2 class="text-light mb-3">
                <i class="fas fa-edit me-2"></i>
                Update Threat Intelligence
              </h2>
              <p class="text-muted mb-4">
                Modify existing threat intelligence data in our security database
              </p>
              <div class="ioc-info-card" *ngIf="currentIOC">
                <div class="row">
                  <div class="col-md-6">
                    <small class="text-muted">IOC ID:</small>
                    <div class="text-info">{{ iocId }}</div>
                  </div>
                  <div class="col-md-6">
                    <small class="text-muted">Last Updated:</small>
                    <div class="text-warning">{{ formatDisplayDate(currentIOC.updated_at!) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="isLoading" class="loading-container text-center">
              <div class="spinner-border text-info" role="status">
                <span class="visually-hidden">Loading IOC data...</span>
              </div>
              <p class="text-muted mt-2">Loading IOC data...</p>
            </div>

            <!-- Alert Messages -->
            <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
              <i class="fas fa-check-circle me-2"></i>
              <strong>Success!</strong> {{ successMessage }}
              <button type="button" class="btn-close" (click)="clearMessages()"></button>
            </div>

            <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Error!</strong> {{ errorMessage }}
              <button type="button" class="btn-close" (click)="clearMessages()"></button>
            </div>

            <form [formGroup]="threatForm" (ngSubmit)="onSubmit()" *ngIf="!isLoading">
              <div class="row">
                <!-- Basic Information -->
                <div class="col-md-6">
                  <div class="form-section">
                    <h5 class="section-title">
                      <i class="fas fa-info-circle me-2"></i>
                      Basic Information
                    </h5>

                    <div class="mb-3">
                      <label class="form-label text-light">IOC Value</label>
                      <input
                        type="text"
                        class="form-control custom-input"
                        formControlName="value"
                        placeholder="e.g., 45.77.89.28, malicious-domain.com"
                        [class.is-invalid]="isFieldInvalid('value')"
                      />
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('value')">
                        IOC value is required
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-light">Type</label>
                      <select 
                        class="form-select custom-input" 
                        formControlName="type"
                        [class.is-invalid]="isFieldInvalid('type')"
                      >
                        <option value="">Select IOC type</option>
                        <option value="ip">IP Address</option>
                        <option value="domain">Domain</option>
                        <option value="url">URL</option>
                        <option value="hash">File Hash</option>
                        <option value="email">Email</option>
                      </select>
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('type')">
                        Type selection is required
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-light">Threat Level</label>
                      <select 
                        class="form-select custom-input" 
                        formControlName="threat_level"
                        [class.is-invalid]="isFieldInvalid('threat_level')"
                      >
                        <option value="">Select threat level</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('threat_level')">
                        Threat level is required
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-light">Status</label>
                      <select 
                        class="form-select custom-input" 
                        formControlName="status"
                        [class.is-invalid]="isFieldInvalid('status')"
                      >
                        <option value="">Select status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="expired">Expired</option>
                      </select>
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('status')">
                        Status is required
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Details & Metadata -->
                <div class="col-md-6">
                  <div class="form-section">
                    <h5 class="section-title">
                      <i class="fas fa-list-alt me-2"></i>
                      Details & Source
                    </h5>

                    <div class="mb-3">
                      <label class="form-label text-light">Description</label>
                      <textarea
                        class="form-control custom-input"
                        formControlName="description"
                        rows="3"
                        placeholder="Describe the threat and its behavior"
                        [class.is-invalid]="isFieldInvalid('description')"
                      ></textarea>
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('description')">
                        Description is required
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-light">Source</label>
                      <input
                        type="text"
                        class="form-control custom-input"
                        formControlName="source"
                        placeholder="e.g., MalwareBazaar, VirusTotal"
                        [class.is-invalid]="isFieldInvalid('source')"
                      />
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('source')">
                        Source is required
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-light">Confidence Level (%)</label>
                      <input
                        type="number"
                        class="form-control custom-input"
                        formControlName="confidence"
                        min="0"
                        max="100"
                        placeholder="85"
                        [class.is-invalid]="isFieldInvalid('confidence')"
                      />
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('confidence')">
                        Confidence level must be between 0 and 100
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label text-light">Tags</label>
                      <div class="tags-container mb-2">
                        <span 
                          *ngFor="let tag of tags.controls; let i = index" 
                          class="badge tag-badge me-1 mb-1"
                        >
                          {{ tag.value }}
                          <button 
                            type="button" 
                            class="btn-close btn-close-white ms-1" 
                            (click)="removeTag(i)"
                            style="font-size: 0.6rem;"
                          ></button>
                        </span>
                      </div>
                      <div class="input-group">
                        <input
                          type="text"
                          class="form-control custom-input"
                          [(ngModel)]="newTag"
                          [ngModelOptions]="{standalone: true}"
                          placeholder="Enter tag and press Add"
                          (keyup.enter)="addTag()"
                        />
                        <button 
                          type="button" 
                          class="btn btn-outline-info" 
                          (click)="addTag()"
                          [disabled]="!newTag.trim()"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dynamic Metadata Section -->
              <div class="form-section">
                <h5 class="section-title">
                  <i class="fas fa-database me-2"></i>
                  Metadata
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-info ms-2" 
                    (click)="showAddMetadataModal = true"
                  >
                    <i class="fas fa-plus"></i> Add Field
                  </button>
                </h5>
                
                <div class="row" formGroupName="metadata">
                  <div class="col-md-6 mb-3" *ngFor="let field of getMetadataFields(); let i = index">
                    <label class="form-label text-light text-capitalize">
                      {{ formatFieldName(field) }}
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline-danger ms-2" 
                        (click)="removeMetadataField(field)"
                        *ngIf="!isRequiredMetadataField(field)"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </label>
                    <input
                      [type]="getInputType(field)"
                      class="form-control custom-input"
                      [formControlName]="field"
                      [placeholder]="getPlaceholder(field)"
                    />
                  </div>
                </div>

                <!-- Add Metadata Field Modal -->
                <div class="metadata-modal" *ngIf="showAddMetadataModal">
                  <div class="modal-content">
                    <h6 class="text-light mb-3">Add Metadata Field</h6>
                    <div class="input-group mb-3">
                      <input
                        type="text"
                        class="form-control custom-input"
                        [(ngModel)]="newMetadataKey"
                        [ngModelOptions]="{standalone: true}"
                        placeholder="Field name (e.g., registrar, asn)"
                      />
                      <input
                        type="text"
                        class="form-control custom-input"
                        [(ngModel)]="newMetadataValue"
                        [ngModelOptions]="{standalone: true}"
                        placeholder="Field value"
                      />
                    </div>
                    <div class="modal-actions">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-primary" 
                        (click)="addMetadataField()"
                        [disabled]="!newMetadataKey.trim()"
                      >
                        Add
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary ms-2" 
                        (click)="cancelAddMetadata()"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expiration Date -->
              <div class="form-section">
                <h5 class="section-title">
                  <i class="fas fa-calendar-alt me-2"></i>
                  Expiration
                </h5>
                
                <div class="row">
                  <div class="col-md-4">
                    <div class="mb-3">
                      <label class="form-label text-light">Expiration Date</label>
                      <input
                        type="datetime-local"
                        class="form-control custom-input"
                        formControlName="expiration_date"
                        [class.is-invalid]="isFieldInvalid('expiration_date')"
                      />
                      <div class="invalid-feedback" *ngIf="isFieldInvalid('expiration_date')">
                        Expiration date is required
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Audit Information -->
              <!-- <div class="form-section" *ngIf="currentIOC">
                <h5 class="section-title">
                  <i class="fas fa-history me-2"></i>
                  Audit Information
                </h5>
                
                <div class="row">
                  <div class="col-md-3">
                    <label class="form-label text-muted">Created At</label>
                    <div class="audit-field">{{ formatDisplayDate(currentIOC.created_at!) }}</div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-muted">Created By</label>
                    <div class="audit-field">{{ currentIOC.created_by || 'N/A' }}</div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-muted">Last Updated</label>
                    <div class="audit-field">{{ formatDisplayDate(currentIOC.updated_at!) }}</div>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label text-muted">Updated By</label>
                    <div class="audit-field">{{ currentIOC.updated_by || 'N/A' }}</div>
                  </div>
                </div>
              </div> -->

              <!-- Submit Button -->
              <div class="form-actions">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  [disabled]="threatForm.invalid || isSubmitting"
                >
                  <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  <i *ngIf="!isSubmitting" class="fas fa-save me-2"></i>
                  {{ isSubmitting ? 'Updating...' : 'Update IOC' }}
                </button>
                
                <button
                  type="button"
                  class="btn btn-secondary btn-lg ms-3"
                  (click)="resetForm()"
                  [disabled]="isSubmitting"
                >
                  <i class="fas fa-undo me-2"></i>
                  Reset Changes
                </button>

                <button
                  type="button"
                  class="btn btn-outline-info btn-lg ms-3"
                  (click)="goBack()"
                  [disabled]="isSubmitting"
                >
                  <i class="fas fa-arrow-left me-2"></i>
                  Back to List
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    // :root {
    //   --primary-color: #1a1a2e;
    //   --secondary-color: #16213e;
    //   --accent-color: #0f3460;
    //   --danger-color: #e94560;
    //   --warning-color: #f39c12;
    //   --success-color: #27ae60;
    //   --info-color: #7de6e7;
    // }

    .threat-form-container {
      background: var(--primary-color);
      border-radius: 15px;
      padding: 2rem;
      margin: 2rem 0;
      border: 1px solid var(--accent-color);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--accent-color);
    }

    .ioc-info-card {
      background: var(--secondary-color);
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      border: 1px solid var(--accent-color);
    }

    .loading-container {
      padding: 3rem;
    }

    .form-section {
      background: var(--secondary-color);
      border-radius: 10px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--accent-color);
    }

    .section-title {
      color: var(--info-color) !important;
      margin-bottom: 1.5rem;
      font-weight: 600;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--accent-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .custom-input {
      background-color: var(--accent-color) !important;
      border: 2px solid var(--accent-color) !important;
      color: white !important;
      transition: all 0.3s ease;
    }

    .custom-input:focus {
      background-color: var(--secondary-color) !important;
      border-color: var(--info-color) !important;
      color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(125, 230, 231, 0.25) !important;
    }

    .custom-input::placeholder {
      color: #adb5bd !important;
    }

    .custom-input option {
      background-color: var(--accent-color);
      color: white;
    }

    .btn-primary {
      background-color: var(--info-color);
      border-color: var(--info-color);
      color: var(--primary-color) !important;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background-color: #6bcbcc;
      border-color: #6bcbcc;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(125, 230, 231, 0.3);
    }

    .btn-secondary {
      background-color: var(--accent-color);
      border-color: var(--accent-color);
      color: white !important;
      font-weight: 600;
    }

    .btn-secondary:hover {
      background-color: var(--secondary-color);
      border-color: var(--secondary-color);
    }

    .btn-outline-info {
      border-color: var(--info-color);
      color: var(--info-color);
    }

    .btn-outline-info:hover {
      background-color: var(--info-color);
      color: var(--primary-color);
    }

    .btn-outline-danger {
      border-color: var(--danger-color);
      color: var(--danger-color);
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
    }

    .btn-outline-danger:hover {
      background-color: var(--danger-color);
      color: white;
    }

    .tags-container {
      min-height: 2rem;
    }

    .tag-badge {
      background-color: var(--info-color) !important;
      color: var(--primary-color) !important;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      display: inline-flex;
      align-items: center;
    }

    .metadata-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--primary-color);
      padding: 2rem;
      border-radius: 10px;
      border: 1px solid var(--accent-color);
      min-width: 400px;
    }

    .modal-actions {
      text-align: center;
    }

    .audit-field {
      background: var(--accent-color);
      padding: 0.5rem;
      border-radius: 5px;
      color: white;
      font-size: 0.9rem;
    }

    .alert-success {
      background-color: rgba(39, 174, 96, 0.2) !important;
      border-color: var(--success-color) !important;
      color: var(--success-color) !important;
    }

    .alert-danger {
      background-color: rgba(233, 69, 96, 0.2) !important;
      border-color: var(--danger-color) !important;
      color: var(--danger-color) !important;
    }

    .form-actions {
      text-align: center;
      padding-top: 2rem;
      border-top: 2px solid var(--accent-color);
    }

    .is-invalid {
      border-color: var(--danger-color) !important;
    }

    .invalid-feedback {
      color: var(--danger-color) !important;
    }

    .form-label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .text-info {
      color: var(--info-color) !important;
    }

    .text-warning {
      color: var(--warning-color) !important;
    }
  `]
})
export class IOCUpdateComponent implements OnInit {
  threatForm: FormGroup;
  isSubmitting = false;
  isLoading = true;
  successMessage = '';
  errorMessage = '';
  newTag = '';
  iocId: string = '';
  currentIOC: ThreatIntelligence | null = null;
  
  // Metadata modal
  showAddMetadataModal = false;
  newMetadataKey = '';
  newMetadataValue = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private threatService: ThreatService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.threatForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.iocId = params['id'];
      if (this.iocId) {
        this.loadIOCData();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      value: ['', [Validators.required]],
      type: ['', [Validators.required]],
      threat_level: ['', [Validators.required]],
      status: ['', [Validators.required]],
      description: ['', [Validators.required]],
      source: ['', [Validators.required]],
      confidence: [85, [Validators.required, Validators.min(0), Validators.max(100)]],
      tags: this.fb.array([]),
      metadata: this.fb.group({}),
      expiration_date: ['', [Validators.required]]
    });
  }

  loadIOCData(): void {
    this.isLoading = true;
    this.threatService.getIOCById(this.iocId).pipe(
      catchError((error) => {
        console.error('Error loading IOC:', error);
        this.errorMessage = 'Failed to load IOC data';
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((response) => {
      if (response) {
        console.log("response:", response);
        this.currentIOC = response;
        this.populateForm(this.currentIOC!);
      }
    });
  }
  isISOString(value: any): boolean {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?Z$/.test(value);
  }
  formatToDatetimeLocal(isoString: string): string {
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  populateForm(ioc: ThreatIntelligence): void {
    // Populate basic fields
    this.threatForm.patchValue({
      value: ioc.value,
      type: ioc.type,
      threat_level: ioc.threat_level,
      status: ioc.status,
      description: ioc.description,
      source: ioc.source,
      confidence: ioc.confidence,
      
      expiration_date: this.formatDateForInput(ioc.expiration_date)
    });

    // Populate tags
    const tagsArray = this.threatForm.get('tags') as FormArray;
    tagsArray.clear();
    if (ioc.tags) {
      ioc.tags.forEach(tag => {
        tagsArray.push(this.fb.control(tag));
      });
    }
    
    console.log("metadata:", ioc.metadata);
    // Populate metadata dynamically
    const metadataGroup = this.threatForm.get('metadata') as FormGroup;
    Object.keys(metadataGroup.controls).forEach(key => {
      metadataGroup.removeControl(key);
    });

    if (ioc.metadata) {
      Object.keys(ioc.metadata).forEach(key => {
        
        let value = ioc.metadata[key];

        if (this.isISOString(value)) {
          value = this.formatToDatetimeLocal(value);
        }
        metadataGroup.addControl(key, this.fb.control(value));
      });
    }
  }

  get tags(): FormArray {
    return this.threatForm.get('tags') as FormArray;
  }

  addTag(): void {
    if (this.newTag?.trim()) {
      this.tags.push(this.fb.control(this.newTag.trim()));
      this.newTag = '';
    }
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  getMetadataFields(): string[] {
    const metadataGroup = this.threatForm.get('metadata') as FormGroup;
    return Object.keys(metadataGroup.controls);
  }

  addMetadataField(): void {
    if (this.newMetadataKey.trim()) {
      const metadataGroup = this.threatForm.get('metadata') as FormGroup;
      metadataGroup.addControl(
        this.newMetadataKey.trim(),
        this.fb.control(this.newMetadataValue.trim())
      );
      this.cancelAddMetadata();
    }
  }

  removeMetadataField(fieldName: string): void {
    const metadataGroup = this.threatForm.get('metadata') as FormGroup;
    metadataGroup.removeControl(fieldName);
  }

  cancelAddMetadata(): void {
    this.showAddMetadataModal = false;
    this.newMetadataKey = '';
    this.newMetadataValue = '';
  }

  isRequiredMetadataField(fieldName: string): boolean {
    const requiredFields = ['country', 'first_detected'];
    return requiredFields.includes(fieldName);
  }

  formatFieldName(fieldName: string): string {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getInputType(fieldName: string): string {
    const dateFields = ['first_detected', 'first_seen', 'last_seen'];
    return dateFields.includes(fieldName) ? 'datetime-local' : 'text';
  }

  getPlaceholder(fieldName: string): string {
    const placeholders: { [key: string]: string } = {
      'country': 'US',
      'asn': 'AS20473',
      'registrar': 'NameCheap',
      'whois_status': 'clientTransferProhibited'
    };
    return placeholders[fieldName] || '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.threatForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  }

  formatDateForAPI(dateString: string): string {
    return new Date(dateString).toISOString();
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  onSubmit(): void {
    if (this.threatForm.valid) {
      this.isSubmitting = true;
      this.clearMessages();

      const formValue = this.threatForm.value;
      
      // Format metadata - handle date fields
      const processedMetadata = { ...formValue.metadata };
      Object.keys(processedMetadata).forEach(key => {
        if (this.getInputType(key) === 'datetime-local' && processedMetadata[key]) {
          processedMetadata[key] = this.formatDateForAPI(processedMetadata[key]);
        }
      });

      const payload: ThreatIntelligence = {
        ...this.currentIOC,
        ...formValue,
        tags: formValue.tags || [],
        metadata: processedMetadata,
        expiration_date: this.formatDateForAPI(formValue.expiration_date),
        updated_by: 'current_user' // You can get this from auth service
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.threatService.updateIOC(this.iocId, payload).pipe(
        catchError((error) => {
          console.error('API Error:', error);
          this.errorMessage = error.error?.message || 'Failed to update threat intelligence';
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      ).subscribe((response) => {
        if (response && response.success) {
          this.successMessage = response.message || 'IOC updated successfully!';
          // Reload the updated data
          this.loadIOCData();
        }
      });
    } else {
      this.markFormGroupTouched(this.threatForm);
    }
  }

  resetForm(): void {
    if (this.currentIOC) {
      this.populateForm(this.currentIOC);
      this.clearMessages();
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  goBack(): void {
    this.router.navigate(['/iocs']); // Adjust path as needed
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}