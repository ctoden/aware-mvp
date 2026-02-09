declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_DEBUG_MENU_ENABLED: string;
      EXPO_PUBLIC_APP_URL: string;
      EXPO_PUBLIC_OPENAI_API_KEY: string;
      EXPO_PUBLIC_MISTRAL_API_KEY: string;
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      CI: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {} 