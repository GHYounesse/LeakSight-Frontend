import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ThreatService } from '../../../service/threat/threat.service';
interface ThreatIntelligence {
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
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-threat-submission',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-lg-10 col-xl-8">
          <div class="threat-form-container">
            <div class="form-header">
              <h2 class="text-light mb-3">
                <i class="fas fa-shield-alt me-2"></i>
                Submit Threat Intelligence
              </h2>
              <p class="text-muted mb-4">
                Submit new threat intelligence data to enhance our security database
              </p>
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

            <form [formGroup]="threatForm" (ngSubmit)="onSubmit()">
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

              <!-- Metadata Section -->
              <div class="form-section">
                <h5 class="section-title">
                  <i class="fas fa-database me-2"></i>
                  Metadata
                </h5>
                
                <div class="row" formGroupName="metadata">
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label class="form-label text-light">First Seen</label>
                      <input
                        type="datetime-local"
                        class="form-control custom-input"
                        formControlName="first_seen"
                        [class.is-invalid]="isMetadataFieldInvalid('first_seen')"
                      />
                      <div class="invalid-feedback" *ngIf="isMetadataFieldInvalid('first_seen')">
                        First seen date is required
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="mb-3">
                      <label class="form-label text-light">Last Seen</label>
                      <input
                        type="datetime-local"
                        class="form-control custom-input"
                        formControlName="last_seen"
                        [class.is-invalid]="isMetadataFieldInvalid('last_seen')"
                      />
                      <div class="invalid-feedback" *ngIf="isMetadataFieldInvalid('last_seen')">
                        Last seen date is required
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="mb-3">
                      <label class="form-label text-light">ASN</label>
                      <input
                        type="text"
                        class="form-control custom-input"
                        formControlName="asn"
                        placeholder="AS20473"
                        [class.is-invalid]="isMetadataFieldInvalid('asn')"
                      />
                      <div class="invalid-feedback" *ngIf="isMetadataFieldInvalid('asn')">
                        ASN is required
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="mb-3">
                      <label class="form-label text-light">Country</label>
                      <input
                        type="text"
                        class="form-control custom-input"
                        formControlName="country"
                        placeholder="US"
                        maxlength="2"
                        [class.is-invalid]="isMetadataFieldInvalid('country')"
                      />
                      <div class="invalid-feedback" *ngIf="isMetadataFieldInvalid('country')">
                        Country code is required (2 letters)
                      </div>
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

              <!-- Submit Button -->
              <div class="form-actions">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  [disabled]="threatForm.invalid || isSubmitting"
                >
                  <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  <i *ngIf="!isSubmitting" class="fas fa-paper-plane me-2"></i>
                  {{ isSubmitting ? 'Submitting...' : 'Submit Threat Intelligence' }}
                </button>
                
                <button
                  type="button"
                  class="btn btn-secondary btn-lg ms-3"
                  (click)="resetForm()"
                  [disabled]="isSubmitting"
                >
                  <i class="fas fa-redo me-2"></i>
                  Reset Form
                </button>
              </div>
            </form>
          </div>
        </div>
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
    }

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
  `]
})
export class IOCCreationComponent implements OnInit {
  threatForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  newTag = '';

  

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,private threatService: ThreatService
  ) {
    this.threatForm = this.createForm();
  }

  ngOnInit(): void {
    // Set default values similar to the example
    this.threatForm.patchValue({
      confidence: 85,
      metadata: {
        first_seen: this.formatDateForInput(new Date()),
        last_seen: this.formatDateForInput(new Date())
      },
      expiration_date: this.formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days from now
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
      metadata: this.fb.group({
        first_seen: ['', [Validators.required]],
        last_seen: ['', [Validators.required]],
        asn: ['', [Validators.required]],
        country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]]
      }),
      expiration_date: ['', [Validators.required]]
    });
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.threatForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isMetadataFieldInvalid(fieldName: string): boolean {
    const field = this.threatForm.get('metadata')?.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  formatDateForAPI(dateString: string): string {
    return new Date(dateString).toISOString();
  }

  onSubmit(): void {
    if (this.threatForm.valid) {
      this.isSubmitting = true;
      this.clearMessages();

      const formValue = this.threatForm.value;
      const payload: ThreatIntelligence = {
        ...formValue,
        tags: formValue.tags || [],
        metadata: {
          ...formValue.metadata,
          first_seen: this.formatDateForAPI(formValue.metadata.first_seen),
          last_seen: this.formatDateForAPI(formValue.metadata.last_seen)
        },
        expiration_date: this.formatDateForAPI(formValue.expiration_date)
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      this.threatService.createIOC(payload).pipe(
          catchError((error) => {
            console.error('API Error:', error);
            this.errorMessage = error.error?.message || 'Failed to submit threat intelligence';
            return of(null);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe((response) => {
          if (response && response.success) {
            this.successMessage = response.message || 'Threat intelligence submitted successfully!';
            this.resetForm();
          }
        });
    } else {
      this.markFormGroupTouched(this.threatForm);
    }
  }

  resetForm(): void {
    this.threatForm.reset();
    this.tags.clear();
    this.newTag = '';
    this.clearMessages();
    
    // Reset default values
    this.threatForm.patchValue({
      confidence: 85,
      metadata: {
        first_seen: this.formatDateForInput(new Date()),
        last_seen: this.formatDateForInput(new Date())
      },
      expiration_date: this.formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
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