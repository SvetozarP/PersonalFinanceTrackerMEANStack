import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
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
  });
});
