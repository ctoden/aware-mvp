import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import { ChatScreen } from '../ChatScreen';
import { ChatViewModel } from '@src/viewModels/ChatViewModel';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { TestLlmProvider } from '@src/providers/llm/__tests__/TestLlmProvider';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';
import { DataService } from '@src/services/DataService';
import { ChatService } from '@src/services/ChatService';
import { user$ } from '@src/models/SessionModel';
import { userProfile$ } from '@src/models/UserProfile';
import { chats$, messages$, MessageSender } from '@src/models/Chat';
import { withViewModel } from '@src/viewModels/ViewModel';

describe('ChatScreen', () => {
    let chatViewModel: ChatViewModel;
    let testLlmProvider: TestLlmProvider;
    let testDataProvider: TestDataProvider;
    let chatService: ChatService;

    const mockUser = {
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
            updated_at: new Date().toISOString()
        });

        // Initialize the view model
        chatViewModel = await withViewModel(ChatViewModel);

        // Create main thread
        const mainThread = await chatService.createChat({
            title: 'Main Thread',
            isMain: true
        });
        expect(mainThread.isOk()).toBe(true);
    });

    afterEach(async () => {
        await chatViewModel.end();
        userProfile$.set(null);
        user$.set(null);
        chats$.set(null);
        messages$.set(null);
    });

    it('renders correctly with main thread', async () => {
        const { getByText } = render(<ChatScreen />);
        expect(getByText('Main thread')).toBeTruthy();
    });

    it('displays messages in chronological order', async () => {
        // Add some test messages
        const chatId = chatViewModel.state.currentChatId.get();
        expect(chatId).toBeTruthy();

        if (chatId) {
            await chatService.saveMessage({
                chatId,
                content: 'Hello',
                sender: MessageSender.USER
            });

            await chatService.saveMessage({
                chatId,
                content: 'Hi there!',
                sender: MessageSender.ASSISTANT
            });

            const { getByText } = render(<ChatScreen />);
            expect(getByText('Hello')).toBeTruthy();
            expect(getByText('Hi there!')).toBeTruthy();
        }
    });

    it('handles sending new messages', async () => {
        testLlmProvider.setMockResponse('Test message', 'I received your test message');
        
        const { getByPlaceholderText, getByLabelText } = render(<ChatScreen />);
        const input = getByPlaceholderText('Type a message');

        await act(async () => {
            // Type and send a message
            fireEvent.changeText(input, 'Test message');
            fireEvent.press(getByLabelText('Send message'));

            // Wait for the message to be processed
            await new Promise(resolve => setTimeout(resolve, 3000));
        })

        // Verify the messages were added
        const chatId = chatViewModel.state.currentChatId.get();
        expect(chatId).toBeTruthy();
        if (chatId) {
            const chatMessages = Object.values(messages$.peek() ?? {})
                .filter(msg => msg.chat_id === chatId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            expect(chatMessages).toHaveLength(2);
            expect(chatMessages[0].content).toBe('Test message');
            expect(chatMessages[1].content).toBe('I received your test message');
        }
    }, 300_000);

    it('shows loading state while sending message', async () => {
        testLlmProvider.setDefaultDelay(500); // Add a delay to test loading state
        testLlmProvider.setMockResponse('Test message', 'Response');
        
        const { getByPlaceholderText, getByLabelText } = render(<ChatScreen />);
        const input = getByPlaceholderText('Type a message');
        const sendButton = getByLabelText('Send message');
        
        // Type and send a message
        fireEvent.changeText(input, 'Test message');
        fireEvent.press(sendButton);

        // Verify loading state
        expect(input.props.editable).toBe(false);
        expect(sendButton.props.disabled).toBe(true);

        // Wait for the message to be processed
        await new Promise(resolve => setTimeout(resolve, 600));

        // Verify loading state is cleared
        expect(input.props.editable).toBe(true);
        expect(sendButton.props.disabled).toBe(false);
    });
});