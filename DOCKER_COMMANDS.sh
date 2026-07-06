#!/bin/bash
# AI Listing Engine - Docker Quick Reference

# ==========================================
# BUILD & DEPLOYMENT
# ==========================================

# Build all images
docker compose build

# Build specific service
docker compose build backend
docker compose build frontend

# Start all services
docker compose up -d

# Start specific service
docker compose up -d backend

# Stop all services
docker compose stop

# Stop specific service
docker compose stop backend

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Remove all containers (WARNING: data loss)
docker compose down

# Remove all containers and volumes (WARNING: data loss)
docker compose down -v

# ==========================================
# MONITORING & LOGS
# ==========================================

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f nginx

# View last 100 lines
docker compose logs --tail=100

# View logs with timestamps
docker compose logs -f --timestamps

# View logs since specific time
docker compose logs -f --since 10m

# Check service status
docker compose ps

# View resource usage
docker stats

# View resource usage (no stream)
docker stats --no-stream

# ==========================================
# CONTAINER MANAGEMENT
# ==========================================

# Execute command in container
docker compose exec backend bash
docker compose exec frontend bash
docker compose exec postgres bash
docker compose exec redis bash

# Execute command without TTY
docker compose exec -T backend python -c "print('test')"

# Copy file from container
docker compose cp backend:/app/logs/error.log ./error.log

# Copy file to container
docker compose cp ./file.txt backend:/app/

# ==========================================
# DATABASE OPERATIONS
# ==========================================

# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d ai_listing

# List databases
docker compose exec postgres psql -U postgres -l

# Backup database
docker compose exec -T postgres pg_dump -U postgres ai_listing | gzip > backup.sql.gz

# Restore database
gunzip < backup.sql.gz | docker compose exec -T postgres psql -U postgres ai_listing

# Check database size
docker compose exec postgres psql -U postgres -d ai_listing -c "SELECT pg_size_pretty(pg_database_size('ai_listing'));"

# List tables
docker compose exec postgres psql -U postgres -d ai_listing -c "\dt"

# ==========================================
# REDIS OPERATIONS
# ==========================================

# Connect to Redis
docker compose exec redis redis-cli -a $REDIS_PASSWORD

# Check Redis info
docker compose exec redis redis-cli -a $REDIS_PASSWORD INFO

# Check Redis memory
docker compose exec redis redis-cli -a $REDIS_PASSWORD INFO memory

# Flush all data (WARNING: data loss)
docker compose exec redis redis-cli -a $REDIS_PASSWORD FLUSHALL

# Get all keys
docker compose exec redis redis-cli -a $REDIS_PASSWORD KEYS "*"

# ==========================================
# HEALTH CHECKS
# ==========================================

# Check all services
docker compose ps

# Check backend health
curl http://localhost:8000/health

# Check frontend health
curl http://localhost/health

# Check nginx health
curl http://localhost/health

# Check API
curl http://localhost/api/v1/analyses

# ==========================================
# CONFIGURATION & ENVIRONMENT
# ==========================================

# View environment variables
docker compose config

# View specific service config
docker compose config --services

# Validate docker-compose.yml
docker compose config --quiet

# ==========================================
# UPDATES & MAINTENANCE
# ==========================================

# Pull latest code
git pull origin main

# Rebuild images
docker compose build

# Restart services
docker compose up -d

# Update and restart (one command)
git pull origin main && docker compose build && docker compose up -d

# Prune unused images
docker image prune -a

# Prune unused volumes
docker volume prune

# Prune unused networks
docker network prune

# Prune everything
docker system prune -a --volumes

# ==========================================
# TROUBLESHOOTING
# ==========================================

# Check port conflicts
sudo netstat -tlnp | grep -E ':(80|443|8000|5432|6379)'

# Check disk usage
df -h /opt/ai-listing-engine

# Check container disk usage
docker system df

# View container details
docker compose inspect backend

# View network details
docker network inspect ai-listing-engine_app-network

# Check Docker daemon logs
sudo journalctl -u docker -f

# ==========================================
# BACKUP & RECOVERY
# ==========================================

# Backup database
docker compose exec -T postgres pg_dump -U postgres ai_listing | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# List backups
ls -lh backups/

# Restore from backup
gunzip < backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U postgres ai_listing

# Backup volumes
docker run --rm -v ai-listing-engine_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# ==========================================
# PERFORMANCE TUNING
# ==========================================

# Check slow queries
docker compose exec postgres psql -U postgres -d ai_listing \
  -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check Redis memory usage
docker compose exec redis redis-cli -a $REDIS_PASSWORD INFO memory

# Monitor network traffic
docker stats --no-stream

# Check CPU usage
docker stats --no-stream | grep backend

# ==========================================
# SECURITY
# ==========================================

# Check running processes in container
docker compose exec backend ps aux

# Check open ports in container
docker compose exec backend netstat -tlnp

# Check file permissions
docker compose exec backend ls -la /app

# View container security options
docker inspect backend | grep -A 20 "SecurityOpt"

# ==========================================
# DEVELOPMENT
# ==========================================

# Rebuild without cache
docker compose build --no-cache

# Build with verbose output
docker compose build --verbose

# View build logs
docker compose build --progress=plain

# Run container with interactive shell
docker compose run --rm backend bash

# Run one-off command
docker compose run --rm backend python -c "print('test')"

# ==========================================
# CLEANUP
# ==========================================

# Remove stopped containers
docker container prune

# Remove dangling images
docker image prune

# Remove dangling volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (WARNING: removes unused resources)
docker system prune -a --volumes

# ==========================================
# USEFUL ALIASES (add to ~/.bashrc)
# ==========================================

# alias dc='docker compose'
# alias dcup='docker compose up -d'
# alias dcdown='docker compose down'
# alias dclogs='docker compose logs -f'
# alias dcps='docker compose ps'
# alias dcexec='docker compose exec'
# alias dcbuild='docker compose build'
# alias dcrestart='docker compose restart'

# ==========================================
# COMMON WORKFLOWS
# ==========================================

# 1. Deploy new version
# git pull origin main
# docker compose build
# docker compose up -d
# docker compose logs -f

# 2. Backup and restore
# docker compose exec -T postgres pg_dump -U postgres ai_listing | gzip > backup.sql.gz
# gunzip < backup.sql.gz | docker compose exec -T postgres psql -U postgres ai_listing

# 3. Scale backend (manual)
# docker compose up -d --scale backend=3

# 4. Monitor performance
# docker stats
# docker compose logs -f backend | grep -i error

# 5. Emergency restart
# docker compose down
# docker compose up -d
# docker compose logs -f

# ==========================================
# ENVIRONMENT VARIABLES
# ==========================================

# Load from .env file
export $(cat .env | xargs)

# View specific variable
echo $DATABASE_URL
echo $REDIS_URL
echo $OPENAI_API_KEY

# ==========================================
# DOCKER COMPOSE OVERRIDE
# ==========================================

# Create docker-compose.override.yml for local development
# This file is automatically loaded and overrides docker-compose.yml

# Example:
# version: '3.9'
# services:
#   backend:
#     volumes:
#       - ./backend:/app
#     environment:
#       DEBUG: "true"

# ==========================================
# PRODUCTION COMMANDS
# ==========================================

# Deploy to production
cd /opt/ai-listing-engine
git pull origin main
docker compose build
docker compose up -d
docker compose logs -f

# Check production status
docker compose ps
docker stats --no-stream
df -h

# Backup production database
docker compose exec -T postgres pg_dump -U postgres ai_listing | \
  gzip > /opt/ai-listing-engine/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# View production logs
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f nginx

# Restart production services
docker compose restart backend
docker compose restart frontend
docker compose restart nginx

# ==========================================
# NOTES
# ==========================================

# - Always backup before major changes
# - Test changes in development first
# - Monitor logs during deployment
# - Keep Docker images updated
# - Regularly prune unused resources
# - Document any custom configurations
# - Set up automated backups
# - Monitor disk space
# - Check security regularly

# ==========================================
# HELP & DOCUMENTATION
# ==========================================

# View docker compose help
docker compose --help

# View specific command help
docker compose up --help
docker compose logs --help
docker compose exec --help

# View Docker documentation
# https://docs.docker.com/
# https://docs.docker.com/compose/

# View project documentation
# See DEPLOYMENT.md
# See DOCKER_ARCHITECTURE.md
# See DOCKER_DEPLOYMENT_SUMMARY.md
