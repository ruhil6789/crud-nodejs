gi# Server Deployment Guide

Deploy the full stack (App, Redis, Prometheus, Grafana) to EC2 via GitHub Actions.

---

## What Gets Deployed

| Service        | Port | Description                    |
|----------------|------|--------------------------------|
| App            | 3002 | Node.js API                    |
| Grafana        | 3001 | Dashboards                     |
| Prometheus     | 9090 | Metrics                        |
| Redis          | 6380 | Cache (internal)               |
| Redis Exporter | 9121 | Redis metrics (internal)       |

---

## Prerequisites

### 1. EC2 instance

- Ubuntu 22.04 (or similar)
- Docker and Docker Compose installed
- Project cloned to `/home/ubuntu/crud-nodejs`

### 2. EC2 Security Group

Open these inbound ports:

| Port  | Service   | Source      |
|-------|-----------|-------------|
| 22    | SSH       | Your IP     |
| 3002  | App       | 0.0.0.0/0   |
| 3001  | Grafana   | 0.0.0.0/0   |
| 9090  | Prometheus| 0.0.0.0/0   |

Optional (for debugging):

- 6380 (Redis)
- 9121 (Redis Exporter)

### 3. .env on server

`.env` is not in git. Create it on the server before first deploy:

```bash
ssh ubuntu@YOUR_EC2_IP
cd /home/ubuntu/crud-nodejs
nano .env
```

Required variables:

```env
PORT=3002
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/crud-app?retryWrites=true&w=majority
REDIS_HOST=redis
REDIS_PORT=6379
# S3 (optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=your-bucket
```

### 4. GitHub Secrets

In the repo: **Settings → Secrets and variables → Actions**:

| Secret        | Value              |
|---------------|--------------------|
| EC2_HOST      | EC2 public IP      |
| EC2_USER      | ubuntu             |
| EC2_SSH_KEY   | Private SSH key    |
| EC2_APP_URL   | http://EC2_IP:3002 |

---

## Deploy

1. Merge or push to `qa`:

   ```bash
   git checkout qa
   git merge main   # or your dev branch
   git push origin qa
   ```

2. GitHub Actions runs tests and deploys.

3. Verify:

   ```bash
   # From your machine
   curl http://YOUR_EC2_IP:3002/health
   curl http://YOUR_EC2_IP:9090/-/healthy
   ```

---

## Post-Deploy: Grafana on Server

If Grafana cannot reach Prometheus via the service name, use the gateway IP:

1. Get the gateway IP:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "docker network inspect github_monitoring-network 2>/dev/null | grep -A1 Gateway"
   ```

2. In Grafana: **Connections → Data sources → Prometheus**
   - URL: `http://172.21.0.1:9090` (or the gateway IP you found)
   - Access: **Server**
   - Save & test

---

## First-Time Server Setup

If the EC2 instance is new:

```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
# Log out and back in

# Clone repo
git clone https://github.com/YOUR_ORG/YOUR_REPO.git /home/ubuntu/crud-nodejs
cd /home/ubuntu/crud-nodejs
git checkout qa

# Create .env (see above)
nano .env

# Deploy
docker-compose up -d --build
```

---

## URLs After Deploy

| Service   | URL                      |
|-----------|--------------------------|
| App       | http://EC2_IP:3002       |
| Swagger   | http://EC2_IP:3002/api-docs |
| Grafana   | http://EC2_IP:3001       |
| Prometheus| http://EC2_IP:9090       |

---

## Troubleshooting

| Issue                | Fix                                                |
|----------------------|----------------------------------------------------|
| Health check fails   | Open port 3002 in security group                   |
| Grafana no data      | Configure Prometheus datasource (see above)        |
| App 500              | Check .env (MongoDB, Redis)                        |
| Build fails on EC2   | Ensure Docker/Docker Compose are installed         |
