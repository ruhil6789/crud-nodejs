# Setup & Troubleshooting Guide

## What We've Built

A complete TypeScript Express CRUD API with:

- ✅ **Express.js** with TypeScript
- ✅ **MongoDB** with Mongoose ODM
- ✅ **Redis** for caching and rate limiting
- ✅ **Rate Limiting** (express-rate-limit + rate-limit-redis)
- ✅ **Security Middleware** (Helmet, CORS)
- ✅ **Input Validation**
- ✅ **Error Handling**
- ✅ **HTTP Logging** (Morgan)
- ✅ **Docker & Docker Compose** configuration
- ✅ **Complete API Documentation**

## Project Structure

```
.
├── src/
│   ├── config/
│   │   ├── database.ts          # MongoDB connection
│   │   └── redis.ts             # Redis connection
│   ├── controllers/
│   │   └── userController.ts    # CRUD operations
│   ├── middleware/
│   │   ├── errorHandler.ts      # Global error handling
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   └── validator.ts         # Input validation
│   ├── models/
│   │   └── User.ts              # Mongoose User model
│   ├── routes/
│   │   └── userRoutes.ts        # API routes
│   └── server.ts                # Main application
├── docker-compose.yaml          # Multi-container setup
├── Dockerfile                   # App container
├── API.md                       # API documentation
└── README.md                    # Project documentation
```

## Running Locally (Without Docker)

If you have MongoDB and Redis installed locally:

1. **Update `.env` for local development:**
   ```env
   PORT=3002
   MONGODB_URI=mongodb://localhost:27017/crud-app
   REDIS_HOST=localhost
   REDIS_PORT=6379
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Start MongoDB:**
   ```bash
   mongod
   ```

3. **Start Redis:**
   ```bash
   redis-server
   ```

4. **Install dependencies and run:**
   ```bash
   npm install
   npm run dev
   ```

5. **Test the API:**
   ```bash
   curl http://localhost:3002/health
   ```

## Running with Docker Compose

### Current Issue

There's a Docker networking issue preventing the app container from connecting to MongoDB and Redis containers. This appears to be environment-specific.

### Troubleshooting Steps

1. **Check if containers are running:**
   ```bash
   docker-compose -p crud-api ps
   ```

2. **Check container logs:**
   ```bash
   docker-compose -p crud-api logs app
   docker-compose -p crud-api logs mongo
   docker-compose -p crud-api logs redis
   ```

3. **Test network connectivity:**
   ```bash
   docker-compose -p crud-api exec app ping -c 2 mongo
   docker-compose -p crud-api exec app ping -c 2 redis
   ```

4. **Try using IP addresses instead of hostnames:**
   
   Get container IPs:
   ```bash
   docker inspect crud-api-mongo-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
   docker inspect crud-api-redis-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
   ```
   
   Update `docker-compose.yaml` environment variables:
   ```yaml
   environment:
     - MONGODB_URI=mongodb://172.29.0.3:27017/crud-app
     - REDIS_HOST=172.29.0.2
   ```

5. **Rebuild and restart:**
   ```bash
   docker-compose -p crud-api down
   docker-compose -p crud-api up -d --build
   ```

### Alternative: Use Host Network (Linux only)

Modify `docker-compose.yaml`:
```yaml
services:
  app:
    network_mode: "host"
    # Remove ports mapping
```

## API Endpoints

Once the server is running (on port 3002 or 3003):

### Health Check
```bash
curl http://localhost:3003/health
```

### Create User
```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Get All Users
```bash
curl http://localhost:3003/api/users
```

### Get User by ID
```bash
curl http://localhost:3003/api/users/<user-id>
```

### Update User
```bash
curl -X PUT http://localhost:3003/api/users/<user-id> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3003/api/users/<user-id>
```

## Features Implemented

### 1. MongoDB Integration
- Mongoose ODM with TypeScript types
- User model with validation
- Indexes for performance
- Connection error handling

### 2. Redis Integration
- Caching for GET requests (5-minute TTL)
- Cache invalidation on mutations
- Rate limit storage
- Connection error handling

### 3. Rate Limiting
- Global: 100 requests per 15 minutes
- Strict (POST): 10 requests per minute
- Redis-backed for distributed rate limiting

### 4. Middleware Stack
- **Helmet**: Security headers
- **CORS**: Cross-origin support
- **Morgan**: HTTP request logging
- **Body Parser**: JSON/URL-encoded parsing
- **Error Handler**: Centralized error handling
- **Validator**: Input validation

### 5. CRUD Operations
- Create user with validation
- Read all users (with caching)
- Read single user (with caching)
- Update user (with cache invalidation)
- Delete user (with cache invalidation)

## Next Steps

1. **Fix Docker networking** (environment-specific issue)
2. **Add authentication** (JWT tokens)
3. **Add more models** (Posts, Comments, etc.)
4. **Add tests** (Jest + Supertest)
5. **Add CI/CD** (GitHub Actions workflow included)
6. **Add API documentation** (Swagger/OpenAPI)

## Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :3002
# Or
netstat -tlnp | grep 3002

# Kill the process or use a different port
```

### MongoDB Connection Timeout
- Ensure MongoDB is running
- Check firewall rules
- Verify connection string
- Try `directConnection: true` option

### Redis Connection Timeout
- Ensure Redis is running
- Check firewall rules
- Verify host and port
- Try connecting with `redis-cli`

### Docker Networking Issues
- Check if containers are on the same network
- Try using IP addresses instead of hostnames
- Restart Docker daemon
- Check Docker logs: `docker logs <container-id>`

## Support

For detailed API documentation, see [API.md](./API.md).

For project overview, see [README.md](./README.md).
