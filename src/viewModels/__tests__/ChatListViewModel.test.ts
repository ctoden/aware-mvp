import {ChatListViewModel} from "../ChatListViewModel";
import {DependencyService} from "@src/core/injection/DependencyService";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {DataService} from "@src/services/DataService";
import {ChatService} from "@src/services/ChatService";
import {chats$, getChatsArray, MessageSender} from "@src/models/Chat";
import {user$} from "@src/models/SessionModel";
import {UserModel} from "@src/models/UserModel";
import {withViewModel} from "../ViewModel";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {wait} from "@src/utils/PromiseUtils";
import {generateSummaryPrompt} from "@src/prompts/ChatPrompts";

function setChatUpdatedAt() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // need to set updated_at for each chat to make sure grouping works
    const chats = getChatsArray();
    chats.forEach((chat) => {
        if(chat.title === 'Today Chat') {
            chat.updated_at = today.toISOString();
        } else if(chat.title === 'Yesterday Chat') {
            chat.updated_at = yesterday.toISOString();
        } else if(chat.title === 'Last Week Chat') {
            chat.updated_at = lastWeek.toISOString();
        }
    });
}

describe('ChatListViewModel', () => {
    let chatListViewModel: ChatListViewModel;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
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
        testDataProvider = new TestDataProvider();
        testLlmProvider = new TestLlmProvider();
        await testDataProvider.initialize();
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Initialize services
        const dataService = DependencyService.resolve(DataService);
        await dataService.initialize();

        chatService = DependencyService.resolve(ChatService);
        await chatService.initialize();

        // Set up mock user
        user$.set(mockUser);

        // Initialize the view model
        chatListViewModel = await withViewModel(ChatListViewModel);
    });

    afterEach(async () => {
        await chatListViewModel.end();
        user$.set(null);
        chats$.set(null);
    });

    describe('createNewChat', () => {
        it('should create a new chat successfully', async () => {
            const result = await chatListViewModel.createNewChat();
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeDefined();
            }

            // Verify chat was created
            const chats = Object.values(chats$.peek() ?? {});
            expect(chats.length).toBeGreaterThanOrEqual(2);
            // Check that the title matches the expected format
            // expect(chats.some(chat => /^New Thread \([A-Za-z0-9]{5}\)$/.test(chat.title))).toBe(true);
        });

        it('should update chat title after first message', async () => {
            // Create a new chat
            const chatResult = await chatListViewModel.createNewChat();
            expect(chatResult.isOk()).toBe(true);
            if (!chatResult.isOk()) return;

            const chat = chatResult.value;
            const messageContent = "This is a test message about cats";
            const expectedSummary = "Cat Discussion";

            // Set up LLM mock response
            testLlmProvider.setMockResponse(generateSummaryPrompt(messageContent).content, expectedSummary);

            // Add first message
            const messageResult = await chatService.saveMessage({
                chatId: chat.id,
                content: messageContent,
                sender: MessageSender.USER
            });
            expect(messageResult.isOk()).toBe(true);

            await wait(500);

            // Verify chat title was updated
            const updatedChat = chats$.peek()?.[chat.id];
            expect(updatedChat).toBeDefined();
            expect(updatedChat?.title).toBe(expectedSummary);
        }, 100_000);

        it('should not update main thread title after first message', async () => {
            // Create main thread
            const mainThreadResult = await chatService.createChat({
                title: 'Main Thread',
                isMain: true
            });
            expect(mainThreadResult.isOk()).toBe(true);
            if (!mainThreadResult.isOk()) return;

            const mainThread = mainThreadResult.value;
            const originalTitle = mainThread.title;

            // Add first message
            const messageResult = await chatService.saveMessage({
                chatId: mainThread.id,
                content: "This is a test message",
                sender: MessageSender.USER
            });
            expect(messageResult.isOk()).toBe(true);

            // Verify main thread title was not updated
            const updatedChat = chats$.peek()?.[mainThread.id];
            expect(updatedChat).toBeDefined();
            expect(updatedChat?.title).toBe(originalTitle);
        });

        it('should not allow creating multiple chats simultaneously', async () => {
            // Start first chat creation
            const firstPromise = chatListViewModel.createNewChat();
            
            // Try to create another chat while first is in progress
            const secondResult = await chatListViewModel.createNewChat();
            expect(secondResult.isErr()).toBe(true);
            // Wait for first chat to complete
            await firstPromise;
        });
    });

    describe('getGroupedChats', () => {
        beforeEach(async () => {
            // Create some test chats with different dates
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);

            // Create chats for different dates
            await chatService.createChat({ title: 'Today Chat', isMain: false, createDate: today });
            await chatService.createChat({ title: 'Yesterday Chat', isMain: false, createDate: yesterday });
            await chatService.createChat({ title: 'Last Week Chat', isMain: false, createDate: lastWeek });

            // Get all chats to add messages
            const chats = Object.values(chats$.peek() ?? {});
            const todayChat = chats.find(c => c.title === 'Today Chat');
            const yesterdayChat = chats.find(c => c.title === 'Yesterday Chat');
            const lastWeekChat = chats.find(c => c.title === 'Last Week Chat');

            // Add messages to chats
            if (todayChat) {
                await chatService.saveMessage({
                    chatId: todayChat.id,
                    content: 'Today message',
                    sender: MessageSender.USER
                });
                todayChat.updated_at = today.toISOString();
                await chatService.updateChatTitle(todayChat.id, todayChat.title);
            }

            if (yesterdayChat) {
                await chatService.saveMessage({
                    chatId: yesterdayChat.id,
                    content: 'Yesterday message',
                    sender: MessageSender.USER
                });
                await chatService.updateChatTitle(yesterdayChat.id, yesterdayChat.title);
                yesterdayChat.updated_at = yesterday.toISOString();
            }

            if (lastWeekChat) {
                await chatService.saveMessage({
                    chatId: lastWeekChat.id,
                    content: 'Last week message',
                    sender: MessageSender.USER
                });
                await chatService.updateChatTitle(lastWeekChat.id, lastWeekChat.title);
                lastWeekChat.updated_at = lastWeek.toISOString();
            }
        });

        it('should group chats correctly by date', () => {
            setChatUpdatedAt();
            const groupedChats = chatListViewModel.getGroupedChats();
            
            // Should have today, yesterday, and last week groups
            expect(Object.keys(groupedChats).length).toBeGreaterThanOrEqual(3);
            
            // Check today's group
            expect(groupedChats.today).toBeDefined();
            expect(groupedChats.today.label).toBe('Today');
            expect(groupedChats.today.chats.some(chat => chat.title === 'Today Chat')).toBe(true);
            
            // Check yesterday's group
            expect(groupedChats.yesterday).toBeDefined();
            expect(groupedChats.yesterday.label).toBe('Yesterday');
            expect(groupedChats.yesterday.chats.some(chat => chat.title === 'Yesterday Chat')).toBe(true);
            
            // Check last week's group (date format will be dynamic)
            const lastWeekKey = Object.keys(groupedChats).find(key => 
                key !== 'today' && key !== 'yesterday'
            );
            expect(lastWeekKey).toBeDefined();
            if (lastWeekKey) {
                expect(groupedChats[lastWeekKey].chats.some(chat => 
                    chat.title === 'Last Week Chat'
                )).toBe(true);
            }
        });

        it('should include main thread in today\'s group', () => {
            const groupedChats = chatListViewModel.getGroupedChats();
            
            expect(groupedChats.today).toBeDefined();
            const mainThread = groupedChats.today.chats.find(chat => 
                chat.title === 'Main Thread'
            );
            expect(mainThread).toBeDefined();
        });

        it('should display correct message content for each chat', () => {
            setChatUpdatedAt();
            const groupedChats = chatListViewModel.getGroupedChats();
            
            // Check today's messages
            const todayChat = groupedChats.today.chats.find(chat => 
                chat.title === 'Today Chat'
            );
            expect(todayChat?.content).toBe('Today message');
            
            // Check yesterday's messages
            const yesterdayChat = groupedChats.yesterday.chats.find(chat => 
                chat.title === 'Yesterday Chat'
            );
            expect(yesterdayChat?.content).toBe('Yesterday message');
            
            // Check last week's messages
            const lastWeekKey = Object.keys(groupedChats).find(key => 
                key !== 'today' && key !== 'yesterday'
            );
            if (lastWeekKey) {
                const lastWeekChat = groupedChats[lastWeekKey].chats.find(chat => 
                    chat.title === 'Last Week Chat'
                );
                expect(lastWeekChat?.content).toBe('Last week message');
            }
        });

        it('should show placeholder for chats with no messages', async () => {
            // Create a new chat without messages
            const result = await chatService.createChat({ 
                title: 'Empty Chat', 
                isMain: false 
            });
            expect(result.isOk()).toBe(true);
            
            const groupedChats = chatListViewModel.getGroupedChats();
            const emptyChat = groupedChats.today.chats.find(chat => 
                chat.title === 'Empty Chat'
            );
            
            expect(emptyChat).toBeDefined();
            expect(emptyChat?.content).toBe('~~~ no messages yet ~~~');
        });
    });
}); 