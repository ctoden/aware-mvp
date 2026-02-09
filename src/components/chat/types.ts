export interface MessageProps {
    text: string;
    isUser?: boolean;
    time?: string;
}

export interface ChatBubbleProps {
    text: string;
    isUser: boolean;
}

export interface ChatHeaderProps {
    title: string;
    iconUrl: string;
    onIconPress?: () => void;
}

export interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading?: boolean;
}

export interface TypingIndicatorProps {
    isVisible: boolean;
}