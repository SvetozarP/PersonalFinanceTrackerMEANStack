# Personal Finance Tracker

A comprehensive personal finance management application built with Angular 20, Express.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Angular CLI

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd finance-tracker
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start MongoDB:**
   ```bash
   docker-compose up -d
   ```

3. **Run Backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Run Frontend:**
   ```bash
   cd frontend
   ng serve
   ```

## 📁 Project Structure

finance-tracker/
├── backend/ # Express.js API
├── frontend/ # Angular application
├── docker-compose.yml # MongoDB setup
└── docs/ # Documentation

## 🔧 Available Scripts

- `npm run dev` - Start backend in development mode
- `ng serve` - Start frontend development server
- `npm run build` - Build backend for production
- `ng build` - Build frontend for production