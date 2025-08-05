
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbuseIpService, ThreatData } from '../../../service/abuseip/abuse-ip.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import * as L from 'leaflet';
import 'leaflet.heat';
import {  ChartOptions } from 'chart.js';

interface ThreatMetrics {
  totalIps: number;
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  uniqueCountries: number;
  averageScore: number;
  latestReports: number;
}

interface HeatmapData {
  country: string;
  ipAddress: string;
  abuseScore: number;
  x: number;
  y: number;
  v: number; // value for heatmap intensity
}

@Component({
  selector: 'app-threat-charts',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective],
  templateUrl: './threat-charts.component.html',
  styleUrls: ['./threat-charts.component.scss']
})
export class ThreatChartsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ipData: ThreatData[] = [];
  isLoading = true;
  error: string | null = null;

  // Chart data properties - keeping only 3 charts
  topIpsData: ChartData<'bar'> = { labels: [], datasets: [] };
  countryHeatmapData: ChartData<'bar'> = { labels: [], datasets: [] };
  

  // Chart types
  barChartType: 'bar' = 'bar';
  scatterChartType: 'scatter' = 'scatter';

  // Metrics
  threatMetrics: ThreatMetrics = {
    totalIps: 0,
    criticalThreats: 0,
    highThreats: 0,
    mediumThreats: 0,
    lowThreats: 0,
    uniqueCountries: 0,
    averageScore: 0,
    latestReports: 0
  };

  // Heatmap data for processing
  heatmapProcessedData: HeatmapData[] = [];

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
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
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#7de6e7',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(125, 230, 231, 0.2)',
          display: false
        },
        border: {
          color: '#333366'
        }
      },
      y: {
        ticks: {
          color: '#7de6e7',
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(125, 230, 231, 0.2)'
        },
        border: {
          color: '#333366'
        },
        beginAtZero: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };
  

  // Heatmap chart options (using scatter chart for heatmap visualization)
  // heatmapOptions: ChartConfiguration<'scatter'>['options'] = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   plugins: {
  //     legend: {
  //       display: false
  //     },
  //     tooltip: {
  //       backgroundColor: 'rgba(26, 26, 46, 0.95)',
  //       titleColor: '#f8f9fa',
  //       bodyColor: '#7de6e7',
  //       borderColor: '#333366',
  //       borderWidth: 1,
  //       cornerRadius: 8,
  //       displayColors: false,
  //       titleFont: {
  //         family: 'Inter, system-ui, sans-serif',
  //         size: 13,
  //         weight: 'bold'
  //       },
  //       bodyFont: {
  //         family: 'Inter, system-ui, sans-serif',
  //         size: 12
  //       },
  //       callbacks: {
  //         title: (context) => {
  //           const dataIndex = context[0].dataIndex;
  //           const heatmapItem = this.heatmapProcessedData[dataIndex];
  //           return `${heatmapItem?.country || 'Unknown'} - ${heatmapItem?.ipAddress || 'N/A'}`;
  //         },
  //         label: (context) => {
  //           const dataIndex = context.dataIndex;
  //           const heatmapItem = this.heatmapProcessedData[dataIndex];
  //           return `Abuse Score: ${heatmapItem?.abuseScore || 0}`;
  //         }
  //       }
  //     }
  //   },
  //   scales: {
  //     x: {
  //       type: 'linear',
  //       position: 'bottom',
  //       title: {
  //         display: true,
  //         text: 'Country Index',
  //         color: '#f8f9fa',
  //         font: {
  //           family: 'Inter, system-ui, sans-serif',
  //           size: 12,
  //           weight: 'bold'
  //         }
  //       },
  //       ticks: {
  //         color: '#7de6e7',
  //         font: {
  //           family: 'Inter, system-ui, sans-serif',
  //           size: 10
  //         },
  //         callback: function(value) {
  //           // You can customize this to show country codes instead of numbers
  //           return value;
  //         }
  //       },
  //       grid: {
  //         color: 'rgba(125, 230, 231, 0.1)'
  //       },
  //       border: {
  //         color: '#333366'
  //       }
  //     },
  //     y: {
  //       type: 'linear',
  //       title: {
  //         display: true,
  //         text: 'IP Index',
  //         color: '#f8f9fa',
  //         font: {
  //           family: 'Inter, system-ui, sans-serif',
  //           size: 12,
  //           weight: 'bold'
  //         }
  //       },
  //       ticks: {
  //         color: '#7de6e7',
  //         font: {
  //           family: 'Inter, system-ui, sans-serif',
  //           size: 10
  //         }
  //       },
  //       grid: {
  //         color: 'rgba(125, 230, 231, 0.1)'
  //       },
  //       border: {
  //         color: '#333366'
  //       }
  //     }
  //   },
  //   elements: {
  //     point: {
  //       radius: function(context) {
  //         const dataIndex = context.dataIndex;
  //         const heatmapItem = this.heatmapProcessedData?.[dataIndex];
  //         const score = heatmapItem?.abuseScore || 0;
  //         return Math.max(3, (score / 100) * 15); // Scale radius based on abuse score
  //       },
  //       hoverRadius: function(context) {
  //         const dataIndex = context.dataIndex;
  //         const heatmapItem = this.heatmapProcessedData?.[dataIndex];
  //         const score = heatmapItem?.abuseScore || 0;
  //         return Math.max(5, (score / 100) * 18);
  //       }
  //     }
  //   }
  // };

  constructor(private abuseIpService: AbuseIpService) {}

  ngOnInit(): void {
    this.loadThreatData();
    setTimeout(() => {
    this.initMap();
    const countryCounts = this.aggregateThreatsByCountry();
    this.addThreatCircles(countryCounts);
    }, 4000); // Delay to ensure map is initialized before adding heat layer
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadThreatData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.abuseIpService.getBlacklist()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ThreatData[]) => {
          this.ipData = data;
          this.calculateMetrics();
          this.buildAllCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load threat data. Please try again.';
          this.isLoading = false;
          console.error('Error loading threat data:', error);
        }
      });
  }

  private calculateMetrics(): void {
    this.threatMetrics.totalIps = this.ipData.length;
    this.threatMetrics.criticalThreats = this.ipData.filter(ip => ip.abuseConfidenceScore === 100).length;
    this.threatMetrics.highThreats = this.ipData.filter(ip => ip.abuseConfidenceScore >= 80 && ip.abuseConfidenceScore < 100).length;
    this.threatMetrics.mediumThreats = this.ipData.filter(ip => ip.abuseConfidenceScore >= 60 && ip.abuseConfidenceScore < 80).length;
    this.threatMetrics.lowThreats = this.ipData.filter(ip => ip.abuseConfidenceScore < 60).length;
    this.threatMetrics.uniqueCountries = new Set(this.ipData.map(ip => ip.countryCode)).size;
    this.threatMetrics.averageScore = this.ipData.length > 0 
      ? Math.round(this.ipData.reduce((sum, ip) => sum + ip.abuseConfidenceScore, 0) / this.ipData.length)
      : 0;
    
    // Count reports from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.threatMetrics.latestReports = this.ipData.filter(ip => 
      new Date(ip.lastReportedAt) > oneDayAgo
    ).length;
    const now = Date.now();
const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000);
const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
  this.ipData.forEach(ip => {
    const parsedDate = new Date(ip.lastReportedAt);
    if (parsedDate > eightDaysAgo &&  parsedDate<= fiveDaysAgo) {
      console.log(`Recent: ${ip.ipAddress} reported at ${parsedDate.toISOString()}`);
    }
  });

  }


  private buildAllCharts(): void {
    this.buildTopIps();
    this.buildCountryHeatmap();
    this.generateHourlyTrend();
    // this.buildMaliciousIpHeatmap();
  }
  private map: L.Map | undefined;
  

hourlyTrendLabels: string[] = [];
hourlyTrendData: ChartData<'line'> = {
  labels: [],
  datasets: [
    {
      label: 'Threat Reports by Hour (UTC)',
      data: [],
      fill: true,
      tension: 0.3,
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgb(255, 99, 132)',
      pointBackgroundColor: 'rgb(255, 99, 132)',
    }
  ]
};

hourlyTrendOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      display: true
    },
    tooltip: {
      callbacks: {
        label: ctx => `${ctx.parsed.y} reports`
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Hour (UTC)'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Reported IPs'
      },
      beginAtZero: true
    }
  }
};

  generateHourlyTrend(): void {
  const hourlyBuckets = new Array(24).fill(0);

  for (const ip of this.ipData) {
    const date = new Date(ip.lastReportedAt);
    if (!isNaN(date.getTime())) {
      const hour = date.getUTCHours(); // or getHours() for local time
      hourlyBuckets[hour]++;
    }
  }

  this.hourlyTrendLabels = hourlyBuckets.map((_, hour) => `${hour}:00`);
  this.hourlyTrendData.labels = this.hourlyTrendLabels;
  this.hourlyTrendData.datasets[0].data = hourlyBuckets;
  console.log("hourlyBuckets:", hourlyBuckets);
}


private countryCoordinates: Record<string, [number, number]> = {
  AF: [33.9391, 67.71],
  AL: [41.1533, 20.1683],
  DZ: [28.0339, 1.6596],
  AO: [-11.2027, 17.8739],
  AR: [-38.4161, -63.6167],
  AM: [40.0691, 45.0382],
  AU: [-25.2744, 133.7751],
  AT: [47.5162, 14.5501],
  AZ: [40.1431, 47.5769],
  BD: [23.685, 90.3563],
  BE: [50.5039, 4.4699],
  BJ: [9.3077, 2.3158],
  BO: [-16.2902, -63.5887],
  BR: [-14.235, -51.9253],
  BG: [42.7339, 25.4858],
  BF: [12.2383, -1.5616],
  BI: [-3.3731, 29.9189],
  KH: [12.5657, 104.991],
  CM: [7.3697, 12.3547],
  CA: [56.1304, -106.3468],
  CF: [6.6111, 20.9394],
  TD: [15.4542, 18.7322],
  CL: [-35.6751, -71.543],
  CN: [35.8617, 104.1954],
  CO: [4.5709, -74.2973],
  CR: [9.7489, -83.7534],
  HR: [45.1, 15.2],
  CU: [21.5218, -77.7812],
  CY: [35.1264, 33.4299],
  CZ: [49.8175, 15.473],
  DK: [56.2639, 9.5018],
  DO: [18.7357, -70.1627],
  EC: [-1.8312, -78.1834],
  EG: [26.8206, 30.8025],
  SV: [13.7942, -88.8965],
  GQ: [1.6508, 10.2679],
  ER: [15.1794, 39.7823],
  EE: [58.5953, 25.0136],
  ET: [9.145, 40.4897],
  FJ: [-16.5782, 179.4144],
  FI: [61.9241, 25.7482],
  FR: [46.2276, 2.2137],
  GA: [-0.8037, 11.6094],
  GE: [42.3154, 43.3569],
  DE: [51.1657, 10.4515],
  GH: [7.9465, -1.0232],
  GR: [39.0742, 21.8243],
  GT: [15.7835, -90.2308],
  GN: [9.9456, -9.6966],
  GY: [4.8604, -58.9302],
  HT: [18.9712, -72.2852],
  HN: [13.2, -86.2419],
  HU: [47.1625, 19.5033],
  IS: [64.9631, -19.0208],
  IN: [20.5937, 78.9629],
  ID: [-0.7893, 113.9213],
  IR: [32.4279, 53.688],
  IQ: [33.2232, 43.6793],
  IE: [53.4129, -8.2439],
  IL: [31.0461, 34.8516],
  IT: [41.8719, 12.5674],
  JM: [18.1096, -77.2975],
  JP: [36.2048, 138.2529],
  JO: [30.5852, 36.2384],
  KZ: [48.0196, 66.9237],
  KE: [-0.0236, 37.9062],
  KR: [35.9078, 127.7669],
  KW: [29.3117, 47.4818],
  KG: [41.2044, 74.7661],
  LA: [19.8563, 102.4955],
  LV: [56.8796, 24.6032],
  LB: [33.8547, 35.8623],
  LS: [-29.6099, 28.2336],
  LR: [6.4281, -9.4295],
  LT: [55.1694, 23.8813],
  LU: [49.8153, 6.1296],
  MG: [-18.7669, 46.8691],
  MW: [-13.2543, 34.3015],
  MY: [4.2105, 101.9758],
  ML: [17.5707, -3.9962],
  MR: [21.0079, -10.9408],
  MX: [23.6345, -102.5528],
  MD: [47.4116, 28.3699],
  MN: [46.8625, 103.8467],
  ME: [42.7087, 19.3744],
  MA: [31.7917, -7.0926],
  MZ: [-18.6657, 35.5296],
  MM: [21.9162, 95.956],
  NA: [-22.9576, 18.4904],
  NP: [28.3949, 84.124],
  NL: [52.1326, 5.2913],
  NZ: [-40.9006, 174.886],
  NI: [12.8654, -85.2072],
  NE: [17.6078, 8.0817],
  NG: [9.082, 8.6753],
  NO: [60.472, 8.4689],
  OM: [21.4735, 55.9754],
  PK: [30.3753, 69.3451],
  PA: [8.538, -80.7821],
  PG: [-6.315, 143.9555],
  PY: [-23.4425, -58.4438],
  PE: [-9.19, -75.0152],
  PH: [13.4125, 122.56],
  PL: [51.9194, 19.1451],
  PT: [39.3999, -8.2245],
  QA: [25.276987, 51.520008],
  RO: [45.9432, 24.9668],
  RU: [61.524, 105.3188],
  RW: [-1.9403, 29.8739],
  SA: [23.8859, 45.0792],
  SN: [14.4974, -14.4524],
  RS: [44.0165, 21.0059],
  SG: [1.3521, 103.8198],
  SK: [48.669, 19.699],
  SI: [46.1512, 14.9955],
  ZA: [-30.5595, 22.9375],
  ES: [40.4637, -3.7492],
  LK: [7.8731, 80.7718],
  SD: [12.8628, 30.2176],
  SE: [60.1282, 18.6435],
  CH: [46.8182, 8.2275],
  SY: [34.8021, 38.9968],
  TW: [23.6978, 120.9605],
  TZ: [-6.369, 34.8888],
  TH: [15.87, 100.9925],
  TN: [33.8869, 9.5375],
  TR: [38.9637, 35.2433],
  UG: [1.3733, 32.2903],
  UA: [48.3794, 31.1656],
  AE: [23.4241, 53.8478],
  GB: [55.3781, -3.436],
  US: [37.0902, -95.7129],
  UY: [-32.5228, -55.7658],
  UZ: [41.3775, 64.5853],
  VE: [6.4238, -66.5897],
  VN: [14.0583, 108.2772],
  YE: [15.5527, 48.5164],
  ZM: [-13.1339, 27.8493],
  ZW: [-19.0154, 29.1549]
};



 

  private initMap(): void {
    this.map = L.map('map', {
      center: [20, 0],
      zoom: 2,
    });
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   attribution: '&copy; OpenStreetMap contributors',
    // }).addTo(this.map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19
}).addTo(this.map);

    
  }

  private aggregateThreatsByCountry(): Record<string, number> {
  const countryCounts: Record<string, number> = {};

  for (const threat of this.ipData) {
    if (!countryCounts[threat.countryCode]) {
      countryCounts[threat.countryCode] = 0;
    }
    countryCounts[threat.countryCode]++;
  }

  return countryCounts;
}


  
  private addThreatCircles(countryCounts: Record<string, number>): void {
  if (!this.map) return;

  const maxCount = Math.max(...Object.values(countryCounts));

  for (const country in countryCounts) {
    const count = countryCounts[country];
    const coords = this.countryCoordinates[country];

    if (coords) {
      const radius = 10 + (40 * count / maxCount); // scale radius between 10 and 50

      const circle = L.circleMarker(coords, {
        radius: radius,
        fillColor: 'red',
        color: '#800',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6
      }).addTo(this.map);

      circle.bindPopup(`<strong>${country}</strong><br>Threats: ${count}`);
      circle.bindTooltip(`${country}: ${count} threats`, {
        permanent: false,
        direction: 'top',
        offset: [0, -radius], // offset tooltip above the circle
        opacity: 0.8
      });
    
    }
  }
}


  private buildTopIps(): void {
    const topIps = [...this.ipData]
      .sort((a, b) => b.abuseConfidenceScore - a.abuseConfidenceScore)
      .slice(0, 10);

    const backgroundColors = topIps.map(ip => {
      if (ip.abuseConfidenceScore === 100) return '#dc2626';
      if (ip.abuseConfidenceScore >= 80) return '#ea580c';
      if (ip.abuseConfidenceScore >= 60) return '#ca8a04';
      return '#16a34a';
    });

    this.topIpsData = {
      labels: topIps.map(ip => ip.ipAddress),
      datasets: [{
        label: 'Abuse Confidence Score',
        data: topIps.map(ip => ip.abuseConfidenceScore),
        backgroundColor: backgroundColors,
        borderColor: '#333366',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: backgroundColors.map(color => `${color}cc`),
        hoverBorderColor: '#7de6e7',
        hoverBorderWidth: 2
      }]
    };
  }

  private buildCountryHeatmap(): void {
    const countryCounts: { [code: string]: number } = {};
    
    this.ipData.forEach(entry => {
      const code = entry.countryCode || 'Unknown';
      countryCounts[code] = (countryCounts[code] || 0) + 1;
    });

  //   // Sort countries by threat count and take top 15
    const sortedCountries = Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15);

    // Create gradient colors based on threat counts
    const maxCount = Math.max(...sortedCountries.map(([,count]) => count));
    const backgroundColors = sortedCountries.map(([,count]) => {
      const intensity = count / maxCount;
      if (intensity > 0.8) return '#dc2626';
      if (intensity > 0.6) return '#ea580c';
      if (intensity > 0.4) return '#ca8a04';
      if (intensity > 0.2) return '#16a34a';
      return '#7de6e7';
    });

    this.countryHeatmapData = {
      labels: sortedCountries.map(([code]) => code),
      datasets: [{
        label: 'Reported IPs per Country',
        data: sortedCountries.map(([,count]) => count),
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

  

  

  getThreatLevelClass(score: number): string {
    if (score === 100) return 'threat-critical';
    if (score >= 80) return 'threat-high';
    if (score >= 60) return 'threat-medium';
    return 'threat-low';
  }

  refreshData(): void {
    this.loadThreatData();
  }

  exportData(): void {
    const dataStr = JSON.stringify(this.ipData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Helper method to get country name from code (optional)
  // getCountryName(countryCode: string): string {
  //   const countryNames: { [key: string]: string } = {
  //     'US': 'United States',
  //     'CN': 'China',
  //     'RU': 'Russia',
  //     'DE': 'Germany',
  //     'GB': 'United Kingdom',
  //     'FR': 'France',
  //     'NL': 'Netherlands',
  //     'JP': 'Japan',
  //     'CA': 'Canada',
  //     'AU': 'Australia',
  //     // Add more as needed
  //   };
  //   return countryNames[countryCode] || countryCode;
  // }
}