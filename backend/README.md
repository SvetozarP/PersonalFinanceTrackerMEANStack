# Finance Tracker Backend

A robust Node.js/Express backend for the Personal Finance Tracker application, built with TypeScript, MongoDB, and modern development practices.

## Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Express.js**: Fast, unopinionated web framework
- **MongoDB**: Document database with Mongoose ODM
- **JWT Authentication**: Secure token-based authentication
- **Winston Logging**: Comprehensive logging with file rotation
- **Repository Pattern**: Clean data access layer
- **ESLint + Prettier**: Code quality and formatting
- **Docker Support**: Easy development environment setup

## Prerequisites

- Node.js 18+ 
- MongoDB 7.0+
- Docker (optional, for local MongoDB)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-tracker/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Start MongoDB** (using Docker)
   ```bash
   # From the project root
   docker-compose up -d mongodb
   ```

## Development

### Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build TypeScript to JavaScript
- **`npm run start`** - Start production server
- **`npm run lint`** - Run ESLint
- **`npm run lint:fix`** - Fix ESLint issues automatically
- **`npm run format`** - Format code with Prettier
- **`npm run type-check`** - Run TypeScript type checking

### Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### API Endpoints

- **Health Check**: `GET /health`
- **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`
- **User Profile**: `GET /api/auth/profile`

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # MongoDB connection
│   └── environment.ts # Environment configuration
├── modules/          # Feature modules
│   ├── auth/         # Authentication module
│   └── users/        # User management
├── shared/           # Shared utilities
│   ├── repositories/ # Base repository pattern
│   └── services/     # Common services (logging)
└── app.ts            # Main application file
```

## Architecture

### Repository Pattern
The application uses a repository pattern for data access, providing a clean abstraction over MongoDB operations.

### Logging
Winston logging service with:
- Console output for development
- File rotation for production
- Configurable log levels
- Structured logging with metadata

### Error Handling
Global error handling middleware with:
- Consistent error response format
- Development vs production error details
- Proper HTTP status codes

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `BACKEND_PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/finance_tracker` |
| `JWT_SECRET` | JWT signing secret | Required |
| `LOG_LEVEL` | Logging level | `info` |

## Docker

The project includes Docker Compose configuration for easy development setup:

```bash
# Start all services
docker-compose up -d

# Start only MongoDB
docker-compose up -d mongodb

# View logs
docker-compose logs -f mongodb
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment**
   ```bash
   export NODE_ENV=production
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## Contributing

1. Ensure code passes linting: `npm run lint`
2. Format code: `npm run format`
3. Check types: `npm run type-check`
4. Run tests: `npm test`

## License

MIT License - see LICENSE file for details.
