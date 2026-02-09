import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { Chat, Message, MessageSender, chats$, messages$, upsertChat, upsertMessage, removeChat, clearChats, clearMessages, getMessagesForChat, findMainChat, removeMessage } from "@src/models/Chat";
import { user$ } from "@src/models/SessionModel";
import { userProfile$ } from "@src/models/UserProfile";
import { generateUUID } from "@src/utils/UUIDUtil";
import { nanoid } from 'nanoid';
import { LlmService } from "./LlmService";
import { generateSummaryPrompt } from "@src/prompts/ChatPrompts";
import { LlmMessage } from "@src/providers/llm/LlmProvider";

export interface CreateChatParams {
    title: string;
    isMain?: boolean;
    createDate?: Date;
}

export interface SendMessageParams {
    chatId: string;
    content: string;
    sender: MessageSender;
}

@singleton()
export class ChatService extends Service {
    private readonly _dataService!: DataService;
    private readonly _llmService!: LlmService;

    constructor() {
        super('ChatService');
        this._dataService = this.addDependency(DataService);
        this._llmService = this.addDependency(LlmService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        let initSubscriptionsResult = await this.initializeSubscriptions();
        if(initSubscriptionsResult.isErr()) {
            return err(initSubscriptionsResult.error);
        }

        const userId = user$.peek()?.id;
        if (!userId) {
            return ok(true); // No user logged in yet
        }

        const fetchResult = await this.fetchUserChats(userId);
        if(fetchResult.isErr()) {
            return err(fetchResult.error);
        }

        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        clearChats();
        clearMessages();
        return ok(true);
    }

    protected async initializeSubscriptions(): Promise<Result<boolean, Error>> {
        // Subscribe to auth user changes to fetch chats
        this.onChange(user$, (async (change) => {
            const user = change.value;
            if (user?.id) {
                const result = await this.fetchUserChats(user.id);
                if (result.isErr()) {
                    console.error('Failed to fetch user chats:', result.error);
                    return;
                }

                // Check if we have any chats and if the main thread exists
                const hasMainThread = result.value.some(chat => chat.is_main);
                if (result.value.length === 0 || !hasMainThread) {
                    // Create main thread if it doesn't exist
                    const mainThreadResult = await this.createChat({
                        title: 'Main Thread',
                        isMain: true
                    });
                    if (mainThreadResult.isErr()) {
                        console.error('Failed to create main thread:', mainThreadResult.error);
                    }
                }

            } else {
                clearChats();
                clearMessages();
            }
        }));

        return ok(true);
    }

    async fetchUserChats(userId: string): Promise<Result<Chat[], Error>> {
        try {
            const result = await this._dataService.fetchData<Chat>('chats', {
                filter: [{ field: 'user_id', value: userId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update the observable state
            const chatsMap = result.value.reduce((acc, chat) => {
                acc[chat.id] = chat;
                return acc;
            }, {} as Record<string, Chat>);
            chats$.set(chatsMap);

            // Fetch messages for all chats
            for (const chat of result.value) {
                const messagesResult = await this._dataService.fetchData<Message>('messages', {
                    filter: [{ field: 'chat_id', value: chat.id }]
                });

                if (messagesResult.isOk()) {
                    messagesResult.value.forEach(message => {
                        upsertMessage(message);
                    });
                }
            }

            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch chats'));
        }
    }

    async createChat(params: CreateChatParams): Promise<Result<Chat, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const createDate = params.createDate ?? new Date();
        const title = params.isMain ? params.title : params.title === 'New Thread' ? `New Thread (${nanoid(5)})` : params.title;

        const newChat: Chat = {
            id: generateUUID(),
            user_id: userId,
            title,
            is_main: params.isMain ?? false,
            created_at: createDate.toISOString(),
            updated_at: createDate.toISOString()
        };

        try {
            const result = await this._dataService.upsertData<Chat>('chats', [newChat]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertChat(newChat);
            return ok(newChat);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create chat'));
        }
    }

    async saveMessage(params: SendMessageParams | Message): Promise<Result<Message, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newMessage: Message = 'chatId' in params ? {
            id: generateUUID(),
            chat_id: params.chatId,
            content: params.content,
            sender: params.sender,
            timestamp: new Date().toISOString()
        } : params;

        try {
            const result = await this._dataService.upsertData<Message>('messages', [newMessage]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertMessage(newMessage);

            // Check if this is the first message in a non-main chat
            const chatId = newMessage.chat_id;
            const chat = chats$.peek()?.[chatId];
            const messages = getMessagesForChat(chatId);

            if (chat && !chat.is_main && messages.length === 1) {
                // Generate and update chat title
                const summaryResult = await this._llmService.chat([generateSummaryPrompt(newMessage.content)]);
                if (summaryResult.isOk()) {
                    const titleResult = await this.updateChatTitle(chatId, summaryResult.value);
                    if (titleResult.isErr()) {
                        console.error('Failed to update chat title:', titleResult.error);
                    }
                }
            }

            return ok(newMessage);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to save message'));
        }
    }

    async updateMessage(messageId: string, updates: Partial<Message>): Promise<Result<Message, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const currentMessage = messages$.peek()?.[messageId];
        if (!currentMessage) {
            return err(new Error('Message not found'));
        }

        const updatedMessage: Message = {
            ...currentMessage,
            ...updates,
            timestamp: new Date().toISOString()
        };

        try {
            const result = await this._dataService.updateData<Message>('messages', updatedMessage);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertMessage(updatedMessage);
            return ok(updatedMessage);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to update message'));
        }
    }

    async deleteMessage(messageId: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            const result = await this._dataService.deleteData('messages', {
                filter: [{ field: 'id', value: messageId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            const messages = messages$.peek();
            if (messages) {
                const newMessages = { ...messages };
                delete newMessages[messageId];
                messages$.set(newMessages);
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete message'));
        }
    }

    async updateChatTitle(chatId: string, newTitle: string): Promise<Result<Chat, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const chat = chats$.peek()?.[chatId];
        if (!chat) {
            return err(new Error('Chat not found'));
        }

        if (chat.is_main) {
            return err(new Error('Cannot update main chat title'));
        }

        const updatedChat: Chat = {
            ...chat,
            title: newTitle,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.updateData<Chat>('chats', updatedChat);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertChat(updatedChat);
            return ok(updatedChat);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to update chat title'));
        }
    }

    formatMessagesForLLM(chatId: string | null): LlmMessage[] {
        const systemMessage: LlmMessage = {
          role: 'user',
          content:
          `${userProfile$.get()?.summary ? `Here is a summary of my profile: ${userProfile$.get()?.summary}` : ''}
As you answer my questions and engage with me, please taylor your response to my profile and background. 
If I am asking you to do something (like form a plan, or provide a list of steps), always respond with a plan of action.
Attempt to relate your answers to my profile and background; highlight how my background, personality, and experiences inform your answers.
Look at the questions I'm asking and weigh your response based on the type of question; for example, if it's a question related to personal relationships,
your response should more closely align with my personality profile; if its goal oriented, your response should be more focused my goals, and main interest, but through the 
lens of my profile.
Do not provide 'generic' responses, take your time and think about my personal profile and background when responding.
Format your response in markdown.`
        };
        
        if (!chatId) {
          return [systemMessage];
        }
    
        const chatMessages = getMessagesForChat(chatId);
        const formattedMessages = chatMessages
          .filter(msg => !msg.content.startsWith('Here is a summary of my profile:'))
          .map(msg => ({
            role: msg.sender === MessageSender.USER ? 'user' : 'assistant',
            content: msg.content
          } as LlmMessage));

        
    
        return [systemMessage, ...formattedMessages];
      }
    
    async sendMessageAndGetResponse(userMessage: string, chatId?: string): Promise<Result<Message[], Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        // Find the target chat
        let targetChat: Chat | null;
        if (chatId) {
            targetChat = chats$.peek()?.[chatId] ?? null;
        } else {
            targetChat = findMainChat();
        }

        if (!targetChat) {
            return err(new Error('No valid chat found'));
        }

        // Save user message
        const userMessageResult = await this.saveMessage({
            chatId: targetChat.id,
            content: userMessage,
            sender: MessageSender.USER
        });

        if (userMessageResult.isErr()) {
            const newMessage: Message = {
                id: generateUUID(),
                chat_id: targetChat.id,
                content: "Error: " + userMessageResult.error.message,
                sender: MessageSender.ASSISTANT,
                timestamp: new Date().toISOString()
            }
            upsertMessage(newMessage);
            return err(userMessageResult.error);
        }

        try {

            // Format messages for LLM service
            const chatMessages = await this.formatMessagesForLLM(targetChat.id);

            // Start AI response
            const llmResponsePromise = this._llmService.chat(chatMessages);

            // add temporary message
            const newMessage: Message = {
                id: generateUUID(),
                chat_id: targetChat.id,
                content: "",
                sender: MessageSender.ASSISTANT,
                timestamp: new Date().toISOString()
            }

            upsertMessage(newMessage);


            const llmResponse = await llmResponsePromise;

            if (llmResponse.isErr()) {
                newMessage.content = "Error: " + llmResponse.error.message;
                return err(llmResponse.error);
            }

            // Remove placeholder message
            removeMessage(newMessage.id);

            // Save AI response
            const aiMessageResult = await this.saveMessage({
                chatId: targetChat.id,
                content: llmResponse.value,
                sender: MessageSender.ASSISTANT
            });

            if (aiMessageResult.isErr()) {
                const newMessage: Message = {
                    id: generateUUID(),
                    chat_id: targetChat.id,
                    content: "Error: " + aiMessageResult.error.message,
                    sender: MessageSender.ASSISTANT,
                    timestamp: new Date().toISOString()
                }
                upsertMessage(newMessage);
                return err(aiMessageResult.error);
            }

            return ok([userMessageResult.value, aiMessageResult.value]);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to process chat message'));
        }
    }

    async deleteChat(chatId: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const chat = chats$.peek()?.[chatId];
        if (!chat) {
            return err(new Error('Chat not found'));
        }

        if (chat.is_main) {
            return err(new Error('Cannot delete main chat'));
        }

        try {
            const result = await this._dataService.deleteData('chats', {
                filter: [
                    { field: 'id', value: chatId },
                    { field: 'user_id', value: userId }
                ]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            removeChat(chatId);
            clearMessages();
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete chat'));
        }
    }
} 