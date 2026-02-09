import { singleton } from "tsyringe";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType, emitChange } from "@src/events/ChangeEvent";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, err, ok } from "neverthrow";
import { FTUX_CURRENT_STEP_KEY, FTUX_FLOW_COMPLETED_KEY, INTRO_COMPLETED_KEY, ftuxState$ } from "@src/models/FtuxModel";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { LocalStorageService } from "./LocalStorageService";
import { DataService } from "./DataService";
import { getUserProfile, updateUserProfile } from "@src/models/UserProfile";
import { AuthService } from "./AuthService";
import { configureFtuxChangeTypes, configureNormalChangeTypes } from "@src/utils/ChangeEventUtils";

export interface IFtuxService {
  isIntroCompleted(): boolean;
  isFtuxCompleted(): boolean;
  getCurrentStep(): number;
  setIntroCompleted(value: boolean): Promise<Result<boolean, Error>>;
  setFtuxCompleted(value: boolean): Promise<Result<boolean, Error>>;
  setCurrentStep(step: number): Promise<Result<boolean, Error>>;
}

@singleton()
export class FtuxService extends EventAwareService implements IFtuxService {
  private readonly _localStorageService: LocalStorageService;
  private readonly _dataService: DataService;
  private readonly _authService: AuthService;

  constructor() {
    super('FtuxService', [
      ChangeType.LOGIN,
      ChangeType.FTUX,
      ChangeType.USER_PROFILE
    ]);
    this._localStorageService = this.addDependency(LocalStorageService);
    this._dataService = this.addDependency(DataService);
    this._authService = this.addDependency(AuthService);
  }
  
  /**
   * Synchronizes FTUX state between local storage and user profile in Supabase
   * This is called when user signs in and when FTUX state changes
   * 
   * Authority model:
   * - has_completed_intro: Local storage is authoritative (always updates server)
   * - has_completed_ftux: Server/database is authoritative
   * - ftux_current_step: Server/database is authoritative
   */
  private async syncWithUserProfile(): Promise<Result<boolean, Error>> {
    try {
      // Check if the user is authenticated
      const isAuthenticated = await this._authService.isAuthenticated();
      
      if (!isAuthenticated) {
        return ok(true);
      }
      
      const userProfile = getUserProfile();
      if (!userProfile) {
        return ok(true);
      }
      
      // Get current state values
      const localIntroCompleted = ftuxState$.hasCompletedIntro.get();
      const localFtuxCompleted = ftuxState$.hasCompletedFTUX.get();
      const localCurrentStep = ftuxState$.currentStep.get();
      
      const profileIntroCompleted = userProfile.has_completed_intro ?? false;
      const profileFtuxCompleted = userProfile.has_completed_ftux ?? false;
      const profileCurrentStep = userProfile.ftux_current_step ?? 0;
      
      // MIXED AUTHORITY MODEL:
      
      // 1. has_completed_intro: Local storage is ALWAYS authoritative
      if (profileIntroCompleted !== localIntroCompleted) {
        // Update the profile model
        updateUserProfile({
          has_completed_intro: localIntroCompleted
        });
        
        // Always update server with local hasCompletedIntro
        const result = await this._dataService.updateData('user_profiles', {
          id: userProfile.id,
          has_completed_intro: localIntroCompleted
        });
        
        if (result.isErr()) {
          console.error('Failed to update server with local hasCompletedIntro', result.error);
          // Continue with other updates even if this one fails
        }
      }
      
      // 2. has_completed_ftux: Server/database is authoritative
      if (userProfile.has_completed_ftux !== undefined && localFtuxCompleted !== profileFtuxCompleted) {
        ftuxState$.hasCompletedFTUX.set(profileFtuxCompleted);
        await this.persistHasCompletedFTUX(profileFtuxCompleted);
      }
      
      // 3. ftux_current_step: Server/database is authoritative
      if (userProfile.ftux_current_step !== undefined && localCurrentStep !== profileCurrentStep) {
        ftuxState$.currentStep.set(profileCurrentStep);
        await this.persistCurrentStep(profileCurrentStep);
      }
      
      return ok(true);
    } catch (error) {
      console.error('Error syncing FTUX state with user profile', error);
      return err(error instanceof Error ? error : new Error('Failed to sync FTUX state'));
    }
  }

  protected async onInitialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    try {
      // First, load the local state
      const hasCompletedIntroResult = await this._localStorageService.getItem(INTRO_COMPLETED_KEY);
      const localIntroCompleted = hasCompletedIntroResult.isOk() ? hasCompletedIntroResult.value === 'true' : false;
      
      // hasCompletedIntro: Local storage is ALWAYS authoritative, set it first
      ftuxState$.hasCompletedIntro.set(localIntroCompleted);
      
      // Load other state values from local storage first (temporary values until server values are loaded)
      const hasCompletedFTUXResult = await this._localStorageService.getItem(FTUX_FLOW_COMPLETED_KEY);
      if (hasCompletedFTUXResult.isOk()) {
        ftuxState$.hasCompletedFTUX.set(hasCompletedFTUXResult.value === 'true');
      }

      const currentStepResult = await this._localStorageService.getItem(FTUX_CURRENT_STEP_KEY);
      if (currentStepResult.isOk() && currentStepResult.value !== null) {
        const step = parseInt(currentStepResult.value, 10);
        if (!isNaN(step)) {
          ftuxState$.currentStep.set(step);
        }
      }

      // If user is authenticated, apply mixed authority model
      const isAuthenticated = await this._authService.isAuthenticated();
      if (isAuthenticated) {
        const userProfile = getUserProfile();
        if (userProfile) {
          // If this is the first time we're setting up the profile after migration,
          // the profile might not have FTUX fields yet, so we need to check
          if (userProfile.has_completed_intro !== undefined && 
              userProfile.has_completed_ftux !== undefined && 
              userProfile.ftux_current_step !== undefined) {
            
            // MIXED AUTHORITY MODEL:
            
            // 1. hasCompletedIntro: Local storage is ALWAYS authoritative 
            // If server value doesn't match local value, update server
            if (userProfile.has_completed_intro !== localIntroCompleted) {
              updateUserProfile({
                has_completed_intro: localIntroCompleted
              });
              
              await this._dataService.updateData('user_profiles', {
                id: userProfile.id,
                has_completed_intro: localIntroCompleted
              });
            }
            
            // 2. has_completed_ftux: Server/database is authoritative
            if (userProfile.has_completed_ftux !== undefined) {
              ftuxState$.hasCompletedFTUX.set(userProfile.has_completed_ftux);
              await this.persistHasCompletedFTUX(userProfile.has_completed_ftux);
            }
            
            // 3. ftux_current_step: Server/database is authoritative
            if (userProfile.ftux_current_step !== undefined) {
              ftuxState$.currentStep.set(userProfile.ftux_current_step);
              await this.persistCurrentStep(userProfile.ftux_current_step);
            }
          } else {
            // If profile doesn't have FTUX fields, sync local state to profile
            await this.syncWithUserProfile();
          }
        }
      }

      // Configure model change types based on FTUX completion status
      if (!this.isFtuxCompleted()) {
        // If FTUX is not completed, configure for FTUX mode
        configureFtuxChangeTypes();
      } else {
        // If FTUX is completed, configure for normal mode
        configureNormalChangeTypes();
      }

      return ok(true);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to initialize FTUX service'));
    }
  }

  protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    return ok(true);
  }

  protected async onStateChange(event: ChangeEvent): Promise<void> {
    if (event.type === ChangeType.FTUX) {
      // Handle FTUX model changes
      
      // Sync with user profile when FTUX state changes
      await this.syncWithUserProfile();
    } else if (event.type === ChangeType.LOGIN) {
      // Apply mixed authority model after login
      const userProfile = getUserProfile();
      if (userProfile && 
          userProfile.has_completed_intro !== undefined && 
          userProfile.has_completed_ftux !== undefined && 
          userProfile.ftux_current_step !== undefined) {
        
        // MIXED AUTHORITY MODEL:
        
        // 1. has_completed_intro: Local storage is ALWAYS authoritative
        // Don't update local value from server - instead, local overrides server
        const localIntroCompleted = ftuxState$.hasCompletedIntro.get();
        if (userProfile.has_completed_intro !== localIntroCompleted) {
          updateUserProfile({
            has_completed_intro: localIntroCompleted
          });
          
          await this._dataService.updateData('user_profiles', {
            id: userProfile.id,
            has_completed_intro: localIntroCompleted
          });
        }
        
        // 2. has_completed_ftux: Server/database is authoritative
        if (userProfile.has_completed_ftux !== undefined) {
          ftuxState$.hasCompletedFTUX.set(userProfile.has_completed_ftux);
          await this.persistHasCompletedFTUX(userProfile.has_completed_ftux);
        }
        
        // 3. ftux_current_step: Server/database is authoritative
        if (userProfile.ftux_current_step !== undefined) {
          ftuxState$.currentStep.set(userProfile.ftux_current_step);
          await this.persistCurrentStep(userProfile.ftux_current_step);
        }
        
        // Update app mode based on FTUX completion
        if (this.isFtuxCompleted()) {
          configureNormalChangeTypes();
        } else {
          configureFtuxChangeTypes();
        }
      }
    } else if (event.type === ChangeType.USER_PROFILE) {
      // Handle user profile updates
      if (event.payload?.action === 'update' && event.payload?.source !== 'ftux') {
        const userProfile = getUserProfile();
        if (userProfile && 
            userProfile.has_completed_intro !== undefined && 
            userProfile.has_completed_ftux !== undefined && 
            userProfile.ftux_current_step !== undefined) {
          
          // MIXED AUTHORITY MODEL:
          
          // 1. has_completed_intro: Local storage is ALWAYS authoritative
          // Don't update local value from server - enforce local value on server if they differ
          const localIntroCompleted = ftuxState$.hasCompletedIntro.get();
          if (userProfile.has_completed_intro !== localIntroCompleted) {
            updateUserProfile({
              has_completed_intro: localIntroCompleted
            });
            
            await this._dataService.updateData('user_profiles', {
              id: userProfile.id,
              has_completed_intro: localIntroCompleted
            });
          }
          
          // 2. has_completed_ftux: Server/database is authoritative
          if (userProfile.has_completed_ftux !== undefined) {
            const localFtuxCompleted = ftuxState$.hasCompletedFTUX.get();
            if (localFtuxCompleted !== userProfile.has_completed_ftux) {
              ftuxState$.hasCompletedFTUX.set(userProfile.has_completed_ftux);
              await this.persistHasCompletedFTUX(userProfile.has_completed_ftux);
            }
          }
          
          // 3. ftux_current_step: Server/database is authoritative
          if (userProfile.ftux_current_step !== undefined) {
            const localCurrentStep = ftuxState$.currentStep.get();
            if (localCurrentStep !== userProfile.ftux_current_step) {
              ftuxState$.currentStep.set(userProfile.ftux_current_step);
              await this.persistCurrentStep(userProfile.ftux_current_step);
            }
          }
        }
      }
    }
  }

  protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
    // Subscribe to ftuxState$ changes to persist them
    this.onChange(ftuxState$.hasCompletedIntro, async (change) => {
      await this.persistHasCompletedIntro(change.value);
    });

    this.onChange(ftuxState$.hasCompletedFTUX, async (change) => {
      if(change.value && !change.getPrevious()) {
        emitChange(ChangeType.FTUX_COMPLETE, { hasCompletedFTUX: change.value });
      }
      await this.persistHasCompletedFTUX(change.value);
    });

    this.onChange(ftuxState$.currentStep, async (change) => {
      await this.persistCurrentStep(change.value);
    });

    return BR_TRUE;
  }

  // Private methods to persist state changes
  private async persistHasCompletedIntro(value: boolean): Promise<void> {
    if (!this._localStorageService) {
      console.error('FtuxService.persistHasCompletedIntro: _localStorageService is null or undefined');
      return;
    }
    
    const result = await this._localStorageService.setItem(INTRO_COMPLETED_KEY, value.toString());
    
    if (result.isErr()) {
      console.error('FtuxService.persistHasCompletedIntro: Failed to persist to localStorage:', result.error);
    }
  }

  private async persistHasCompletedFTUX(value: boolean): Promise<void> {
    if (!this._localStorageService) {
      console.error('FtuxService.persistHasCompletedFTUX: _localStorageService is null or undefined');
      return;
    }
    
    const result = await this._localStorageService.setItem(FTUX_FLOW_COMPLETED_KEY, value.toString());
    
    if (result.isErr()) {
      console.error('FtuxService.persistHasCompletedFTUX: Failed to persist to localStorage:', result.error);
    }
  }

  private async persistCurrentStep(value: number): Promise<void> {
    if (!this._localStorageService) {
      console.error('FtuxService.persistCurrentStep: _localStorageService is null or undefined');
      return;
    }
    
    const result = await this._localStorageService.setItem(FTUX_CURRENT_STEP_KEY, value.toString());
    
    if (result.isErr()) {
      console.error('FtuxService.persistCurrentStep: Failed to persist to localStorage:', result.error);
    } else {
      emitChange(ChangeType.FTUX, { currentStep: value });
    }
  }

  // Public methods implementing IFtuxService
  public isIntroCompleted(): boolean {
    return ftuxState$.hasCompletedIntro.get();
  }

  public isFtuxCompleted(): boolean {
    return ftuxState$.hasCompletedFTUX.get();
  }

  public getCurrentStep(): number {
    return ftuxState$.currentStep.get();
  }

  public async setIntroCompleted(value: boolean): Promise<Result<boolean, Error>> {
    try {
      if(value === ftuxState$.hasCompletedIntro.peek()) { 
        await this.persistHasCompletedIntro(value);
        return ok(true);
      }

      // Local storage is authoritative for has_completed_intro
      ftuxState$.hasCompletedIntro.set(value);
      
      // Directly call persistHasCompletedIntro instead of relying on the observable change handler
      await this.persistHasCompletedIntro(value);
      
      // When intro is started, configure model change types for FTUX mode
      if (value) {
        configureFtuxChangeTypes();
      }
      
      // Sync with user profile if authenticated
      const isAuthenticated = await this._authService.isAuthenticated();
      
      if (isAuthenticated) {
        const userProfile = getUserProfile();
        if (userProfile) {
          updateUserProfile({
            has_completed_intro: value
          });
          
          // Sync with Supabase
          await this._dataService.updateData('user_profiles', {
            id: userProfile.id,
            has_completed_intro: value
          });
        }
      }
      
      emitChange(ChangeType.FTUX, { 
        hasCompletedIntro: value,
        source: 'ftux'  // Add source to prevent infinite sync loop
      });
      
      return ok(true);
    } catch (error) {
      console.error(`FtuxService.setIntroCompleted: failed with error:`, error);
      return err(error instanceof Error ? error : new Error('Failed to set intro completed'));
    }
  }

  public async setFtuxCompleted(value: boolean): Promise<Result<boolean, Error>> {
    try {
      if(value === ftuxState$.hasCompletedFTUX.peek()) { return ok(true) }

      // Server is authoritative for has_completed_ftux, but we still need to update local
      // state immediately for UI responsiveness
      ftuxState$.hasCompletedFTUX.set(value);
      await this.persistHasCompletedFTUX(value);
      
      // When FTUX is completed, configure model change types for normal mode
      if (value) {
        configureNormalChangeTypes();
      }
      
      // Sync with user profile if authenticated
      const isAuthenticated = await this._authService.isAuthenticated();
      
      if (isAuthenticated) {
        const userProfile = getUserProfile();
        if (userProfile) {
          updateUserProfile({
            has_completed_ftux: value
          });
          
          // Sync with Supabase
          await this._dataService.updateData('user_profiles', {
            id: userProfile.id,
            has_completed_ftux: value
          });
        }
      }
      
      emitChange(ChangeType.FTUX, { 
        hasCompletedFTUX: value,
        source: 'ftux'  // Add source to prevent infinite sync loop
      });
      return ok(true);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to set FTUX completed'));
    }
  }

  public async setCurrentStep(step: number): Promise<Result<boolean, Error>> {
    try {
      if(step === ftuxState$.currentStep.peek()) { return ok(true) }
      
      // Server is authoritative for ftux_current_step, but we still need to update local
      // state immediately for UI responsiveness
      ftuxState$.currentStep.set(step);
      await this.persistCurrentStep(step);
      
      // Sync with user profile if authenticated
      const isAuthenticated = await this._authService.isAuthenticated();
      
      if (isAuthenticated) {
        const userProfile = getUserProfile();
        if (userProfile) {
          updateUserProfile({
            ftux_current_step: step
          });
          
          // Sync with Supabase
          await this._dataService.updateData('user_profiles', {
            id: userProfile.id,
            ftux_current_step: step
          });
        }
      }
      
      return ok(true);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to set current step'));
    }
  }
} 