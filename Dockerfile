# Stage 1: Build compilation environment
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm package manager globally
RUN npm install -g pnpm

# Copy package lock and package.json to cache dependency layer
COPY pnpm-lock.yaml package.json ./

# Install project dependencies with exact lockfile resolution
RUN pnpm install --frozen-lockfile

# Declare build-time environment arguments (injected statically into Vite assets)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_MAPS_API_KEY

# Set environment variables for the compiler process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# Copy the entire workspace code
COPY . .

# Run the build compiler script
RUN pnpm build

# Stage 2: Web Server production environment
FROM nginx:alpine

# Copy custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose container port 8080 for Google Cloud Run
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
