import {container} from "tsyringe";
import {UserInnerCircleViewModel} from "../UserInnerCircleViewModel";
import {userInnerCircle$} from "@src/models/UserInnerCircle";
import {TestDataProvider} from '@src/providers/data/__tests__/TestDataProvider';
import {DependencyService} from '@src/core/injection/DependencyService';
import {DATA_PROVIDER_KEY} from '@src/providers/data/DataProvider';
import {DataService} from '@src/services/DataService';
import {user$} from '@src/models/SessionModel';

describe("UserInnerCircleViewModel", () => {
    let viewModel: UserInnerCircleViewModel;
    let testDataProvider: TestDataProvider;
    let dataService: DataService;
    const testUserId = "test-user-id";

    beforeEach(async () => {
        container.clearInstances();
        
        // Create and initialize the test provider
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        
        // Register the test provider
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        
        // Create and initialize the data service
        dataService = new DataService();
        await dataService.initialize();
        
        // Create and initialize the view model
        viewModel = DependencyService.resolve(UserInnerCircleViewModel);

        // Set up test user
        user$.set({
            id: testUserId,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
        });

        userInnerCircle$.set([]);
        testDataProvider.clearTestData();
    });

    afterEach(async () => {
        await dataService.end();
        await testDataProvider.end();
        user$.set(null);
        userInnerCircle$.set([]);
        container.clearInstances();
    });

    describe("initialization", () => {
        it("should fail to initialize without userId", async () => {
            const result = await viewModel.onInitialize({});
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe("User ID is required");
            }
        });

        it("should initialize with userId", async () => {
            const mockMembers = [
                {
                    id: '1',
                    user_id: testUserId,
                    name: 'John Doe',
                    relationship_type: 'friend',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            testDataProvider.setTestData('user_inner_circle', mockMembers);

            const result = await viewModel.onInitialize({ userId: testUserId });
            expect(result.isOk()).toBe(true);
            const members = userInnerCircle$.peek();
            expect(members).toHaveLength(1);
            expect(members[0].name).toBe('John Doe');
        });
    });

    describe("addMember", () => {
        it("should not add member with empty name", async () => {
            viewModel.newMemberName$.set("");
            viewModel.newMemberRelationType$.set("friend");

            const result = await viewModel.addMember();
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe("Name and relationship type are required");
            }
            expect(userInnerCircle$.peek()).toHaveLength(0);
        });

        it("should not add member with empty relationship type", async () => {
            viewModel.newMemberName$.set("John Doe");
            viewModel.newMemberRelationType$.set("");

            const result = await viewModel.addMember();
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe("Name and relationship type are required");
            }
            expect(userInnerCircle$.peek()).toHaveLength(0);
        });

        it("should add member successfully", async () => {
            viewModel.newMemberName$.set("John Doe");
            viewModel.newMemberRelationType$.set("friend");

            const result = await viewModel.addMember();
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.name).toBe("John Doe");
                expect(result.value.relationship_type).toBe("friend");
                expect(result.value.user_id).toBe(testUserId);
            }
            const members = userInnerCircle$.peek();
            expect(members).toHaveLength(1);
            expect(viewModel.newMemberName$.get()).toBe("");
            expect(viewModel.newMemberRelationType$.get()).toBe("");
        });
    });

    describe("updateMember", () => {
        it("should update member successfully", async () => {
            // First add a member
            viewModel.newMemberName$.set("John Doe");
            viewModel.newMemberRelationType$.set("friend");
            const addResult = await viewModel.addMember();
            expect(addResult.isOk()).toBe(true);

            if (addResult.isOk()) {
                const memberId = addResult.value.id;
                const updateResult = await viewModel.updateMember(memberId, {
                    name: "Jane Doe",
                    relationship_type: "family"
                });

                expect(updateResult.isOk()).toBe(true);
                if (updateResult.isOk()) {
                    expect(updateResult.value.name).toBe("Jane Doe");
                    expect(updateResult.value.relationship_type).toBe("family");
                }
                const members = userInnerCircle$.peek();
                expect(members).toHaveLength(1);
                expect(members[0].name).toBe("Jane Doe");
            }
        });

        it("should fail to update non-existent member", async () => {
            const result = await viewModel.updateMember("non-existent-id", {
                name: "Jane Doe"
            });

            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe("Member not found");
            }
        });
    });

    describe("removeMember", () => {
        it("should remove member successfully", async () => {
            // First add a member
            viewModel.newMemberName$.set("John Doe");
            viewModel.newMemberRelationType$.set("friend");
            const addResult = await viewModel.addMember();
            expect(addResult.isOk()).toBe(true);

            if (addResult.isOk()) {
                const memberId = addResult.value.id;
                const removeResult = await viewModel.removeMember(memberId);
                expect(removeResult.isOk()).toBe(true);
                expect(userInnerCircle$.peek()).toHaveLength(0);
            }
        });

        it("should fail to remove non-existent member", async () => {
            const result = await viewModel.removeMember("non-existent-id");
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe("Member not found");
            }
        });
    });
}); 