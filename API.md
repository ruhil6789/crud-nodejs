# API Documentation

## Base URL
```
http://localhost:3002
```

## Rate Limiting
- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Strict Rate Limit** (POST /api/users): 10 requests per minute per IP

## Endpoints

### Health Check

#### GET /
Returns API status

**Response:**
```json
{
  "success": true,
  "message": "API is running successfully",
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

#### GET /health
Returns detailed health information

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

---

### Users API

#### POST /api/users
Create a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Validation:**
- `name`: Required, string, 2-50 characters
- `email`: Required, valid email format, unique
- `age`: Optional, number, 0-150

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "createdAt": "2026-02-09T12:00:00.000Z",
    "updatedAt": "2026-02-09T12:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

---

#### GET /api/users
Get all users

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "createdAt": "2026-02-09T12:00:00.000Z",
      "updatedAt": "2026-02-09T12:00:00.000Z"
    }
  ],
  "cached": false
}
```

**Note:** Results are cached in Redis for 5 minutes. The `cached` field indicates if the data came from cache.

**cURL Example:**
```bash
curl http://localhost:3002/api/users
```

---

#### GET /api/users/:id
Get a single user by ID

**Parameters:**
- `id`: MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "createdAt": "2026-02-09T12:00:00.000Z",
    "updatedAt": "2026-02-09T12:00:00.000Z"
  },
  "cached": false
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**cURL Example:**
```bash
curl http://localhost:3002/api/users/65abc123...
```

---

#### PUT /api/users/:id
Update a user

**Parameters:**
- `id`: MongoDB ObjectId

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 25
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "age": 25,
    "createdAt": "2026-02-09T12:00:00.000Z",
    "updatedAt": "2026-02-09T12:05:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3002/api/users/65abc123... \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "age": 25
  }'
```

---

#### DELETE /api/users/:id
Delete a user

**Parameters:**
- `id`: MongoDB ObjectId

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3002/api/users/65abc123...
```

---

## Error Responses

### Rate Limit Exceeded (429)
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": "Name is required and must be at least 2 characters"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Route /api/invalid not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

---

## Features

- ✅ **MongoDB** - Database for persistent storage
- ✅ **Redis** - Caching layer for improved performance
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Input Validation** - Request validation middleware
- ✅ **Error Handling** - Centralized error handling
- ✅ **Security** - Helmet.js for security headers
- ✅ **CORS** - Cross-origin resource sharing enabled
- ✅ **Logging** - Morgan HTTP request logger
- ✅ **TypeScript** - Type-safe development
