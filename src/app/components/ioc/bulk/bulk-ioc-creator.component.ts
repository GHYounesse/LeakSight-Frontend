import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface IoC {
  value: string;
  type: 'ip' | 'domain' | 'file_hash' | 'url' | 'email';
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive';
  description: string;
  source: string;
  confidence: number;
  tags: string[];
  metadata?: any;
  expiration_date?: string;
}

interface BulkIoCRequest {
  iocs: IoC[];
}

@Component({
  selector: 'app-bulk-ioc-creator',
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-ioc-creator.component.html',
  styleUrls: ['./bulk-ioc-creator.component.scss']
})
export class BulkIoCCreatorComponent implements OnInit {
  // Component properties
  inputMethod: 'file' | 'json' = 'file';
  selectedFile: File | null = null;
  jsonInput: string = '';
  isDragOver: boolean = false;
  isProcessing: boolean = false;
  isSubmitting: boolean = false;
  
  // Data properties
  parsedIoCs: IoC[] = [];
  validationResults: any[] = [];
  validationErrors: string[] = [];
  submitResult: { success: boolean; message: string } | null = null;

  // API Configuration - Update these values
  private readonly API_BASE_URL = 'http://localhost:8080/api/v1';
  

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.resetStats();
  }

  // Computed properties for stats
  get totalIoCs(): number {
    return this.parsedIoCs.length;
  }

  get validIoCs(): number {
    return this.parsedIoCs.filter(ioc => this.validateIoC(ioc).isValid).length;
  }

  get invalidIoCs(): number {
    return this.totalIoCs - this.validIoCs;
  }

  // Input method management
  setInputMethod(method: 'file' | 'json'): void {
    this.inputMethod = method;
    this.resetValidation();
  }

  // File handling methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  private handleFileSelection(file: File): void {
    // Validate file type
    const allowedTypes = ['text/plain', 'application/json'];
    const isValidExtension = file.name.toLowerCase().endsWith('.txt') || 
                            file.name.toLowerCase().endsWith('.json');
    
    if (!allowedTypes.includes(file.type) && !isValidExtension) {
      this.showError('Please select a valid .txt or .json file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showError('File size must be less than 10MB');
      return;
    }

    this.selectedFile = file;
    this.resetValidation();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.resetValidation();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // JSON handling methods
  formatJson(): void {
    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonInput = JSON.stringify(parsed, null, 2);
    } catch (error) {
      this.showError('Invalid JSON format');
    }
  }

  clearJson(): void {
    this.jsonInput = '';
    this.resetValidation();
  }

  // Processing methods
  canProcess(): boolean {
    if (this.inputMethod === 'file') {
      return this.selectedFile !== null;
    } else {
      return this.jsonInput.trim().length > 0;
    }
  }

  async processInput(): Promise<void> {
    console.log("Processing Button is clicked!");
    this.isProcessing = true;
    this.resetValidation();

    try {
      let data: any;

      if (this.inputMethod === 'file') {
        data = await this.processFile();
      } else {
        data = await this.processJson();
      }

      if (data && data.iocs) {
        this.parsedIoCs = data.iocs;
        this.validateIoCs();
      } else {
        throw new Error('Invalid data format. Expected an object with "iocs" array.');
      }

    } catch (error: any) {
      this.showError(`Processing failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processFile(): Promise<any> {
    if (!this.selectedFile) {
      throw new Error('No file selected');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          if (this.selectedFile!.name.toLowerCase().endsWith('.json')) {
            // Parse JSON file
            const data = JSON.parse(content);
            resolve(data);
          } else {
            // Parse TXT file (assume one IoC value per line)
            const lines = content.split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0);
            
            const iocs = lines.map((line, index) => ({
              value: line,
              type: this.detectIoCType(line),
              threat_level: 'medium',
              status: 'active',
              description: `IoC imported from file (line ${index + 1})`,
              source: 'File Import',
              confidence: 75,
              tags: ['imported'],
              metadata: {
                line_number: index + 1,
                imported_at: new Date().toISOString()
              }
            }));
            
            resolve({ iocs });
          }
        } catch (error: any) {
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(this.selectedFile!);
    });
  }

  private async processJson(): Promise<any> {
    try {
      return JSON.parse(this.jsonInput);
    } catch (error: any) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  private detectIoCType(value: string): IoC['type'] {
    // IP address pattern
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(value)) {
      return 'ip';
    }

    // Domain pattern
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (domainPattern.test(value)) {
      return 'domain';
    }

    // Hash pattern (MD5, SHA1, SHA256)
    const hashPattern = /^[a-fA-F0-9]{32,64}$/;
    if (hashPattern.test(value)) {
      return 'file_hash';
    }

    // URL pattern
    const urlPattern = /^https?:\/\//;
    if (urlPattern.test(value)) {
      return 'url';
    }

    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(value)) {
      return 'email';
    }

    // Default to domain if unknown
    return 'domain';
  }

  // Validation methods
  private validateIoCs(): void {
    this.validationResults = [];
    this.validationErrors = [];

    this.parsedIoCs.forEach((ioc, index) => {
      const validation = this.validateIoC(ioc);
      this.validationResults.push({
        index,
        isValid: validation.isValid,
        errors: validation.errors
      });

      if (!validation.isValid) {
        this.validationErrors.push(
          `IoC ${index + 1} (${ioc.value}): ${validation.errors.join(', ')}`
        );
      }
    });

    // Remove invalid IoCs
    this.parsedIoCs = this.parsedIoCs.filter((_, index) => 
      this.validationResults[index].isValid
    );
  }

  private validateIoC(ioc: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!ioc.value || typeof ioc.value !== 'string') {
      errors.push('Value is required and must be a string');
    }

    if (!ioc.type || !['ip', 'domain', 'file_hash', 'url', 'email'].includes(ioc.type)) {
      errors.push('Type must be one of: ip, domain, file_hash, url, email');
    }

    if (!ioc.threat_level || !['low', 'medium', 'high', 'critical'].includes(ioc.threat_level)) {
      errors.push('Threat level must be one of: low, medium, high, critical');
    }

    if (!ioc.status || !['active', 'inactive'].includes(ioc.status)) {
      errors.push('Status must be either active or inactive');
    }

    if (!ioc.description || typeof ioc.description !== 'string') {
      errors.push('Description is required and must be a string');
    }

    if (!ioc.source || typeof ioc.source !== 'string') {
      errors.push('Source is required and must be a string');
    }

    if (typeof ioc.confidence !== 'number' || ioc.confidence < 0 || ioc.confidence > 100) {
      errors.push('Confidence must be a number between 0 and 100');
    }

    if (!Array.isArray(ioc.tags)) {
      errors.push('Tags must be an array');
    }

    // Value format validation based on type
    if (ioc.type && ioc.value) {
      const isValidFormat = this.validateIoCFormat(ioc.value, ioc.type);
      if (!isValidFormat) {
        errors.push(`Invalid format for ${ioc.type}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateIoCFormat(value: string, type: string): boolean {
    switch (type) {
      case 'ip':
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
      case 'domain':
        return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
      case 'file_hash':
        return /^[a-fA-F0-9]{32,64}$/.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      default:
        return true;
    }
  }

  // Submission methods
  async submitBulkIoCs(): Promise<void> {
    if (this.parsedIoCs.length === 0) {
      this.showError('No valid IoCs to submit');
      return;
    }

    this.isSubmitting = true;
    this.submitResult = null;

    try {
      const payload: BulkIoCRequest = {
        iocs: this.parsedIoCs
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
        
      });

      const response = await this.http.post(
        `${this.API_BASE_URL}/iocs/bulk`,
        payload,
        { headers }
      ).toPromise();

      this.submitResult = {
        success: true,
        message: `Successfully created ${this.parsedIoCs.length} IoCs`
      };

      // Reset form after successful submission
      setTimeout(() => {
        this.resetForm();
      }, 3000);

    } catch (error: any) {
      console.error('Submission error:', error);
      
      let errorMessage = 'Failed to create IoCs';
      if (error.error?.message) {
        errorMessage += `: ${error.error.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      this.submitResult = {
        success: false,
        message: errorMessage
      };
    } finally {
      this.isSubmitting = false;
    }
  }

  // Utility methods
  private resetValidation(): void {
    this.parsedIoCs = [];
    this.validationResults = [];
    this.validationErrors = [];
    this.submitResult = null;
  }

  private resetStats(): void {
    // Stats are computed properties, so this just triggers change detection
  }

  private resetForm(): void {
    this.inputMethod = 'file';
    this.selectedFile = null;
    this.jsonInput = '';
    this.isDragOver = false;
    this.resetValidation();
  }

  private showError(message: string): void {
    this.submitResult = {
      success: false,
      message
    };
  }

  // Math utility for template
  Math = Math;
}