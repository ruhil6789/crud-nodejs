# Monitoring Stack (Docker Compose)

## Overview

The monitoring stack includes:
- **Redis** – Cache and pub/sub
- **Redis Exporter** – Redis metrics for Prometheus
- **Prometheus** – Metrics collection
- **Grafana** – Dashboards and visualization

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     App     │────▶│  Prometheus │◀────│ Redis Exp.  │
│  :3002      │     │  :9090      │     │  :9121      │
│  /metrics   │     └──────┬──────┘     └─────────────┘
└─────────────┘            │
                           ▼
                    ┌─────────────┐
                    │   Grafana   │
                    │  :3001      │
                    └─────────────┘
```

## Key Configuration Notes

### 1. Docker Networking
- Services use the **monitoring-network** bridge.
- Prometheus scrapes by **service name** (e.g. `app:3002`, `redis-exporter:9121`), not `localhost`.

### 2. Redis for the App
- `REDIS_HOST=redis` and `REDIS_PORT=6379` are set in docker-compose so the app connects to the Redis service.
- Without this override, `.env` values like `REDIS_HOST=localhost` would point to the app container itself, not Redis.

### 3. MongoDB
- MongoDB is not in docker-compose. Use Atlas or a host Mongo.
- If using MongoDB on the host: `MONGODB_URI=mongodb://host.docker.internal:27017/crud-app` (Docker Desktop).

### 4. Grafana
- URL: http://localhost:3001 (maps to container port 3000).
- Default login: `admin` / `admin` (change `GF_SECURITY_ADMIN_PASSWORD` in production).

## Run the Stack

```bash
docker-compose up -d
```

| Service        | URL                     |
|----------------|-------------------------|
| App            | http://localhost:3002   |
| App metrics    | http://localhost:3002/metrics |
| Prometheus     | http://localhost:9090   |
| Grafana        | http://localhost:3001   |
| Redis          | localhost:6379          |

## Add Dashboards to Grafana

1. Put `.json` files in `grafana/dashboards/json/`.
2. Restart Grafana or reload provisioning.
3. Or add dashboards manually: Dashboards → Import → paste ID from [grafana.com/dashboards](https://grafana.com/dashboards).

Useful dashboard IDs:
- **1860** – Node Exporter
- **7362** – Redis
- **3662** – Prometheus
