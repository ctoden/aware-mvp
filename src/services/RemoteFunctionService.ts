import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { IRemoteFunctionProvider, REMOTE_FUNCTION_PROVIDER_KEY } from "@src/providers/functions/RemoteFunctionProvider";
import { DependencyService } from "@src/core/injection/DependencyService";
import { PdfParseResponse, PdfParseType } from "@src/types/pdf";

@singleton()
export class RemoteFunctionService extends Service {
    private _functionProvider: IRemoteFunctionProvider | null = null;

    constructor() {
        super('RemoteFunctionService');
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Get the function provider
        this._functionProvider = DependencyService.resolveSafe(REMOTE_FUNCTION_PROVIDER_KEY);
        if (!this._functionProvider) {
            return err(new Error('No remote function provider registered'));
        }
        return this._functionProvider.initialize();
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (!this._functionProvider) {
            return err(new Error('No remote function provider registered'));
        }
        return this._functionProvider.end();
    }

    private ensureProvider(): Result<IRemoteFunctionProvider, Error> {
        if (!this._functionProvider) {
            return err(new Error('Remote function provider not initialized'));
        }
        return ok(this._functionProvider);
    }

    /**
     * Invoke a remote function
     * @param functionName The name of the function to invoke
     * @param args Optional arguments to pass to the function
     * @returns A Result containing the function response or an error
     */
    async invoke<T = any>(functionName: string, args?: Record<string, any>): Promise<Result<T, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.invoke<T>(functionName, args);
    }

    /**
     * Parse a PDF file and extract its text and metadata
     * @param base64 The PDF file content as a base64 string
     * @returns A Result containing the parsed PDF data or an error
     */
    async parsePdf(base64: string): Promise<Result<PdfParseType, Error>> {
        const result = await this.invoke<PdfParseResponse>('pdf-extract', {
            pdfBase64: base64
        });

        if (result.isErr()) {
            return err(result.error);
        }

        const { textBase64, metadata, pages } = result.value;

        try {
            const extractedText = atob(textBase64);
            return ok({
                text: extractedText,
                metadata,
                pages
            });
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to decode base64 text'));
        }
    }
} 