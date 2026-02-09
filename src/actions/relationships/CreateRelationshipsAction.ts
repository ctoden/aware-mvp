import { ok, err, Result } from "neverthrow";
import { ILlmProvider } from "@src/providers/llm/LlmProvider";
import { UserRelationship } from "@src/models/UserRelationship";
import { Prompt } from "@src/prompts/Prompt";
import {
    generateUserRelationshipsKeyTermsPrompt,
    generateUserRelationshipsDescriptionPrompt,
    generateUserRelationshipsCommunicationStylePrompt,
    generateUserRelationshipsConflictResolutionStylePrompt,
    generateUserRelationshipsAttachmentStylePrompt,
    userRelationshipsUserContextPrompt,
    retryUserRelationshipsKeyTermsPrompt,
    retryUserRelationshipsDescriptionPrompt,
    retryUserRelationshipsCommunicationStylePrompt,
    retryUserRelationshipsConflictResolutionStylePrompt,
    retryUserRelationshipsAttachmentStylePrompt,
    KeyTermsSchema,
    DescriptionSchema,
    CommunicationStyleSchema,
    ConflictResolutionStyleSchema,
    AttachmentStyleSchema,
    StrictKeyTermsSchema,
    StrictDescriptionSchema,
    StrictCommunicationStyleSchema,
    StrictConflictResolutionStyleSchema,
    StrictAttachmentStyleSchema
} from "@src/prompts/UserRelationships";

export class CreateRelationshipsAction {
    constructor(
        private readonly llmProvider: ILlmProvider
    ) {}

    async execute(): Promise<Result<Partial<UserRelationship>, Error>> {
        try {
            // Get key terms
            const keyTermsResult = await this.getKeyTerms();
            if (keyTermsResult.isErr()) return err(keyTermsResult.error);
            const keyTerms = keyTermsResult.value;

            // Get description
            const descriptionResult = await this.getDescription();
            if (descriptionResult.isErr()) return err(descriptionResult.error);
            const description = descriptionResult.value;

            // Get communication style
            const communicationStyleResult = await this.getCommunicationStyle();
            if (communicationStyleResult.isErr()) return err(communicationStyleResult.error);
            const communicationStyle = communicationStyleResult.value;

            // Get conflict resolution style
            const conflictResolutionStyleResult = await this.getConflictResolutionStyle();
            if (conflictResolutionStyleResult.isErr()) return err(conflictResolutionStyleResult.error);
            const conflictResolutionStyle = conflictResolutionStyleResult.value;

            // Get attachment style
            const attachmentStyleResult = await this.getAttachmentStyle();
            if (attachmentStyleResult.isErr()) return err(attachmentStyleResult.error);
            const attachmentStyle = attachmentStyleResult.value;

            return ok({
                key_terms: keyTerms,
                description,
                communication_style_title: communicationStyle.title,
                communication_style_description: communicationStyle.description,
                conflict_style_title: conflictResolutionStyle.title,
                conflict_style_description: conflictResolutionStyle.description,
                attachment_style_title: attachmentStyle.title,
                attachment_style_description: attachmentStyle.description
            });
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    private async getKeyTerms(): Promise<Result<string[], Error>> {
        try {
            const keyTermsPrompt = generateUserRelationshipsKeyTermsPrompt(!this.llmProvider.supportsStructuredOutputs);
            const keyTermsResponse = await this.llmProvider.generateStructuredOutput([keyTermsPrompt], KeyTermsSchema);
            if (keyTermsResponse.isErr()) return err(keyTermsResponse.error);

            const validationResult = KeyTermsSchema.safeParse(keyTermsResponse.value);
            
            if (!validationResult.success) {
                const retryPrompt = retryUserRelationshipsKeyTermsPrompt();
                const retryResponse = await this.llmProvider.generateStructuredOutput([keyTermsPrompt, retryPrompt], KeyTermsSchema);
                if (retryResponse.isErr()) return err(retryResponse.error);

                const strictValidation = StrictKeyTermsSchema.safeParse(retryResponse.value);
                if (!strictValidation.success) {
                    return err(new Error('Failed to get valid key terms after retry'));
                }
                return ok(strictValidation.data.entries.key_terms);
            }

            const strictValidation = StrictKeyTermsSchema.safeParse(keyTermsResponse.value);
            if (!strictValidation.success) {
                return err(new Error('Key terms validation failed'));
            }
            return ok(strictValidation.data.entries.key_terms);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to get key terms'));
        }
    }

    private async getDescription(): Promise<Result<string, Error>> {
        try {
            const descriptionPrompt = generateUserRelationshipsDescriptionPrompt(!this.llmProvider.supportsStructuredOutputs);
            const descriptionResponse = await this.llmProvider.generateStructuredOutput([descriptionPrompt], DescriptionSchema);
            if (descriptionResponse.isErr()) return err(descriptionResponse.error);

            const validationResult = DescriptionSchema.safeParse(descriptionResponse.value);
            
            if (!validationResult.success) {
                const retryPrompt = retryUserRelationshipsDescriptionPrompt();
                const retryResponse = await this.llmProvider.generateStructuredOutput([descriptionPrompt, retryPrompt], DescriptionSchema);
                if (retryResponse.isErr()) return err(retryResponse.error);

                const strictValidation = StrictDescriptionSchema.safeParse(retryResponse.value);
                if (!strictValidation.success) {
                    return err(new Error('Failed to get valid description after retry'));
                }
                return ok(strictValidation.data.entries.description);
            }

            const strictValidation = StrictDescriptionSchema.safeParse(descriptionResponse.value);
            if (!strictValidation.success) {
                return err(new Error('Description validation failed'));
            }
            return ok(strictValidation.data.entries.description);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to get description'));
        }
    }

    private async getCommunicationStyle(): Promise<Result<{ title: string; description: string }, Error>> {
        try {
            const stylePrompt = generateUserRelationshipsCommunicationStylePrompt(!this.llmProvider.supportsStructuredOutputs);
            const styleResponse = await this.llmProvider.generateStructuredOutput([stylePrompt], CommunicationStyleSchema);
            if (styleResponse.isErr()) return err(styleResponse.error);

            const validationResult = CommunicationStyleSchema.safeParse(styleResponse.value);
            
            if (!validationResult.success) {
                const retryPrompt = retryUserRelationshipsCommunicationStylePrompt();
                const retryResponse = await this.llmProvider.generateStructuredOutput([stylePrompt, retryPrompt], CommunicationStyleSchema);
                if (retryResponse.isErr()) return err(retryResponse.error);

                const strictValidation = StrictCommunicationStyleSchema.safeParse(retryResponse.value);
                if (!strictValidation.success) {
                    return err(new Error('Failed to get valid communication style after retry'));
                }
                return ok(strictValidation.data.entries);
            }

            const strictValidation = StrictCommunicationStyleSchema.safeParse(styleResponse.value);
            if (!strictValidation.success) {
                return err(new Error('Communication style validation failed'));
            }
            return ok(strictValidation.data.entries);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to get communication style'));
        }
    }

    private async getConflictResolutionStyle(): Promise<Result<{ title: string; description: string }, Error>> {
        try {
            const stylePrompt = generateUserRelationshipsConflictResolutionStylePrompt(!this.llmProvider.supportsStructuredOutputs);
            const styleResponse = await this.llmProvider.generateStructuredOutput([stylePrompt], ConflictResolutionStyleSchema);
            if (styleResponse.isErr()) return err(styleResponse.error);

            const validationResult = ConflictResolutionStyleSchema.safeParse(styleResponse.value);
            
            if (!validationResult.success) {
                const retryPrompt = retryUserRelationshipsConflictResolutionStylePrompt();
                const retryResponse = await this.llmProvider.generateStructuredOutput([stylePrompt, retryPrompt], ConflictResolutionStyleSchema);
                if (retryResponse.isErr()) return err(retryResponse.error);

                const strictValidation = StrictConflictResolutionStyleSchema.safeParse(retryResponse.value);
                if (!strictValidation.success) {
                    return err(new Error('Failed to get valid conflict resolution style after retry'));
                }
                return ok(strictValidation.data.entries);
            }

            const strictValidation = StrictConflictResolutionStyleSchema.safeParse(styleResponse.value);
            if (!strictValidation.success) {
                return err(new Error('Conflict resolution style validation failed'));
            }
            return ok(strictValidation.data.entries);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to get conflict resolution style'));
        }
    }

    private async getAttachmentStyle(): Promise<Result<{ title: string; description: string }, Error>> {
        try {
            const stylePrompt = generateUserRelationshipsAttachmentStylePrompt(!this.llmProvider.supportsStructuredOutputs);
            const styleResponse = await this.llmProvider.generateStructuredOutput([stylePrompt], AttachmentStyleSchema);
            if (styleResponse.isErr()) return err(styleResponse.error);

            const validationResult = AttachmentStyleSchema.safeParse(styleResponse.value);
            
            if (!validationResult.success) {
                const retryPrompt = retryUserRelationshipsAttachmentStylePrompt();
                const retryResponse = await this.llmProvider.generateStructuredOutput([stylePrompt, retryPrompt], AttachmentStyleSchema);
                if (retryResponse.isErr()) return err(retryResponse.error);

                const strictValidation = StrictAttachmentStyleSchema.safeParse(retryResponse.value);
                if (!strictValidation.success) {
                    return err(new Error('Failed to get valid attachment style after retry'));
                }
                return ok(strictValidation.data.entries);
            }

            const strictValidation = StrictAttachmentStyleSchema.safeParse(styleResponse.value);
            if (!strictValidation.success) {
                return err(new Error('Attachment style validation failed'));
            }
            return ok(strictValidation.data.entries);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to get attachment style'));
        }
    }
} 