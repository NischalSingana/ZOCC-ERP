# Docker Setup Guide

This guide explains how to run the ZOCC-ERP application using Docker.

## Prerequisites

- Docker Desktop installed on your machine
- Docker Compose (usually included with Docker Desktop)
- A Gmail account with App Password enabled

## Environment Variables Setup

1. Create a `.env` file in the project root:

```bash
# Server Environment Variables
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# JWT Secret (change this to a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to Security → 2-Step Verification → App Passwords
4. Generate a new app password for "Mail"
5. Use the 16-character password (no spaces) as `SMTP_PASS`

## Running with Docker Compose

### Start all services

```bash
docker-compose up -d
```

This will start:
- **MongoDB** on port 27017
- **Backend Server** on port 4000
- **Frontend** on port 4173 (http://localhost:4173)

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f mongodb
docker-compose logs -f frontend
```

### Stop services

```bash
docker-compose down
```

### Stop and remove volumes (clean slate)

```bash
docker-compose down -v
```

## Building Individual Images

### Build Server Image

```bash
cd server
docker build -t zocc-erp-server:latest .
```

### Build Frontend Image

```bash
cd my-app
docker build -t zocc-erp-frontend:latest .
```

## Running Individual Containers

### Server only

```bash
docker run -d \
  -p 4000:4000 \
  -e MONGODB_URI=mongodb://localhost:27017/zocc_erp \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASS=your-gmail-app-password \
  -e JWT_SECRET=your-secret-key \
  --name zocc-erp-server \
  zocc-erp-server:latest
```

### Frontend only

```bash
docker run -d \
  -p 4173:4173 \
  --name zocc-erp-frontend \
  zocc-erp-frontend:latest
```

## Health Checks

Each service includes health checks:

- **MongoDB**: Checks database connection
- **Server**: `http://localhost:4000/health`
- **Frontend**: `http://localhost:4173/`

## Accessing the Application

- **Frontend**: http://localhost:4173
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health
- **MongoDB**: localhost:27017

## Troubleshooting

### Issue: SMTP connection fails

```bash
# Test Gmail connection
curl http://localhost:4000/test-email

# Check server logs
docker-compose logs server
```

### Issue: MongoDB connection fails

```bash
# Check if MongoDB is healthy
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb
```

### Issue: Frontend can't reach backend

- Make sure `CORS_ORIGIN` in docker-compose.yml includes your frontend URL
- Check that both services are running: `docker-compose ps`

### Rebuild after code changes

```bash
docker-compose up -d --build
```

## Production Considerations

1. **Change JWT_SECRET** to a strong random string
2. **Use environment-specific CORS_ORIGIN**
3. **Set up SSL/TLS** certificates (use Traefik or Nginx as reverse proxy)
4. **Use MongoDB Atlas** or managed database instead of local MongoDB
5. **Set resource limits** in docker-compose.yml
6. **Use secrets management** (Docker secrets, AWS Secrets Manager, etc.)
7. **Enable logging and monitoring** (ELK, Prometheus, etc.)
8. **Set up backup strategy** for MongoDB data

## Docker Compose Override

For local development, you can create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  server:
    volumes:
      - ./server:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

## Volumes

- `mongodb_data`: Persists MongoDB data between container restarts

To backup MongoDB data:

```bash
docker-compose exec mongodb mongodump --archive=/data/db/backup.archive
```

