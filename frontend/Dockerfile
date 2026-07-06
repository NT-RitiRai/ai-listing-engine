# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN addgroup -g 1000 nginx && \
    adduser -D -u 1000 -G nginx nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx

# Switch to non-root user
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
