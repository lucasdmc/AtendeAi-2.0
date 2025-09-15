# Use Node.js 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy backend package file
COPY package.backend.json ./package.json

# Install dependencies
RUN npm install

# Copy backend files
COPY webhook-production.js ./

# Copy pre-built frontend
COPY dist/ ./dist/

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "webhook-production.js"]
