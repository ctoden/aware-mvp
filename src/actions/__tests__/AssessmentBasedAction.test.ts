import {ok, err, Result} from "neverthrow";
import { AssessmentBasedAction } from "../AssessmentBasedAction";
import { UserAssessment } from "@src/models/UserAssessment";
import { user$ } from "@src/models/SessionModel";
import { userProfile$ } from "@src/models/UserProfile";
import { UserModel } from "@src/models/UserModel";

// Test implementation of AssessmentBasedAction
class TestAction extends AssessmentBasedAction<boolean> {
    name = "TestAction";
    description = "Test Action Description";

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        return ok(true);
    }
}

describe("AssessmentBasedAction", () => {
    let action: TestAction;

    const mockUser: UserModel = {
        id: 'test-user-id',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'test@example.com',
        phone: '',
        role: 'authenticated',
        updated_at: new Date().toISOString()
    };

    beforeEach(() => {
        action = new TestAction();
        // Reset global state
        user$.set(mockUser);
        userProfile$.updated_at.set("2024-01-01T00:00:00Z");
    });

    it("should return error when no arguments provided", async () => {
        const result = await action.execute();
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe("Invalid arguments: userAssessments is required");
    });

    it("should return error when user is not logged in", async () => {
        user$.set(null);
        const result = await action.execute([]);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe("User not logged in");
    });

    it("should return ok(true) when assessments array is empty", async () => {
        const result = await action.execute([]);
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBe(true);
    });

    it("should process only newer assessments", async () => {
        const assessments: UserAssessment[] = [
            { 
                id: "1", 
                updated_at: "2024-01-02T00:00:00Z",
                user_id: mockUser.id,
                assessment_type: "test",
                name: "Test Assessment",
                assessment_full_text: null,
                assessment_summary: null,
                created_at: null
            },
            { 
                id: "2", 
                updated_at: "2023-12-31T00:00:00Z",
                user_id: mockUser.id,
                assessment_type: "test",
                name: "Test Assessment",
                assessment_full_text: null,
                assessment_summary: null,
                created_at: null
            },
            { 
                id: "3", 
                updated_at: "2024-01-03T00:00:00Z",
                user_id: mockUser.id,
                assessment_type: "test",
                name: "Test Assessment",
                assessment_full_text: null,
                assessment_summary: null,
                created_at: null
            }
        ];

        const processSpy = jest.spyOn(action as any, "processAssessments");
        const result = await action.execute(assessments);

        expect(result.isOk()).toBe(true);
        expect(processSpy).toHaveBeenCalledWith([
            assessments[0],
            assessments[2]
        ]);
    });

    it("should handle invalid timestamp comparison gracefully", async () => {
        const assessments: UserAssessment[] = [
            { 
                id: "1", 
                updated_at: "invalid-date",
                user_id: mockUser.id,
                assessment_type: "test",
                name: "Test Assessment",
                assessment_full_text: null,
                assessment_summary: null,
                created_at: null
            }
        ];

        const result = await action.execute(assessments);
        expect(result.isOk()).toBe(true);
    });
});