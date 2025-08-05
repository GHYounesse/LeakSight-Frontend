import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, shareReplay } from 'rxjs/operators';

export interface ThreatData {
  ipAddress: string;
  countryCode: string;
  abuseConfidenceScore: number;
  lastReportedAt: string;
}

export interface BlacklistResponse {
  data: ThreatData[];
  success: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AbuseIpService {
  private readonly API_BASE = 'http://localhost:8080/api/v1/abuse-blacklist'; // FastAPI endpoint

  constructor(private http: HttpClient) {}

  getBlacklist(
    maxAgeInDays: number = 45,
    confidenceMinimum: number = 50
  ): Observable<ThreatData[]> {
    const params = new HttpParams()
      .set('max_age_in_days', maxAgeInDays.toString())
      .set('confidence_minimum', confidenceMinimum.toString());

    return this.http.get<BlacklistResponse>(this.API_BASE, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Invalid response format');
        }),
        retry(3),
        catchError(this.handleError),
        shareReplay({ bufferSize: 1, refCount: true })
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('API error:', error);
    let errorMessage = 'Failed to fetch blacklist data';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}