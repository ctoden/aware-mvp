import { ChangeType } from "@src/events/ChangeEvent";
import { GenerateDataService } from "@src/services/GenerateDataService";
import { DependencyService } from "@src/core/injection/DependencyService";
import { Result } from "neverthrow";

/**
 * Configure change types for the FTUX (First Time User Experience) process
 * Disables all change types and then enables only FTUX, AUTH, and USER_PROFILE_REFRESH
 */
export const configureFtuxChangeTypes = (): void => {
  const generateDataService = DependencyService.resolve(GenerateDataService);

  // Disable all change types first
  generateDataService.disableAllChangeTypes();

  // Enable app state changes
  generateDataService.enableChangeType(ChangeType.APP_INIT_DONE);

  // Enable only the types needed for FTUX
  generateDataService.enableChangeType(ChangeType.FTUX);
  generateDataService.enableChangeType(ChangeType.FTUX_COMPLETE);
  generateDataService.enableChangeType(ChangeType.LOGIN);
  generateDataService.enableChangeType(ChangeType.LOGOUT);
  generateDataService.enableChangeType(ChangeType.USER_PROFILE_GENERATE_SUMMARY);
};

export const configureAppInitChangeTypes = (): void => {
  const generateDataService = DependencyService.resolve(GenerateDataService);
  // First disable all change types
  generateDataService.disableAllChangeTypes();

  // Enable app state changes
  generateDataService.enableChangeType(ChangeType.APP_INIT_DONE);

  //TODO: got to be a better way to do this
  // Then enable only the specified types
  generateDataService.enableChangeType(ChangeType.FTUX);
  generateDataService.enableChangeType(ChangeType.LOGIN);
  generateDataService.enableChangeType(ChangeType.SIGNUP);
  generateDataService.enableChangeType(ChangeType.LOGOUT);
  generateDataService.enableChangeType(ChangeType.USER_PROFILE_GENERATE_SUMMARY);
  generateDataService.enableChangeType(ChangeType.FTUX_COMPLETE);
};


/**
 * Configure change types for normal application usage after FTUX
 * Enables all supported change types
 */
export const configureNormalChangeTypes = (): void => {
  const generateDataService = DependencyService.resolve(GenerateDataService);

  // Enable all change types for normal application usage
  generateDataService.enableAllChangeTypes();
};

/**
 * Get the currently enabled change types
 * @returns Array of enabled change types
 */
export const getEnabledChangeTypes = (): ChangeType[] => {
  const generateDataService = DependencyService.resolve(GenerateDataService);
  return generateDataService.getEnabledChangeTypes();
};

/**
 * Check if a specific change type is enabled
 * @param changeType The change type to check
 * @returns True if the change type is enabled, false otherwise
 */
export const isChangeTypeEnabled = (changeType: ChangeType): boolean => {
  const generateDataService = DependencyService.resolve(GenerateDataService);
  return generateDataService.isChangeTypeEnabled(changeType);
};

/**
 * Enable a specific change type
 * @param changeType The change type to enable
 */
export const enableChangeType = (changeType: ChangeType): void => {
  const generateDataService = DependencyService.resolve(GenerateDataService);
  generateDataService.enableChangeType(changeType);
};

/**
 * Disable a specific change type
 * @param changeType The change type to disable
 */
export const disableChangeType = (changeType: ChangeType): void => {
  const generateDataService = DependencyService.resolve(GenerateDataService);
  generateDataService.disableChangeType(changeType);
};

/**
 * Waits for actions triggered by a specific change type to complete
 * @param changeType The type of change to wait for
 * @param timeoutMs Maximum time to wait in milliseconds
 * @returns Promise that resolves when actions are completed or timeout is reached
 */
export const waitForChangeActions = async (
  changeType: ChangeType,
  timeoutMs: number = 10000
): Promise<Result<boolean, Error>> => {
  const generateDataService = DependencyService.resolve(GenerateDataService);
  return await generateDataService.waitForChangeActions(changeType, timeoutMs);
};
