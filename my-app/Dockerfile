# Single-stage build for React app with Vite preview
FROM node:20-alpine

# Accept build arguments
ARG VITE_API_URL
ARG VITE_REDIRECT_URL

# Set as environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_REDIRECT_URL=$VITE_REDIRECT_URL

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-check-certificate --spider http://localhost:4173/ || exit 1

# Start Vite preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]

