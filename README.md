# Personal Finance Tracker

A comprehensive personal finance management application built with Angular 20, Express.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Angular CLI

### Development Setup

1. **Clone and navigate to project:**
   ```bash
   git clone https://github.com/SvetozarP/PersonalFinanceTrackerMEANStack
   cd "Personal Finance Tracker MEAN/finance-tracker"
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start MongoDB:**
   ```bash
   cd ..
   docker-compose up -d
   ```

5. **Run Backend (in a new terminal):**
   ```bash
   cd backend
   npm run dev
   ```

6. **Run Frontend (in another new terminal):**
   ```bash
   cd frontend
   ng serve
   ```

## 📁 Project Structure

```
Personal Finance Tracker MEAN/
├── finance-tracker/
│   ├── backend/           # Express.js API with TypeScript
│   │   ├── src/          # Source code
│   │   ├── package.json  # Backend dependencies
│   │   └── tsconfig.json # TypeScript configuration
│   ├── frontend/          # Angular 20 application
│   │   ├── src/          # Angular source code
│   │   ├── package.json  # Frontend dependencies
│   │   └── angular.json  # Angular configuration
│   ├── docs/             # Documentation
│   ├── docker-compose.yml # MongoDB setup
│   └── .github/          # GitHub workflows
└── Plan.md               # Development roadmap
```

## 🔧 Available Scripts

### Backend Scripts (run from `backend/` directory)
- `npm run dev` - Start backend in development mode with nodemon
- `npm run build` - Build backend for production
- `npm start` - Start production backend
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Frontend Scripts (run from `frontend/` directory)
- `ng serve` - Start frontend development server
- `ng build` - Build frontend for production
- `ng test` - Run unit tests
- `ng lint` - Run linting

## 🌐 Access Points

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **MongoDB**: localhost:27017

## 🐳 Docker Commands

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# View logs
docker-compose logs -f
```

## 📚 Documentation

- Check the `docs/` folder for detailed documentation
