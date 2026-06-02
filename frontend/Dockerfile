# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .

# We pass the VITE_API_BASE_URL as an empty string because the Nginx reverse proxy
# will forward requests made to '/api/v1' directly to the backend container.
# If you prefer to hardcode a remote URL, pass it as a build arg.
ENV VITE_API_BASE_URL=/api/v1

# Build the app
RUN npm run build

# Stage 2: Serve the app using Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
