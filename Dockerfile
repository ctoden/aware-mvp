# Stage 1: Build the Expo web app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the web export
RUN npx expo export --platform web

# Stage 2: Serve with a lightweight static server
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve

# Copy the built static files
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "dist", "-l", "3000", "-s"]
