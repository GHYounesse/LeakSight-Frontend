// websocket.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ThreatAlert {
  id: string;
  type: 'threat_alert' | 'admin_alert' | 'welcome' | 'pong';
  timestamp: string;
  data?: {
    id: string;
    user_id: string;
    username?: string;
    matched_keyword: string;
    channel_username: string;
    channel_display_name: string;
    message_text: string;
    message_url: string;
    alert_timestamp: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message_preview: string;
    user_email?: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private pingInterval: any;

  // Observables
  private connectionStatusSubject = new BehaviorSubject<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private alertsSubject = new Subject<ThreatAlert>();
  private messagesSubject = new Subject<any>();

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  constructor() {}

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.connectionStatusSubject.next('connecting');
    const token = localStorage.getItem("access_token")
    // Use authenticated endpoint if token is provided
    const wsUrl = `ws://localhost:8080/ws/alerts/${token}`;

    try {
      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.connectionStatusSubject.next('error');
      this.handleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.connectionStatusSubject.next('connected');
      this.reconnectAttempts = 0;
      this.startPinging();
    };

    this.socket.onmessage = (event) => {
      try {
        const message: ThreatAlert = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.connectionStatusSubject.next('disconnected');
      this.stopPinging();
      
      if (event.code !== 1000) { // Not a normal closure
        this.handleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatusSubject.next('error');
    };
  }

  private handleMessage(message: ThreatAlert): void {
    this.messagesSubject.next(message);

    switch (message.type) {
      case 'threat_alert':
      case 'admin_alert':
        this.alertsSubject.next(message);
        this.showBrowserNotification(message);
        break;
        
      case 'welcome':
        console.log('WebSocket welcome message:', message.message);
        break;
        
      case 'pong':
        // Handle pong response
        break;
        
      default:
        console.log('Unknown message type:', message);
    }
  }

  private showBrowserNotification(alert: ThreatAlert): void {
    if (!('Notification' in window)) {
      return; // Browser doesn't support notifications
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification('🚨 Threat Alert', {
        body: `Keyword "${alert.data?.matched_keyword}" detected in ${alert.data?.channel_display_name}`,
        icon: '/assets/icons/alert-icon.png',
        tag: `alert-${alert.data?.id}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        if (alert.data?.message_url) {
          window.open(alert.data.message_url, '_blank');
        }
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  }

  private startPinging(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPinging(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  disconnect(): void {
    this.stopPinging();
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    this.connectionStatusSubject.next('disconnected');
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Get connection status
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.connectionStatusSubject.value;
  }

  // Send a message through WebSocket
  sendMessage(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}