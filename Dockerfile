FROM node:22-alpine

WORKDIR /app

# Copy backend package file
COPY package.backend.json package.json

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "main-server.js"]
