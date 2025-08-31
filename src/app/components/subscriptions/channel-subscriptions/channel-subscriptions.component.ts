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

interface GroupedSubscription {
  keywords: Keyword[];
  channels: string[];
  subscriptionIds: string[];
}

interface BulkOperationResult {
  message: string;
  results: { [channel: string]: boolean };
  successful_count: number;
  total_requested: number;
}

@Component({
  selector: 'app-channel-subscriptions',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './channel-subscriptions.component.html',
  styleUrls: ['./channel-subscriptions.component.scss']
})
export class ChannelSubscriptionsComponent implements OnInit {
  subscriptions: Subscription[] = [];
  groupedSubscriptions: GroupedSubscription[] = [];
  subscriptionForm: FormGroup;
  bulkForm: FormGroup;
  isEditing = false;
  editingIndex = -1;
  loading = false;
  showBulkForm = false;
  showGroupedView = false;
  showCreateButton=false;
  selectedChannels: Set<string> = new Set();
  
  // API endpoints
  private apiBaseUrl = 'http://localhost:8080';
  
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
    this.bulkForm = this.createBulkForm();
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

  createBulkForm(): FormGroup {
    return this.fb.group({
      channel_usernames: ['', Validators.required], // Comma-separated list
      keywords: this.fb.array([])
    });
  }

  get keywordsArray(): FormArray {
    return this.subscriptionForm.get('keywords') as FormArray;
  }

  get bulkKeywordsArray(): FormArray {
    return this.bulkForm.get('keywords') as FormArray;
  }

  createKeywordGroup(keyword: Keyword = { keyword: '', case_sensitive: false, regex: false }): FormGroup {
    return this.fb.group({
      keyword: [keyword.keyword, Validators.required],
      case_sensitive: [keyword.case_sensitive],
      regex: [keyword.regex]
    });
  }

  addKeyword(keyword?: Keyword, isBulk = false) {
    const formArray = isBulk ? this.bulkKeywordsArray : this.keywordsArray;
    formArray.push(this.createKeywordGroup(keyword));
  }

  removeKeyword(index: number, isBulk = false) {
    const formArray = isBulk ? this.bulkKeywordsArray : this.keywordsArray;
    formArray.removeAt(index);
  }

  addSuggestedKeyword(keyword: string, isBulk = false) {
    const formArray = isBulk ? this.bulkKeywordsArray : this.keywordsArray;
    const existingKeywords = formArray.value.map((k: Keyword) => k.keyword.toLowerCase());
    if (!existingKeywords.includes(keyword.toLowerCase())) {
      this.addKeyword({ keyword, case_sensitive: false, regex: false }, isBulk);
    }
  }

  loadSubscriptions() {
    this.loading = true;
    
    this.http.get<Subscription[]>(`${this.apiBaseUrl}/auth/me/subscriptions`)
      .subscribe({
        next: (subscriptions) => {
          this.subscriptions = subscriptions;
          this.groupSubscriptionsByKeywords();
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

  groupSubscriptionsByKeywords() {
    const groupMap = new Map<string, GroupedSubscription>();
    
    this.subscriptions.forEach(subscription => {
      // Create a unique key based on keywords (sorted for consistency)
      const keywordsKey = JSON.stringify(
        subscription.keywords
          .map(k => ({ keyword: k.keyword.toLowerCase(), case_sensitive: k.case_sensitive, regex: k.regex }))
          .sort((a, b) => a.keyword.localeCompare(b.keyword))
      );
      
      if (groupMap.has(keywordsKey)) {
        const existing = groupMap.get(keywordsKey)!;
        existing.channels.push(subscription.channel_username);
        if (subscription._id) {
          existing.subscriptionIds.push(subscription._id);
        }
      } else {
        groupMap.set(keywordsKey, {
          keywords: subscription.keywords,
          channels: [subscription.channel_username],
          subscriptionIds: subscription._id ? [subscription._id] : []
        });
      }
    });
    
    this.groupedSubscriptions = Array.from(groupMap.values());
  }

  // Bulk subscription operations
  startBulkNew() {
    this.showBulkForm = true;
    this.bulkForm.reset();
    
    // Clear keywords array
    while (this.bulkKeywordsArray.length !== 0) {
      this.bulkKeywordsArray.removeAt(0);
    }
    
    // Add one empty keyword
    this.addKeyword(undefined, true);
  }

  saveBulkSubscription() {
    if (this.bulkForm.valid && this.bulkKeywordsArray.length > 0) {
      const formValue = this.bulkForm.value;
      
      // Parse comma-separated channel list
      const channelUsernames = formValue.channel_usernames
        .split(',')
        .map((channel: string) => channel.trim())
        .filter((channel: string) => channel.length > 0);
      
      if (channelUsernames.length === 0) {
        console.error('No valid channel usernames provided');
        return;
      }

      const bulkRequest = {
        channel_usernames: channelUsernames,
        keywords: formValue.keywords
      };

      this.loading = true;

      this.http.post<BulkOperationResult>(`${this.apiBaseUrl}/auth/bulk/subscribe`, bulkRequest)
        .subscribe({
          next: (response) => {
            console.log('Bulk subscription created:', response);
            this.loadSubscriptions(); // Reload subscriptions
            this.cancelBulkEdit();
            this.loading = false;
            // Optionally show success message to user
            alert(`Successfully subscribed to ${response.successful_count}/${response.total_requested} channels`);
          },
          error: (error) => {
            console.error('Error creating bulk subscription:', error);
            this.loading = false;
            // Optionally show error message to user
          }
        });
    }
  }

  updateBulkSubscriptions() {
    if (this.selectedChannels.size === 0) {
      alert('Please select channels to update');
      return;
    }

    if (this.bulkForm.valid && this.bulkKeywordsArray.length > 0) {
      const formValue = this.bulkForm.value;
      const channelUsernames = Array.from(this.selectedChannels);

      const bulkRequest = {
        channel_usernames: channelUsernames,
        keywords: formValue.keywords
      };

      this.loading = true;

      this.http.put<BulkOperationResult>(`${this.apiBaseUrl}/auth/bulk/subscriptions`, bulkRequest)
        .subscribe({
          next: (response) => {
            console.log('Bulk subscriptions updated:', response);
            this.loadSubscriptions();
            this.cancelBulkEdit();
            this.clearSelection();
            this.loading = false;
            this.showCreateButton=false;
            alert(`Successfully updated ${response.successful_count}/${response.total_requested} subscriptions`);
          },
          error: (error) => {
            console.error('Error updating bulk subscriptions:', error);
            this.loading = false;
          }
        });
    }
  }

  deleteBulkSubscriptions() {
    if (this.selectedChannels.size === 0) {
      alert('Please select channels to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${this.selectedChannels.size} subscription(s)?`)) {
      const channelUsernames = Array.from(this.selectedChannels);
      const bulkRequest = { channel_usernames: channelUsernames };

      this.loading = true;

      this.http.delete<BulkOperationResult>(`${this.apiBaseUrl}/auth/bulk/subscriptions`, { body: bulkRequest })
        .subscribe({
          next: (response) => {
            console.log('Bulk subscriptions deleted:', response);
            this.loadSubscriptions();
            this.clearSelection();
            this.loading = false;
            alert(`Successfully deleted ${response.successful_count}/${response.total_requested} subscriptions`);
          },
          error: (error) => {
            console.error('Error deleting bulk subscriptions:', error);
            this.loading = false;
          }
        });
    }
  }

  cancelBulkEdit() {
    this.showBulkForm = false;
    this.bulkForm.reset();
  }

  // Selection management
  toggleChannelSelection(channelUsername: string) {
    if (this.selectedChannels.has(channelUsername)) {
      this.selectedChannels.delete(channelUsername);
    } else {
      this.selectedChannels.add(channelUsername);
    }
  }

  selectAllChannels() {
    this.subscriptions.forEach(sub => {
      this.selectedChannels.add(sub.channel_username);
    });
  }

  clearSelection() {
    this.selectedChannels.clear();
  }

  isChannelSelected(channelUsername: string): boolean {
    return this.selectedChannels.has(channelUsername);
  }

  // Grouped subscriptions operations
  toggleGroupedView() {
    this.showGroupedView = !this.showGroupedView;
  }

  updateGroupedSubscriptions(group: GroupedSubscription) {
    // Open bulk form for editing this group
    this.showCreateButton=true;
    this.showBulkForm = true;
    
    this.bulkForm.reset();
    
    // Clear existing keywords array
    while (this.bulkKeywordsArray.length !== 0) {
      this.bulkKeywordsArray.removeAt(0);
    }
    
    // Pre-populate with existing keywords from the group
    group.keywords.forEach(keyword => {
      this.addKeyword(keyword, true);
    });
    
    // Set channel usernames in the form
    this.bulkForm.patchValue({
      channel_usernames: group.channels.join(', ')
    });
    
    // Pre-select the channels in selectedChannels for consistency
    this.clearSelection();
    group.channels.forEach(channel => {
      this.selectedChannels.add(channel);
    });
  }

  deleteGroupedSubscriptions(group: GroupedSubscription) {
    if (confirm(`Delete subscriptions for ${group.channels.length} channels with the same keywords?`)) {
      const bulkRequest = { channel_usernames: group.channels };

      this.loading = true;

      this.http.delete<BulkOperationResult>(`${this.apiBaseUrl}/auth/bulk/subscriptions`, { body: bulkRequest })
        .subscribe({
          next: (response) => {
            console.log('Grouped subscriptions deleted:', response);
            this.loadSubscriptions();
            this.loading = false;
            alert(`Successfully deleted ${response.successful_count}/${response.total_requested} subscriptions`);
          },
          error: (error) => {
            console.error('Error deleting grouped subscriptions:', error);
            this.loading = false;
          }
        });
    }
  }

  // Existing methods (preserved)
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
    
    this.http.put(`${this.apiBaseUrl}/auth/subscriptions/${subscription.channel_username}`, updatedSubscription)
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

  // Utility methods
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

  // Helper methods for grouped subscriptions
  getKeywordsDisplayText(keywords: Keyword[]): string {
    return keywords.map(k => k.keyword).join(', ');
  }

  getChannelsDisplayText(channels: string[]): string {
    return channels.map(channel => this.getChannelDisplayName(channel)).join(', ');
  }

  // Bulk edit selected subscriptions
  startBulkEditSelected() {
    if (this.selectedChannels.size === 0) {
      alert('Please select channels to edit');
      return;
    }

    this.showBulkForm = true;
    this.bulkForm.reset();
    
    // Clear keywords array
    while (this.bulkKeywordsArray.length !== 0) {
      this.bulkKeywordsArray.removeAt(0);
    }
    
    // Pre-populate with existing keywords if all selected channels have the same keywords
    const selectedSubscriptions = this.subscriptions.filter(sub => 
      this.selectedChannels.has(sub.channel_username)
    );
    
    if (selectedSubscriptions.length > 0) {
      const firstKeywords = selectedSubscriptions[0].keywords;
      const allHaveSameKeywords = selectedSubscriptions.every(sub => 
        JSON.stringify(sub.keywords) === JSON.stringify(firstKeywords)
      );
      
      if (allHaveSameKeywords) {
        firstKeywords.forEach(keyword => {
          this.addKeyword(keyword, true);
        });
      } else {
        // Add one empty keyword if keywords differ
        this.addKeyword(undefined, true);
      }
    }
    
    // Set channel usernames in the form
    this.bulkForm.patchValue({
      channel_usernames: Array.from(this.selectedChannels).join(', ')
    });
  }

  // Parse channel usernames from bulk form
  private parseChannelUsernames(input: string): string[] {
    return input
      .split(',')
      .map(channel => channel.trim())
      .filter(channel => channel.length > 0)
      .map(channel => channel.startsWith('@') ? channel.substring(1) : channel);
  }

  // Check if keywords are identical
  private areKeywordsIdentical(keywords1: Keyword[], keywords2: Keyword[]): boolean {
    if (keywords1.length !== keywords2.length) return false;
    
    const sorted1 = [...keywords1].sort((a, b) => a.keyword.localeCompare(b.keyword));
    const sorted2 = [...keywords2].sort((a, b) => a.keyword.localeCompare(b.keyword));
    
    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
  }
}