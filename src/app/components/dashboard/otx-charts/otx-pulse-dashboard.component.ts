import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

interface OTXPulseInsights {
  trendingTimeline: Array<{ date: string; count: number }>;
  topMalwareFamilies: Array<{ malware_family: string; count: number }>;
  popularityLeaderboard: Array<{ 
    pulse_name: string; 
    subscriber_count: number; 
    export_count: number 
  }>;
  indicatorTypeDistribution: { [key: string]: number };
  metadata?: {
    total_pulses: number;
    processed_at: string;
    cache_duration_hours: number;
  };
  _cache_info?: {
    cached: boolean;
    cache_stored: boolean;
    cache_key: string;
    will_expire_at?: number;
  };
}

interface DashboardMetrics {
  totalPulses: number;
  totalIndicators: number;
  topMalwareFamily: string;
  mostPopularPulse: string;
  averageSubscribers: number;
  cacheStatus: string;
}

@Component({
  selector: 'app-otx-pulse-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
  templateUrl: './otx-pulse-dashboard.component.html',
  styleUrls: ['./otx-pulse-dashboard.component.scss']
})
export class OtxPulseDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  insights: OTXPulseInsights | null = null;
  isLoading = true;
  error: string | null = null;
  lastUpdated: Date | null = null;

  // Dashboard metrics
  metrics: DashboardMetrics = {
    totalPulses: 0,
    totalIndicators: 0,
    topMalwareFamily: 'N/A',
    mostPopularPulse: 'N/A',
    averageSubscribers: 0,
    cacheStatus: 'Unknown'
  };

  // Chart data properties
  timelineData: ChartData<'line'> = { labels: [], datasets: [] };
  malwareFamiliesData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  popularityData: ChartData<'bar'> = { labels: [], datasets: [] };
  indicatorDistributionData: ChartData<'polarArea'> = { labels: [], datasets: [] };

  // Chart types
  lineChartType: 'line' = 'line';
  doughnutChartType: 'doughnut' = 'doughnut';
  barChartType: 'bar' = 'bar';
  polarAreaChartType: 'polarArea' = 'polarArea';

  // Chart options
  timelineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Trending Attack Campaigns Timeline',
        color: '#f8f9fa',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        labels: {
          color: '#f8f9fa',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#f8f9fa',
        bodyColor: '#7de6e7',
        borderColor: '#333366',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#f8f9fa',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          }
        },
        ticks: {
          color: '#7de6e7',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10
          }
        },
        grid: {
          color: 'rgba(125, 230, 231, 0.2)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Pulse Count',
          color: '#f8f9fa',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          }
        },
        ticks: {
          color: '#7de6e7',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10
          }
        },
        grid: {
          color: 'rgba(125, 230, 231, 0.2)'
        },
        beginAtZero: true
      }
    }
  };

  malwareFamiliesOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Top Malware Families by Pulse Count',
        color: '#f8f9fa',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          color: '#f8f9fa',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#f8f9fa',
        bodyColor: '#7de6e7',
        borderColor: '#333366',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} pulses (${percentage}%)`;
          }
        }
      }
    }
  };

  popularityOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      title: {
        display: true,
        text: 'Pulse Popularity Leaderboard',
        color: '#f8f9fa',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        labels: {
          color: '#f8f9fa',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#f8f9fa',
        bodyColor: '#7de6e7',
        borderColor: '#333366',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Subscriber Count',
          color: '#f8f9fa',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          }
        },
        ticks: {
          color: '#7de6e7',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10
          }
        },
        grid: {
          color: 'rgba(125, 230, 231, 0.2)'
        },
        beginAtZero: true
      },
      y: {
        ticks: {
          color: '#7de6e7',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 9
          },
          callback: function(value) {
            const label = this.getLabelForValue(value as number);
            return label.length > 25 ? label.substring(0, 25) + '...' : label;
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  indicatorDistributionOptions: ChartConfiguration<'polarArea'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Indicator Type Distribution',
        color: '#f8f9fa',
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          color: '#f8f9fa',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: '#f8f9fa',
        bodyColor: '#7de6e7',
        borderColor: '#333366',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            // const label = context.label || '';
            // const value = context.parsed || 0;
            // const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            // const percentage = ((value / total) * 100).toFixed(1);
            // return `${label}: ${value.toLocaleString()} indicators (${percentage}%)`;
            const label = context.label || '';
      const value = typeof context.parsed === 'number' ? context.parsed : 0;
      const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
      const percentage = ((value / total) * 100).toFixed(1);
      return `${label}: ${value.toLocaleString()} indicators (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      r: {
        ticks: {
          color: '#7de6e7',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10
          }
        },
        grid: {
          color: 'rgba(125, 230, 231, 0.3)'
        },
        angleLines: {
          color: 'rgba(125, 230, 231, 0.3)'
        },
        beginAtZero: true
      }
    }
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPulseInsights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPulseInsights(): void {
    this.isLoading = true;
    this.error = null;
    
    // Replace with your actual API endpoint
    this.http.get<OTXPulseInsights>('http://localhost:8080/api/v1/otx/pulse-insights')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: OTXPulseInsights) => {
          this.insights = data;
          this.calculateMetrics();
          this.buildAllCharts();
          this.lastUpdated = new Date();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load OTX pulse insights. Please try again.';
          this.isLoading = false;
          console.error('Error loading pulse insights:', error);
        }
      });
  }

  private calculateMetrics(): void {
    if (!this.insights) return;

    this.metrics.totalPulses = this.insights.metadata?.total_pulses || 0;
    this.metrics.totalIndicators = Object.values(this.insights.indicatorTypeDistribution)
      .reduce((sum, count) => sum + count, 0);
    
    this.metrics.topMalwareFamily = this.insights.topMalwareFamilies.length > 0 
      ? this.insights.topMalwareFamilies[0].malware_family 
      : 'N/A';
    
    this.metrics.mostPopularPulse = this.insights.popularityLeaderboard.length > 0
      ? this.insights.popularityLeaderboard[0].pulse_name
      : 'N/A';
    
    this.metrics.averageSubscribers = this.insights.popularityLeaderboard.length > 0
      ? Math.round(this.insights.popularityLeaderboard
          .reduce((sum, pulse) => sum + pulse.subscriber_count, 0) / this.insights.popularityLeaderboard.length)
      : 0;
    
    this.metrics.cacheStatus = this.insights._cache_info?.cached ? 'Cached' : 'Fresh';
  }

  private buildAllCharts(): void {
    if (!this.insights) return;

    this.buildTimelineChart();
    this.buildMalwareFamiliesChart();
    this.buildPopularityChart();
    this.buildIndicatorDistributionChart();
  }

  private buildTimelineChart(): void {
    if (!this.insights) return;

    const timeline = this.insights.trendingTimeline;
    
    this.timelineData = {
      labels: timeline.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'New Pulses',
        data: timeline.map(item => item.count),
        fill: true,
        tension: 0.4,
        backgroundColor: 'rgba(125, 230, 231, 0.2)',
        borderColor: 'rgb(125, 230, 231)',
        pointBackgroundColor: 'rgb(125, 230, 231)',
        pointBorderColor: '#1a1a2e',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };
  }

  private buildMalwareFamiliesChart(): void {
    if (!this.insights) return;

    const malwareFamilies = this.insights.topMalwareFamilies.slice(0, 8); // Top 8 for better visibility
    
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#C9CBCF', '#4BC0C0'
    ];

    this.malwareFamiliesData = {
      labels: malwareFamilies.map(item => item.malware_family),
      datasets: [{
        data: malwareFamilies.map(item => item.count),
        backgroundColor: colors.slice(0, malwareFamilies.length),
        borderColor: '#1a1a2e',
        borderWidth: 2,
        hoverBorderColor: '#7de6e7',
        hoverBorderWidth: 3
      }]
    };
  }

  private buildPopularityChart(): void {
    if (!this.insights) return;

    const popularity = this.insights.popularityLeaderboard.slice(0, 8); // Top 8 for better visibility
    
    // Create gradient colors based on subscriber count
    const maxSubscribers = Math.max(...popularity.map(pulse => pulse.subscriber_count));
    const backgroundColors = popularity.map(pulse => {
      const intensity = pulse.subscriber_count / maxSubscribers;
      if (intensity > 0.8) return '#dc2626';
      if (intensity > 0.6) return '#ea580c';
      if (intensity > 0.4) return '#ca8a04';
      if (intensity > 0.2) return '#16a34a';
      return '#7de6e7';
    });

    this.popularityData = {
      labels: popularity.map(pulse => {
        const name = pulse.pulse_name;
        return name.length > 30 ? name.substring(0, 30) + '...' : name;
      }),
      datasets: [{
        label: 'Subscribers',
        data: popularity.map(pulse => pulse.subscriber_count),
        backgroundColor: backgroundColors,
        borderColor: '#333366',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: backgroundColors.map(color => `${color}dd`),
        hoverBorderColor: '#7de6e7',
        hoverBorderWidth: 2
      }]
    };
  }

  private buildIndicatorDistributionChart(): void {
    if (!this.insights) return;

    const distribution = this.insights.indicatorTypeDistribution;
    const entries = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .slice(0, 10); // Top 10 indicator types

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB'
    ];

    this.indicatorDistributionData = {
      labels: entries.map(([type]) => type),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: colors.slice(0, entries.length),
        borderColor: '#1a1a2e',
        borderWidth: 2,
        hoverBorderColor: '#7de6e7',
        hoverBorderWidth: 3
      }]
    };
  }

  refreshData(): void {
    this.loadPulseInsights();
  }

  clearCache(): void {
    this.http.delete('https:://localhost:8080/api/v1/otx/cache/clear')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Cache cleared:', response);
          this.loadPulseInsights(); // Reload data after clearing cache
        },
        error: (error) => {
          console.error('Error clearing cache:', error);
        }
      });
  }

  exportData(): void {
    if (!this.insights) return;

    const dataStr = JSON.stringify(this.insights, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `otx-pulse-insights-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  getTimeSinceUpdate(): string {
    if (!this.lastUpdated) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getCacheExpiryTime(): string {
    if (!this.insights?._cache_info?.will_expire_at) return 'N/A';
    
    const expiryDate = new Date(this.insights._cache_info.will_expire_at * 1000);
    return expiryDate.toLocaleString();
  }
}