import { observable } from "@legendapp/state";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Chat, getChatsArray, getMessagesForChat } from "@src/models/Chat";
import { ChatService } from "@src/services/ChatService";
import { err, ok, Result } from "neverthrow";
import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { format, isToday, isYesterday } from 'date-fns';

export interface ChatListState {
    isCreatingChat: boolean;
}

const speechBubbleEmoji = "💬";
const starEmoji = "⭐️";

export interface GroupedChats {
    [key: string]: {
        label: string;
        chats: Array<{
            id: string;
            emoji: string;
            title: string;
            content: string;
        }>;
    };
}


@injectable()
export class ChatListViewModel extends ViewModel {
    private readonly _chatService: ChatService;

    readonly state = observable<ChatListState>({
        isCreatingChat: false
    });

    constructor() {
        super('ChatListViewModel');
        this._chatService = this.addDependency(ChatService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    async createNewChat(): Promise<Result<Chat, Error>> {
        if (this.state.isCreatingChat.get()) {
            return err(new Error('Chat already creating'));
        }

        this.state.isCreatingChat.set(true);
        try {
            const result = await this._chatService.createChat({
                title: 'New Thread',
            });

            if (result.isErr()) {
                return err(result.error);
            }

            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create new chat'));
        } finally {
            this.state.isCreatingChat.set(false);
        }
    }

    getGroupedChats(): GroupedChats {
        const chatsArray = getChatsArray();
        return chatsArray.reduce<GroupedChats>((acc, chat) => {
            const date = new Date(chat.updated_at);
            let groupKey: string;
            let label: string;

            if (isToday(date)) {
                groupKey = 'today';
                label = 'Today';
            } else if (isYesterday(date)) {
                groupKey = 'yesterday';
                label = 'Yesterday';
            } else {
                groupKey = format(date, 'yyyy-MM-dd');
                label = format(date, 'MMMM d');
            }

            if (!acc[groupKey]) {
                acc[groupKey] = {
                    label,
                    chats: []
                };
            }

            const messages = getMessagesForChat(chat.id);
            const lastMessage = messages[messages.length - 1];

            acc[groupKey].chats.push({
                id: chat.id,
                emoji: chat.is_main ? starEmoji : speechBubbleEmoji,
                title: chat.title,
                content: lastMessage?.content ?? '~~~ no messages yet ~~~',
            });

            return acc;
        }, {});
    }
} 