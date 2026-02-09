import { DependencyService } from '@src/core/injection/DependencyService';
import { get } from "lodash";
import { z } from "zod";
import { LLM_PROVIDER_KEY, LlmMessage } from '../LlmProvider';
import { OpenAiLlmProvider } from '../OpenAiLlmProvider';
import {WeaknessType} from "@src/models/UserWeakness";
import {CoreValueType} from "@src/models/UserCoreValue";
import {LlmMessageBuilderService} from "@src/services/LlmMessageBuilderService";
import { ok, Result } from 'neverthrow';

const rawImageData = "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII="
const imageData = "data:image/png;base64," + rawImageData;

function getAwareBotContext() {
    return {
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
    };
}

describe('OpenAiLlmProvider', () => {
    let provider: OpenAiLlmProvider;
    let apiKeyFromTestEnv: string;
    beforeAll(()=> {
        // KEEP THIS - jest messes up the process.env and the process.env.EXPO_PUBLIC_OPENAI_API_KEY is undefined
        apiKeyFromTestEnv = get(global, 'test.env.EXPO_PUBLIC_OPENAI_API_KEY') as unknown as string;
    });

    beforeEach(() => {
        // Create provider instance
        DependencyService.registerValue("OPENAI_API_KEY", apiKeyFromTestEnv);
        DependencyService.registerValue("OPENAI_DEFAULT_MODEL", "gpt-4o-mini");
        provider = new OpenAiLlmProvider();
    });

    afterEach(async () => {
        await provider.end();
    });

    afterAll(()=> {
        delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        DependencyService.unregister('OPENAI_API_KEY');
        DependencyService.unregister('OPENAI_DEFAULT_MODEL');
        DependencyService.unregister(LLM_PROVIDER_KEY);
    })

    describe('Initialization', () => {
        it('should initialize successfully with API key from environment', async () => {
            const result = await provider.initialize();
            expect(result.isOk()).toBe(true);
        });

        it('should initialize successfully with API key from dependency service', async () => {
            delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
            DependencyService.registerValue('OPENAI_API_KEY', apiKeyFromTestEnv);

            const result = await provider.initialize();
            expect(result.isOk()).toBe(true);
        });

        it.skip('should fail initialization without API key', async () => {
            delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
            DependencyService.unregister('OPENAI_API_KEY');

            const result = await provider.initialize();
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('OPENAI_API_KEY is not defined');
            }
        });
    });

    describe('Model Configuration', () => {
        it('should return default model configuration', () => {
            const defaultModel = provider.getDefaultModel();
            expect(defaultModel.modelName).toBeDefined();
            expect(defaultModel.temperature).toBeDefined();
            expect(defaultModel.maxTokens).toBeDefined();
        });

        it('should use custom model name from dependency service', () => {
            const customModel = 'gpt-4o-mini';
            DependencyService.registerValue('OPENAI_DEFAULT_MODEL', customModel);

            provider.updateDefaultModel();

            const defaultModel = provider.getDefaultModel();
            expect(defaultModel.modelName).toBe(customModel);
        });

        it('should return available models', () => {
            const models = provider.getAvailableModels();
            expect(models).toContain('gpt-4o');
            expect(models).toContain('gpt-4o-mini');
            expect(models).toContain('gpt-4-turbo');
        });
    });

    describe('Chat', () => {
        beforeEach(async () => {
            await provider.initialize();
            provider.updateDefaultModel({
                modelName: 'gpt-4o',
                temperature: 0.1,
                maxTokens: 4098
            })
        });

        it('should generate chat response', async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const messages: LlmMessage[] = [
                { role: 'user', content: 'Say Hello in French' }
            ];

            const result = await provider.chat(messages);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
                expect(result.value.length).toBeGreaterThan(0);
                expect(result.value.toLowerCase()).toContain('bonjour');
            }
        });

        it('should use default model if modelName is not provided', async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const messages: LlmMessage[] = [{ role: 'user', content: 'Reply with a simple Hello in french' }];

            const result = await provider.chat(messages);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
                expect(result.value.length).toBeGreaterThan(0);
                expect(result.value.toLowerCase()).toContain('bonjour');
            }
        });

        it('should handle streaming chat response', async () => {
            const messages: LlmMessage[] = [
                { role: 'user', content: 'This is a stream test, reply with only "Hello World" nothing more' }
            ];

            // prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

            const result = await provider.chatStream(messages);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
                expect(result.value.length).toBeGreaterThan(0);
                expect(result.value.toLowerCase()).toContain('hello world');
            }
        });

        it('should handle chat with image content', async () => {
            const messages: LlmMessage[] = [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Describe this image' },
                        { type: 'image_url', imageUrl: { url: imageData } }
                    ]
                }
            ];

            // prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

            const result = await provider.chat(messages, { modelName: 'gpt-4-vision-preview' });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
                expect(result.value.length).toBeGreaterThan(0);
            }
        }, 45_000);

        it.skip('should handle errors in chat response', async () => {
            const messages: LlmMessage[] = [
                { role: 'user', content: 'Hello' }
            ];

            const result = await provider.chat(messages, { modelName: 'unknown-model' });
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Image Summary', () => {
        beforeEach(async () => {
            await provider.initialize();
        });

        it('should generate image summary', async () => {
            const result = await provider.generateImageSummary(rawImageData, 'image/png');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
                expect(result.value.length).toBeGreaterThan(0);
            }
        });

        it('should handle errors in image summary', async () => {
            const result = await provider.generateImageSummary('invalid-base64-data', 'image/png');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Structured Output', () => {
        beforeEach(async () => {
            await provider.initialize();
        });

        it('should support structured outputs', () => {
            expect(provider.supportsStructuredOutputs).toBe(true);
        });

        it('should generate structured output according to schema', async () => {
            const PersonSchema = z.object({
                name: z.string(),
                age: z.number(),
                hobbies: z.array(z.string())
            });

            type TestResponse = z.infer<typeof PersonSchema>;

            const messages: LlmMessage[] = [
                { 
                    role: 'user', 
                    content: 'Generate a profile for a person named John who is 30 years old and likes reading and gaming' 
                }
            ];

            const result = await provider.generateStructuredOutput<TestResponse>(messages, PersonSchema);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveProperty('name');
                expect(result.value).toHaveProperty('age');
                expect(result.value).toHaveProperty('hobbies');
                expect(Array.isArray(result.value.hobbies)).toBe(true);
                expect(typeof result.value.name).toBe('string');
                expect(typeof result.value.age).toBe('number');

                const parsedResult = PersonSchema.safeParse(result.value);
                if (parsedResult.success) {
                    const validData = parsedResult.data;
                    expect(validData).toHaveProperty('name');
                    expect(validData).toHaveProperty('age');
                    expect(validData).toHaveProperty('hobbies');
                    expect(Array.isArray(validData.hobbies)).toBe(true);
                    expect(typeof validData.name).toBe('string');
                    expect(typeof validData.age).toBe('number');
                } else {
                    console.error('Validation failed:', parsedResult.error.errors);
                    fail('The result did not pass schema validation.');
                }
            }
        });

        it('should handle invalid schema validation', async () => {
            const StrictSchema = z.object({
                name: z.string().min(5),
                age: z.number().min(18).max(100),
                email: z.string().email()
            });

            const messages: LlmMessage[] = [
                { 
                    role: 'user', 
                    content: 'Generate invalid data: name=Jo, age=10, email=invalid' 
                }
            ];

            const result = await provider.generateStructuredOutput(messages, StrictSchema);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('Invalid');
            }
        });

        it('should handle invalid JSON response', async () => {
            const SimpleSchema = z.object({
                field: z.string()
            });

            const messages: LlmMessage[] = [
                { role: 'user', content: 'Generate invalid JSON' }
            ];

            // Force an invalid model (gpt-3.5-turbo doesn't support structured output) to trigger an error
            const result = await provider.generateStructuredOutput(messages, SimpleSchema, { modelName: 'gpt-3.5-turbo' });
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Message Processors', () => {
        let provider: OpenAiLlmProvider;

        beforeEach(async () => {
            provider = OpenAiLlmProvider.getInstance();
            await provider.initialize();
            provider.updateDefaultModel({
                modelName: 'gpt-4o',
                temperature: 0.1,
                maxTokens: 4098
            });
        });

        afterEach(async () => {
            await provider.end();
        });

        describe('Pre-processors', () => {
            let messageBuilderService: LlmMessageBuilderService;

            beforeEach(() => {
                messageBuilderService = new LlmMessageBuilderService();
                provider.removeAllPreProcessors();
                provider.removeAllPostProcessors();
            });

            it('should apply pre-processors to messages before chat', async () => {
                // TODO: Add test implementation
                const awareBotContext = getAwareBotContext();

                const awareBotPrompts = messageBuilderService.createContextMessages(awareBotContext);

                provider.registerPreProcessor(async (messages: LlmMessage[]): Promise<Result<LlmMessage[], Error>> => {
                    // Filter out any existing system/context messages
                    const filteredMessages = messages.filter(msg => 
                        !msg.content.toString().startsWith('You are Aware Bot') &&
                        !msg.content.toString().startsWith('This is some background about me:')
                    );

                    if (awareBotPrompts.isOk()) {
                        const contextMessages = awareBotPrompts.value;
                        return ok([...contextMessages, ...filteredMessages]);
                    }
                    
                    return ok(filteredMessages);
                });

                const result = await provider.chat([
                    { 
                        role: 'user', content: `Could you analyze these results and provide a summary of what the assessments say about me as relates to personal relationsihps?
                         I'm looking for a concise, short, and insightful paragraph 2-3 sentences long formatted in markdown`
                    }
                ]);
                expect(result.isOk()).toBe(true);
                const value = result._unsafeUnwrap();
                expect(value).toBeTruthy();
                expect(value.length).toBeGreaterThan(0);

                const result2 = await provider.chat([
                    ...(awareBotPrompts._unsafeUnwrap()),
                    { 
                        role: 'user', content: `Could you analyze these results and provide a summary of what the assessments say about me as relates to my career goals?
                         I'm looking for a concise, short, and insightful paragraph 2-3 sentences long formatted in markdown`
                    }
                ]);
                expect(result2.isOk()).toBe(true);
                const value2 = result2._unsafeUnwrap();
                expect(value2).toBeTruthy();
                expect(value2.length).toBeGreaterThan(0);
                
            });

            it('should apply pre-processors in correct order', async () => {
                // TODO: Add test implementation
                expect(true).toBe(true);
            });

            it('should handle empty pre-processor list', async () => {
                // TODO: Add test implementation
                expect(true).toBe(true);
            });

            it('should handle pre-processor errors gracefully', async () => {
                // TODO: Add test implementation
                expect(true).toBe(true);
            });
        });
    });
}); 