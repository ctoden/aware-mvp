```markdown:README.md
# Aware MVP

A React Native application built with Expo and Supabase.

## Prerequisites

- Node.js (LTS version)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase account and project
- iOS Simulator (macOS) or Android Emulator for local development

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd aware-mvp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [database.new](https://database.new)
2. Copy your project's URL and anon key from the API settings page
3. Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Migrations

First time setup:

```bash
# Apply migrations locally
supabase migration up --local

# Generate TypeScript types for the database
npm run generate:types
```

For subsequent database changes:

```bash
# Create a new migration
supabase migration new <migration_name>

# Apply new migrations
supabase migration up --local

# Update TypeScript types
npm run generate:types
```

### 5. Start the Development Server

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run the app in the iOS Simulator
- `npm run android` - Run the app in the Android Emulator
- `npm run web` - Run the app in a web browser
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:services` - Run service tests
- `npm run test:models` - Run model tests
- `npm run test:viewModels` - Run viewModel tests
- `npm run test:screens` - Run screen tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run generate:types` - Generate TypeScript types from Supabase schema
- `npm run ios:clean` - Clean iOS build files
- `npm run ios:prebuild` - Generate native iOS files
- `npm run ios:run:release` - Run iOS app in release mode
- `npm run ios:run:debug` - Run iOS app in debug mode
- `npm run ios:run:device` - Run iOS app on a connected device

## Development Tools

### Expo

This project uses Expo, a framework and platform for universal React applications. Expo provides:

- A unified development environment
- Access to native APIs
- Live reloading during development
- Easy deployment to devices for testing

Learn more about Expo in their [documentation](https://docs.expo.dev/).

### Supabase

Supabase is an open source Firebase alternative providing:

- PostgreSQL Database
- Authentication
- Real-time subscriptions
- Storage
- Edge Functions

To work with Supabase locally:

1. Install the Supabase CLI
2. Link your project: `supabase link --project-ref your-project-ref`
3. Start the local development environment: `supabase start`

Learn more about Supabase in their [documentation](https://supabase.com/docs).

## Project Structure

```
aware-mvp/
├── app/                 # Expo Router pages
├── assets/             # Static assets
├── src/
│   ├── core/           # Core utilities and types
│   ├── models/         # Data models
│   ├── providers/      # Service providers
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── supabase/
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
└── __tests__/         # Test files
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests: `npm test`
4. Create a pull request

## License

[Add your license information here]
```
