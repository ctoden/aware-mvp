import { observable } from "@legendapp/state";
import { getFromEnv } from "@src/utils/EnvUtils";

/**
 * Enum representing different types of application state changes
 * These events represent changes in the application state that components
 * may need to react to, including user actions and system events
 */
export enum ChangeType {
  // Application State
  AUTH = 'AUTH',
  FTUX = 'FTUX',
  FTUX_COMPLETE = 'FTUX_COMPLETE',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  LOGOUT = 'LOGOUT',
  
  // App State Changes
  APP_INIT_DONE = 'APP_INIT_DONE',

  // User Data
  USER_PROFILE = 'USER_PROFILE',
  USER_ASSESSMENT = 'USER_ASSESSMENT',
  ASSESSMENT_UPDATED = 'ASSESSMENT_UPDATED',
  ASSESSMENT_DELETED = 'ASSESSMENT_DELETED',
  USER_PROFILE_REFRESH = 'USER_PROFILE_REFRESH',
  USER_PROFILE_GENERATE_SUMMARY = 'USER_PROFILE_GENERATE_SUMMARY',
  
  // Goals & Interests
  SHORT_TERM_GOAL = 'SHORT_TERM_GOAL',
  LONG_TERM_GOAL = 'LONG_TERM_GOAL',
  MAIN_INTEREST = 'MAIN_INTEREST',
  
  // Personal Development
  PROFESSIONAL_DEVELOPMENT = 'PROFESSIONAL_DEVELOPMENT',
  DIG_DEEPER = 'DIG_DEEPER',
  CHAT = 'CHAT',
  
  // Personal Attributes
  CORE_VALUES = 'CORE_VALUES',
  MOTIVATIONS = 'MOTIVATIONS',
  WEAKNESSES = 'WEAKNESSES',
  ABOUT_YOU = 'ABOUT_YOU',
  TOP_QUALITIES = 'TOP_QUALITIES',
  QUICK_INSIGHT = 'QUICK_INSIGHT',
  INNER_CIRCLE = 'INNER_CIRCLE',
}

/**
 * Interface representing a change event in the application
 * These events are used to communicate state changes across the application
 */
export interface ChangeEvent {
  /** The type of change that occurred */
  type: ChangeType;
  
  /** The data associated with the change */
  payload: any;
  
  /** Timestamp when the event was created */
  timestamp: number;
  
  /** Source of the event - helps track origin for debugging and analytics */
  source?: 'user_action' | 'system' | 'api';
}

/**
 * Observable that emits change events throughout the application
 * Components can subscribe to this to react to application state changes
 */
export const change$ = observable<ChangeEvent | null>(null);

// Track last emitted event timestamp by type for debouncing
const lastEventTimestamps: Record<string, number> = {};

// Default debounce interval (milliseconds)
const DEFAULT_DEBOUNCE_MS = 300;

// Get debounce time from env or use default
const envValue = getFromEnv('CHANGE_EVENT_DEBOUNCE_MS', DEFAULT_DEBOUNCE_MS.toString());
const DEBOUNCE_TIME_MS = envValue ? parseInt(envValue) : DEFAULT_DEBOUNCE_MS;

/**
 * Emits a change event to the application
 * @param type The type of change event
 * @param payload The data associated with the event
 * @param source The source of the event (user_action, system, or API)
 */
export function emitChange(type: ChangeType, payload: any, source: 'user_action' | 'system' | 'api' = 'system'): void {
  const now = Date.now();
   
  // const error = new Error(`Change type ${type}`);
  // const stack = error.stack;
  // console.log("~~~~ Change event emitted", type, payload, source, now, stack);

  // Check if we're within the debounce period for this event type
  const lastEmittedTime = lastEventTimestamps[type] || 0;
  const timeSinceLastEmit = now - lastEmittedTime;
  
  if (timeSinceLastEmit < DEBOUNCE_TIME_MS) {
    console.log(`~~~~ Debouncing change event ${type}, last emitted ${timeSinceLastEmit}ms ago`, payload);
    return;
  }
  
  // Update the timestamp for this event type
  lastEventTimestamps[type] = now;
  
  console.log("~~~~ Emitting change event", type, payload, source, now);

  change$.set({
    type,
    payload,
    timestamp: now,
    source
  });
}
