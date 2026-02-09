import { get, isBoolean, isString, isNumber } from 'lodash';
import { DependencyService } from '@src/core/injection/DependencyService';
import Constants from 'expo-constants';

/**
 * Parses a value into a boolean
 * 
 * @param value The value to parse
 * @returns The parsed boolean value
 */
export function parseBoolean(value: unknown): boolean {
    if (isBoolean(value)) {
        return value;
    }
    if (isString(value)) {
        return ['true', 'yes'].includes(value.toLowerCase());
    }
    if (isNumber(value)) {
        return value !== 0 && !isNaN(value);
    }
    return false;
}

/**
 * Gets a value from environment variables with fallbacks
 * 
 * @param key The environment variable key
 * @param defaultValue Optional default value if not found
 * @returns The environment variable value or undefined
 */
export function getFromEnv(key: string, defaultValue?: string): string | undefined {
    try {
        // Try process.env (works in development)
        const processVal = process.env[key] || process.env[key.toUpperCase()] || 
                          (key.startsWith('EXPO_PUBLIC_') ? undefined : process.env[`EXPO_PUBLIC_${key}`]);
        
        // Try Expo Constants (works in release builds)
        // First check directly in Constants.expoConfig
        let expoVal = undefined;
        if (Constants.expoConfig) {
            // Handle both direct access and via 'extra'
            expoVal = get(Constants.expoConfig, key) || 
                     get(Constants.expoConfig, key.toUpperCase()) ||
                     get(Constants.expoConfig, ['extra', key]) || 
                     get(Constants.expoConfig, ['extra', key.toUpperCase()]);
                     
            // Try with EXPO_PUBLIC_ prefix if not already using it
            if (!expoVal && !key.startsWith('EXPO_PUBLIC_')) {
                expoVal = get(Constants.expoConfig, `EXPO_PUBLIC_${key}`) || 
                         get(Constants.expoConfig, ['extra', `EXPO_PUBLIC_${key}`]);
            }
        }
        
        // Try Constants.manifest.extra (older Expo versions)
        if (!expoVal && Constants.manifest) {
            expoVal = get(Constants.manifest, ['extra', key]) || 
                     get(Constants.manifest, ['extra', key.toUpperCase()]) ||
                     get(Constants.manifest, ['extra', `EXPO_PUBLIC_${key}`]);
        }
        
        // Try directly in Constants for Expo 46+
        if (!expoVal) {
            expoVal = get(Constants, key) || 
                     get(Constants, key.toUpperCase()) ||
                     get(Constants, `EXPO_PUBLIC_${key}`);
        }
        
        // Try test environment (for Jest)
        const globalVal = get(global, `test.env.${key}`) || 
                         get(global, `test.env.${key.toUpperCase()}`) ||
                         get(global, `test.env.EXPO_PUBLIC_${key}`);
        
        // Try DependencyService
        const dependencyVal = DependencyService.resolveSafe<string>(key);
        
        // Return the first non-null value or the default
        return processVal || expoVal || globalVal || dependencyVal || defaultValue;
    } catch (error) {
        console.warn(`Error getting environment variable ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Gets a value from environment variables with fallbacks, throwing an error if not found
 * 
 * @param key The environment variable key
 * @returns The environment variable value
 * @throws Error if the environment variable is not found
 */
export function getRequiredFromEnv(key: string): string {
    const value = getFromEnv(key);
    if (value === undefined) {
        throw new Error(`Required environment variable ${key} is not defined`);
    }
    return value;
} 
