import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';

declare const jasmine: any;

export const createTestBed = (config: any = {}) => {
  return TestBed.configureTestingModule({
    imports: [
      RouterTestingModule,
      HttpClientTestingModule,
      NoopAnimationsModule,
      ...(config.imports || [])
    ],
    providers: [
      ...(config.providers || [])
    ],
    declarations: [
      ...(config.declarations || [])
    ]
  });
};

export const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
  navigateByUrl: jasmine.createSpy('navigateByUrl'),
  createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
  serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/test'),
  url: '/test',
  events: of({}),
  routerState: {
    snapshot: {
      url: '/test'
    }
  }
};

export const mockActivatedRoute = {
  snapshot: {
    url: [],
    params: {},
    queryParams: {},
    fragment: null
  },
  params: jasmine.createSpyObj('params', ['subscribe']),
  queryParams: jasmine.createSpyObj('queryParams', ['subscribe']),
  fragment: jasmine.createSpyObj('fragment', ['subscribe'])
};

// Helper function to create a proper router mock for tests
export const createRouterMock = () => {
  return {
    navigate: jasmine.createSpy('navigate'),
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/test'),
    url: '/test',
    events: of({}),
    routerState: {
      snapshot: {
        url: '/test'
      }
    }
  };
};
