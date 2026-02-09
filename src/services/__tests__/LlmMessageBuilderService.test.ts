import { LlmMessageBuilderService } from "../LlmMessageBuilderService";
import { AwareBotPrompt } from "@src/prompts/AwareBotPrompt";
import { CoreValueType } from "@src/models/UserCoreValue";
import { WeaknessType } from "@src/models/UserWeakness";

describe('LlmMessageBuilderService', () => {
    let service: LlmMessageBuilderService;

    beforeEach(() => {
        service = new LlmMessageBuilderService();
    });

    it('should create context messages with all data', () => {
        const result = service.createContextMessages({
            assessments: [{
                id: '1',
                user_id: 'user1',
                assessment_type: 'personality',
                assessment_summary: 'Very extroverted',
                assessment_full_text: 'Full assessment text',
                name: 'Personality Assessment',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            },
            {
                id: '2',
                user_id: 'user1',
                assessment_type: 'MBTI',
                assessment_summary: 'ENTJ - The Commander',
                assessment_full_text: 'You are an ENTJ personality type. As a natural born leader, you have a strong drive to organize and direct others. You are decisive, strategic and excel at logical reasoning. Your combination of Extroversion (E), Intuition (N), Thinking (T), and Judging (J) makes you particularly adept at seeing the big picture while also being able to create and execute detailed plans.',
                name: 'Myers-Briggs Type Indicator',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }
            ],
            coreValues: [{
                id: '1',
                user_id: 'user1',
                title: 'Honesty',
                description: 'Being truthful',
                value_type: CoreValueType.SYSTEM_GENERATED,
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }],
            innerCircle: [{
                id: '1',
                user_id: 'user1',
                name: 'John',
                relationship_type: 'Friend',
                created_at: new Date(),
                updated_at: new Date()
            }],
            mainInterests: [{
                id: '1',
                user_id: 'user1',
                interest: 'Programming',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }],
            professionalDevelopment: {
                id: '1',
                user_id: 'user1',
                key_terms: ['Leadership', 'Communication'],
                description: 'Professional development description',
                leadership_style_title: 'Democratic Leader',
                leadership_style_description: 'Leadership style description',
                goal_setting_style_title: 'SMART Goals',
                goal_setting_style_description: 'Goal setting style description',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            },
            longTermGoals: [{
                id: '1',
                user_id: 'user1',
                goal: 'Become a tech lead',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }],
            shortTermGoals: [{
                id: '1',
                user_id: 'user1',
                goal: 'Learn TypeScript',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }],
            weaknesses: [{
                id: '1',
                user_id: 'user1',
                title: 'Public Speaking',
                description: 'Need to improve public speaking',
                weakness_type: WeaknessType.SYSTEM_GENERATED,
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }]
        });

        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
            const messages = result.value;
            expect(messages).toHaveLength(2);
            expect(messages[0]).toEqual({
                role: 'system',
                content: AwareBotPrompt
            });

            const userMessage = messages[1];
            expect(userMessage.role).toBe('user');
            expect(userMessage.content).toContain('This is the background for the user');
            expect(userMessage.content).toContain('personality: Very extroverted');
            expect(userMessage.content).toContain('MBTI: ENTJ - The Commander');
            expect(userMessage.content).toContain('Honesty');
            expect(userMessage.content).toContain('Friend: John');
            expect(userMessage.content).toContain('Programming');
            expect(userMessage.content).toContain('Key Terms: Leadership, Communication');
            expect(userMessage.content).toContain('Democratic Leader');
            expect(userMessage.content).toContain('SMART Goals');
            expect(userMessage.content).toContain('Become a tech lead');
            expect(userMessage.content).toContain('Learn TypeScript');
            expect(userMessage.content).toContain('Public Speaking');
        }
    });

    it('should handle empty data', () => {
        const result = service.createContextMessages({
            assessments: [],
            coreValues: [],
            innerCircle: [],
            mainInterests: [],
            professionalDevelopment: null,
            longTermGoals: [],
            shortTermGoals: [],
            weaknesses: []
        });

        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
            const messages = result.value;
            expect(messages).toHaveLength(2);
            expect(messages[0].content).toBe(AwareBotPrompt);
            expect(messages[1].content).toContain('This is the background for the user');
        }
    });

    it('should handle errors gracefully', () => {
        // @ts-ignore - Testing with invalid data
        const result = service.createContextMessages(null);

        expect(result.isErr()).toBe(true);
    });
}); 