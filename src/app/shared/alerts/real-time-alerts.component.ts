// real-time-alerts.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebSocketService,ThreatAlert } from '../../service/websocket/websocket.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-real-time-alerts',
  imports:[CommonModule],
  templateUrl: './real-time-alerts.component.html',
  styleUrls: ['./real-time-alerts.component.scss']
})
export class RealTimeAlertsComponent implements OnInit, OnDestroy {
  alerts: ThreatAlert[] = [];
  connectionStatus: string = 'disconnected';
  isMinimized: boolean = false;
  unreadCount: number = 0;
  loggedIn:boolean=false
  
  private subscriptions: Subscription[] = [];

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    if(this.isAuthenticated()){
    this.subscribeToWebSocket();
    this.requestNotificationPermission();
    
    // Connect to WebSocket with authentication token
     // Implement this method
    this.webSocketService.connect();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketService.disconnect();
  }
  private isAuthenticated(): boolean {

    const token = localStorage.getItem('access_token');
    if (!token){   this.loggedIn=false;
         return false;}
    this.loggedIn=true;
    return true;
  }

  private subscribeToWebSocket(): void {
    // Subscribe to connection status
    console.log("Subscribe to connection status")
    const statusSub = this.webSocketService.connectionStatus$.subscribe(
      status => {
        this.connectionStatus = status;
        if (status === 'connected' && this.unreadCount > 0) {
          // Reset unread count when reconnected
          this.unreadCount = 0;
        }
      }
    );
    console.log("Subscribe to alerts")
    // Subscribe to alerts
    const alertsSub = this.webSocketService.alerts$.subscribe(
      alert => {
        this.handleNewAlert(alert);
      }
    );

    this.subscriptions.push(statusSub, alertsSub);
  }

  private handleNewAlert(alert: ThreatAlert): void {
    // Add alert to the beginning of the array
    this.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    // Increment unread count if minimized
    if (this.isMinimized) {
      this.unreadCount++;
    }

    // Play alert sound
    this.playAlertSound(alert.data?.severity || 'LOW');

    // Show toast notification
    this.showToastNotification(alert);
  }

  private playAlertSound(severity: string): void {
    const audio = new Audio();
    
    switch (severity) {
      case 'HIGH':
        audio.src = '/assets/sounds/high-alert.mp3';
        break;
      case 'MEDIUM':
        audio.src = '/assets/sounds/medium-alert.mp3';
        break;
      default:
        audio.src = '/assets/sounds/low-alert.mp3';
    }

    audio.volume = 0.3;
    audio.play().catch(e => console.warn('Could not play alert sound:', e));
  }

  private showToastNotification(alert: ThreatAlert): void {
    // You can use a toast library like ngx-toastr
    console.log('New threat alert:', alert);
  }

  private async requestNotificationPermission(): Promise<void> {
    const permission = await this.webSocketService.requestNotificationPermission();
    if (permission === 'denied') {
      console.warn('Browser notifications are disabled');
    }
  }

//   private getAuthToken(): string | undefined {
//     // Get JWT token from your auth service
//     return localStorage.getItem('auth_token') || undefined;
//   }

  // UI Methods
  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    if (!this.isMinimized) {
      this.unreadCount = 0;
    }
  }

  clearAlerts(): void {
    this.alerts = [];
    this.unreadCount = 0;
  }

  reconnect(): void {
    this.webSocketService.disconnect();
    setTimeout(() => {
      
      this.webSocketService.connect();
    }, 1000);
  }

  openMessageUrl(url: string): void {
    window.open(url, '_blank');
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'HIGH': return 'severity-high';
      case 'MEDIUM': return 'severity-medium';
      case 'LOW': return 'severity-low';
      default: return 'severity-unknown';
    }
  }

  getConnectionStatusClass(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'status-connected';
      case 'connecting': return 'status-connecting';
      case 'error': return 'status-error';
      default: return 'status-disconnected';
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  trackByAlertId(index: number, alert: ThreatAlert): string {
    return alert.data?.id || index.toString();
  }
  
}