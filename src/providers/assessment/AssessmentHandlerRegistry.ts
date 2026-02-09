import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { IAssessmentHandler } from "./AssessmentHandler";

@singleton()
export class AssessmentHandlerRegistry extends ObservableLifecycleManager {
    private handlers: Map<string, IAssessmentHandler> = new Map();
    name = 'AssessmentHandlerRegistry';

    constructor() {
        super();
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.handlers.clear();
        return BR_TRUE;
    }

    registerHandler(handler: IAssessmentHandler): void {
        this.handlers.set(handler.assessmentType.toLowerCase(), handler);
    }

    getHandler(assessmentType: string): Result<IAssessmentHandler, Error> {
        const handler = this.handlers.get(assessmentType.toLowerCase());
        if (!handler) {
            return err(new Error(`No handler found for assessment type: ${assessmentType}`));
        }
        return ok(handler);
    }

    getSupportedTypes(): string[] {
        return Array.from(this.handlers.keys());
    }
} 