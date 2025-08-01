// src/app/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError} from 'rxjs/operators';
import { throwError } from 'rxjs';
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
@Injectable({
  providedIn: 'root'
})
export class ThreatService {
  private baseUrl = 'http://localhost:8080';  

  constructor(private http: HttpClient) { }

  getEnrichment(jobId: string): Observable<any> {
    const url = `${this.baseUrl}/api/v1/enrichment/status/${jobId}`;
    return this.http.get<any>(url);
  }
  analyseIOC(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/enrichment/analyze`;
    return this.http.post(url, data);
    
  }
  createIOC(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/iocs/`;
    return this.http.post(url, data);
    
  }
  updateIOC(iocId: string, data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/iocs/${iocId}`;
    return this.http.put(url, data);
  }
  getIOCById(iocId: string): Observable<any> {
    const url = `${this.baseUrl}/api/v1/iocs/${iocId}`;
    return this.http.get(url);
  }
  deleteIOC(iocId: string): Observable<any> {
    const url = `${this.baseUrl}/api/v1/iocs/${iocId}`;
    return this.http.delete(url);
  }
  getAllIOCs(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/iocs/`;
    return this.http.get(url);
  }

  
  
  
  
}
