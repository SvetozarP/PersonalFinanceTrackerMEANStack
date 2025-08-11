import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { catchError, Observable, throwError } from "rxjs";


@Injectable()
export abstract class BaseApiService<T> {
    protected abstract endpoint: string;

    constructor(protected http: HttpClient) {}

    protected get baseUrl(): string {
        return `${environment.apiUrl}/${this.endpoint}`;
    }

    getAll(): Observable<T[]> {
        return this.http.get<T[]>(this.baseUrl).pipe(
            catchError(this.handleError)
        );
    }

    getById(id: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    create(item: Partial<T>): Observable<T> {
        return this.http.post<T>(this.baseUrl, item).pipe(
            catchError(this.handleError)
        );
    }

    update(id: string, item: Partial<T>): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${id}`, item).pipe(
            catchError(this.handleError)
        );
    }

    delete(id: string): Observable<boolean> {
        return this.http.delete<boolean>(`${this.baseUrl}/${id}`).pipe(
            catchError(this.handleError)
        );
    }
    
    protected handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else {
          // Server-side error
          errorMessage = error.error?.message || error.message || errorMessage;
        }
        
        console.error('API Error:', error);
        return throwError(() => new Error(errorMessage));
      }
}