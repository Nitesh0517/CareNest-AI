# Stage 1: Build React Vite app
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build argument for backend API URL on Cloud Run
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Run production build
RUN npm run build

# Stage 2: Serve with Nginx on Cloud Run
FROM nginx:alpine

# Default Cloud Run port
ENV PORT=8080

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Expose port
EXPOSE 8080

# Cloud Run automatically starts Nginx and envsubst template
CMD ["nginx", "-g", "daemon off;"]
