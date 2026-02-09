The following is an example of how to use the Mistral AI model to create a chat application with limited memory. It is using the most recent mistral typescript library.

```typescript
import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";
import prompts from "prompts";
import ora from "ora";

dotenv.config();

async function main() {
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    const model = process.env.MODEL;
    if (!mistralApiKey) {
        throw new Error("Mistral API Key is not defined in the environment variables.");
    }   

    if (!model) {
        throw new Error("Model is not defined in the environment variables.");
    }

    console.log(`Mistral API Key: ${mistralApiKey.substring(0, 3)}...${mistralApiKey.substring(mistralApiKey.length - 3)}`);
    console.log(`Using model: ${model}`);

    const client = new Mistral({ apiKey: mistralApiKey });
    
    let messages: any[] = [{
        role: "system",
        content: "Act as Aware Bot.Aware Bot is a helpful assistant that can help users understand themselves better by distilling results from personality tests and assessments into personalized content. Additionally, Aware Bot acts as a conversational assistant that responds to user prompts by interpreting their Personality Scores. Aware Bot uses common American colloquialisms and idioms to add a sense of familiarity to interactions with users. It is a creative writer, adding delightful turns of phrase on occasion to add some flair. Aware Bot is never sterile or robotic and can be poetic at times, while remaining grounded in scientific knowledge about the human psyche. Emojis like 🔮✨🤍🦋🌈 are sometimes used, but only 1 or 2 at a time and never when the user is discussing sad, serious, or frustrating topics. Aware Bot always writes titles, headers, and subheaders in sentence case, and avoids unnecessary repetition and redundancy."
    }];
    do {
        const response = await prompts({
            type: 'text',
            name: 'input',
            message: 'Type something (or "quit"/"exit" to end):',
        });
    
        // Check for exit conditions
        if (response.input.toLowerCase() === 'quit' || response.input.toLowerCase() === 'exit') {
            console.log('Goodbye!');
            break;
        }
    
        const message = {
            role: "user",
            content: response.input,
        };

        if (messages.length > 9) {
            messages = messages.slice(1);
        }

        messages.push(message);

        const spinner = ora('Getting Aware Bot response...').start();
        
        try {
            const stream = await client.chat.stream({
                model,
                messages,
            });

            let responseChunks: string[] = [];
            for await (const chunk of stream) {
                if (chunk.data.choices[0]?.delta?.content) {
                    responseChunks.push(chunk.data!.choices[0].delta.content.toString());
                }
            }

            const fullResponse = responseChunks.join('');
            spinner.succeed('Got response!');
            console.log('\nAware Bot:', fullResponse, '\n');

            messages.push({
                role: "assistant",
                content: fullResponse
            });
        } catch (error) {
            spinner.fail('Error getting response');
            console.error('Error:', error);
        }
    } while (true);
}

main().catch(console.error);
```
