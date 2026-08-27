# ===================================================
# Stage 1: Build React/Vite application
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ===================================================
# Stage 2: Serve using Nginx Alpine
# ===================================================
FROM nginx:alpine

# Copy Nginx custom configuration for React Router SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
