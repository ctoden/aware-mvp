# Stage 1: Build the Expo web app
FROM node:20-alpine AS builder

WORKDIR /app

# Declare build args for env vars that get baked into the bundle
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_MISTRAL_API_KEY
ARG EXPO_PUBLIC_OPENAI_API_KEY

# Set them as env vars so Expo can read them during build
ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_MISTRAL_API_KEY=$EXPO_PUBLIC_MISTRAL_API_KEY
ENV EXPO_PUBLIC_OPENAI_API_KEY=$EXPO_PUBLIC_OPENAI_API_KEY

# Copy package files
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create .env.local from build args so app.config.js (dotenv) can read them
RUN echo "EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL" > .env.local && \
    echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY" >> .env.local && \
    echo "EXPO_PUBLIC_MISTRAL_API_KEY=$EXPO_PUBLIC_MISTRAL_API_KEY" >> .env.local && \
    echo "EXPO_PUBLIC_OPENAI_API_KEY=$EXPO_PUBLIC_OPENAI_API_KEY" >> .env.local

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
