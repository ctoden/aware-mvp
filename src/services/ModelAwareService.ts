/**
 * @deprecated Use EventAwareService instead
 * This is a compatibility layer to ensure existing code continues to work during migration
 */

import { EventAwareService } from "./EventAwareService";
import { ModelChangeEvent, ModelChangeType } from "@src/models/ModelChangeEvent";
import { ChangeEvent } from "@src/events/ChangeEvent";
import { Result } from "neverthrow";

export abstract class ModelAwareService extends EventAwareService {
  /**
   * @deprecated Use EventAwareService constructor instead
   */
  constructor(name: string, modelChangeTypes: ModelChangeType[]) {
    // Pass the model change types directly to EventAwareService
    // They're compatible due to our compatibility layer
    super(name, modelChangeTypes as any);
  }

  /**
   * Bridge method that converts ChangeEvent to ModelChangeEvent for backward compatibility
   * @param event The change event from the new system
   */
  protected async onStateChange(event: ChangeEvent): Promise<void> {
    // Convert ChangeEvent to ModelChangeEvent for backward compatibility
    const modelEvent: ModelChangeEvent = {
      type: event.type as unknown as ModelChangeType,
      payload: event.payload,
      timestamp: event.timestamp
    };
    
    // Call the old onModelChange method
    await this.onModelChange(modelEvent);
  }

  /**
   * @deprecated Use onStateChange in EventAwareService instead
   */
  protected abstract onModelChange(event: ModelChangeEvent): Promise<void>;
  
  /**
   * Initialize any additional subscriptions specific to this service
   * This is called after the model change subscription is set up
   */
  protected abstract initializeCustomSubscriptions(): Promise<Result<boolean, Error>>;
}