
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Keyword {
  keyword: string;
  case_sensitive: boolean;
  regex: boolean;
}

interface Subscription {
  _id?: string;
  user_id: string;
  channel_username: string;
  keywords: Keyword[];
  enabled?: boolean;
  created_at?: string;
}

@Component({
  selector: 'app-channel-subscriptions',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './channel-subscriptions.component.html',
  styleUrls: ['./channel-subscriptions.component.scss']
})
export class ChannelSubscriptionsComponent implements OnInit {
  subscriptions: Subscription[] = [];
  subscriptionForm: FormGroup;
  isEditing = false;
  editingIndex = -1;
  loading = false;
  currentUserId = '687620effcae33bf9555540a'; // Replace with actual user ID
  
  // API endpoints
  private apiBaseUrl = 'http://localhost:8080';
  
  // Common cybersecurity keywords for suggestions
  suggestedKeywords = [
    'AI', 'Leak', 'Hack', 'Breach', 'Malware', 'Phishing', 'Ransomware',
    'Vulnerability', 'Exploit', 'Zero-day', 'APT', 'Botnet', 'DDoS',
    'SQL Injection', 'XSS', 'CSRF', 'Backdoor', 'Trojan', 'Spyware',
    'Credential', 'Password', 'Database', 'API', 'Token', 'Certificate'
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.subscriptionForm = this.createForm();
  }

  ngOnInit() {
    this.loadSubscriptions();
  }

  createForm(): FormGroup {
    return this.fb.group({
      channel_username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      keywords: this.fb.array([])
    });
  }

  get keywordsArray(): FormArray {
    return this.subscriptionForm.get('keywords') as FormArray;
  }

  createKeywordGroup(keyword: Keyword = { keyword: '', case_sensitive: false, regex: false }): FormGroup {
    return this.fb.group({
      keyword: [keyword.keyword, Validators.required],
      case_sensitive: [keyword.case_sensitive],
      regex: [keyword.regex]
    });
  }

  addKeyword(keyword?: Keyword) {
    this.keywordsArray.push(this.createKeywordGroup(keyword));
  }

  removeKeyword(index: number) {
    this.keywordsArray.removeAt(index);
  }

  addSuggestedKeyword(keyword: string) {
    const existingKeywords = this.keywordsArray.value.map((k: Keyword) => k.keyword.toLowerCase());
    if (!existingKeywords.includes(keyword.toLowerCase())) {
      this.addKeyword({ keyword, case_sensitive: false, regex: false });
    }
  }

  loadSubscriptions() {
    this.loading = true;
    
    this.http.get<Subscription[]>(`${this.apiBaseUrl}/auth/me/subscriptions`)
      .subscribe({
        next: (subscriptions) => {
          this.subscriptions = subscriptions;
          this.loading = false;
          console.log('Subscriptions loaded:', subscriptions);
        },
        error: (error) => {
          console.error('Error loading subscriptions:', error);
          this.loading = false;
          // Optionally show user-friendly error message
        }
      });
  }

  startEdit(subscription: Subscription, index: number) {
    this.isEditing = true;
    this.editingIndex = index;
    
    // Clear existing keywords
    while (this.keywordsArray.length !== 0) {
      this.keywordsArray.removeAt(0);
    }
    
    // Populate form - remove @ prefix if present
    const channelUsername = subscription.channel_username.startsWith('@') 
      ? subscription.channel_username.substring(1) 
      : subscription.channel_username;
    
    this.subscriptionForm.patchValue({
      channel_username: channelUsername
    });
    
    // Add keywords
    subscription.keywords.forEach(keyword => {
      this.addKeyword(keyword);
    });
  }

  startNew() {
    this.isEditing = true;
    this.editingIndex = -1;
    this.subscriptionForm.reset();
    
    // Clear keywords array
    while (this.keywordsArray.length !== 0) {
      this.keywordsArray.removeAt(0);
    }
    
    // Add one empty keyword
    this.addKeyword();
  }

  saveSubscription() {
  if (this.subscriptionForm.valid && this.keywordsArray.length > 0) {
    const formValue = this.subscriptionForm.value;
    const subscription = {
      channel_username: formValue.channel_username,
      keywords: formValue.keywords
    };

    this.loading = true;

    if (this.editingIndex >= 0) {
      // Update existing subscription
      const existingSubscription = this.subscriptions[this.editingIndex];
      
      this.http.put(`${this.apiBaseUrl}/auth/subscriptions/${existingSubscription.channel_username}`, subscription)
        .subscribe({
          next: (response) => {
            console.log('Subscription updated:', response);
            this.loadSubscriptions(); // Reload subscriptions
            this.cancelEdit();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating subscription:', error);
            this.loading = false;
          }
        });
    } else {
      // Create new subscription
      this.http.post(`${this.apiBaseUrl}/auth/subscribe`, subscription)
        .subscribe({
          next: (response) => {
            console.log('Subscription created:', response);
            this.loadSubscriptions(); // Reload subscriptions
            this.cancelEdit();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating subscription:', error);
            this.loading = false;
          }
        });
    }
  }
}
  
  deleteSubscription(index: number) {
  if (confirm('Are you sure you want to delete this subscription?')) {
    const subscription = this.subscriptions[index];
    this.loading = true;
    
    // Use the new FastAPI endpoint structure
    this.http.delete(`${this.apiBaseUrl}/auth/subscriptions/${subscription.channel_username}`)
      .subscribe({
        next: (response) => {
          console.log('Subscription deleted:', response);
          this.loadSubscriptions(); // Reload subscriptions
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting subscription:', error);
          this.loading = false;
        }
      });
  }
}

  toggleSubscription(index: number) {
    const subscription = this.subscriptions[index];
    const updatedSubscription = {
      ...subscription,
      enabled: !subscription.enabled
    };
    
    this.loading = true;
    
    this.http.put(`${this.apiBaseUrl}/auth/subscriptions/${subscription._id}`, updatedSubscription)
      .subscribe({
        next: (response) => {
          console.log('Subscription toggled:', response);
          this.subscriptions[index] = updatedSubscription;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error toggling subscription:', error);
          this.loading = false;
        }
      });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingIndex = -1;
    this.subscriptionForm.reset();
  }

  getChannelDisplayName(username: string): string {
    return username.startsWith('@') ? username.substring(1) : username;
  }

  getKeywordTypeIcon(keyword: Keyword): string {
    if (keyword.regex) return '🔍'; // Regex
    if (keyword.case_sensitive) return 'Aa'; // Case sensitive
    return '📝'; // Normal text
  }

  getKeywordTypeTooltip(keyword: Keyword): string {
    if (keyword.regex) return 'Regular Expression';
    if (keyword.case_sensitive) return 'Case Sensitive';
    return 'Text Match';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }
}