import { DependencyService } from "@src/core/injection/DependencyService";
import { isAuthenticated$ } from "@src/models/SessionModel";
import { LlmService } from "@src/services/LlmService";
import { RemoteFunctionService } from "@src/services/RemoteFunctionService";
import { DocumentPickerAsset } from "expo-document-picker";
import { err, ok, Result } from "neverthrow";

export type FileUploadProgressInfo = {
    type: 'info' | 'success' | 'error',
    text1: string,
    text2: string,
}

export type FileUploadProgressCallback = (progressInfo: FileUploadProgressInfo) => void;

export const getImageMimeType = (ext: string): string => {
    switch (ext.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        default:
            return `image/${ext}`;
    }
};

async function processPdfAssessment(pdfBase64: string, remoteFunctionService: RemoteFunctionService): Promise<Result<string, Error>> {
    let results: Result<string, Error> = err(new Error('Unknown error occurred'));
    try {
        const pdfResult = await remoteFunctionService.parsePdf(pdfBase64);
        if (pdfResult.isErr()) {
            return err(pdfResult.error);
        }

        results = ok(pdfResult.value.text);

    } catch (error) {

        results = err(error instanceof Error ? error : new Error('Unknown error occurred'));
    }

    return results;
}

async function ocrViaLlm(imageBase64: string, mimeType: string, llmService: LlmService): Promise<Result<string, Error>> {
    console.log("Processing image assessment", mimeType);

    let results: Result<string, Error> = err(new Error('Unknown error occurred'));
    try {
        const result = await llmService.generateImageSummary(imageBase64, mimeType);

        if (result.isOk()) {
            const ocrResults = result.value;
            results = ok(ocrResults);
        } else {
            results = err(result.error);
        }
    } catch (error) {
        results = err(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
    return results;
}

export async function getTextFromAssessmentFile(file: DocumentPickerAsset, cb?: FileUploadProgressCallback): Promise<Result<string, Error>> {
    if (!file) {
        return err(new Error('No file selected'));
    }
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
        return err(new Error('File has no extension, unknown file type'));
    }

    if (!isAuthenticated$.get()) {
        return err(new Error('User is not authenticated'));
    }

    const remoteFunctionService = DependencyService.resolve(RemoteFunctionService);
    const llmService = DependencyService.resolve(LlmService);

    if (fileExtension === 'txt') {
        const response = await fetch(file.uri);
        const text = await response.text();
        return ok(text)
    } else if (fileExtension === 'pdf') {
        if (cb) {
            cb({
                type: 'info',
                text1: 'Processing PDF File',
                text2: 'Processing PDF files, please wait this can take a while',
            });
        }
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise<Result<string, Error>>((resolve) => {
            const clearTimeOut = setTimeout(() => resolve(err(new Error('Failed to read file in time'))), 60_000);
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(',')[1];
                if (base64data) {
                    resolve(await processPdfAssessment(base64data, remoteFunctionService));
                    clearTimeout(clearTimeOut);
                } else {
                    clearTimeout(clearTimeOut);
                    resolve(err(new Error('Failed to read file')));
                }
            };
        });

    } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
        if (cb) {
            cb({
                type: 'info',
                text1: 'Processing Image (wait)',
                text2: 'Please wait, this can take a while',
            });
        }
        // Convert image to Base64
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise((resolve) => {
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const clearTimeOut = setTimeout(() => resolve(err(new Error('Failed to read file in time'))), 300_000);
                const base64data = reader.result?.toString().split(',')[1];
                if (base64data) {

                    const mimeType = file.mimeType ?? getImageMimeType(fileExtension);
                    resolve(await ocrViaLlm(base64data, mimeType, llmService));
                    clearTimeout(clearTimeOut);
                } else {
                    clearTimeout(clearTimeOut);
                    resolve(err(new Error('Failed to read file')));
                }
            };
        });

    } else {
        return err(new Error('Unsupported File Type'));
    }
}
