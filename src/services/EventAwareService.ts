import { Service } from "./Service";
import { ChangeEvent, ChangeType, change$ } from "@src/events/ChangeEvent";
import { Result, ok } from "neverthrow";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";

/**
 * Base class for services that need to react to application state changes
 * Provides a standardized way to subscribe to and handle change events
 */
export abstract class EventAwareService extends Service {
  private changeTypes: Set<ChangeType> = new Set();

  /**
   * Creates a new EventAwareService
   * @param name The name of the service
   * @param changeTypes The types of change events this service is interested in
   */
  constructor(name: string, changeTypes: ChangeType[]) {
    super(name);
    changeTypes.forEach(type => this.changeTypes.add(type));
  }


  protected async postInitialize(config?: LifeCycleConfig): Promise<void> {
    await this.initializeEventSubscriptions();    
  }

  /**
   * Sets up subscriptions to change events
   */
  protected async initializeEventSubscriptions(): Promise<Result<boolean, Error>> {
    console.log(`~~~~ ${this.name} initializing event subscriptions ~~~~`, this.changeTypes);
    this.onChange(change$, async (change) => {
      const event = change.value;
      if (event && this.changeTypes.has(event.type)) {
        await this.onStateChange(event);
      }
    });
    
    // Initialize custom subscriptions specific to this service
    return this.initializeCustomSubscriptions();
  }

  /**
   * Handle change events for types this service is interested in
   * @param event The change event
   */
  protected abstract onStateChange(event: ChangeEvent): Promise<void>;
  
  /**
   * Initialize any additional subscriptions specific to this service
   * This is called after the change event subscription is set up
   */
  protected abstract initializeCustomSubscriptions(): Promise<Result<boolean, Error>>;
}
