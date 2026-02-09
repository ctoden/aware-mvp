import {singleton} from "tsyringe";
import {EventAwareService} from "./EventAwareService";
import {ChangeEvent, ChangeType} from "@src/events/ChangeEvent";
import {err, ok, Result} from "neverthrow";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {Action} from "@src/actions/Action";
import {AsyncActionQueue} from "@src/utils/AsyncActionQueue";
import {observable} from "@legendapp/state";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import {DependencyService} from "@src/core/injection/DependencyService";
import { getFromEnv } from "@src/utils/EnvUtils";

export interface ActionProgress {
  actionName: string;
  status: 'pending' | 'started' | 'completed' | 'error';
  errorMessage?: string;
  timestamp: number;
}

export interface GenerationProgress {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  errorMessage?: string;
  totalActions: number;
  completedActions: number;
  currentAction?: string;
  actionProgress: Record<string, ActionProgress>;
}

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

@singleton()
export class GenerateDataService extends EventAwareService {
  // Observable state for tracking progress
  public readonly generationProgress$ = observable<Record<string, GenerationProgress>>({});
  
  // Action queues to manage execution
  private readonly actionQueue: AsyncActionQueue;
  
  // Action lists for different change types
  private readonly actionsByChangeType: Map<ChangeType, Action<any>[]> = new Map();
  
  // Set of currently enabled change types
  private readonly enabledChangeTypes: Set<ChangeType> = new Set();

  // Queue for storing ChangeEvents before APP_INIT_DONE
  private readonly pendingEvents: ChangeEvent[] = [];
  
  // Flag to track if APP_INIT_DONE has been received
  private hasReceivedAppInitDone = false;
  
  constructor() {
    super("GenerateDataService", [
      // ChangeType.AUTH,
      // ChangeType.USER_ASSESSMENT,
      ChangeType.FTUX,
      ChangeType.FTUX_COMPLETE,
      // ChangeType.USER_PROFILE_REFRESH,
      ChangeType.USER_PROFILE_GENERATE_SUMMARY,
      ChangeType.LOGIN,
      ChangeType.SIGNUP,
      ChangeType.LOGOUT,
      ChangeType.APP_INIT_DONE
    ]);
    
    // Initialize action queue with max concurrent action of 1
    this.actionQueue = new AsyncActionQueue(1, `GenerateDataService`);
  }

  protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    // Get supported change types from the constructor call to super
    const supportedTypes = [
      // ChangeType.AUTH,
      ChangeType.USER_ASSESSMENT,
      ChangeType.FTUX,
      ChangeType.FTUX_COMPLETE,
      // ChangeType.USER_PROFILE_REFRESH,
      ChangeType.USER_PROFILE_GENERATE_SUMMARY,
      ChangeType.LOGIN,
      ChangeType.SIGNUP,
      ChangeType.LOGOUT,
      ChangeType.APP_INIT_DONE
    ];
    
    // Initialize action lists with empty arrays for each supported change type
    for (const type of supportedTypes) {
      this.actionsByChangeType.set(type, this.actionsByChangeType.get(type) ?? []);
      
      // Enable all change types by default
      this.enabledChangeTypes.add(type);
    }
    
    return BR_TRUE;
  }

  protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    // Clear all registered actions and progress data
    this.actionsByChangeType.clear();
    this.enabledChangeTypes.clear();
    this.generationProgress$.set({});
    this.pendingEvents.length = 0;
    this.hasReceivedAppInitDone = false;
    return BR_TRUE;
  }

  /**
   * Enable a specific change type to be processed
   * @param changeType The change type to enable
   */
  public enableChangeType(changeType: ChangeType): void {
    if (this.actionsByChangeType.has(changeType)) {
      this.enabledChangeTypes.add(changeType);
    }
  }

  /**
   * Disable a specific change type from being processed
   * @param changeType The change type to disable
   */
  public disableChangeType(changeType: ChangeType): void {
    this.enabledChangeTypes.delete(changeType);
  }

  /**
   * Enable all supported change types
   */
  public enableAllChangeTypes(): void {
    for (const type of this.actionsByChangeType.keys()) {
      this.enabledChangeTypes.add(type);
    }
  }

  /**
   * Disable all currently enabled change types
   */
  public disableAllChangeTypes(): void {
    this.enabledChangeTypes.clear();
  }

  /**
   * Check if a specific change type is currently enabled
   * @param changeType The change type to check
   * @returns True if the change type is enabled, false otherwise
   */
  public isChangeTypeEnabled(changeType: ChangeType): boolean {
    return this.enabledChangeTypes.has(changeType);
  }

  /**
   * Get all currently enabled change types
   * @returns Array of enabled change types
   */
  public getEnabledChangeTypes(): ChangeType[] {
    return Array.from(this.enabledChangeTypes);
  }

  /**
   * Register actions to be executed when a specific change type occurs
   */
  public registerActions(changeType: ChangeType, actions: Action<any>[]): void {
    console.log("~~~~ GenerateDataService: Registering actions for change type", changeType, actions.map(a => a.name).join(', '));
    const existingActions = this.actionsByChangeType.get(changeType) || [];
    this.actionsByChangeType.set(changeType, [...existingActions, ...actions]);
  }

  /**
   * Get actions registered for a specific change type
   */
  public getActions(changeType: ChangeType): Action<any>[] {
    return this.actionsByChangeType.get(changeType) || [];
  }

  /**
   * Get all registered actions across all change types
   */
  public getAllActions(): Action<any>[] {
    const allActions: Action<any>[] = [];
    for (const actions of this.actionsByChangeType.values()) {
      allActions.push(...actions);
    }
    return allActions;
  }

  /**
   * Execute a list of actions sequentially with progress tracking
   */
  public async executeActions(actions: Action<any>[], data: any | null = null, progressId = Date.now().toString()): Promise<Result<boolean, Error>> {
    if (actions.length === 0) {
      return ok(true);
    }

    // Initialize progress tracking
    this.initializeProgress(progressId, actions);

    try {
      // Execute all actions in parallel as intended VERY IMPORTANT
      const results = [];
      for (const action of actions) {
        const r = this.executeAction(action, data, progressId).then(result => {
          if (result.isErr()) {
            this.updateGenerationError(progressId, result.error);
            console.log("~~~~ GenerateDataService: Error executing action", action.name, result.error);
            return err(result.error);
          }  
        });

        results.push(r);
      }

      await Promise.all(results);

      this.completeGeneration(progressId);
      return ok(true);
    } catch (error) {
      const errorObject = error instanceof Error ? error : new Error('Unknown error during action execution');
      this.updateGenerationError(progressId, errorObject);
      return err(errorObject);
    }
  }

  /**
   * Execute a single action with progress tracking
   */
  private async executeAction(action: Action<any>, data: any | null, progressId: string): Promise<Result<any, Error>> {
    this.updateActionStatus(progressId, action.name, 'started');
    
    try {
      console.log("~~~~ GenerateDataService: Executing action", action.name ?? 'Unknown Action');
      const result = await action.execute(data);
      
      if (result.isErr()) {
        this.updateActionStatus(progressId, action.name, 'error', result.error.message);
        return err(result.error);
      }

      this.updateActionStatus(progressId, action.name, 'completed');
      return result;
    } catch (error) {
      const errorObject = error instanceof Error ? error : new Error(`Error executing action ${action.name}`);
      this.updateActionStatus(progressId, action.name, 'error', errorObject.message);
      return err(errorObject);
    }
  }

  /**
   * Process a single ChangeEvent
   */
  private async processChangeEvent(event: ChangeEvent): Promise<void> {
    // Skip processing if this change type is disabled
    if (!this.enabledChangeTypes.has(event.type)) {
      console.log(`Skipping disabled change type: ${event.type} from: ${event.source} at: ${event.timestamp}`);
      return;
    } else {
      console.log(`Processing enabled change type: ${event.type} from: ${event.source} at: ${event.timestamp}`);
    }
    
    this.disableChangeType(event.type); // Disable this change type to prevent duplicate processing
    
    const actions = this.actionsByChangeType.get(event.type) || [];
    
    if (actions.length === 0) {
      console.log(`No actions registered for change type: ${event.type}`);
      return;
    }

    console.log(`Executing ${actions.length} actions for change type: ${event.type}`);
    const progressId = `${event.type}_${event.timestamp}`;
    try {
      await this.executeActions(actions, event.payload, progressId);
    } finally {
      this.enableChangeType(event.type); // Re-enable this change type after processing
    }
  }

  /**
   * Process all pending events in order
   */
  private async processPendingEvents(): Promise<void> {
    console.log(`Processing ${this.pendingEvents.length} pending events`);
    for (const event of this.pendingEvents) {
      await this.actionQueue.executeAction(
        async () => this.processChangeEvent(event)
      );
    }
    this.pendingEvents.length = 0; // Clear the queue after processing
  }

  /**
   * Handle change events by executing appropriate actions
   * Only processes events for enabled change types
   */
  protected async onStateChange(event: ChangeEvent): Promise<void> {
    if (event.type === ChangeType.APP_INIT_DONE) {
      console.log('Received APP_INIT_DONE, starting to process pending events');
      this.hasReceivedAppInitDone = true;
      await this.processPendingEvents();
      return;
    }

    if (!this.hasReceivedAppInitDone) {
      console.log(`Queueing change event ${event.type} for later processing`);
      this.pendingEvents.push(event);
      return;
    }

    // If we've received APP_INIT_DONE, process the event immediately
    await this.actionQueue.executeAction(
      async () => this.processChangeEvent(event)
    );
  }

  /**
   * Initialize any additional subscriptions specific to this service
   */
  protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
    // Add custom subscriptions here if needed
    return ok(true);
  }

  // Progress tracking methods

  private initializeProgress(progressId: string, actions: Action<any>[]): void {
    const actionProgress: Record<string, ActionProgress> = {};
    
    for (const action of actions) {
      actionProgress[action.name] = {
        actionName: action.name,
        status: 'pending',
        timestamp: Date.now()
      };
    }

    this.generationProgress$.set({
      ...this.generationProgress$.get(),
      [progressId]: {
        id: progressId,
        status: 'running',
        startTime: Date.now(),
        totalActions: actions.length,
        completedActions: 0,
        actionProgress
      }
    });
  }

  private updateActionStatus(
    progressId: string, 
    actionName: string, 
    status: 'pending' | 'started' | 'completed' | 'error',
    errorMessage?: string
  ): void {
    const progressData = this.generationProgress$.get()[progressId];
    
    if (!progressData) {
      return;
    }

    const updatedProgress = {
      ...progressData,
      currentAction: status === 'started' ? actionName : progressData.currentAction,
      completedActions: status === 'completed' 
        ? progressData.completedActions + 1 
        : progressData.completedActions,
      actionProgress: {
        ...progressData.actionProgress,
        [actionName]: {
          actionName,
          status,
          errorMessage,
          timestamp: Date.now()
        }
      }
    };

    this.generationProgress$.set({
      ...this.generationProgress$.get(),
      [progressId]: updatedProgress
    });
  }

  private completeGeneration(progressId: string): void {
    const progressData = this.generationProgress$.get()[progressId];
    
    if (!progressData) {
      return;
    }

    this.generationProgress$.set({
      ...this.generationProgress$.get(),
      [progressId]: {
        ...progressData,
        status: 'completed',
        endTime: Date.now(),
        currentAction: undefined
      }
    });
  }

  private updateGenerationError(progressId: string, error: Error): void {
    const progressData = this.generationProgress$.get()[progressId];
    
    if (!progressData) {
      return;
    }

    this.generationProgress$.set({
      ...this.generationProgress$.get(),
      [progressId]: {
        ...progressData,
        status: 'error',
        endTime: Date.now(),
        errorMessage: error.message
      }
    });
  }

  /**
   * Waits for actions triggered by a specific change type to complete
   * @param changeType The type of change to wait for
   * @param timeoutMs Maximum time to wait in milliseconds
   * @returns Promise that resolves when actions are completed or timeout is reached
   */
  public async waitForChangeActions(
    changeType: ChangeType,
    timeoutMs: number = 10000
  ): Promise<Result<boolean, Error>> {
    try {
      const generationProgress = this.generationProgress$.peek();
      
      // Find the latest progress ID for this change type
      const progressEntries = Object.entries(generationProgress)
        .filter(([id]) => id.startsWith(`${changeType}_`))
        .sort((a, b) => (b[1].startTime || 0) - (a[1].startTime || 0));
      
      if (progressEntries.length === 0) {
        // No actions found for this change type
        return ok(true);
      }
      
      const [progressId, progressData] = progressEntries[0];
      
      // If already completed, return immediately
      if (progressData.status === 'completed') {
        return ok(true);
      }
      
      if (progressData.status === 'error') {
        return err(new Error(progressData.errorMessage || `Error in actions for ${changeType}`));
      }
      
      // Wait for completion or timeout
      return await new Promise((resolve) => {
        const startTime = Date.now();
        
        // Check progress periodically
        const checkInterval = setInterval(() => {
          const currentProgress = this.generationProgress$.get()[progressId];
          
          // If completed, resolve with success
          if (currentProgress?.status === 'completed') {
            clearInterval(checkInterval);
            resolve(ok(true));
            return;
          }
          
          // If error, resolve with error
          if (currentProgress?.status === 'error') {
            clearInterval(checkInterval);
            resolve(err(new Error(currentProgress.errorMessage || `Error in actions for ${changeType}`)));
            return;
          }
          
          // If timeout is reached, resolve with success but log warning
          if (Date.now() - startTime >= timeoutMs) {
            console.warn(`Timeout waiting for actions of type ${changeType} to complete`);
            clearInterval(checkInterval);
            resolve(ok(false));
          }
        }, 50); // Check every 50ms
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(`Failed to wait for change actions: ${error}`));
    }
  }
} 