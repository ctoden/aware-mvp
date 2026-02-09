import { DependencyService } from "@src/core/injection/DependencyService";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import { UserMainInterestService } from "../UserMainInterestService";
import { userMainInterests$ } from "@src/models/UserMainInterest";
import { user$ } from "@src/models/SessionModel";

describe('UserMainInterestService', () => {
    let userMainInterestService: UserMainInterestService;
    let testDataProvider: TestDataProvider;

    const mockUserId = 'test-user-id';
    const mockUser = {
        id: mockUserId,
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: 'test@example.com',
        phone: '',
        role: 'authenticated',
        confirmation_sent_at: undefined,
        confirmed_at: undefined,
        recovery_sent_at: undefined,
        email_confirmed_at: undefined,
        email_change_sent_at: undefined,
        last_sign_in_at: undefined,
        banned_until: undefined,
        reauthentication_sent_at: undefined,
        identities: undefined
    };

    beforeEach(async () => {
        // Reset observables
        userMainInterests$.set(null);
        user$.set(null);

        // Setup test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Initialize the service
        userMainInterestService = new UserMainInterestService();
        await userMainInterestService.initialize();
    });

    it('should initialize successfully', () => {
        expect(userMainInterestService).toBeDefined();
    });

    it('should create a new interest', async () => {
        // Setup
        user$.set(mockUser);
        const mockInterest = {
            interest: 'Technology',
            user_id: mockUserId
        };

        // Execute
        const result = await userMainInterestService.createUserMainInterest(mockInterest);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.interest).toBe(mockInterest.interest);
            expect(result.value.user_id).toBe(mockUserId);
        }
    });

    it('should fetch user interests', async () => {
        testDataProvider.clearTestData();
        // Setup
        const mockInterests = [
            {
                id: '1',
                user_id: mockUserId,
                interest: 'Technology',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        await testDataProvider.upsertData('user_main_interests', mockInterests);

        // Execute
        const result = await userMainInterestService.fetchUserMainInterests(mockUserId);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(1);
            expect(result.value[0].interest).toBe(mockInterests[0].interest);
        }
    });

    it('should delete interest', async () => {
        testDataProvider.clearTestData();
        // Setup
        user$.set(mockUser);
        const mockInterest = {
            interest: 'Technology',
            user_id: mockUserId
        };
        const createResult = await userMainInterestService.createUserMainInterest(mockInterest);
        expect(createResult.isOk()).toBe(true);
        if (!createResult.isOk()) return;

        // Execute
        const result = await userMainInterestService.deleteUserMainInterest(createResult.value.id);

        // Assert
        expect(result.isOk()).toBe(true);
        const interests = userMainInterests$.peek();
        expect(interests).toEqual({});
    });
}); 