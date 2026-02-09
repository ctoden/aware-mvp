import { err, ok, Result } from "neverthrow";
import { Action } from "./Action";
import {UserAssessment, userAssessments$} from "@src/models/UserAssessment";
import { user$ } from "@src/models/SessionModel";
import { userProfile$ } from "@src/models/UserProfile";
import { compareTimestamps } from "@src/utils/TimestampUtils";
import { isEmpty } from "lodash";

export type DoWithUserAssessments<T> = (assessments: UserAssessment[]) => Promise<Result<T, Error>>;

export async function doWithUserAssessments<T>(action: DoWithUserAssessments<T>, forceAll = false): Promise<Result<T, Error>> {
    const userAssessments = userAssessments$.peek();

    let newAssessmentCount = 0;
    let relevantAssessments: UserAssessment[] = [];

    userAssessments.forEach(assessment => {
        const profileUpdatedAt = userProfile$.updated_at?.get() ?? new Date().toISOString();
        const result = compareTimestamps(assessment.updated_at, profileUpdatedAt);
        if (result.isOk()) {
            const comparison = result._unsafeUnwrap();
            if (comparison > 0 || forceAll) {
                // assessment is newer
                newAssessmentCount++;
                relevantAssessments.push(assessment);
            }
        }
    });

    return action(relevantAssessments);
}

export abstract class AssessmentBasedAction<T> implements Action<T> {
    abstract name: string;
    abstract description: string;

    protected abstract processAssessments(assessments: UserAssessment[]): Promise<Result<T, Error>>;

    async execute<U = T>(...args: any[]): Promise<Result<U, Error>> {

        const forceAll = args.length > 1 && typeof args[1] === 'boolean' ? args[1] : false;
        return doWithUserAssessments<U>((assessments) => 
            this.processAssessments(Array.isArray(args[0]) ? args[0] : assessments) as unknown as Promise<Result<U, Error>>,
            forceAll
        );
    }
} 