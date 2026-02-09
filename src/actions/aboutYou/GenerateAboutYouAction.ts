import { err, ok, Result } from "neverthrow";
import { Action } from "@src/actions/Action";
import { IAboutYouService } from "./IAboutYouService";
import { ftuxState$ } from "@src/models/FtuxModel";
import { CreateAboutYouAction } from "./CreateAboutYouAction";
import { ILlmProvider } from "@src/providers/llm/LlmProvider";
import { AboutYouSectionType } from "@src/models/UserAboutYou";

export class GenerateAboutYouAction implements Action<boolean> {
    name = "GenerateAboutYouAction";
    description = "Generate about you data after FTUX completion";

    constructor(
        private aboutYouService: IAboutYouService,
        private llmProvider: ILlmProvider
    ) {}

    async execute<T = boolean>(): Promise<Result<T, Error>> {
        // Only generate if FTUX is completed
        if (!ftuxState$.peek().hasCompletedFTUX) {
            return ok(true) as Result<T, Error>;
        }

        console.log("~~~~ GenerateAboutYouAction: Generating about you data");

        try {
            const sections = [
                AboutYouSectionType.SELF_AWARENESS,
                AboutYouSectionType.RELATIONSHIPS,
                AboutYouSectionType.CAREER_DEVELOPMENT
            ];

            // Clear existing entries
            const clearResult = await this.aboutYouService.clearAboutYouEntries();
            if (clearResult.isErr()) {
                return err(clearResult.error) as Result<T, Error>;
            }

            // Generate new entries for each section
            for (const sectionType of sections) {
                const createAction = new CreateAboutYouAction(this.llmProvider, sectionType);
                const result = await createAction.execute("");
                if (result.isErr()) {
                    return err(result.error) as Result<T, Error>;
                }

                // Ensure we only take a maximum of 5 entries per section
                const entriesToCreate = result.value.slice(0, 5);
                
                // Create entries for this section
                for (const entry of entriesToCreate) {
                    const createResult = await this.aboutYouService.createAboutYouEntry(entry, sectionType);
                    if (createResult.isErr()) {
                        return err(createResult.error) as Result<T, Error>;
                    }
                }
            }

            return ok(true) as Result<T, Error>;
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error))) as Result<T, Error>;
        }
    }
} 