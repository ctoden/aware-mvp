import {LlmMessage, LlmMessageProcessor} from "@src/providers/llm/LlmProvider";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {err, ok} from "neverthrow";

describe('TestLlmProvider', () => {
    let provider: TestLlmProvider;

    beforeEach(() => {
        provider = new TestLlmProvider();
        provider.removeAllPreProcessors();
        provider.removeAllPostProcessors();
    });

    describe('message processing', () => {
        it('should apply pre and post processors in chat', async () => {
            // Arrange
            const messages: LlmMessage[] = [{ role: 'user', content: 'test message' }];
            let preProcessorCalled = false;
            let postProcessorCalled = false;

            provider.registerPreProcessor(async (msgs) => {
                preProcessorCalled = true;
                return ok([...msgs, { role: 'system', content: 'pre-processed' }]);
            });

            provider.registerPostProcessor(async (msgs) => {
                postProcessorCalled = true;
                const content = msgs[0].content + ' (post-processed)';
                return ok([{ role: 'assistant', content }]);
            });

            // Act
            const result = await provider.chat(messages);

            // Assert
            expect(result.isOk()).toBe(true);
            expect(preProcessorCalled).toBe(true);
            expect(postProcessorCalled).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('(post-processed)');
            }
        });

        it('should apply post processors in generateImageSummary', async () => {
            // Arrange
            let postProcessorCalled = false;
            provider.registerPostProcessor(async (msgs) => {
                postProcessorCalled = true;
                const content = msgs[0].content + ' (post-processed)';
                return ok([{ role: 'assistant', content }]);
            });

            // Act
            const result = await provider.generateImageSummary('base64', 'image/png');

            // Assert
            expect(result.isOk()).toBe(true);
            expect(postProcessorCalled).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('(post-processed)');
            }
        });

        it('should handle pre-processor errors', async () => {
            // Arrange
            const messages: LlmMessage[] = [{ role: 'user', content: 'test message' }];
            provider.registerPreProcessor(async () => {
                return err(new Error('Pre-processor error'));
            });

            // Act
            const result = await provider.chat(messages);

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Pre-processor error');
            }
        });

        it('should handle post-processor errors', async () => {
            // Arrange
            const messages: LlmMessage[] = [{ role: 'user', content: 'test message' }];

            // Add a successful pre-processor
            provider.registerPreProcessor(async (msgs: LlmMessage[]) => {
                return ok(msgs);
            });

            provider.registerPostProcessor(async () => {
                return err(new Error('Post-processor error'));
            });

            // Act
            const result = await provider.chat(messages);

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Post-processor error');
            }
        });

        it('should remove pre-processor', async () => {
            // Arrange
            const messages: LlmMessage[] = [{ role: 'user', content: 'test message' }];
            let preProcessorCalled = false;
            
            const preProcessor: LlmMessageProcessor = async (msgs: LlmMessage[]) => {
                preProcessorCalled = true;
                return ok([...msgs, { role: 'system' as const, content: 'pre-processed' }]);
            };

            // Add and then remove the pre-processor
            provider.registerPreProcessor(preProcessor);
            const removed = provider.removePreProcessor(preProcessor);

            // Act
            const result = await provider.chat(messages);

            // Assert
            expect(removed).toBe(true);
            expect(preProcessorCalled).toBe(false);
            expect(result.isOk()).toBe(true);
        });

        it('should remove post-processor', async () => {
            // Arrange
            const messages: LlmMessage[] = [{ role: 'user', content: 'test message' }];
            let postProcessorCalled = false;
            
            const postProcessor: LlmMessageProcessor = async (msgs: LlmMessage[]) => {
                postProcessorCalled = true;
                return ok([{ role: 'assistant' as const, content: msgs[0].content + ' (post-processed)' }]);
            };

            // Add and then remove the post-processor
            provider.registerPostProcessor(postProcessor);
            const removed = provider.removePostProcessor(postProcessor);

            // Act
            const result = await provider.chat(messages);

            // Assert
            expect(removed).toBe(true);
            expect(postProcessorCalled).toBe(false);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).not.toContain('(post-processed)');
            }
        });

        it('should return false when removing non-existent processors', () => {
            // Arrange
            const nonExistentProcessor: LlmMessageProcessor = async (msgs: LlmMessage[]) => ok(msgs);

            // Act & Assert
            expect(provider.removePreProcessor(nonExistentProcessor)).toBe(false);
            expect(provider.removePostProcessor(nonExistentProcessor)).toBe(false);
        });

        it('should remove all pre-processors', async () => {
            // Arrange
            const messages: LlmMessage[] = [{ role: 'user', content: 'test message' }];
            let preProcessor1Called = false;
            let preProcessor2Called = false;
            
            const preProcessor1: LlmMessageProcessor = async (msgs: LlmMessage[]) => {
                preProcessor1Called = true;
                return ok(msgs);
            };
            
            const preProcessor2: LlmMessageProcessor = async (msgs: LlmMessage[]) => {
                preProcessor2Called = true;
                return ok(msgs);
            };

            provider.registerPreProcessor(preProcessor1);
            provider.registerPreProcessor(preProcessor2);
            
            // Act
            provider.removeAllPreProcessors();
            const result = await provider.chat(messages);

            // Assert
            expect(preProcessor1Called).toBe(false);
            expect(preProcessor2Called).toBe(false);
            expect(result.isOk()).toBe(true);
        });

        it('should remove all post-processors', async () => {
            // Arrange
            const messages: LlmMessage[] = [{ role: 'user', content: 'test message' }];
            let postProcessor1Called = false;
            let postProcessor2Called = false;
            
            const postProcessor1: LlmMessageProcessor = async (msgs: LlmMessage[]) => {
                postProcessor1Called = true;
                return ok([{ role: 'assistant' as const, content: msgs[0].content + ' (post1)' }]);
            };
            
            const postProcessor2: LlmMessageProcessor = async (msgs: LlmMessage[]) => {
                postProcessor2Called = true;
                return ok([{ role: 'assistant' as const, content: msgs[0].content + ' (post2)' }]);
            };

            provider.registerPostProcessor(postProcessor1);
            provider.registerPostProcessor(postProcessor2);
            
            // Act
            provider.removeAllPostProcessors();
            const result = await provider.chat(messages);

            // Assert
            expect(postProcessor1Called).toBe(false);
            expect(postProcessor2Called).toBe(false);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).not.toContain('(post1)');
                expect(result.value).not.toContain('(post2)');
            }
        });
    });
});