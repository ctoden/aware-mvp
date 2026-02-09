/**
 * @deprecated This file is being migrated to @src/events/ChangeEvent
 * This compatibility layer ensures existing code continues to work during migration
 */

import { ChangeEvent, ChangeType, change$, emitChange } from "@src/events/ChangeEvent";

/**
 * @deprecated Use ChangeType from @src/events/ChangeEvent instead
 */
export enum ModelChangeType {
  USER_ASSESSMENT = ChangeType.USER_ASSESSMENT,
  USER_PROFILE = ChangeType.USER_PROFILE,
  FTUX = ChangeType.FTUX,
  AUTH = ChangeType.AUTH,
  CAREER = 'CAREER', // Deprecated - use PROFESSIONAL_DEVELOPMENT
  RELATIONSHIPS = 'RELATIONSHIPS', // Deprecated - use appropriate specific types
  CORE_VALUES = ChangeType.CORE_VALUES,
  MOTIVATIONS = ChangeType.MOTIVATIONS,
  WEAKNESSES = ChangeType.WEAKNESSES,
  ABOUT_YOU = ChangeType.ABOUT_YOU,
  TOP_QUALITIES = ChangeType.TOP_QUALITIES,
  QUICK_INSIGHT = ChangeType.QUICK_INSIGHT,
  INNER_CIRCLE = ChangeType.INNER_CIRCLE,
  SHORT_TERM_GOAL = ChangeType.SHORT_TERM_GOAL,
  LONG_TERM_GOAL = ChangeType.LONG_TERM_GOAL,
  MAIN_INTEREST = ChangeType.MAIN_INTEREST,
  PROFESSIONAL_DEVELOPMENT = ChangeType.PROFESSIONAL_DEVELOPMENT,
  DIG_DEEPER = ChangeType.DIG_DEEPER,
  CHAT = ChangeType.CHAT,
  USER_PROFILE_REFRESH = ChangeType.USER_PROFILE_REFRESH,
  USER_PROFILE_GENERATE_SUMMARY = ChangeType.USER_PROFILE_GENERATE_SUMMARY
}

/**
 * @deprecated Use ChangeEvent from @src/events/ChangeEvent instead
 */
export interface ModelChangeEvent extends Omit<ChangeEvent, 'type'> {
  type: ModelChangeType;
}

/**
 * @deprecated Use change$ from @src/events/ChangeEvent instead
 */
export const modelChange$ = change$;

/**
 * @deprecated Use emitChange from @src/events/ChangeEvent instead
 */
export function emitModelChange(type: ModelChangeType, payload: any): void {
  // Map ModelChangeType to ChangeType (they're identical for now)
  const changeType = type as unknown as ChangeType;
  
  // Call the new emitChange function
  emitChange(changeType, payload, 'system');
}
