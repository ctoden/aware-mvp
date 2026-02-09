export interface ChatItemProps {
    id: string;
    emoji: string;
    title: string;
    content: string;
}

export interface ChatSectionProps {
    label: string;
    chats: ChatItemProps[];
}