import { GenerateInsightArticleAction, InsightArticle } from '../aboutYou/GenerateInsightArticleAction';
import { TestLlmProvider } from '@src/providers/llm/__tests__/TestLlmProvider';
import { AboutYouSectionType } from '@src/models/UserAboutYou';
import { generateInsightArticlePrompt } from '@src/prompts/AboutYouPrompts';
import {cloneDeep} from "lodash";

describe('GenerateInsightArticleAction', () => {
    let action: GenerateInsightArticleAction;
    let testLlmProvider: TestLlmProvider;

    const validArticle: InsightArticle = {
        metadata: {
            sectionType: AboutYouSectionType.SELF_AWARENESS,
            title: "Communication Style",
            summary: "Direct and assertive communication"
        },
        content: {
            introduction: {
                text: "Your communication style is characterized by directness and clarity, making you an effective communicator in both personal and professional settings."
            },
            sections: [
                {
                    heading: "Strengths in Communication",
                    content: "You excel at conveying complex ideas in simple terms and maintaining transparency in your interactions."
                },
                {
                    heading: "Areas for Growth",
                    content: "Consider developing more flexibility in your communication approach for different audiences and situations."
                },
                {
                    heading: "Impact on Relationships",
                    content: "Your direct style builds trust but may sometimes need to be softened for more sensitive conversations."
                }
            ]
        }
    };

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        action = new GenerateInsightArticleAction(testLlmProvider);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        testLlmProvider.clearMockResponses();
    });

    it('should successfully generate and parse valid insight article', async () => {
        const params = {
            sectionType: AboutYouSectionType.SELF_AWARENESS,
            title: "Communication Style",
            description: "Direct and assertive communication"
        };

        const prompt = generateInsightArticlePrompt(params.sectionType, params.title, params.description);
        testLlmProvider.setMockResponse(prompt.content, JSON.stringify(validArticle));
        
        const result = await action.execute(params);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.metadata.title).toBe(validArticle.metadata.title);
            expect(result.value.content.introduction.text).toBe(validArticle.content.introduction.text);
            expect(result.value.content.sections).toHaveLength(3);
        }
    });

    it('should handle invalid article structure', async () => {
        const params = {
            sectionType: AboutYouSectionType.SELF_AWARENESS,
            title: "Communication Style",
            description: "Direct and assertive communication"
        };

        const invalidArticle = cloneDeep(validArticle);
        delete (invalidArticle as any).content.sections;
        
        const prompt = generateInsightArticlePrompt(params.sectionType, params.title, params.description);
        testLlmProvider.setMockResponse(prompt.content, JSON.stringify(invalidArticle));
        
        const result = await action.execute(params);
        expect(result.isErr()).toBe(true);
    });

    it('should handle malformed JSON response', async () => {
        const params = {
            sectionType: AboutYouSectionType.SELF_AWARENESS,
            title: "Communication Style",
            description: "Direct and assertive communication"
        };

        const prompt = generateInsightArticlePrompt(params.sectionType, params.title, params.description);
        testLlmProvider.setMockResponse(prompt.content, "Invalid JSON response");
        
        const result = await action.execute(params);
        expect(result.isErr()).toBe(true);
    });

    it('should handle different section types correctly', async () => {
        const params = {
            sectionType: AboutYouSectionType.RELATIONSHIPS,
            title: "Empathy in Relationships",
            description: "Strong empathy and understanding"
        };

        const relationshipsArticle: InsightArticle = {
            ...validArticle,
            metadata: {
                sectionType: AboutYouSectionType.RELATIONSHIPS,
                title: params.title,
                summary: params.description
            }
        };

        const prompt = generateInsightArticlePrompt(params.sectionType, params.title, params.description);
        testLlmProvider.setMockResponse(prompt.content, JSON.stringify(relationshipsArticle));
        
        const result = await action.execute(params);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.metadata.sectionType).toBe(AboutYouSectionType.RELATIONSHIPS);
            expect(result.value.metadata.title).toBe(params.title);
        }
    });
}); 