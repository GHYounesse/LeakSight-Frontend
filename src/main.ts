import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import {
  Chart,
  CategoryScale,
  LinearScale,
  RadialLinearScale, // ✅ Import this
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  ArcElement,
  PieController,
  RadarController,   // ✅ if using Radar chart
  PolarAreaController, // ✅ if using Polar Area
  Tooltip,
  Legend,
  Title,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale, // ✅ Register here
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  ArcElement,
  PieController,
  RadarController,   // ✅ if needed
  PolarAreaController, // ✅ if needed
  Tooltip,
  Legend,
  Title,
  Filler
);


// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers!,
    importProvidersFrom(HttpClientModule) // ✅ Ensure HttpClient is available globally
  ]
});