import {observable} from "@legendapp/state";
import {Nilable} from "@src/core/types/Nullable";
import {clone, cloneDeep} from "lodash";

export enum MessageSender {
    USER = 'user',
    ASSISTANT = 'assistant'
}

export interface Message {
    id: string;
    chat_id: string;
    sender: MessageSender;
    content: string;
    timestamp: string;
}

export interface Chat {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_main: boolean;
}

export interface Chats {
    [key: string]: Chat;
}

export interface Messages {
    [key: string]: Message;
}

// Create observable states
export const chats$ = observable<Nilable<Chats>>(null);
export const messages$ = observable<Nilable<Messages>>(null);
export const currentChatId$ = observable<Nilable<string>>(null);
export const autoUserMsgToSend$ = observable<Nilable<{text: string}>>(null);
// Helper functions for chats
export function getChatsArray(): Chat[] {
    const values = chats$.peek();
    if (!values) return [];
    return Object.values(values);
}

export function upsertChat(chat: Chat): void {
    const values = clone(chats$.peek() ?? {});
    values[chat.id] = chat;
    chats$.set(values);
}

export function removeChat(id: string): void {
    const values = chats$.peek();
    if (!values) return;
    
    const newValues = { ...values };
    delete newValues[id];
    chats$.set(newValues);
}

export function clearChats(): void {
    chats$.set(null);
}

export function messagesFromChat(chatMessages: Messages, id: string): Message[] {
    return Object.values(chatMessages)
        .filter(messages => messages.chat_id === id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Helper functions for messages
export function getMessagesForChat(chatId: string): Message[] {
    const values = messages$.peek();
    if (!values) return [];
    return Object.values(values)
        .filter(msg => msg.chat_id === chatId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function upsertMessage(message: Message): void {
    const values = cloneDeep(messages$.peek() ?? {});
    values[message.id] = message;
    messages$.set(values);
}

export function removeMessage(id: string): void {
    const values = cloneDeep(messages$.peek() ?? {});
    if (!values) return;
    
    const newValues = { ...values };
    delete newValues[id];
    messages$.set(newValues);
}

export function clearMessages(): void {
    messages$.set(null);
}

export function findMainChat(): Chat | null {
    const chatsMap = chats$.peek();
    if (!chatsMap) return null;
    
    return Object.values(chatsMap).find(chat => chat.is_main) ?? null;
}

export function clearMessagesForChat(chatId: string): void {
    const values = cloneDeep(messages$.peek() ?? {});
    if (!values) return;
    
    Object.keys(values).forEach(key => {
        if (values[key].chat_id === chatId) {
            delete values[key];
        }
    });
    messages$.set(values);
} 