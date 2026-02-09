import { LlmMessage } from "./LlmProvider";
import Mustache from "mustache";

export class LlmSystemMessage {
    private systemMessageTemplate: string | null = null;
    private systemMessageVars: Record<string, any> | null = null;
    private cachedSystemMessage: LlmMessage | null = null;

    setSystemMessage(msgTemplate: string, vars?: Record<string, any>): void {
        this.systemMessageTemplate = msgTemplate;
        this.systemMessageVars = vars ?? null;
        
        const content = this.systemMessageVars 
            ? Mustache.render(this.systemMessageTemplate, this.systemMessageVars)
            : this.systemMessageTemplate;

        this.cachedSystemMessage = {
            role: "system",
            content
        };
    }

    getSystemMessage(): LlmMessage | null {
        return this.cachedSystemMessage;
    }

    addSystemMessage(messages: LlmMessage[]): LlmMessage[] {
        const systemMessage = this.getSystemMessage();
        if (!systemMessage) {
            return messages;
        }

        // Check if first message is already a system message
        if (messages.length > 0 && messages[0].role === 'system') {
            return messages;
        }

        return [systemMessage, ...messages];
    }
} 