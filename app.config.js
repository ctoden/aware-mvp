// Load environment variables from .env files
const path = require('path');
const dotenv = require('dotenv');

// Flag to track if we've logged already
let hasLogged = false;

// Load .env first (base configuration)
const baseEnvPath = path.resolve('.env');
let env = dotenv.config({ path: baseEnvPath }).parsed || {};

// Then load .env.local to override values
const localEnvPath = path.resolve('.env.local');
const localEnv = dotenv.config({ path: localEnvPath }).parsed;

// Merge .env.local values with .env values, with .env.local taking precedence
if (localEnv) {
  env = { ...env, ...localEnv };
}

// Base app configuration from app.json
const config = {
  "name": "Aware",
  "slug": "aware-self-improvement",
  "version": "1.0.16",
  "orientation": "portrait",
  "icon": "./assets/aware_icon.png",
  "userInterfaceStyle": "automatic",
  "newArchEnabled": true,
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#F0EBE4"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.visualjc.aware"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    },
    "package": "com.visualjc.aware"
  },
  "web": {
    "favicon": "./assets/favicon.png",
    "bundler": "metro"
  },
  "plugins": [
    "expo-router",
    "expo-font"
  ],
  "scheme": "aware",
  // Add environment variables to the extra section
  "extra": {
    ...(Object.keys(env)
      .filter(key => key.startsWith('EXPO_PUBLIC_'))
      .reduce((obj, key) => {
        obj[key] = env[key];
        return obj;
      }, {})),
  }
};

// Log configuration with truncated values (only once)
if (!hasLogged) {
  const truncatedExtra = Object.entries(config.extra).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      // Show 4 chars for *KEY variables, 8 chars for others
      const isKeyVariable = key.endsWith('KEY');
      acc[key] = `${value.slice(0, isKeyVariable ? 4 : 16)}...`;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
  console.log('App config extra:', JSON.stringify(truncatedExtra, null, 2));
  hasLogged = true;
}

module.exports = config; 
