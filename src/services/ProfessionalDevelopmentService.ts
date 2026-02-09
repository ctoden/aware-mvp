import { GenerateAndSaveProfessionalDevelopmentAction } from "@src/actions/professionalDevelopment/GenerateAndSaveProfessionalDevelopmentAction";
import { ProfessionalDevelopmentAuthChangeAction } from "@src/actions/professionalDevelopment/ProfessionalDevelopmentAuthChangeAction";
import { ProfessionalDevelopmentOnUserAssessmentChangeAction } from "@src/actions/professionalDevelopment/ProfessionalDevelopmentOnUserAssessmentChangeAction";
import { IProfessionalDevelopmentService } from "@src/actions/professionalDevelopment/IProfessionalDevelopmentService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { clearProfessionalDevelopment, ProfessionalDevelopment, professionalDevelopment$, setProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { DataService } from "./DataService";
import { GenerateDataService } from "@src/services/GenerateDataService";
import { LlmService } from "./LlmService";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";

@singleton()
export class ProfessionalDevelopmentService extends EventAwareService implements IProfessionalDevelopmentService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;
    private readonly _llmService!: LlmService;
    private readonly TABLE_NAME = 'user_professional_development';

    constructor() {
        super('ProfessionalDevelopmentService', []);
        this._dataService = this.addDependency(DataService);
        this._generateDataService = this.addDependency(GenerateDataService);
        this._llmService = this.addDependency(LlmService);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {

    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._generateDataService.registerActions(ChangeType.LOGIN, [
            new ProfessionalDevelopmentAuthChangeAction(this)
        ]);
        
        this._generateDataService.registerActions(ChangeType.USER_ASSESSMENT, [
            new ProfessionalDevelopmentOnUserAssessmentChangeAction(this)
        ]);

        this._generateDataService.registerActions(ChangeType.USER_PROFILE_GENERATE_SUMMARY, [
            new GenerateAndSaveProfessionalDevelopmentAction(this._llmService.llmProvider!, this)
        ]);

        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        clearProfessionalDevelopment();
        return ok(true);
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    async fetchProfessionalDevelopment(userId: string): Promise<Result<ProfessionalDevelopment, Error>> {
        try {
            const result = await this._dataService.fetchData<ProfessionalDevelopment>(this.TABLE_NAME, {
                filter: [{ field: 'user_id', value: userId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            if (result.value.length === 0) {
                console.warn('Professional development not found');
                return ok({} as ProfessionalDevelopment);
            }

            setProfessionalDevelopment(result.value[0]);
            return ok(result.value[0]);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch professional development'));
        }
    }

    async createProfessionalDevelopment(value: Partial<ProfessionalDevelopment>): Promise<Result<ProfessionalDevelopment, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newProfessionalDevelopment: ProfessionalDevelopment = {
            id: generateUUID(),
            user_id: userId,
            key_terms: value.key_terms || [],
            description: value.description || '',
            leadership_style_title: value.leadership_style_title || '',
            leadership_style_description: value.leadership_style_description || '',
            goal_setting_style_title: value.goal_setting_style_title || '',
            goal_setting_style_description: value.goal_setting_style_description || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.upsertData<ProfessionalDevelopment>(this.TABLE_NAME, [newProfessionalDevelopment]);
            if (result.isErr()) {
                return err(result.error);
            }

            setProfessionalDevelopment(newProfessionalDevelopment);
            return ok(newProfessionalDevelopment);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create professional development'));
        }
    }

    async updateProfessionalDevelopment(updates: Partial<ProfessionalDevelopment>): Promise<Result<ProfessionalDevelopment, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const current = professionalDevelopment$.peek();
        if (!current) {
            return err(new Error('Professional development not found'));
        }

        const updatedValue: ProfessionalDevelopment = {
            ...current,
            ...updates,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.updateData<ProfessionalDevelopment>(this.TABLE_NAME, updatedValue);
            if (result.isErr()) {
                return err(result.error);
            }

            setProfessionalDevelopment(updatedValue);
            return ok(updatedValue);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to update professional development'));
        }
    }

    async clearProfessionalDevelopment(): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('User not authenticated'));
        }

        try {
            // Delete from database first
            const deleteResult = await this._dataService.deleteData(this.TABLE_NAME, {
                filter: [{ field: 'user_id', value: userId }]
            });
            
            if (deleteResult.isErr()) {
                return err(deleteResult.error);
            }
            
            // Only clear local state after successful database deletion
            clearProfessionalDevelopment();
            

            
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to clear professional development'));
        }
    }
} 