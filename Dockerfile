FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Install only production dependencies
RUN npm ci --omit=dev

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "webhook-production.js"]
