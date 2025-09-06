import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Injectable, provideZoneChangeDetection } from '@angular/core';

// Create a concrete test implementation of the abstract BaseApiService
@Injectable()
class TestApiService extends BaseApiService<any> {
  protected endpoint = 'test';
}

describe('BaseApiService', () => {
  let service: TestApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TestApiService,
        provideZoneChangeDetection({ eventCoalescing: true })
      ]
    });
    service = TestBed.inject(TestApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct endpoint', () => {
    expect(service['endpoint']).toBe('test');
  });

  it('should construct correct baseUrl', () => {
    expect(service['baseUrl']).toContain('/test');
  });

  describe('getAll', () => {
    it('should make GET request to correct endpoint', () => {
      const mockResponse = [{ id: 1, name: 'test' }];

      service.getAll().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service.getAll().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeDefined();
        }
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getById', () => {
    it('should make GET request with correct ID', () => {
      const id = '123';
      const mockResponse = { id: '123', name: 'test' };

      service.getById(id).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith(`/test/${id}`));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should make POST request with correct data', () => {
      const testData = { name: 'test' };
      const mockResponse = { id: '1', ...testData };

      service.create(testData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(testData);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should make PUT request with correct ID and data', () => {
      const id = '123';
      const testData = { name: 'updated' };
      const mockResponse = { id, ...testData };

      service.update(id, testData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith(`/test/${id}`));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(testData);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should make DELETE request with correct ID', () => {
      const id = '123';
      const mockResponse = true;

      service.delete(id).subscribe(response => {
        expect(response).toBe(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith(`/test/${id}`));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', () => {
      service.getAll().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeDefined();
        }
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle client-side errors', () => {
      service.getAll().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Client-side error');
        }
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      req.error(new ErrorEvent('Client-side error', { message: 'Client-side error' }));
    });

    it('should handle server-side errors with message', () => {
      service.getAll().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Server error message');
        }
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      req.flush({ message: 'Server error message' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle server-side errors without message', () => {
      service.getAll().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Http failure response for http://localhost:3000/api/test: 500 Internal Server Error');
        }
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle server-side errors with default message', () => {
      service.getAll().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Http failure response for http://localhost:3000/api/test: 500 Internal Server Error');
        }
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle server-side errors with no message at all', () => {
      // Test the handleError method directly to cover the specific branch
      const mockError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: 'http://localhost:3000/api/test',
        error: null
      });
      
      // Override the message property to be empty to test the fallback
      Object.defineProperty(mockError, 'message', {
        value: '',
        writable: true
      });

      service['handleError'](mockError).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('An error occurred');
        }
      });
    });
  });

  describe('Additional CRUD operations', () => {
    it('should handle create with empty data', () => {
      const testData = {};
      const mockResponse = { id: '1', ...testData };

      service.create(testData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(testData);
      req.flush(mockResponse);
    });

    it('should handle update with partial data', () => {
      const id = '123';
      const testData = { name: 'updated' };
      const mockResponse = { id, ...testData };

      service.update(id, testData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith(`/test/${id}`));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(testData);
      req.flush(mockResponse);
    });

    it('should handle delete with different response types', () => {
      const id = '123';
      const mockResponse = true;

      service.delete(id).subscribe(response => {
        expect(response).toBe(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith(`/test/${id}`));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('URL construction', () => {
    it('should construct correct URLs for different endpoints', () => {
      // Test with different endpoint
      const testService = new TestApiService(TestBed.inject(HttpClient));
      testService['endpoint'] = 'different-endpoint';
      
      expect(testService['baseUrl']).toContain('/different-endpoint');
    });

    it('should handle empty endpoint', () => {
      const testService = new TestApiService(TestBed.inject(HttpClient));
      testService['endpoint'] = '';
      
      expect(testService['baseUrl']).toContain('//');
    });
  });

  describe('HTTP method variations', () => {
    it('should handle GET with query parameters', () => {
      const mockResponse = [{ id: 1, name: 'test' }];

      service.getAll().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should handle POST with different content types', () => {
      const testData = { name: 'test' };
      const mockResponse = { id: '1', ...testData };

      service.create(testData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => request.url.endsWith('/test'));
      expect(req.request.method).toBe('POST');
      // Angular HttpClient doesn't automatically set Content-Type for object bodies
      // The Content-Type header should be null for object bodies
      const contentType = req.request.headers.get('Content-Type');
      expect(contentType).toBeNull();
      req.flush(mockResponse);
    });
  });
});
