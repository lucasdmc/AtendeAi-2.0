# Use Node.js 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy only backend files
COPY webhook-production.js ./

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "webhook-production.js"]
