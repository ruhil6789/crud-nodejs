# TypeScript Express CRUD API

A production-ready RESTful API built with TypeScript, Express, MongoDB, and Redis featuring rate limiting, caching, and comprehensive middleware.

## Features

- 🚀 **Express.js** - Fast, unopinionated web framework
- 📘 **TypeScript** - Type-safe development
- 🗄️ **MongoDB** - NoSQL database with Mongoose ODM
- 🔴 **Redis** - In-memory caching for improved performance
- 🛡️ **Rate Limiting** - Protection against API abuse
- 🔒 **Security** - Helmet.js for security headers
- ✅ **Input Validation** - Request validation middleware
- 🐳 **Docker** - Containerized application with Docker Compose
- 📝 **Logging** - Morgan HTTP request logger
- 🌐 **CORS** - Cross-origin resource sharing enabled

## Prerequisites

- Node.js 22+ (or Docker)
- MongoDB (or use Docker Compose)
- Redis (or use Docker Compose)

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd typescript-express-server
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Check service status**
   ```bash
   docker-compose ps
   ```

4. **View logs**
   ```bash
   docker-compose logs -f app
   ```

5. **Test the API**
   ```bash
   curl http://localhost:3002/health
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local MongoDB and Redis settings
   ```

3. **Start MongoDB and Redis locally**
   ```bash
   # MongoDB
   mongod

   # Redis
   redis-server
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3002

# MongoDB
MONGODB_URI=mongodb://mongo:27017/crud-app

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Environment
NODE_ENV=production
```

## API Documentation

See [API.md](./API.md) for detailed API documentation.

### Quick API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | Health check |
| POST | `/api/users` | Create user |
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Example Requests

**Create a user:**
```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

**Get all users:**
```bash
curl http://localhost:3002/api/users
```

**Get user by ID:**
```bash
curl http://localhost:3002/api/users/<user-id>
```

**Update user:**
```bash
curl -X PUT http://localhost:3002/api/users/<user-id> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "age": 25
  }'
```

**Delete user:**
```bash
curl -X DELETE http://localhost:3002/api/users/<user-id>
```

## Project Structure

```
.
├── src/
│   ├── config/
│   │   ├── database.ts      # MongoDB connection
│   │   └── redis.ts         # Redis connection
│   ├── controllers/
│   │   └── userController.ts # User CRUD logic
│   ├── middleware/
│   │   ├── errorHandler.ts  # Error handling
│   │   ├── rateLimiter.ts   # Rate limiting
│   │   └── validator.ts     # Input validation
│   ├── models/
│   │   └── User.ts          # User model
│   ├── routes/
│   │   └── userRoutes.ts    # User routes
│   └── server.ts            # Application entry point
├── .env                     # Environment variables
├── .gitignore
├── docker-compose.yaml      # Docker services
├── Dockerfile               # App container
├── package.json
├── tsconfig.json
└── README.md
```

## Docker Commands

**Start services:**
```bash
docker-compose up -d
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Access MongoDB shell:**
```bash
docker-compose exec mongo mongosh
```

**Access Redis CLI:**
```bash
docker-compose exec redis redis-cli
```

## Rate Limiting

- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Strict Rate Limit** (POST endpoints): 10 requests per minute per IP

Rate limit information is stored in Redis and shared across all instances.

## Caching

User data is cached in Redis with a TTL of 5 minutes:
- `GET /api/users` - Cached list of all users
- `GET /api/users/:id` - Cached individual user

Cache is automatically invalidated on:
- User creation
- User update
- User deletion

## Development

**Run tests:**
```bash
npm test
```

**Lint code:**
```bash
npm run lint
```

**Format code:**
```bash
npm run format
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use strong MongoDB credentials
3. Configure Redis with authentication
4. Set appropriate rate limits
5. Use a reverse proxy (nginx) in front of the API
6. Enable HTTPS

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
