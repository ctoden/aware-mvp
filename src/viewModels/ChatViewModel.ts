import {observable} from "@legendapp/state";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {
  autoUserMsgToSend$,
  chats$,
  currentChatId$,
  getMessagesForChat,
  Message,
  messages$,
  MessageSender,
  removeMessage,
  upsertMessage
} from "@src/models/Chat";
import {userProfile$} from "@src/models/UserProfile";
import {LlmMessage} from "@src/providers/llm/LlmProvider";
import {ChatService} from "@src/services/ChatService";
import {LlmService} from "@src/services/LlmService";
import {err, ok, Result} from "neverthrow";
import {injectable} from "tsyringe";
import {ViewModel} from "./ViewModel";
import {generateUUID} from "@src/utils/UUIDUtil";

export interface ChatState {
  currentChatId: string | null;
  currentChatTitle: string | null;
  inputText: string;
  isLoading: boolean;
}

@injectable()
export class ChatViewModel extends ViewModel {
  private readonly _llmService: LlmService;
  private readonly _chatService: ChatService;

  readonly state = observable<ChatState>({
    currentChatId: null,
    currentChatTitle: null,
    inputText: '',
    isLoading: false
  });

  constructor() {
    super('ChatViewModel');
    this._llmService = this.addDependency(LlmService);
    this._chatService = this.addDependency(ChatService);
  }

  protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    // Find or wait for main thread
    const currentChatId = currentChatId$.peek();
    console.log("~~~ ChatViewModel onInitialize: currentChatId", currentChatId);
    if (currentChatId) {
      this.state.currentChatId.set(currentChatId);
      const thread = Object.values(chats$.peek() ?? {}).find(chat => chat.id === currentChatId);
      if (thread) {
        this.state.currentChatTitle.set(thread.title);
      }
    } else {  
      const mainThread = Object.values(chats$.peek() ?? {}).find(chat => chat.is_main);
      console.log("~~~~ ChatViewModel mainThread", mainThread?.title ?? "--- can't find it....");
      if (mainThread) {
        this.state.currentChatId.set(mainThread.id);
        this.state.currentChatTitle.set(mainThread.title);
      }
    }

    // Subscribe to chats$ changes to detect when main thread is created
    this.onChange(chats$, (change) => {
      if (!this.state.currentChatId.peek()) {
        const mainThread = Object.values(change.value ?? {}).find(chat => chat.is_main);
        console.log("~~~~ ChatViewModel mainThread", mainThread?.title ?? "--- can't find it....");
        if (mainThread) {
          this.state.currentChatId.set(mainThread.id);
        }
      }
    });

    this.onChange(this.state.currentChatId, (change) => {
        console.log("~~~~ ChatViewModel currentChatId", change.value);
        this.switchChat(change.value);
    })

    return ok(true);
  }

  protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    return ok(true);
  }

  setInputText(text: string): void {
    this.state.inputText.set(text);
  }

  async switchChat(chatId: string | null): Promise<Result<boolean, Error>> {
    if(!chatId) {
      // find main thread chat
      const mainThread = Object.values(chats$.peek() ?? {}).find(chat => chat.is_main);
      if (mainThread) {
        this.state.currentChatId.set(mainThread.id);
        this.state.currentChatTitle.set(mainThread.title);
      }
      return ok(true);
    }
    const chat = chats$.peek()?.[chatId];
    if (!chat) {
      return err(new Error('Chat not found'));
    }
    this.state.currentChatId.set(chatId);
    this.state.currentChatTitle.set(chat.title);
    return ok(true);
  }

  private formatMessagesForLLM(): LlmMessage[] {
    return this._chatService.formatMessagesForLLM(this.state.currentChatId.peek());
  }

  get hasAutoMessage(): boolean {
    return autoUserMsgToSend$.get() !== null;
  }

  async sendAutoMessage(): Promise<Result<boolean, Error>> {
    const msg = autoUserMsgToSend$.get();
    if (msg?.text) {
      this.state.inputText.set(msg.text);
      autoUserMsgToSend$.set(null);
      return this.sendMessage();
    }
    return ok(false);
  }

  async sendMessage(): Promise<Result<boolean, Error>> {
    const chatId = this.state.currentChatId.peek();
    if (!chatId) {
      return err(new Error('No chat selected'));
    }

    const inputText = this.state.inputText.get();
    const value = inputText.trim();
    if (!value || this.state.isLoading.get()) {
      return ok(false);
    }

    // Send user message
    this.state.isLoading.set(true);
    try {
      const sendResult = await this._chatService.saveMessage({
        chatId,
        content: inputText,
        sender: MessageSender.USER
      });

      if (sendResult.isErr()) {
        return err(sendResult.error);
      }

      this.state.inputText.set('');

      // Get AI response
      const formattedMessages = this.formatMessagesForLLM();

      const responsePromise = this._llmService.chat(formattedMessages);
      // Create placeholder message for assistant's response
      const newMessage: Message = {
        id: generateUUID(),
        chat_id: chatId,
        content: "",
        sender: MessageSender.ASSISTANT,
        timestamp: new Date().toISOString()
      }

      upsertMessage(newMessage);

      const response = await responsePromise;
      
      if (response.isErr()) {
        // Remove placeholder message on error
        removeMessage(newMessage.id);
        console.error('Failed to get AI response:', response.error);
        return err(response.error);
      }

      // Remove placeholder message
      removeMessage(newMessage.id);

      // Update placeholder message with actual response
      const aiMessageResult = await this._chatService.saveMessage({
        chatId,
        sender: MessageSender.ASSISTANT,
        content: response.value
      });

      if (aiMessageResult.isErr()) {
        return err(aiMessageResult.error);
      }

      return ok(true);
    } catch (error) {
      console.error('Error in chat flow:', error);
      return err(error instanceof Error ? error : new Error('Failed to process chat message'));
    } finally {
      this.state.isLoading.set(false);
    }
  }

  clearInputText(): void {
    this.state.inputText.set('');
  }
} 