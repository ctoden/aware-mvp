import {injectable, singleton} from 'tsyringe';
import {Result, ok, err} from 'neverthrow';
import {DependencyService} from '@src/core/injection/DependencyService';
import {Mistral} from '@mistralai/mistralai';
import {Service} from "@src/services/Service";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import {Nilable} from "@src/core/types/Nullable";
import { getFromEnv } from "@src/utils/EnvUtils";

@singleton()
export class MistralAiService extends Service {
    private _mistralClient: Nilable<Mistral>;
    private readonly _modelNames: string[] = [
        'mistral-large-latest',
        'ministral-3b-latest',
        'ministral-8b-latest',
        'mistral-small-latest',
        'open-mistral-nemo',
        'pixtral-large-latest',
    ];
    private readonly _defaultModel: string = DependencyService.resolveSafe<string>('MISTRAL_DEFAULT_MODEL') ?? 'ministral-8b-latest';

    constructor() {
        super('MistralAiService');
    }

    async generateImageSummary(base64Image: string, mimeType: string): Promise<Result<string, Error>> {
        if (!this._mistralClient) {
            return err(new Error('Mistral client is not initialized'));
        }
        try {
            const response = await this._mistralClient.chat.complete({
                model: "pixtral-large-latest",
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: "Act as an OCR and extract the text from the image." },
                      {
                        type: "image_url",
                        imageUrl: {
                          url: `data:${mimeType};base64,${base64Image}`,
                        },
                      },
                    ],
                  },
                ],
              });
            
              if(!response || !response.choices) {
                  console.log("Error? response is null");
                  return err(new Error("Response not found"));
              }
          
              console.log(response.choices[0].message.content);
              return ok(response.choices[0].message.content?.toString() ?? "");
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        const dependencyApiKey = DependencyService.resolveSafe<string>('MISTRAL_API_KEY');
        const apiKey = getFromEnv('EXPO_PUBLIC_MISTRAL_API_KEY', dependencyApiKey ?? undefined);
        if (!apiKey) {
            return err(new Error('MISTRAL_API_KEY is not defined in the environment variables.'));
        }
        this._mistralClient = new Mistral({apiKey});
        return BR_TRUE;
    }
    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    async getResponse(messages: any[], modelName?: string): Promise<Result<string, Error>> {
        if(!this._mistralClient) {
            return err(new Error('Mistral client is not initialized'));
        }
        try {
            const model =
                modelName && this._modelNames.includes(modelName) ? modelName : this._defaultModel;
            const response = await this._mistralClient.chat.complete({
                model,
                messages,
            });

            if (response.choices) {
                const fullResponse = response.choices[0].message.content;
                return ok(fullResponse?.toString() ?? "");
            }
            return err(new Error("Response not found"));
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    async getResponseStream(messages: any[], modelName?: string): Promise<Result<string, Error>> {
        if(!this._mistralClient) {
            return err(new Error('Mistral client is not initialized'));
        }
        try {
            const model =
                modelName && this._modelNames.includes(modelName) ? modelName : this._defaultModel;
            const stream = await this._mistralClient.chat.stream({
                model,
                messages,
            });

            let responseChunks: string[] = [];
            for await (const chunk of stream) {
                if (chunk.data.choices[0]?.delta?.content) {
                    responseChunks.push(chunk.data.choices[0].delta.content.toString());
                }
            }

            const fullResponse = responseChunks.join('');
            return ok(fullResponse);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }
    // TODO: move to a command
    async generateSummary(text: string): Promise<Result<string, Error>> {
        const userProfilePrompt = `Generate a concise, professional, and slightly motivational summary for 
        the user's profile. The summary should synthesize key insights from the user's personality test results. 
        Highlight the user's core strengths, motivations, and overall approach to life, emphasizing positive aspects of
        the user's personality. The tone should be empowering and encouraging, giving the user a sense of clarity and 
        confidence about their unique qualities. Keep the length to 4 sentences maximum. Word it as if you are speaking
        to the user directly and not as if you are a chatbot. Do not include any other information in the summary; Do not include
        disclaimers or other information that is not relevant to the user's profile. The user understands they ar working with
        a chatbot and has read the disclaimers.`;

        const messages = [
            {
                role: 'system',
                content: userProfilePrompt,
            },
            {
                role: 'user',
                content: text,
            },
        ];
        return this.getResponse(messages);
    }
} 
