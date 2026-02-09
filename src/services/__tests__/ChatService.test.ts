import { ChatService, CreateChatParams, SendMessageParams } from "../ChatService";
import { DependencyService } from "@src/core/injection/DependencyService";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import { DataService } from "../DataService";
import {Chat, Message, MessageSender, chats$, messages$, findMainChat} from "@src/models/Chat";
import { user$ } from "@src/models/SessionModel";
import { UserModel } from "@src/models/UserModel";
import {wait} from "@src/utils/PromiseUtils";
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { UserProfile, userProfile$ } from "@src/models/UserProfile";
import {ok} from "neverthrow";

describe('ChatService', () => {
    let chatService: ChatService;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;

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

    const mockUserProfile: UserProfile = {
        id: mockUser.id,
        full_name: 'Test User',
        avatar_url: null,
        website: null,
        summary: 'MBTI Type: INTJ - Strategic, analytical, and focused on continuous improvement. Values intellectual discourse and systematic problem-solving.',
        phone_number: null,
        birth_date: new Date('1990-01-01'),
        updated_at: new Date().toISOString(),
        family_story: null,
        primary_occupation: 'Software Engineer'
    };

    const mockChat: Chat = {
        id: 'test-chat-id',
        user_id: mockUser.id,
        title: 'Test Chat',
        is_main: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const mockMessage: Message = {
        id: 'test-message-id',
        chat_id: mockChat.id,
        content: 'Test message',
        sender: MessageSender.USER,
        timestamp: new Date().toISOString()
    };

    beforeEach(async () => {
        // Setup test data provider
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Setup test llm provider
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Initialize DataService and register it
        const dataService = new DataService();
        await dataService.initialize();
        DependencyService.registerValue(DataService, dataService);

        // Set up mock user and profile
        user$.set(mockUser);
        userProfile$.set(mockUserProfile);

        // Initialize ChatService
        chatService = new ChatService();
        await chatService.initialize();
    });

    afterEach(async () => {
        await chatService.end();
        await testLlmProvider.end();
        testLlmProvider.setShouldFailInit(false);
        testLlmProvider.clearMockResponses();
        user$.set(null);
        userProfile$.set(null);
        chats$.set(null);
        messages$.set(null);
    });

    describe('initialization', () => {
        it('should create main thread if none exists', async () => {
            // Clear any existing chats
            await testDataProvider.clearTestData();



            // Re-initialize service to trigger subscription
            await chatService.end();
            chatService = new ChatService();
            await chatService.initialize();

            // Trigger user change to create main thread
            user$.set(null);
            await wait(100);

            user$.set({...mockUser}); 

            // Wait for async operations
            await wait(100);

            // Check if main thread was created
            const chatsArray = Object.values(chats$.peek() ?? {});
            expect(chatsArray.length).toBeGreaterThanOrEqual(1);
            const mainThread = chatsArray.find(c => c.is_main);
            expect(mainThread).toBeDefined();
            if (mainThread) {
                expect(mainThread.title).toBe('Main Thread');
            }
        });

        it('should not create main thread if it already exists', async () => {
            // Clear any existing chats
            await testDataProvider.clearTestData();
            
            // Create a main thread manually
            const existingMainThread: Chat = {
                id: 'existing-main-thread',
                user_id: mockUser.id,
                title: 'Existing Main Thread',
                is_main: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            await testDataProvider.upsertData('chats', [existingMainThread]);

            // Re-initialize service to trigger subscription
            await chatService.end();
            chatService = new ChatService();
            await chatService.initialize();

            // Check that only the existing main thread exists
            const chatsArray = Object.values(chats$.peek() ?? {});
            expect(chatsArray.length).toBeGreaterThanOrEqual(1);
            const mainThreads = chatsArray.filter(c => c.is_main);
            expect(mainThreads.length).toBe(1);
            expect(mainThreads[0].id).toBe('existing-main-thread');
        });
    });

    describe('createChat', () => {
        it('should create a new chat', async () => {
            const params: CreateChatParams = {
                title: 'New Chat',
                isMain: false
            };

            const result = await chatService.createChat(params);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.title).toBe(params.title);
                expect(result.value.is_main).toBe(false);
                expect(result.value.user_id).toBe(mockUser.id);
            }
        });

        it('should not create chat when user is not logged in', async () => {
            user$.set(null);
            const params: CreateChatParams = {
                title: 'New Chat'
            };

            const result = await chatService.createChat(params);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('sendMessage', () => {
        it('should send a new message', async () => {
            const params: SendMessageParams = {
                chatId: mockChat.id,
                content: 'Hello, world!',
                sender: MessageSender.USER
            };

            const result = await chatService.saveMessage(params);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.content).toBe(params.content);
                expect(result.value.sender).toBe(params.sender);
                expect(result.value.chat_id).toBe(params.chatId);
            }
        });
    });

    describe('updateChatTitle', () => {
        beforeEach(async () => {
            // Add mock chat to state
            const result = await chatService.createChat({
                title: mockChat.title,
                isMain: mockChat.is_main
            });
            expect(result.isOk()).toBe(true);
        });

        it('should update chat title', async () => {
            const newTitle = 'Updated Chat Title';
            const chatsArray = Object.values(chats$.peek() ?? {});
            const nonMainChat = chatsArray.find(chat => !chat.is_main);
            if (!nonMainChat) {
                throw new Error('No non-main chat found for test');
            }
            const chatId = nonMainChat.id;

            const result = await chatService.updateChatTitle(chatId, newTitle);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.title).toBe(newTitle);
            }
        });

        it('should not update main chat title', async () => {
            // Create main chat
            const mainChat = await chatService.createChat({
                title: 'Main Chat',
                isMain: true
            });
            expect(mainChat.isOk()).toBe(true);
            if (mainChat.isOk()) {
                const result = await chatService.updateChatTitle(mainChat.value.id, 'New Title');
                expect(result.isErr()).toBe(true);
                if (result.isErr()) {
                    expect(result.error.message).toBe('Cannot update main chat title');
                }
            }
        });
    });

    describe('deleteChat', () => {
        beforeEach(async () => {
            // Add mock chat to state
            const result = await chatService.createChat({
                title: mockChat.title,
                isMain: mockChat.is_main
            });
            expect(result.isOk()).toBe(true);
        });

        it('should delete chat', async () => {
            const chatsArray = Object.values(chats$.peek() ?? {});
            const nonMainChat = chatsArray.find(chat => !chat.is_main);
            if (!nonMainChat) {
                throw new Error('No non-main chat found for test');
            }
            const chatId = nonMainChat.id;

            const result = await chatService.deleteChat(chatId);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(true);
                expect(chats$.peek()?.[chatId]).toBeUndefined();
            }
        });

        it('should not delete main chat', async () => {
            // Create main chat
            const mainChat = await chatService.createChat({
                title: 'Main Chat',
                isMain: true
            });
            expect(mainChat.isOk()).toBe(true);
            if (mainChat.isOk()) {
                const result = await chatService.deleteChat(mainChat.value.id);
                expect(result.isErr()).toBe(true);
                if (result.isErr()) {
                    expect(result.error.message).toBe('Cannot delete main chat');
                }
            }
        });
    });

    describe('fetchUserChats', () => {
        it('should fetch user chats and messages', async () => {
            // Add mock data to provider
            await testDataProvider.clearTestData();
            await testDataProvider.upsertData('chats', [mockChat]);
            await testDataProvider.upsertData('messages', [mockMessage]);

            const result = await chatService.fetchUserChats(mockUser.id);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(1);
                expect(result.value[0].id).toBe(mockChat.id);
                
                // Check if messages were fetched
                const chatMessages = messages$.peek();
                expect(chatMessages).toBeDefined();
                expect(Object.values(chatMessages ?? {})).toHaveLength(1);
                expect(Object.values(chatMessages ?? {})[0].id).toBe(mockMessage.id);
            }
        });
    });

    describe('sendMessageAndGetResponse', () => {
        let mainChat: Chat;

        beforeEach(async () => {
            const getMainChat = async () => {
                let mChat = findMainChat();
                if(mChat) {
                    return ok(mChat);
                }
               return await chatService.createChat({
                        title: 'Main Chat',
                        isMain: true
                    });
            };

            // Create a main chat
            const mainChatResult = await getMainChat();
            expect(mainChatResult.isOk()).toBe(true);
            if (mainChatResult.isOk()) {
                mainChat = mainChatResult.value;
            }

            // Set up mock LLM response
            testLlmProvider.setMockResponse('Test message', 'Mock AI response');
        });

        it('should send message and get response with specific chat ID', async () => {
            // Create a regular chat
            const chatResult = await chatService.createChat({
                title: 'Test Chat',
                isMain: false
            });
            expect(chatResult.isOk()).toBe(true);
            if (!chatResult.isOk()) return;

            const result = await chatService.sendMessageAndGetResponse('Test message', chatResult.value.id);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const [userMessage, aiMessage] = result.value;
                
                // Verify user message
                expect(userMessage.content).toBe('Test message');
                expect(userMessage.sender).toBe(MessageSender.USER);
                expect(userMessage.chat_id).toBe(chatResult.value.id);

                // Verify AI response
                expect(aiMessage.content).toBe('Mock AI response');
                expect(aiMessage.sender).toBe(MessageSender.ASSISTANT);
                expect(aiMessage.chat_id).toBe(chatResult.value.id);
            }
        });

        it('should send message to main chat when no chat ID provided', async () => {
            const result = await chatService.sendMessageAndGetResponse('Test message');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const [userMessage, aiMessage] = result.value;
                
                // Verify user message
                expect(userMessage.content).toBe('Test message');
                expect(userMessage.sender).toBe(MessageSender.USER);
                expect(userMessage.chat_id).toBe(mainChat.id);

                // Verify AI response
                expect(aiMessage.content).toBe('Mock AI response');
                expect(aiMessage.sender).toBe(MessageSender.ASSISTANT);
                expect(aiMessage.chat_id).toBe(mainChat.id);
            }
        });

        it('should fail when no chat ID provided and no main chat exists', async () => {
            // Delete all chats including main chat
            await testDataProvider.clearTestData();
            chats$.set(null);

            const result = await chatService.sendMessageAndGetResponse('Test message');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No valid chat found');
            }
        });

        it('should fail when provided chat ID does not exist', async () => {
            const result = await chatService.sendMessageAndGetResponse('Test message', 'non-existent-chat-id');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No valid chat found');
            }
        });

        it('should handle LLM service errors', async () => {
            // Set up mock LLM error response
            testLlmProvider.setMockResponse('Test message', 'error');

            const result = await chatService.sendMessageAndGetResponse('Test message', mainChat.id);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Mock error response');
            }
        });

        it('should maintain conversation context', async () => {
            // First message
            const firstResult = await chatService.sendMessageAndGetResponse('First message', mainChat.id);
            expect(firstResult.isOk()).toBe(true);

            // Set up mock response for second message that references the first
            testLlmProvider.setMockResponse('Second message', 'Response referencing: First message');

            // Second message
            const secondResult = await chatService.sendMessageAndGetResponse('Second message', mainChat.id);
            expect(secondResult.isOk()).toBe(true);
            if (secondResult.isOk()) {
                const [_, aiMessage] = secondResult.value;
                expect(aiMessage.content).toBe('Response referencing: First message');
            }
        });
    });
}); 