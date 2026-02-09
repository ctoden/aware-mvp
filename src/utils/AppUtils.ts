import Constants from 'expo-constants';
// Direct import of app.json for fallback
import appJson from '../../app.json';

/**
 * Gets the app version directly from app.json and app.config.js using require to avoid caching
 * @returns The app version string
 */
export function getAppVersionDirect(): string {
  try {
    // Use require to get fresh copies of the files
    const appJsonDirect = require('../../app.json');
    console.log('Direct app.json version:', appJsonDirect.expo.version);
    
    // Return the version from app.json
    return appJsonDirect.expo.version;
  } catch (error) {
    console.error('Error getting direct version:', error);
    return '1.0.7'; // Fallback
  }
}

/**
 * Gets the current app version from Expo Constants
 * @returns The app version string
 */
export function getAppVersion(): string {
  // Try to get version directly first
  const directVersion = getAppVersionDirect();
  if (directVersion) {
    console.log('Using direct version:', directVersion);
    return directVersion;
  }
  
  // Log the entire Constants object for debugging
  console.log('Constants object:', JSON.stringify(Constants, null, 2));
  
  // Try to get version from expoConfig first (newer Expo versions)
  if (Constants.expoConfig?.version) {
    console.log('Using version from Constants.expoConfig:', Constants.expoConfig.version);
    return Constants.expoConfig.version;
  }
  
  // Try to get version from manifest (older Expo versions)
  if (Constants.manifest?.version) {
    console.log('Using version from Constants.manifest:', Constants.manifest.version);
    return Constants.manifest.version;
  }
  
  // Try to get version directly from Constants
  if (Constants.version) {
    console.log('Using version directly from Constants:', Constants.version);
    return Constants.version;
  }
  
  // Try to get version directly from app.json
  if (appJson.expo?.version) {
    console.log('Using version from app.json:', appJson.expo.version);
    return appJson.expo.version;
  }
  
  // Fallback to a default version if not found
  console.log('No version found in Constants or app.json, using default');
  return '1.0.7'; // Updated default version
} 