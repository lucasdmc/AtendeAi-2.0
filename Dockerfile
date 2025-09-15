# Use Node.js 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy backend package file
COPY package.backend.json ./package.json

# Install only production dependencies
RUN npm ci --omit=dev

# Copy only backend files
COPY webhook-production.js ./
COPY main-server.js ./
COPY app.js ./
COPY production-server.js ./

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "webhook-production.js"]
