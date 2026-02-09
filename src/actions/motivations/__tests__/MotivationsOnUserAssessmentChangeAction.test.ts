import { DependencyService } from "@src/core/injection/DependencyService";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { MotivationsOnUserAssessmentChangeAction } from "../MotivationsOnUserAssessmentChangeAction";
import { UserAssessment } from "@src/models/UserAssessment";
import { MotivationType, UserMotivation } from "@src/models/UserMotivation";

describe('MotivationsOnUserAssessmentChangeAction', () => {
    let testLlmProvider: TestLlmProvider;
    let mockMotivationsService: {
        clearMotivations: jest.Mock;
        createMotivation: jest.Mock;
    };
    let action: MotivationsOnUserAssessmentChangeAction;

    beforeEach(() => {
        // Setup test LLM provider
        testLlmProvider = TestLlmProvider.getInstance();
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Setup mock motivations service
        mockMotivationsService = {
            clearMotivations: jest.fn().mockResolvedValue({ isOk: () => true }),
            createMotivation: jest.fn().mockImplementation((value) => {
                const motivation: UserMotivation = {
                    id: 'test-id',
                    user_id: 'test-user',
                    title: value.title,
                    description: value.description,
                    motivation_type: MotivationType.SYSTEM_GENERATED,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                return Promise.resolve({ isOk: () => true, value: motivation });
            })
        };

        action = new MotivationsOnUserAssessmentChangeAction(mockMotivationsService);
    });

    afterEach(() => {
        testLlmProvider.clearMockResponses();
        jest.clearAllMocks();
    });

    it('should process assessments and create motivations', async () => {
        // Setup
        const mockAssessments: UserAssessment[] = [
            {
                id: '1',
                user_id: 'test-user',
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        const mockLlmResponse = JSON.stringify([
            {
                title: 'Creative Expression',
                description: 'Driven by the desire to bring innovative ideas to life.'
            },
            {
                title: 'Achievement',
                description: 'Motivated by setting and reaching ambitious goals.'
            },
            {
                title: 'Personal Growth',
                description: 'Energized by continuous learning and self-improvement.'
            }
        ]);

        testLlmProvider.setMockResponse('User Profile and Assessment Context: PERSONALITY: User is creative and ambitious.', mockLlmResponse);

        // Execute
        const result = await action.execute(mockAssessments);

        // Assert
        expect(result.isOk()).toBe(true);
        expect(mockMotivationsService.clearMotivations).toHaveBeenCalledTimes(1);
        expect(mockMotivationsService.createMotivation).toHaveBeenCalledTimes(3);
        expect(mockMotivationsService.createMotivation).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Creative Expression',
                description: 'Driven by the desire to bring innovative ideas to life.'
            })
        );
    });

    it('should handle empty assessments', async () => {
        // Execute
        const result = await action.execute([]);

        // Assert
        expect(result.isOk()).toBe(true);
        expect(mockMotivationsService.clearMotivations).not.toHaveBeenCalled();
        expect(mockMotivationsService.createMotivation).not.toHaveBeenCalled();
    });

    it('should handle LLM error', async () => {
        // Setup
        const mockAssessments: UserAssessment[] = [
            {
                id: '1',
                user_id: 'test-user',
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        testLlmProvider.setShouldFailInit(true);

        // Execute
        const result = await action.execute(mockAssessments);

        // Assert
        expect(result.isErr()).toBe(true);
        expect(mockMotivationsService.clearMotivations).not.toHaveBeenCalled();
        expect(mockMotivationsService.createMotivation).not.toHaveBeenCalled();
    });

    it('should handle clearMotivations error', async () => {
        // Setup
        mockMotivationsService.clearMotivations.mockResolvedValue({ isOk: () => false, error: new Error('Failed to clear') });
        const mockAssessments: UserAssessment[] = [
            {
                id: '1',
                user_id: 'test-user',
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        const mockLlmResponse = JSON.stringify([
            {
                title: 'Creative Expression',
                description: 'Driven by the desire to bring innovative ideas to life.'
            },
            {
                title: 'Achievement',
                description: 'Motivated by setting and reaching ambitious goals.'
            },
            {
                title: 'Personal Growth',
                description: 'Energized by continuous learning and self-improvement.'
            }
        ]);

        testLlmProvider.setMockResponse('User Profile and Assessment Context: PERSONALITY: User is creative and ambitious.', mockLlmResponse);

        // Execute
        const result = await action.execute(mockAssessments);

        // Assert
        expect(result.isErr()).toBe(true);
        expect(mockMotivationsService.clearMotivations).toHaveBeenCalledTimes(1);
        expect(mockMotivationsService.createMotivation).not.toHaveBeenCalled();
    });

    it('should handle createMotivation error', async () => {
        // Setup
        mockMotivationsService.createMotivation.mockResolvedValue({ isOk: () => false, error: new Error('Failed to create') });
        const mockAssessments: UserAssessment[] = [
            {
                id: '1',
                user_id: 'test-user',
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        const mockLlmResponse = JSON.stringify([
            {
                title: 'Creative Expression',
                description: 'Driven by the desire to bring innovative ideas to life.'
            },
            {
                title: 'Achievement',
                description: 'Motivated by setting and reaching ambitious goals.'
            },
            {
                title: 'Personal Growth',
                description: 'Energized by continuous learning and self-improvement.'
            }
        ]);

        testLlmProvider.setMockResponse('User Profile and Assessment Context: PERSONALITY: User is creative and ambitious.', mockLlmResponse);

        // Execute
        const result = await action.execute(mockAssessments);

        // Assert
        expect(result.isErr()).toBe(true);
        expect(mockMotivationsService.clearMotivations).toHaveBeenCalledTimes(1);
        expect(mockMotivationsService.createMotivation).toHaveBeenCalledTimes(1);
    });
}); 