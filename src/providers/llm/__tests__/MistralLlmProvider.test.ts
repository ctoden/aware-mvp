import { DependencyService } from '@src/core/injection/DependencyService';
import { get } from "lodash";
import { LLM_PROVIDER_KEY, LlmMessage } from '../LlmProvider';
import { MistralLlmProvider } from '../MistralLlmProvider';

const rawImageData = "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII="
const imageData = "data:image/png;base64," + rawImageData;

describe('MistralLlmProvider', () => {
    let provider: MistralLlmProvider;
    let apiKeyFromTestEnv: string;
    beforeAll(()=> {
        // KEEP THIS - jest messes up the process.env and the process.env.EXPO_PUBLIC_MISTRAL_API_KEY is undefined
        apiKeyFromTestEnv = get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
    });

    beforeEach(() => {
        // Create provider instance
        DependencyService.registerValue("MISTRAL_API_KEY", apiKeyFromTestEnv);
        DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "open-mistral-nemo");
        provider = new MistralLlmProvider();
    });

    afterEach(async () => {
        await provider.end();
    });

    afterAll(()=> {
        delete process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
        DependencyService.unregister('MISTRAL_API_KEY');
        DependencyService.unregister('MISTRAL_DEFAULT_MODEL');
        DependencyService.unregister(LLM_PROVIDER_KEY);
    })

    describe('Initialization', () => {
        it('should initialize successfully with API key from environment', async () => {
            const result = await provider.initialize();
            expect(result.isOk()).toBe(true);
        });

        it('should initialize successfully with API key from dependency service', async () => {
            delete process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
            DependencyService.registerValue('MISTRAL_API_KEY', apiKeyFromTestEnv);

            const result = await provider.initialize();
            expect(result.isOk()).toBe(true);
        });

        it.skip('should fail initialization without API key', async () => {
            delete process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
            DependencyService.unregister('MISTRAL_API_KEY');

            const result = await provider.initialize();
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('MISTRAL_API_KEY is not defined');
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
            const customModel = 'mistral-large-latest';
            DependencyService.registerValue('MISTRAL_DEFAULT_MODEL', customModel);

            provider.updateDefaultModel();

            const defaultModel = provider.getDefaultModel();
            expect(defaultModel.modelName).toBe(customModel);
        });

        it('should return available models', () => {
            const models = provider.getAvailableModels();
            expect(models).toContain('mistral-large-latest');
            expect(models).toContain('mistral-small-latest');
            expect(models).toContain('pixtral-large-latest');
        });
    });

    describe('Chat', () => {
        beforeEach(async () => {
            await provider.initialize();
            provider.updateDefaultModel({
                modelName: 'open-mistral-nemo',
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
                expect(result.value).toBe('Hello World');
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

            const result = await provider.chat(messages, { modelName: 'pixtral-large-latest' });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
                expect(result.value.length).toBeGreaterThan(0);
            }
        }, 10_000);

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

        it.skip('should handle errors in image summary', async () => {
            const result = await provider.generateImageSummary('base64data', 'image/png');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Image processing error');
            }
        });
    });
}); 