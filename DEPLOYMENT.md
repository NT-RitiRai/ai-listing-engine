# AI Listing Engine - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [VPS Setup](#vps-setup)
3. [Docker Installation](#docker-installation)
4. [Application Deployment](#application-deployment)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required
- Linux VPS (Ubuntu 20.04 LTS or later recommended)
- 4GB RAM minimum (8GB recommended)
- 20GB disk space minimum
- Root or sudo access
- Domain name (for SSL)

### API Keys Required
- OpenAI API Key
- Gemini API Key

---

## VPS Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y \
    curl \
    wget \
    git \
    htop \
    net-tools \
    ufw \
    fail2ban

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Create Application User

```bash
# Create non-root user for application
sudo useradd -m -s /bin/bash appuser
sudo usermod -aG docker appuser
sudo usermod -aG sudo appuser

# Set up SSH key for appuser (optional but recommended)
sudo -u appuser mkdir -p /home/appuser/.ssh
# Copy your public key to /home/appuser/.ssh/authorized_keys
```

### 3. Create Application Directory

```bash
# Create application directory
sudo mkdir -p /opt/ai-listing-engine
sudo chown -R appuser:appuser /opt/ai-listing-engine
cd /opt/ai-listing-engine
```

---

## Docker Installation

### 1. Install Docker

```bash
# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker compose version
```

### 2. Configure Docker Daemon

```bash
# Create daemon configuration
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false
}
EOF

# Restart Docker
sudo systemctl restart docker
```

---

## Application Deployment

### 1. Clone Repository

```bash
cd /opt/ai-listing-engine
git clone <your-repo-url> .
# Or if already cloned:
git pull origin main
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit with production values
nano .env

# Required changes:
# - DB_PASSWORD: Generate strong password
# - REDIS_PASSWORD: Generate strong password
# - SECRET_KEY: Generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# - OPENAI_API_KEY: Add your key
# - GEMINI_API_KEY: Add your key
# - CORS_ORIGINS: Set to your domain
```

### 3. Generate Secure Secrets

```bash
# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate strong passwords
openssl rand -base64 32
```

### 4. Build Docker Images

```bash
# Build all images
docker compose build

# Or build specific service
docker compose build backend
docker compose build frontend
```

### 5. Start Services

```bash
# Start all services in background
docker compose up -d

# Verify services are running
docker compose ps

# Check logs
docker compose logs -f

# Check specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f redis
```

### 6. Verify Deployment

```bash
# Check health endpoints
curl http://localhost/health
curl http://localhost/api/v1/analyses

# Check database connection
docker compose exec backend curl http://localhost:8000/health

# Check frontend
curl http://localhost/

# Check logs for errors
docker compose logs backend | grep -i error
docker compose logs postgres | grep -i error
```

---

## SSL/HTTPS Setup

### 1. Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Generate SSL Certificate

```bash
# Stop nginx temporarily
docker compose stop nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Verify certificate
sudo ls -la /etc/letsencrypt/live/yourdomain.com/
```

### 3. Configure Nginx for HTTPS

```bash
# Copy certificates to nginx volume
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/key.pem
sudo chown appuser:appuser ./nginx/*.pem

# Update nginx.conf - uncomment HTTPS sections
nano nginx/nginx.conf

# Restart nginx
docker compose restart nginx
```

### 4. Auto-Renew Certificates

```bash
# Create renewal script
sudo tee /usr/local/bin/renew-certs.sh > /dev/null <<'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/ai-listing-engine/nginx/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/ai-listing-engine/nginx/key.pem
docker compose -f /opt/ai-listing-engine/docker-compose.yml restart nginx
EOF

sudo chmod +x /usr/local/bin/renew-certs.sh

# Add to crontab
sudo crontab -e
# Add: 0 3 * * * /usr/local/bin/renew-certs.sh
```

---

## Monitoring & Maintenance

### 1. Set Up Log Rotation

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/ai-listing > /dev/null <<EOF
/opt/ai-listing-engine/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 appuser appuser
    sharedscripts
    postrotate
        docker compose -f /opt/ai-listing-engine/docker-compose.yml restart backend > /dev/null 2>&1 || true
    endscript
}
EOF
```

### 2. Monitor Services

```bash
# Check service status
docker compose ps

# View resource usage
docker stats

# Check disk usage
df -h
du -sh /opt/ai-listing-engine/*

# Check database size
docker compose exec postgres psql -U postgres -d ai_listing -c "SELECT pg_size_pretty(pg_database_size('ai_listing'));"
```

### 3. Backup Database

```bash
# Create backup script
mkdir -p /opt/ai-listing-engine/backups

cat > /opt/ai-listing-engine/backup-db.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/ai-listing-engine/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

docker compose exec -T postgres pg_dump -U postgres ai_listing | gzip > "$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/ai-listing-engine/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/ai-listing-engine/backup-db.sh
```

### 4. Monitor Disk Space

```bash
# Create disk space alert script
cat > /opt/ai-listing-engine/check-disk.sh <<'EOF'
#!/bin/bash
THRESHOLD=80
USAGE=$(df /opt/ai-listing-engine | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "WARNING: Disk usage is ${USAGE}%"
    # Send alert (email, webhook, etc.)
fi
EOF

chmod +x /opt/ai-listing-engine/check-disk.sh

# Run every hour
crontab -e
# Add: 0 * * * * /opt/ai-listing-engine/check-disk.sh
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs backend

# Verify environment variables
docker compose config

# Check port conflicts
sudo netstat -tlnp | grep -E ':(80|443|8000|5432|6379)'

# Restart services
docker compose restart
```

### Database Connection Issues

```bash
# Test database connection
docker compose exec backend psql -h postgres -U postgres -d ai_listing -c "SELECT 1"

# Check database logs
docker compose logs postgres

# Verify database exists
docker compose exec postgres psql -U postgres -l
```

### Redis Connection Issues

```bash
# Test Redis connection
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping

# Check Redis logs
docker compose logs redis

# Clear Redis cache (if needed)
docker compose exec redis redis-cli -a $REDIS_PASSWORD FLUSHALL
```

### High Memory Usage

```bash
# Check container memory
docker stats

# Restart container
docker compose restart backend

# Check for memory leaks in logs
docker compose logs backend | grep -i memory
```

### Slow Performance

```bash
# Check database query performance
docker compose exec postgres psql -U postgres -d ai_listing -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check Redis memory
docker compose exec redis redis-cli -a $REDIS_PASSWORD INFO memory

# Monitor network
docker stats --no-stream
```

---

## Rollback Procedures

### Rollback to Previous Version

```bash
# 1. Stop current services
docker compose down

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild images
docker compose build

# 4. Start services
docker compose up -d

# 5. Verify
docker compose ps
curl http://localhost/health
```

### Restore from Database Backup

```bash
# 1. Stop backend service
docker compose stop backend

# 2. Restore database
gunzip < /opt/ai-listing-engine/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U postgres ai_listing

# 3. Start backend
docker compose start backend

# 4. Verify
curl http://localhost/api/v1/analyses
```

### Emergency Rollback

```bash
# If something goes wrong, quickly revert:
cd /opt/ai-listing-engine

# Stop everything
docker compose down

# Restore from backup
git checkout main
git pull origin main

# Rebuild and restart
docker compose build
docker compose up -d

# Monitor
docker compose logs -f
```

---

## Production Validation Checklist

```bash
# Run these commands to verify everything works:

# 1. Frontend loads
curl -I http://localhost/

# 2. API reachable
curl http://localhost/api/v1/analyses

# 3. Database connects
docker compose exec backend curl http://localhost:8000/health

# 4. Redis connects
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping

# 5. All services running
docker compose ps

# 6. No errors in logs
docker compose logs --tail=100 | grep -i error

# 7. Disk space available
df -h /opt/ai-listing-engine

# 8. Memory usage normal
docker stats --no-stream

# 9. SSL certificate valid (after setup)
curl -I https://yourdomain.com

# 10. Firewall rules correct
sudo ufw status
```

---

## Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Execute command in container
docker compose exec backend bash

# Restart specific service
docker compose restart backend

# Stop all services
docker compose stop

# Start all services
docker compose start

# Remove all containers (WARNING: data loss)
docker compose down -v

# Update and restart
git pull origin main
docker compose build
docker compose up -d

# Check resource usage
docker stats

# Prune unused images and volumes
docker system prune -a --volumes
```

---

## Support & Monitoring

### Set Up Monitoring (Optional)

```bash
# Install monitoring tools
sudo apt-get install -y prometheus grafana-server

# Or use cloud monitoring services:
# - AWS CloudWatch
# - DigitalOcean Monitoring
# - Datadog
# - New Relic
```

### Enable Application Metrics

```bash
# Backend already includes health endpoint
# Add to monitoring dashboard:
# - http://localhost/health
# - http://localhost/api/v1/analyses
# - Database connection status
# - Redis connection status
```

---

## Security Hardening

```bash
# 1. Update system regularly
sudo apt-get update && sudo apt-get upgrade -y

# 2. Configure SSH
sudo nano /etc/ssh/sshd_config
# - Disable root login
# - Change default port
# - Use key-based authentication

# 3. Enable firewall
sudo ufw enable

# 4. Set up fail2ban
sudo systemctl enable fail2ban

# 5. Regular backups
# Already configured above

# 6. Monitor logs
tail -f /var/log/auth.log
tail -f /var/log/syslog
```

---

## Next Steps

1. Configure DNS records to point to your VPS
2. Set up SSL certificates
3. Configure monitoring and alerts
4. Set up automated backups
5. Document any custom configurations
6. Train team on deployment procedures
7. Set up CI/CD pipeline (optional)

---

## Contact & Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Review troubleshooting section above
3. Check application documentation
4. Contact development team
