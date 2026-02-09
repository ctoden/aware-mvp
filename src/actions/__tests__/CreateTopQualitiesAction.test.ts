import {CreateTopQualitiesAction} from '../topQualities/CreateTopQualitiesAction';
import {TestLlmProvider} from '@src/providers/llm/__tests__/TestLlmProvider';
import {cloneDeep} from "lodash";
import {LlmService} from '@src/services/LlmService';
import {ok} from 'neverthrow';

class TestLlmService extends LlmService {
    constructor(provider: TestLlmProvider) {
        super();
        Object.defineProperty(this, '_llmProvider', {
            value: provider,
            writable: true
        });
    }

    protected async onInitialize() {
        return ok(true);
    }

    protected async onEnd() {
        return ok(true);
    }
}

describe('CreateTopQualitiesAction', () => {
    let action: CreateTopQualitiesAction;
    let testLlmProvider: TestLlmProvider;
    let llmService: TestLlmService;

    const validQualities = {
        entries: [
            {
                title: 'Extraverted',
                level: 'Very Low',
                description: 'Description of extraversion',
                score: 3
            },
            {
                title: 'Emotional Stability',
                level: 'Low',
                description: 'Description of emotional stability',
                score: 4
            },
            {
                title: 'Agreeableness',
                level: 'Very High',
                description: 'Description of agreeableness',
                score: 8
            },
            {
                title: 'Spirituality',
                level: 'Medium',
                description: 'Description of spirituality',
                score: 6
            },
            {
                title: 'Honesty Humility',
                level: 'Highest',
                description: 'Description of honesty and humility',
                score: 7
            },
            {
                title: 'Conscientiousness',
                level: 'High',
                description: 'Description of conscientiousness',
                score: 9
            },
            {
                title: 'Rationality',
                level: 'Lowest',
                description: 'Description of rationality',
                score: 1
            },
            {
                title: 'Openness',
                level: 'High',
                description: 'Description of openness',
                score: 7
            }
        ]
    };

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        llmService = new TestLlmService(testLlmProvider);
        action = new CreateTopQualitiesAction(llmService);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        testLlmProvider.clearMockResponses();
    });

    it('should successfully parse valid LLM response', async () => {
        const testContext = 'test context';
        testLlmProvider.setNextResponse(
            JSON.stringify(validQualities)
        );
        
        const result = await action.execute(testContext);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(validQualities.entries.length);
            expect(result.value[0].title).toBe(validQualities.entries[0].title);
            expect(result.value[0].description).toBe(validQualities.entries[0].description);
        }
    });

    it('should handle invalid quality structure', async () => {
        const testContext = 'test context';
        const invalidQualities = cloneDeep(validQualities);
        delete (invalidQualities.entries[0] as any).score;
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidQualities)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should attempt to retry with malformed response', async () => {
        const testContext = 'test context';
        const malformedResponse = `Quality1 is rated as High with a score of 85 and Description 1. Quality2 is rated as Medium with a score of 65 and Description 2.`;

        testLlmProvider.clearMockResponses();
        testLlmProvider.setSupportsStructuredOutputs(false);
        testLlmProvider.setSupportsJsonResultOutput(false);

        testLlmProvider.setNthResponse(0,
            malformedResponse
        );
        testLlmProvider.setNthResponse(
            1,
            JSON.stringify(validQualities)
        );
        
        const result = await action.execute(testContext);
        if(result.isErr()) {
            console.log("Error: ", result.error.message, "\n", result.error.stack);
        }
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(validQualities.entries.length);
            expect(result.value[0].title).toBe(validQualities.entries[0].title);
        }

        // Reset provider capabilities
        testLlmProvider.setSupportsStructuredOutputs(true);
        testLlmProvider.setSupportsJsonResultOutput(true);
    });

    it('should validate quality count is exactly 8', async () => {
        const testContext = 'test context';
        const tooFewQualities = cloneDeep(validQualities);
        tooFewQualities.entries = tooFewQualities.entries.slice(0, 7);
        
        testLlmProvider.setNextResponse(
            JSON.stringify(tooFewQualities)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });
});
