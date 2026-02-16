# TypeScript Express CRUD API + Messaging

A production-ready RESTful API built with TypeScript, Express, MongoDB Atlas, Redis, AWS S3, and WebSocket-based messaging. Features CI/CD with GitHub Actions, rate limiting, caching, and comprehensive API documentation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Redis Managed Service Setup](#redis-managed-service-setup)
- [AWS S3 Setup](#aws-s3-setup)
- [GitHub Actions CI/CD Pipeline](#github-actions-cicd-pipeline)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)

---

## Features

| Category | Features |
|----------|----------|
| **Core** | Express.js, TypeScript, Mongoose ODM |
| **Database** | MongoDB Atlas (cloud-hosted) |
| **Caching & Pub/Sub** | Redis (managed service) for rate limiting, caching, WebSocket scaling |
| **Storage** | AWS S3 for file uploads (with local fallback) |
| **Messaging** | WhatsApp-style chat: group chats, real-time WebSocket, offline inbox, message ack |
| **API** | REST CRUD (Users, Chats, Messages), file attachments, Swagger docs |
| **Security** | Helmet, CORS, rate limiting, input validation |
| **DevOps** | GitHub Actions CI/CD, Docker, Docker Compose |

---

## Tech Stack

- **Runtime:** Node.js 22
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Cache & Pub/Sub:** Redis (managed, e.g. AWS ElastiCache, Upstash)
- **File Storage:** AWS S3
- **Real-time:** Socket.io with Redis adapter
- **Docs:** Swagger / OpenAPI 3.0

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│  Express API │────▶│  MongoDB Atlas  │
│ (HTTP/WS)   │     │  (Node.js)   │     │  (Data Store)   │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │ Redis       │  │ AWS S3      │  │ WebSocket   │
   │ (Rate Limit │  │ (Uploads)   │  │ (Socket.io) │
   │  Cache)     │  │             │  │             │
   └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)
- Redis (optional for dev; recommended for production)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install

# Create .env and configure (see Environment Configuration section)
# Minimum: MONGODB_URI, optional: REDIS_*, S3_*, etc.

# Run development server
npm run dev
```

The API will be available at:

- **API:** http://localhost:3002
- **Swagger Docs:** http://localhost:3002/api-docs
- **Health Check:** http://localhost:3002/health

---

## Environment Configuration

Create a `.env` file in the project root. See [ENV-EXAMPLES.md](./ENV-EXAMPLES.md) for detailed examples.

### Required (minimal local setup)

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/crud-app
```

### Full production example

```env
PORT=3002
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/crud-app?retryWrites=true&w=majority

# Redis (managed service)
REDIS_URL=rediss://default:password@your-redis-host:6379

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional
SEED_ON_STARTUP=false
```

---

## MongoDB Atlas Setup

This project uses [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) as the primary data store.

### 1. Create an Atlas account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new organization and project

### 2. Create a cluster

1. Click **Build a Database**
2. Choose **M0 Free** (or paid tier)
3. Select a cloud provider and region
4. Name the cluster and create

### 3. Configure database access

1. **Database Access** → Add New Database User
2. Create username and password (save securely)
3. Grant read/write access to your database

### 4. Configure network access

1. **Network Access** → Add IP Address
2. Add your server IP, or `0.0.0.0/0` for development (restrict in production)

### 5. Get connection string

1. **Database** → Connect → Connect your application
2. Copy the connection string
3. Replace `<password>` with your user password
4. Add database name: `crud-app` (or append `?retryWrites=true&w=majority`)

Example:

```
mongodb+srv://db_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/crud-app?retryWrites=true&w=majority
```

Set in `.env`:

```env
MONGODB_URI=mongodb+srv://db_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/crud-app?retryWrites=true&w=majority
```

---

## Redis Managed Service Setup

Redis is used for:

- **Rate limiting** – distributed limits across instances
- **Caching** – user and list caches
- **WebSocket scaling** – pub/sub for Socket.io across multiple servers

### Option 1: AWS ElastiCache

1. Create an ElastiCache Redis cluster in AWS
2. For serverless: use ElastiCache Serverless
3. Note host, port, and credentials

```env
REDIS_URL=rediss://default:your_password@your-cluster.cache.amazonaws.com:6379
# Or
REDIS_HOST=your-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_TLS=true
```

### Option 2: Upstash Redis

1. Sign up at [Upstash](https://upstash.com)
2. Create a Redis database
3. Copy the Redis URL (TLS enabled)

```env
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
```

### Option 3: Local Redis (development)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
# Leave REDIS_PASSWORD empty for local
REDIS_TLS=false
```

If Redis is not configured, the app falls back to in-memory rate limiting and no caching.

---

## AWS S3 Setup

File uploads (attachments) can be stored in AWS S3.

### 1. Create an S3 bucket

1. AWS Console → S3 → Create bucket
2. Choose a unique name and region
3. Configure access (block public unless needed)

### 2. IAM user and policy

1. Create an IAM user for the application
2. Attach a policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

3. Create access keys for the user

### 3. Environment variables

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
```

- If `S3_BUCKET` is not set, uploads are stored locally in `./uploads`
- Use `GET /api/attachments/:id/view` for presigned URLs on private buckets

---

## GitHub Actions CI/CD Pipeline

The project uses **GitHub Actions** for deployment to QA/production.

### Workflow

- **Trigger:** Push to `qa` branch
- **Steps:** Checkout → SSH to EC2 → Pull → Rebuild and restart with Docker Compose

### Workflow overview

Location: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

The pipeline includes:

| Stage | Description |
|-------|-------------|
| **Test** | `npm ci` → `npm test` (build + smoke tests) – must pass before deploy |
| **Artifacts** | Uploads `dist/`, `package.json`, `package-lock.json` (7-day retention) |
| **Deploy** | SSH to EC2, save previous commit, `git pull` + `docker-compose up --build` |
| **Health check** | Retries `GET /health` up to 18 times (3 min) after deploy |
| **Rollback** | On failure, reverts to previous commit and rebuilds |

### Required GitHub secrets

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | EC2 instance IP or hostname |
| `EC2_USER` | SSH username (e.g. `ubuntu`) |
| `EC2_SSH_KEY` | Private SSH key for EC2 |
| `EC2_APP_URL` | (Optional) Full app URL for health check, e.g. `http://your-ec2-ip:3002`. If unset, uses `http://EC2_HOST:3002`. |

### How to configure

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add the required secrets
3. Push to `qa` to trigger the pipeline

---

## API Documentation

### Swagger UI

Interactive API docs: **http://localhost:3002/api-docs**

### Main endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger documentation |

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

#### Chats & Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats?userId=` | Get user's chats |
| POST | `/api/chats` | Create chat |
| GET | `/api/chats/:id` | Get chat |
| GET | `/api/chats/:id/messages` | Get messages |
| PUT | `/api/chats/:id/participants` | Add/remove participant |

#### Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attachments` | Upload file |
| GET | `/api/attachments/:id/view` | View file (presigned URL for S3) |

See [API.md](./API.md) and [MESSAGING.md](./MESSAGING.md) for detailed API and WebSocket documentation.

---

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── src/
│   ├── config/
│   │   ├── database.ts         # MongoDB connection
│   │   ├── redis.ts            # Redis connection
│   │   ├── s3.ts               # S3 configuration
│   │   └── swagger.ts          # OpenAPI/Swagger setup
│   ├── controllers/
│   │   ├── userController.ts
│   │   ├── chatController.ts
│   │   └── attachmentController.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validator.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   ├── Message.ts
│   │   ├── Attachment.ts
│   │   ├── Client.ts
│   │   └── Inbox.ts
│   ├── routes/
│   │   ├── userRoutes.ts
│   │   ├── chatRoutes.ts
│   │   └── attachmentRoutes.ts
│   ├── services/
│   │   ├── chatService.ts
│   │   ├── messageService.ts
│   │   └── s3Service.ts
│   ├── socket/
│   │   └── index.ts            # WebSocket handlers
│   ├── seed/
│   │   └── seedData.ts
│   └── server.ts
├── public/                     # Static assets, chat test UI
├── .env
├── docker-compose.yaml
├── Dockerfile
├── package.json
├── tsconfig.json
├── API.md
├── MESSAGING.md
├── ENV-EXAMPLES.md
├── SETUP.md
└── README.md
```

---

## Docker Deployment

### Build and run with Docker Compose

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Environment

Ensure `.env` exists and is loaded. For production:

- Use `MONGODB_URI` pointing to Atlas
- Use `REDIS_URL` or `REDIS_*` for managed Redis
- Use S3 credentials if storing files in S3

### Persisting uploads (local storage)

If not using S3, mount the uploads directory:

```yaml
services:
  app:
    build: .
    ports:
      - "3002:3002"
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
    restart: always
```

---

## Server Deployment

See [docs/SERVER_DEPLOYMENT.md](./docs/SERVER_DEPLOYMENT.md) for:

- EC2 security group ports (3002, 3001, 9090)
- .env setup on server
- GitHub Actions deploy (push to `qa`)
- Grafana datasource config on server

---

## Production Deployment

### Checklist

1. **MongoDB Atlas:** Connection string with strong credentials and restricted IPs
2. **Redis:** Managed Redis with TLS
3. **S3:** IAM user with minimal `PutObject`/`GetObject` permissions
4. **Environment:** `NODE_ENV=production`
5. **Secrets:** Store credentials in env or secret manager, never in code
6. **Reverse proxy:** Use nginx or similar for TLS and load balancing
7. **CI/CD:** Configure GitHub Actions secrets and `qa` branch workflow

### NPM scripts

```bash
npm run dev      # Development with hot reload
npm run build    # TypeScript compile
npm start        # Production (runs dist/server.js)
```

---

## License

MIT

## Contributing

Pull requests are welcome. For major changes, open an issue first.
