import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { RealTimeAlertsComponent } from './shared/alerts/real-time-alerts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterModule,FormsModule,CommonModule,NavbarComponent,RealTimeAlertsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'LeakSight';
  theme: 'dark-theme' | 'light-theme' = 'dark-theme';
  sidebarVisible: boolean = true;

  constructor(private titleService: Title, private router: Router) {
  this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      const route = this.router.url.split('/')[1] || 'Dashboard';
      const formatted = route.charAt(0).toUpperCase() + route.slice(1);
      this.titleService.setTitle(`LeakSight | ${formatted}`);
    }
  });
}

  // toggleTheme() {
  //   this.theme = this.theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
  // }

  // toggleSidebar() {
  //   this.sidebarVisible = !this.sidebarVisible;
  // }
  ngOnInit() {
  const storedTheme = localStorage.getItem('theme');
  const storedSidebar = localStorage.getItem('sidebarVisible');

  if (storedTheme === 'light-theme' || storedTheme === 'dark-theme') {
    this.theme = storedTheme as 'light-theme' | 'dark-theme';
  }

  if (storedSidebar !== null) {
    this.sidebarVisible = storedSidebar === 'true';
  }
}

toggleTheme() {
  this.theme = this.theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
  localStorage.setItem('theme', this.theme);
}

toggleSidebar() {
  this.sidebarVisible = !this.sidebarVisible;
  localStorage.setItem('sidebarVisible', String(this.sidebarVisible));
}
ngAfterViewInit() {
  if (window.innerWidth < 768) {
    this.sidebarVisible = false;
  }
}
toastMsg: string = '';

showToast(message: string) {
  this.toastMsg = message;
  setTimeout(() => this.toastMsg = '', 3000);
}
}

