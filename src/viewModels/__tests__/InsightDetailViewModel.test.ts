import { InsightDetailViewModel } from '../InsightDetailViewModel';
import { withViewModel } from '../ViewModel';
import { TestLlmProvider } from '@src/providers/llm/__tests__/TestLlmProvider';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import {AboutYouSectionType, selectedAboutYou$} from '@src/models/UserAboutYou';
import { setSelectedAboutYou } from '@src/models/UserAboutYou';
import { InsightArticle } from '@src/actions/aboutYou/GenerateInsightArticleAction';
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {generateInsightArticlePrompt} from "@src/prompts/AboutYouPrompts";

describe('InsightDetailViewModel', () => {
    let testLlmProvider: TestLlmProvider;

    const mockAboutYou = {
        id: '1',
        user_id: '1',
        title: 'Communication Style',
        description: 'Direct and assertive communication',
        section_type: AboutYouSectionType.SELF_AWARENESS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const mockArticle: InsightArticle = {
        metadata: {
            sectionType: AboutYouSectionType.SELF_AWARENESS,
            title: mockAboutYou.title,
            summary: mockAboutYou.description
        },
        content: {
            introduction: {
                text: "Your communication style is characterized by directness and clarity."
            },
            sections: [
                {
                    heading: "Strengths",
                    content: "Clear and effective communication."
                },
                {
                    heading: "Areas for Growth",
                    content: "Developing more flexibility in communication."
                },
                {
                    heading: "Impact",
                    content: "Building trust through direct communication."
                }
            ]
        }
    };

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        
        // Register the LLM provider with the service
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
    });

    afterEach(async () => {
        testLlmProvider.clearMockResponses();
        setSelectedAboutYou(null);
        await testLlmProvider.end();
    });

    it('should initialize with null article and no error', async () => {
        const vm = await withViewModel(InsightDetailViewModel);
        
        expect(vm.getArticle()).toBeNull();
        expect(vm.getError()).toBeNull();
        expect(vm.isLoading()).toBeFalsy();
    });

    it('should generate insight article successfully', async () => {
        const vm = await withViewModel(InsightDetailViewModel);
        vm.clear();
        setSelectedAboutYou(mockAboutYou);

        const prompt = generateInsightArticlePrompt(mockAboutYou.section_type, mockAboutYou.title, mockAboutYou.description);
        testLlmProvider.setMockResponse(prompt.content, JSON.stringify(mockArticle));

        const result = await vm.generateInsight();
        
        expect(result.isOk()).toBe(true);
        expect(vm.getArticle()).toEqual(mockArticle);
        expect(vm.getError()).toBeNull();
        expect(vm.isLoading()).toBeFalsy();
    });

    it('should handle error when no about you entry is selected', async () => {
        const vm = await withViewModel(InsightDetailViewModel);
        vm.clear();
        setSelectedAboutYou(null);
        
        const result = await vm.generateInsight();
        
        expect(result.isErr()).toBe(true);
        expect(vm.getArticle()).toBeNull();
        expect(vm.getError()).toBe('No about you entry selected');
        expect(vm.isLoading()).toBeFalsy();
    });

    it('should handle LLM service error', async () => {
        const vm = await withViewModel(InsightDetailViewModel);
        vm.clear();
        setSelectedAboutYou(mockAboutYou);

        const prompt = generateInsightArticlePrompt(mockAboutYou.section_type, mockAboutYou.title, mockAboutYou.description);
        testLlmProvider.setMockResponse(prompt.content, "Invalid JSON");
        
        const result = await vm.generateInsight();
        
        expect(result.isErr()).toBe(true);
        expect(vm.getArticle()).toBeNull();
        expect(vm.getError()).toBeTruthy();
        expect(vm.isLoading()).toBeFalsy();
    });

    it('should clean up state on end', async () => {
        const vm = await withViewModel(InsightDetailViewModel);
        vm.clear();
        setSelectedAboutYou(mockAboutYou);

        const prompt = generateInsightArticlePrompt(mockAboutYou.section_type, mockAboutYou.title, mockAboutYou.description);
        testLlmProvider.setMockResponse(prompt.content, JSON.stringify(mockArticle));
        await vm.generateInsight();
        
        expect(vm.getArticle()).toEqual(mockArticle);
        
        await vm.end();
        
        expect(vm.getArticle()).toBeNull();
        expect(vm.getError()).toBeNull();
        expect(vm.isLoading()).toBeFalsy();
    });
}); 
