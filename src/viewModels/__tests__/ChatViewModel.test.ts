import { ChatViewModel } from "../ChatViewModel";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LlmService } from "@src/services/LlmService";
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { userProfile$ } from "@src/models/UserProfile";
import { ChatService } from "@src/services/ChatService";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { DataService } from "@src/services/DataService";
import {chats$, clearMessages, messages$, MessageSender} from "@src/models/Chat";
import { user$ } from "@src/models/SessionModel";
import { UserModel } from "@src/models/UserModel";
import { wait } from "@src/utils/PromiseUtils";
import { ok } from "neverthrow";

describe('ChatViewModel', () => {
    let chatViewModel: ChatViewModel;
    let testLlmProvider: TestLlmProvider;
    let testDataProvider: TestDataProvider;
    let chatService: ChatService;

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

    beforeEach(async () => {
        // Setup test providers
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Initialize services
        const llmService = new LlmService();
        await llmService.initialize();
        DependencyService.registerValue(LlmService, llmService);

        const dataService = new DataService();
        await dataService.initialize();
        DependencyService.registerValue(DataService, dataService);

        chatService = new ChatService();
        await chatService.initialize();
        DependencyService.registerValue(ChatService, chatService);

        // Set up mock user and profile
        user$.set(mockUser);
        userProfile$.set({
            id: mockUser.id,
            full_name: 'Test User',
            summary: 'Test user summary',
            phone_number: null,
            avatar_url: null,
            website: null,
            birth_date: null,
            updated_at: new Date().toISOString()
        });

        // Initialize the view model
        chatViewModel = new ChatViewModel();
        await chatViewModel.initialize();
    });

    afterEach(async () => {
        await chatViewModel.end();
        userProfile$.set(null);
        user$.set(null);
        chats$.set(null);
        messages$.set(null);
    });

    describe('initialization', () => {
        it('should initialize with empty state and select main thread', async () => {
            // Create main thread
            // Find existing main chat or create new one
            const existingChats = Object.values(chats$.peek() ?? {});
            const mainChat = existingChats.find(chat => chat.is_main);
            
            const result = mainChat ? ok(mainChat) : await chatService.createChat({
                title: 'Main Thread',
                isMain: true
            });
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                await wait(100); // Wait for subscription to process
                expect(chatViewModel.state.currentChatId.get()).toBe(result.value.id);
            }
            expect(chatViewModel.state.inputText.get()).toBe('');
            expect(chatViewModel.state.isLoading.get()).toBe(false);
        });
    });

    describe('switchChat', () => {
        it('should switch to another chat', async () => {
            // Create main thread and another chat
            const mainThread = await chatService.createChat({
                title: 'Main Thread',
                isMain: true
            });
            expect(mainThread.isOk()).toBe(true);

            const newChat = await chatService.createChat({
                title: 'New Chat',
                isMain: false
            });
            expect(newChat.isOk()).toBe(true);

            if (mainThread.isOk() && newChat.isOk()) {
                // Switch to new chat
                const result = await chatViewModel.switchChat(newChat.value.id);
                expect(result.isOk()).toBe(true);
                expect(chatViewModel.state.currentChatId.get()).toBe(newChat.value.id);
            }
        });

        it('should fail to switch to non-existent chat', async () => {
            const result = await chatViewModel.switchChat('non-existent-id');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Chat not found');
            }
        });
    });

    describe('sendMessage', () => {
        beforeEach(async () => {
            // Create main thread
            const result = await chatService.createChat({
                title: 'Main Thread',
                isMain: true
            });
            expect(result.isOk()).toBe(true);
            await wait(100); // Wait for subscription to process
        });

        it('should send message and receive response', async () => {
            // Set up mock response
            testLlmProvider.setMockResponse(
                'Hello',
                'Hello! How can I help you today?'
            );

            // Send message
            chatViewModel.setInputText('Hello');
            const result = await chatViewModel.sendMessage();

            // Verify result
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(true);
            }

            // Verify messages
            const chatId = chatViewModel.state.currentChatId.get();
            expect(chatId).toBeDefined();
            if (chatId) {
                const messages = messages$.peek();
                expect(messages).toBeDefined();
                const chatMessages = Object.values(messages ?? {})
                    .filter(msg => msg.chat_id === chatId)
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                expect(chatMessages).toHaveLength(2);
                expect(chatMessages[0].sender).toBe(MessageSender.USER);
                expect(chatMessages[0].content).toBe('Hello');
                expect(chatMessages[1].sender).toBe(MessageSender.ASSISTANT);
                expect(chatMessages[1].content).toBe('Hello! How can I help you today?');
            }

            // Verify input was cleared
            expect(chatViewModel.state.inputText.get()).toBe('');
        });

        it('should not send empty messages', async () => {
            clearMessages();
            chatViewModel.setInputText('   ');
            const result = await chatViewModel.sendMessage();
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(false);
            }

            const messages = messages$.peek();
            expect(Object.keys(messages ?? {})).toHaveLength(0);
        });

        it('should handle error in AI response', async () => {
            clearMessages();
            testLlmProvider.clearMockResponses();
            // Set up provider to fail
            testLlmProvider.setMockResponse(
                'Hello',
                'ERROR'
            );

            // Send message
            chatViewModel.setInputText('Hello');
            const result = await chatViewModel.sendMessage();

            // Verify error handling
            expect(result.isErr()).toBe(true);
            
            // Verify user message was still added
            const chatId = chatViewModel.state.currentChatId.get();
            expect(chatId).toBeDefined();
            if (chatId) {
                const messages = messages$.peek();
                expect(messages).toBeDefined();
                const chatMessages = Object.values(messages ?? {})
                    .filter(msg => msg.chat_id === chatId);
                expect(chatMessages).toHaveLength(1);
                expect(chatMessages[0].sender).toBe(MessageSender.USER);
                expect(chatMessages[0].content).toBe('Hello');
            }

            // Verify loading state was reset
            expect(chatViewModel.state.isLoading.get()).toBe(false);
        });
    });
}); 