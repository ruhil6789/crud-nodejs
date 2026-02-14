# Environment Configuration Guide

## MongoDB URI

### Local MongoDB
```
mongodb://localhost:27017/crud-app
```
- **Requires:** MongoDB running locally (`mongod` or `sudo systemctl start mongod`)
- **Error `ECONNREFUSED 127.0.0.1:27017`:** MongoDB is not running. Start it first.

### MongoDB Atlas (Cloud)
```
mongodb+srv://db_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/crud-app?retryWrites=true&w=majority
```
- Get from [MongoDB Atlas](https://cloud.mongodb.com) → Cluster → Connect → Connection string
- Replace `YOUR_PASSWORD` with your actual password

### Local with Auth
```
mongodb://username:password@localhost:27017/crud-app?authSource=admin
```

---

## Redis NOAUTH Error

**Cause:** Redis server requires authentication but the app isn't sending credentials.

### Local Redis (no auth)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
# Leave REDIS_PASSWORD empty
REDIS_TLS=false
```

### AWS ElastiCache Serverless
```env
REDIS_HOST=crud-api-redis-xxxxx.serverless.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password
REDIS_TLS=true
REDIS_TLS_REJECT_UNAUTHORIZED=false
```

### Run without Redis (local dev)
If Redis fails, the app continues but rate limiting and caching won't work. Start Redis locally:
```bash
redis-server
```

---

## Quick Local Setup

1. **Start MongoDB:** `mongod` or `sudo systemctl start mongod`
2. **Start Redis:** `redis-server` (optional)
3. **.env for local:**
```env
MONGODB_URI=mongodb://localhost:27017/crud-app
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TLS=false
```
4. **Run:** `npm run dev`
