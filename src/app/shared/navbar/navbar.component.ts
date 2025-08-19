import { CommonModule } from '@angular/common';
import { Component, OnInit,OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs';
import { AuthService } from '../../service/auth/auth.service';
import { Observable} from "rxjs";




interface NavItem {
  label: string;
  path: string;
  icon: string;
  children?: NavItem[];
  badge?: number;
  requiresAuth?: boolean;
}

interface QuickStat {
  value: number;
  label: string;
  color?: string;
}


@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isNavbarOpen = false;
  isUserLoggedIn = false; 
  username = 'Username'; 
  userInitial = 'A';
  currentRoute = '';
  
  
  private subscriptions: Subscription[] = [];

  

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
       requiresAuth: true
    },
    {
      label: 'IOCs',
      path: '/iocs',
      icon: 'fas fa-database',
      children: [
        { label: 'View All IOCs', path: '/iocs', icon: 'fas fa-list' },
        { label: 'Add Single IOC', path: '/iocs/create', icon: 'fas fa-plus' },
        { label: 'Bulk Upload', path: '/iocs/bulk', icon: 'fas fa-upload' }
        // ,
        // { label: 'Manage Tags', path: '/iocs/tags', icon: 'fas fa-tags' },
        // { label: 'Related IOCs', path: '/iocs/related', icon: 'fas fa-project-diagram' }
      ], requiresAuth: true
    },
    // {
    //   label: 'Intelligence',
    //   path: '/intelligence',
    //   icon: 'fas fa-brain',
    //   children: [
    //     { label: 'Enrichment', path: '/intelligence/enrichment', icon: 'fas fa-search' },
    //     { label: 'Classification', path: '/intelligence/classification', icon: 'fas fa-sitemap' },
    //     { label: 'Attribution', path: '/intelligence/attribution', icon: 'fas fa-fingerprint' },
    //     { label: 'MITRE ATT&CK', path: '/intelligence/mitre', icon: 'fas fa-bullseye' }
    //   ]
    // },
    {
      label: 'Enrichment',
      path: '/enrichment',
      icon: 'fas fa-search',
      children: [
      { label: 'File Hash', path: '/enrichment/hash', icon: 'fas fa-file-code' },      // Represents code or hash
  { label: 'Domain', path: '/enrichment/domain', icon: 'fas fa-globe' },           // Represents a domain or global
  { label: 'URL', path: '/enrichment/url', icon: 'fas fa-link' },                  // Represents a hyperlink (URL)
  { label: 'IP', path: '/enrichment/ip', icon: 'fas fa-network-wired' } 
      ], requiresAuth: true
    },
    // {
    //   label: 'Analytics',
    //   path: '/analytics',
    //   icon: 'fas fa-chart-line',
    //   children: [
    //     { label: 'Threat Trends', path: '/analytics/trends', icon: 'fas fa-trending-up' },
    //     { label: 'Actor Analysis', path: '/analytics/actors', icon: 'fas fa-users' },
    //     { label: 'Campaigns', path: '/analytics/campaigns', icon: 'fas fa-flag' },
    //     { label: 'Geolocation', path: '/analytics/geolocation', icon: 'fas fa-globe' },
    //     { label: 'Timeline', path: '/analytics/timeline', icon: 'fas fa-clock' }
    //   ]
    // },
    // {
    //   label: 'Correlation',
    //   path: '/correlation',
    //   icon: 'fas fa-project-diagram'
    // },

    {
      label: 'Home',
      path: '/',
      icon: 'fas fa-home',
      requiresAuth: false
    },
    {
      label: 'About',
      path: '/about',
      icon: 'fas fa-info-circle',
      requiresAuth: false
    },
    // {
    //   label: 'Alerts',
    //   path: '/alerts',
    //   icon: 'fas fa-exclamation-triangle',
    //   badge: 15, requiresAuth: true
    // },
    {
      label: 'Feeds',
      path: '/feeds',
      icon: 'fas fa-rss',
      
      requiresAuth: true
    }
    // children: [
      //   { label: 'Active Feeds', path: '/feeds', icon: 'fas fa-list' },
      //   { label: 'Add Feed', path: '/feeds/add', icon: 'fas fa-plus' },
      //   { label: 'Feed Statistics', path: '/feeds/stats', icon: 'fas fa-chart-bar' },
      //   { label: 'Process Feeds', path: '/feeds/process', icon: 'fas fa-sync' }
      // ]
  ];

  exportItems: NavItem[] = [
    { label: 'STIX Format', path: '/export/stix', icon: 'fas fa-file-code' },
    { label: 'CSV Format', path: '/export/csv', icon: 'fas fa-file-csv' },
    { label: 'JSON Format', path: '/export/json', icon: 'fas fa-file-code' },
    { label: 'Custom Report', path: '/export/custom', icon: 'fas fa-file-alt' }
  ];

  userMenuItems: NavItem[] = [
    //{ label: 'Profile', path: '/profile', icon: 'fas fa-user' },
    { label: 'Settings', path: '/settings', icon: 'fas fa-cog' },
    { label: 'Subscriptions', path: '/subscriptions', icon: 'fab fa-telegram' },
    { label: 'Help', path: '/help', icon: 'fas fa-question-circle' }
  ];

  //systemOnline = true;

  isLoggedIn$!: Observable<boolean>;
  

  constructor(private authService: AuthService, private router: Router) {
    this.authService.isLoggedIn$.subscribe(value => {
    this.isUserLoggedIn=value;
    this.checkAuthenticationStatus();
  });
  
  }
  ngOnInit(): void {
    //this.checkAuthenticationStatus();
    // Subscribe to route changes
    // const routerSubscription = this.router.events
    //   .pipe(filter(event => event instanceof NavigationEnd))
    //   .subscribe((event: NavigationEnd) => {
    //     this.currentRoute = event.url;
    //   });
    
    // this.subscriptions.push(routerSubscription);

    // Simulate real-time updates
    // const statsUpdateSubscription = interval(30000).subscribe(() => {
    //   this.updateQuickStats();
    // });
    
    // const alertsUpdateSubscription = interval(45000).subscribe(() => {
    //   this.updateAlertsBadge();
    // });

    //this.subscriptions.push( alertsUpdateSubscription);

    // Get initial route
    // this.currentRoute = this.router.url;
    // console.log("Current Route:", this.currentRoute);
    this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      this.currentRoute = event.urlAfterRedirects;
      //console.log("Current Route:", this.currentRoute);
    }
  });
  }

  ngOnDestroy(): void {
    //this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleNavbar(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.isNavbarOpen = false; // Close mobile menu
  }

  isActive(path: string): boolean{
    // if (path === '/dashboard' && this.currentRoute === '/') {
    //   return true;
    // }
    //console.log("Path:", path,"this.currentRoute === path",this.currentRoute === path);
    return this.currentRoute === path ;
    

  }
  isActiveStr(path: string): string {
    // if (path === '/dashboard' && this.currentRoute === '/') {
    //   return true;
    // }
    //console.log("Path:", path,"this.currentRoute === path",this.currentRoute === path);
    //return this.currentRoute === path ;
    return this.currentRoute === path ? 'active' : '';

  }

  isParentActive(item: NavItem): boolean {
    if (item.children) {
      return item.children.some(child => this.isActive(child.path));
    }
    return this.isActive(item.path);
  }

  // logout(event: Event): void {
  //   event.preventDefault();
  //   // Implement logout logic here
  //   console.log('Logging out...');
  //   
    
  //   // Example: this.authService.logout();
  //   // this.router.navigate(['/login']);
  // }
  logout(event: Event): void {
    event.preventDefault();
    
    // Clear authentication data
    this.clearAuthData();
    this.authService.logout();
    // Close mobile navbar if open
    this.isNavbarOpen = false;
    
    // Redirect to login page
    this.router.navigate(['/login']);
    
    console.log('User logged out successfully');
  }

  //  updateQuickStats(): void {
  //   this.quickStats = this.quickStats.map(stat => ({
  //     ...stat,
  //     value: Math.max(0, stat.value + Math.floor(Math.random() * 5) - 2)
  //   }));
  // }

  // private updateAlertsBadge(): void {
  //   const alertsItem = this.navItems.find(item => item.path === '/alerts');
  //   if (alertsItem && alertsItem.badge !== undefined) {
  //     alertsItem.badge = Math.max(0, alertsItem.badge + Math.floor(Math.random() * 3) - 1);
  //   }
  // }

  // formatStatValue(value: number): string {
  //   return value.toLocaleString();
  // }

  onExportClick(exportType: string): void {
    console.log('Exporting as:', exportType);
    // Implement export logic here
  }
  /**
   * Check if user is authenticated and update component state
   */
  checkAuthenticationStatus(): void {
    try {
      // Check localStorage for auth token and user info
      const token = localStorage.getItem('access_token');
      // const storedUsername = localStorage.getItem('username');
      this.username=localStorage.getItem('username')|| '';   
      if (token ) {
        // Optionally validate token expiration
        if (this.isTokenValid(token)) {
          console.log(" Token Valid");
          this.isUserLoggedIn = true;
          
          this.userInitial = this.username!.charAt(0).toUpperCase();
        } else {
          console.log(" Token Invalid");
          // Token expired, clear storage
          this.clearAuthData();
        }
      } else {
        this.isUserLoggedIn = false;
        this.username = '';
        this.userInitial = '';
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      this.isUserLoggedIn = false;
    }
  }
  isLoginPage(): boolean {
    //console.log("LoginPage:",this.router.url.includes('/auth/login'));
    return this.router.url.includes('/login');
  }
  /**
   * Validate if token is still valid (not expired)
   */
  private isTokenValid(token: string): boolean {
    try {
      // If using JWT tokens, decode and check expiration
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return tokenData.exp > currentTime;
    } catch (error) {
      // If token parsing fails or it's not JWT, assume invalid
      return false;
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    this.isUserLoggedIn = false;
    this.username = '';
    this.userInitial = '';
  }

  /**
   * Get filtered navigation items based on authentication status
   */
  getVisibleNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (item.requiresAuth === undefined) return true; // Show items without requiresAuth property
      //return this.isUserLoggedIn ? item.requiresAuth : !item.requiresAuth;
      return this.isUserLoggedIn ? item.requiresAuth : !item.requiresAuth;
    });
  }

  /**
   * Get filtered export items (only show if logged in)
   */
  getVisibleExportItems(): NavItem[] {
    //return this.isUserLoggedIn ? this.exportItems : [];
    return this.isUserLoggedIn ? this.exportItems : [];
  }

  /**
   * Get filtered user menu items (only show if logged in)
   */
  getVisibleUserMenuItems(): NavItem[] {
    return this.isUserLoggedIn ? this.userMenuItems : [];
  }

  

  
  

  /**
   * Method to update user info when login occurs
   * Call this method from your authentication service after successful login
   */
  // updateUserInfo(username: string, token: string): void {
  //   localStorage.setItem('authToken', token);
  //   localStorage.setItem('username', username);
  //   this.isUserLoggedIn = true;
  //   this.username = username;
  //   this.userInitial = username.charAt(0).toUpperCase();
  // }

  

  
}