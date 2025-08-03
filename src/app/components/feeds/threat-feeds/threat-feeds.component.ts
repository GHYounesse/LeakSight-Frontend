// threat-feeds.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ThreatService } from '../../../service/threat/threat.service'; 
export interface ThreatFeed {
  _id: string;
  title: string;
  link: string;
  publishedDate: string;
  summary: string;
  content: string;
  source: string;
  categories: string[];
  priority: 'High' | 'Medium' | 'Low' | 'Information';
}

export interface FeedsResponse {
  items: ThreatFeed[];
  total: number;
  limit: number;
  skip: number;
}

@Component({
  selector: 'app-threat-feeds',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './threat-feeds.component.html',
  styleUrls: ['./threat-feeds.component.scss']
})
export class ThreatFeedsComponent implements OnInit, OnDestroy {
  feeds: ThreatFeed[] = [];
  totalFeeds = 0;
  currentPage = 0;
  pageSize = 25;
  isLoading = false;
  isLoadingMore = false;
  
  selectedPriority = '';
  selectedSource = '';
  uniqueSources: string[] = [];
  priorityCount: { [key: string]: number } = {};
  searchQuery: string = '';
  filteredCount: number = 0;
  private searchTimeout: any;
  
  private refreshSubscription?: Subscription;
  private apiUrl = 'http://localhost:8080/api/v1/feeds'; // Adjust based on your API URL

  constructor(private threatService: ThreatService) {}

  ngOnInit() {
    this.loadFeeds();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  onSearchChange(): void {
  // Clear previous timeout to debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Debounce search with 300ms delay
    this.searchTimeout = setTimeout(() => {
      this.onFilterChange();
    }, 300);
  }
  clearSearch(): void {
  this.searchQuery = '';
  this.onFilterChange();
}
clearAllFilters(): void {
  this.searchQuery = '';
  this.selectedPriority = '';
  this.selectedSource = '';
  this.onFilterChange();
}



  trackByFeedId(index: number, feed: ThreatFeed): string {
    return feed._id;
  }
  private escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
  highlightSearchTerm(text: string): string {
    if (!this.searchQuery || !this.searchQuery.trim() || !text) {
      return text;
    }

    const query = this.searchQuery.trim();
    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  
  loadFeeds(append = false) {
    if (!append) {
      this.isLoading = true;
      this.currentPage = 0;
    } else {
      this.isLoadingMore = true;
    }

    const skip = this.currentPage * this.pageSize;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('limit', this.pageSize.toString());
    params.append('skip', skip.toString());
    
    // Add search query if provided
    if (this.searchQuery && this.searchQuery.trim()) {
      params.append('q', this.searchQuery.trim());
    }
    
    // Add priority filter if selected
    if (this.selectedPriority && this.selectedPriority.trim()) {
      params.append('priority', this.selectedPriority.trim());
    }
    
    // Add source filter if selected
    if (this.selectedSource && this.selectedSource.trim()) {
      params.append('source', this.selectedSource.trim());
    }
    
    // Use the search endpoint for all requests
    const url = `${this.apiUrl}/search?${params.toString()}`;
    
    console.log('Loading feeds with URL:', url); // Debug log
    
    this.threatService.manageFeed(url).subscribe({
      next: (response) => {
        if (append) {
          this.feeds = [...this.feeds, ...response.items];
        } else {
          this.feeds = response.items;
          this.extractUniqueSources();
        }
        
        this.totalFeeds = response.total;
        this.filteredCount = response.total; // Server handles filtering now
        
        // Update priority counts based on current filtered results
        this.calculatePriorityCounts();
        
        console.log("Total feeds:", this.totalFeeds);
        console.log("Filtered count:", this.filteredCount);
        
        
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error loading feeds:', error);
        this.isLoading = false;
        this.isLoadingMore = false;
      }
    });
  }

  loadMore() {
    this.currentPage++;
    this.loadFeeds(true);
  }

  refreshFeeds() {
    this.loadFeeds();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadFeeds();
  }

  clearFilters() {
    this.selectedPriority = '';
    this.selectedSource = '';
    this.onFilterChange();
  }

  private startAutoRefresh() {
    // Auto-refresh every 5 minutes
    this.refreshSubscription = interval(300000)
      .pipe(startWith(0))
      .subscribe(() => {
        if (!this.isLoading) {
          this.refreshFeeds();
        }
      });
  }

  private extractUniqueSources() {
    this.uniqueSources = [...new Set(this.feeds.map(feed => feed.source))].sort();
  }

  private calculatePriorityCounts() {
    this.priorityCount = this.feeds.reduce((acc, feed) => {
      acc[feed.priority] = (acc[feed.priority] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'High': return '🚨';
      case 'Medium': return '⚠️';
      case 'Low': return '📝';
      case 'Information': return 'ℹ️';
      default: return '📄';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      // Could add a toast notification here
      console.log('Link copied to clipboard');
    });
  }
}