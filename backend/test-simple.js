// Simple JavaScript test without TypeScript
const express = require('express');

describe('Financial Routes - JS Test', () => {
  it('should import express successfully', () => {
    expect(express).toBeDefined();
    expect(typeof express).toBe('function');
  });

  it('should create an express app', () => {
    const app = express();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
  });
});
