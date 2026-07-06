# Docker Deployment Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Users                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx Reverse  │
                    │     Proxy       │
                    │   (Port 80/443) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼──────┐      ┌────▼────┐
   │ Frontend │         │   Backend  │      │   Docs  │
   │ (React)  │         │  (FastAPI) │      │ (Swagger)
   │ Port 80  │         │ Port 8000  │      │         │
   └──────────┘         └─────┬──────┘      └─────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
           ┌────▼────┐   ┌────▼────┐  ┌───▼────┐
           │PostgreSQL   │  Redis  │  │ Uploads│
           │ Database    │  Cache  │  │ Volume │
           │ Port 5432   │ Port 6379  │        │
           └─────────────┘─────────────┴────────┘
```

## Container Services

### 1. Nginx (Reverse Proxy)
- **Image**: nginx:alpine
- **Port**: 80 (HTTP), 443 (HTTPS)
- **Role**: Route requests to frontend/backend
- **Features**:
  - SSL/TLS termination
  - Gzip compression
  - Rate limiting
  - Security headers
  - WebSocket support

### 2. Frontend (React + Vite)
- **Image**: Custom (multi-stage build)
- **Port**: 3000 (internal), 80 (via nginx)
- **Role**: Serve React SPA
- **Features**:
  - Static asset caching
  - SPA routing
  - Gzip compression
  - Security headers

### 3. Backend (FastAPI)
- **Image**: Custom (python:3.12-slim)
- **Port**: 8000
- **Role**: API server
- **Features**:
  - Async request handling
  - Database connection pooling
  - Redis caching
  - Background tasks
  - Health checks

### 4. PostgreSQL
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Role**: Primary database
- **Features**:
  - Persistent storage
  - Automatic backups
  - Health checks
  - Connection pooling

### 5. Redis
- **Image**: redis:7-alpine
- **Port**: 6379
- **Role**: Cache & session store
- **Features**:
  - Persistent storage (AOF)
  - Password protection
  - Health checks
  - Auto-reconnection

## Network Architecture

```
Docker Network: app-network (10.0.9.0/24)

Services communicate via service names:
- backend:8000
- frontend:80
- postgres:5432
- redis:6379
```

## Volume Management

```
Volumes:
├── postgres_data/      → Database files
├── redis_data/         → Redis persistence
├── uploads/            → User uploads
└── logs/               → Application logs
```

## Deployment Flow

```
1. Build Phase
   ├── Backend Dockerfile
   │  ├── Install dependencies
   │  ├── Copy source code
   │  └── Create non-root user
   └── Frontend Dockerfile
      ├── Build React app
      ├── Copy to nginx
      └── Configure nginx

2. Startup Phase
   ├── PostgreSQL starts
   ├── Redis starts
   ├── Backend starts (waits for DB)
   ├── Frontend starts
   └── Nginx starts (routes traffic)

3. Health Check Phase
   ├── Nginx checks /health
   ├── Backend checks /health
   ├── PostgreSQL checks connection
   └── Redis checks connection

4. Running Phase
   ├── Nginx routes requests
   ├── Frontend serves static files
   ├── Backend processes API requests
   ├── Database stores data
   └── Redis caches data
```

## Production Deployment Steps

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd ai-listing-engine

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 3. Build images
docker compose build

# 4. Start services
docker compose up -d

# 5. Verify
docker compose ps
curl http://localhost/health
```

### Detailed Steps

```bash
# 1. Prepare VPS
ssh root@your-vps
apt-get update && apt-get upgrade -y
apt-get install -y docker.io docker-compose git

# 2. Clone and setup
cd /opt
git clone <repo-url> ai-listing-engine
cd ai-listing-engine

# 3. Configure
cp .env.example .env
# Edit .env with:
# - DB_PASSWORD
# - REDIS_PASSWORD
# - SECRET_KEY
# - API_KEYS
# - CORS_ORIGINS

# 4. Build
docker compose build

# 5. Start
docker compose up -d

# 6. Monitor
docker compose logs -f

# 7. Setup SSL (after domain is ready)
# See DEPLOYMENT.md for SSL setup
```

## Health Checks

All services include health checks:

```yaml
Backend:
  - Endpoint: http://localhost:8000/health
  - Interval: 30s
  - Timeout: 10s
  - Retries: 3

PostgreSQL:
  - Command: pg_isready
  - Interval: 10s
  - Timeout: 5s
  - Retries: 5

Redis:
  - Command: redis-cli ping
  - Interval: 10s
  - Timeout: 5s
  - Retries: 5

Frontend:
  - Endpoint: http://localhost/health
  - Interval: 30s
  - Timeout: 10s
  - Retries: 3

Nginx:
  - Endpoint: http://localhost/health
  - Interval: 30s
  - Timeout: 10s
  - Retries: 3
```

## Logging Strategy

```
Logs are stored in /app/logs volume:

├── application.log     → General application logs
├── crawler.log         → Web crawler logs
├── llm.log            → LLM API calls
├── error.log          → Error logs
└── access.log         → HTTP access logs

Log rotation:
- Max size: 10MB per file
- Max files: 3-5 per service
- Retention: 14 days
```

## Performance Tuning

### Backend
```python
# Uvicorn workers
workers = 4  # CPU cores

# Connection pooling
pool_size = 20
max_overflow = 10

# Async concurrency
asyncio_mode = "auto"
```

### Nginx
```nginx
# Worker processes
worker_processes auto;

# Connections per worker
worker_connections 2048;

# Keepalive
keepalive_timeout 65;
keepalive_requests 100;

# Gzip compression
gzip_comp_level 6;
```

### PostgreSQL
```sql
-- Connection pooling
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
```

### Redis
```
# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
appendonly yes
appendfsync everysec
```

## Security Measures

1. **Network Isolation**
   - Custom Docker network
   - No direct internet access to DB/Redis
   - Firewall rules on VPS

2. **Container Security**
   - Non-root users
   - Read-only filesystems where possible
   - Resource limits

3. **Data Protection**
   - Encrypted passwords
   - SSL/TLS for external traffic
   - Database backups

4. **Access Control**
   - CORS configuration
   - Rate limiting
   - Security headers

## Monitoring & Alerts

### Key Metrics to Monitor
- CPU usage per container
- Memory usage per container
- Disk space usage
- Database connection count
- Redis memory usage
- Request latency
- Error rates

### Recommended Tools
- Docker stats (built-in)
- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- New Relic

## Backup & Recovery

### Automated Backups
```bash
# Daily database backups
0 2 * * * /opt/ai-listing-engine/backup-db.sh

# Backup retention: 30 days
# Location: /opt/ai-listing-engine/backups/
```

### Recovery Procedure
```bash
# 1. Stop backend
docker compose stop backend

# 2. Restore database
gunzip < backups/db_backup_YYYYMMDD.sql.gz | \
  docker compose exec -T postgres psql -U postgres ai_listing

# 3. Start backend
docker compose start backend
```

## Scaling Considerations

### Horizontal Scaling
```yaml
# Multiple backend instances
backend:
  replicas: 3
  
# Load balancing via Nginx
upstream backend {
  least_conn;
  server backend-1:8000;
  server backend-2:8000;
  server backend-3:8000;
}
```

### Vertical Scaling
- Increase container resource limits
- Increase database connection pool
- Increase Redis memory

### Database Scaling
- Read replicas for PostgreSQL
- Connection pooling (PgBouncer)
- Query optimization

## Troubleshooting Guide

### Service Won't Start
```bash
# Check logs
docker compose logs <service>

# Check port conflicts
netstat -tlnp | grep -E ':(80|443|8000|5432|6379)'

# Check resource limits
docker stats
```

### Database Connection Failed
```bash
# Test connection
docker compose exec backend psql -h postgres -U postgres

# Check database logs
docker compose logs postgres

# Verify database exists
docker compose exec postgres psql -U postgres -l
```

### High Memory Usage
```bash
# Check container memory
docker stats

# Check for memory leaks
docker compose logs backend | grep -i memory

# Restart container
docker compose restart backend
```

### Slow Performance
```bash
# Check database queries
docker compose exec postgres psql -U postgres -d ai_listing \
  -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check Redis memory
docker compose exec redis redis-cli INFO memory

# Monitor network
docker stats --no-stream
```

## Files Created

```
ai-listing-engine/
├── backend/
│   ├── Dockerfile              # Backend container image
│   └── docker.env              # Docker-specific env vars
├── frontend/
│   ├── Dockerfile              # Frontend container image
│   └── nginx.conf              # Frontend nginx config
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment template
├── .dockerignore               # Docker build optimization
├── DEPLOYMENT.md               # Deployment guide
└── DOCKER_ARCHITECTURE.md      # This file
```

## Quick Reference Commands

```bash
# Build
docker compose build

# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f
docker compose logs -f backend

# Status
docker compose ps

# Execute command
docker compose exec backend bash

# Restart service
docker compose restart backend

# View resource usage
docker stats

# Prune unused resources
docker system prune -a --volumes
```

## Next Steps

1. Review DEPLOYMENT.md for detailed setup
2. Configure .env with production values
3. Set up SSL certificates
4. Configure monitoring
5. Set up automated backups
6. Test disaster recovery
7. Document any customizations
8. Train team on operations

---

For detailed deployment instructions, see DEPLOYMENT.md
