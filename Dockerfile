# Use Node.js 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Install only production dependencies for runtime
RUN npm ci --omit=dev

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "webhook-production.js"]
