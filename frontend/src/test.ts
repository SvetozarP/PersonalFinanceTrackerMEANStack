// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// Zone.js is required for testing even in zoneless applications
import 'zone.js';
import 'zone.js/testing';

// Suppress zone.js warnings in test environment
const originalConsoleWarn = console.warn;
console.warn = function(...args: any[]) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('NG0914')) {
    // Suppress zone.js warnings in test environment
    return;
  }
  originalConsoleWarn.apply(console, args);
};

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().forEach(context);
