import { observable } from "@legendapp/state";
import { careerJourneyEntries$, addCareerJourneyEntry, updateCareerJourneyEntry, removeCareerJourneyEntry } from "@src/models/CareerJourneyModel";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, err } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { CareerHistoryService } from "@src/services/CareerHistoryService";

@injectable()
export class CareerJourneyViewModel extends ViewModel {
    private readonly _careerHistoryService!: CareerHistoryService;
    public readonly entries$ = careerJourneyEntries$;
    
    public readonly isValid$ = observable(() => 
        this.entries$.get().length > 0 && 
        this.entries$.get().every(entry => entry.journey.trim().length > 0)
    );

    constructor() {
        super('CareerJourneyViewModel');
        this._careerHistoryService = this.addDependency(CareerHistoryService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public addEntry(): void {
        addCareerJourneyEntry();
    }

    public updateEntry(id: string, journey: string): void {
        updateCareerJourneyEntry(id, journey);
    }

    public removeEntry(id: string): void {
        removeCareerJourneyEntry(id);
    }

    public async saveEntries(): Promise<Result<boolean, Error>> {
        const entries = this.entries$.get();
        
        // Save each entry using the career history service
        for (const entry of entries) {
            const result = await this._careerHistoryService.createCareerHistoryEntry(entry.journey);
            if (result.isErr()) {
                return err(result.error);
            }
        }

        return BR_TRUE;
    }
} 