import { observable } from "@legendapp/state";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { RelationshipDetails, addRelationshipDetails, relationshipDetails$, removeRelationshipDetails } from "@src/models/RelationshipDetailsModel";
import { UserInnerCircleService } from "@src/services/UserInnerCircleService";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { Result, err, ok } from "neverthrow";
import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { RelationshipType } from "@src/constants/relationshipTypes";

@injectable()
export class RelationshipDetailsViewModel extends ViewModel {
    public readonly relationshipDetails$ = relationshipDetails$;
    public readonly currentRelationshipType$ = observable<RelationshipType>('Spouse');
    public readonly currentName$ = observable<string>('');

    public readonly isValid$ = observable(() =>
        this.currentName$.get().trim().length > 0
    );

    private readonly _innerCircleService: UserInnerCircleService;

    constructor() {
        super('RelationshipDetailsViewModel');
        this._innerCircleService = this.addDependency(UserInnerCircleService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public addRelationship(): void {
        const details: RelationshipDetails = {
            relationshipType: this.currentRelationshipType$.get(),
            name: this.currentName$.get().trim()
        };
        addRelationshipDetails(details);
        this.resetForm();
    }

    public removeRelationship(index: number): void {
        console.log("Remove:" + index);
        removeRelationshipDetails(index);
    }

    public async convertToInnerCircle(): Promise<Result<boolean, Error>> {
        try {
            const relationships = this.relationshipDetails$.peek();

            for (const relationship of relationships) {
                const result = await this._innerCircleService.createInnerCircleMember(
                    relationship.name,
                    relationship.relationshipType
                );

                if (result.isErr()) {
                    return err(result.error);
                }
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error("Failed to convert relationships to inner circle"));
        }
    }

    private resetForm(): void {
        this.currentRelationshipType$.set('Spouse');
        this.currentName$.set('');
    }
}