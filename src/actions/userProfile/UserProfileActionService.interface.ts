import { Result } from "neverthrow";
import { UserProfile } from "@src/models/UserProfile";
import { UserAssessment } from "@src/models/UserAssessment";

export const USER_PROFILE_ACTION_SERVICE_DI_KEY = "UserProfileActionService";

export interface UserProfileActionService {
    fetchProfile(userId: string): Promise<Result<UserProfile | null, Error>>;
    updateProfileSummary(assessments: UserAssessment[]): Promise<Result<boolean, Error>>;
    checkAndRefreshProfile(forceRefresh?: boolean): Promise<Result<boolean, Error>>;
    setRefreshProfileTimestamp(): Promise<Result<boolean, Error>>;
}