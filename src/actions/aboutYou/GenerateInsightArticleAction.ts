import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { ILlmProvider, LlmMessage, LlmModelConfig } from "@src/providers/llm/LlmProvider";
import { AboutYouSectionType } from "@src/models/UserAboutYou";
import { generateInsightArticlePrompt } from "@src/prompts/AboutYouPrompts";
import { z } from "zod";

export interface InsightArticleSection {
    heading: string;
    content: string;
}

export interface InsightArticle {
    metadata: {
        sectionType: AboutYouSectionType;
        title: string;
        summary: string;
    };
    content: {
        introduction: {
            text: string;
        };
        sections: InsightArticleSection[];
    };
}

const InsightArticleSectionSchema = z.object({
    heading: z.string(),
    content: z.string()
});

const InsightArticleSchema = z.object({
    metadata: z.object({
        sectionType: z.nativeEnum(AboutYouSectionType),
        title: z.string(),
        summary: z.string()
    }),
    content: z.object({
        introduction: z.object({
            text: z.string()
        }),
        sections: z.array(InsightArticleSectionSchema)
    })
});

export class GenerateInsightArticleAction implements Action<InsightArticle> {
    name = "GenerateInsightArticleAction";
    description = "Generate an insight article using LLM based on about you entry";

    constructor(
        private llmProvider: ILlmProvider
    ) {}

    async execute<T = InsightArticle>(params: { sectionType: AboutYouSectionType; title: string; description: string }, config?: LlmModelConfig): Promise<Result<T, Error>> {
        const prompt = generateInsightArticlePrompt(params.sectionType, params.title, params.description);

        const messages: LlmMessage[] = [prompt];

        if (this.llmProvider.supportsStructuredOutputs) {
            const structuredResult = await this.llmProvider.generateStructuredOutput<InsightArticle>(messages, InsightArticleSchema, config);
            return structuredResult as Result<T, Error>;
        } else if (this.llmProvider.supportsJsonResultOutput) {
            const jsonResult = await this.llmProvider.generateJsonSchemaOutput<InsightArticle>(messages, InsightArticleSchema, config);
            return jsonResult as Result<T, Error>;
        } else {
            const chatResult = await this.llmProvider.chat(messages, config);
            if (chatResult.isErr()) {
                return err(chatResult.error);
            }
            const parseResult = await this.parseInsightArticle(chatResult.value);
            return parseResult as Result<T, Error>;
        }
    }

    private async parseInsightArticle(result: string): Promise<Result<InsightArticle, Error>> {
        try {
            const parsedArticle = InsightArticleSchema.safeParse(JSON.parse(result));

            if (!parsedArticle.success) {
                console.error("~~~ GenerateInsightArticleAction execute chat error parsing response", parsedArticle.error);
                return err(new Error('Invalid insight article response'));
            }

            return ok(parsedArticle.data);
        } catch (error) {
            console.error("~~~ GenerateInsightArticleAction execute error parsing response", error);
            return err(error instanceof Error ? error : new Error('Failed to parse insight article response'));
        }
    }
} 
