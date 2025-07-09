# Use an official Node.js runtime as a base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3000 (Next.js)
EXPOSE 3000

# Start Next.js in production mode — build happens at runtime
CMD ["sh", "-c", "npm run build && npm start"]