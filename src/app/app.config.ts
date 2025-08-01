import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './core/token.interceptor';




export const appConfig: ApplicationConfig = {
  providers: [ provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideZoneChangeDetection()
  ]
  //provideHttpClient(withInterceptors([tokenInterceptor])),provideZoneChangeDetection({ eventCoalescing: true }),
};
