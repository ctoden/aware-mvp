import { MistralAiService } from '../MistralAiService';
import { Result } from 'neverthrow';
import { DependencyService } from "@src/core/injection/DependencyService";
import { get } from "lodash";

describe('MistralAiService', () => {
  let mistralAiService: MistralAiService;

  beforeAll(()=> {
    // KEEP THIS - jest messes up the process.env and the process.env.EXPO_PUBLIC_MISTRAL_API_KEY is undefined
    const apiKeyFromTestEnv = get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY');
    DependencyService.registerValue("MISTRAL_API_KEY", apiKeyFromTestEnv);
    DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "open-mistral-nemo");
  });

  beforeEach(async () => {
    mistralAiService = new MistralAiService();
    const result = await mistralAiService.initialize();

    expect(result.isOk()).toBe(true);
  });


  afterEach(async() => {
    await mistralAiService.end();
  })
  test('should initialize successfully', async () => {
    expect(mistralAiService.isInitialized.get()).toBe(true);
  });

  test('should return response from getResponse', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const messages = [{ role: 'user', content: 'Reply with a simple hello' }];

    const result: Result<string, Error> = await mistralAiService.getResponse(messages);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeTruthy();
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  test('should use default model if modelName is not provided', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const messages = [{ role: 'user', content: 'Reply with a simple Hello in french' }];

    const result = await mistralAiService.getResponse(messages);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeTruthy();
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  test('should use provided model if it is in the model list', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const messages = [{ role: 'user', content: 'Reply with a simple Hello in spanish' }];
    const modelName = 'mistral-small-latest';

    const result = await mistralAiService.getResponse(messages, modelName);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeTruthy();
      expect(result.value.length).toBeGreaterThan(0);
    }
  }, 10_000);

  test('should default to default model if provided model is not in the model list', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const messages = [{ role: 'user', content: 'Reply with a simple hello' }];
    const modelName = 'unknown-model';

    const result = await mistralAiService.getResponse(messages, modelName);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeTruthy();
      expect(result.value.length).toBeGreaterThan(0);
    }
  }, 10_000);

  test('should throw error if API key is not set', async () => {
    delete process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
    DependencyService.registerValue('MISTRAL_API_KEY', "");
    const result = await (new MistralAiService().initialize());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toEqual(
      'MISTRAL_API_KEY is not defined in the environment variables.'
    );
  }, 10_000);
}); 