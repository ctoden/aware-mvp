import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { ILlmProvider } from "@src/providers/llm/LlmProvider";
import { CreateProfessionalDevelopmentAction } from "./CreateProfessionalDevelopmentAction";
import { IProfessionalDevelopmentService } from "./IProfessionalDevelopmentService";
import { user$ } from "@src/models/SessionModel";
import { getProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";
import { isNil } from "lodash";

export class GenerateAndSaveProfessionalDevelopmentAction implements Action<boolean> {
    name = "GenerateAndSaveProfessionalDevelopmentAction";
    description = "Generate professional development using LLM and save it to the database";

    constructor(
        private llmProvider: ILlmProvider,
        private professionalDevelopmentService: IProfessionalDevelopmentService
    ) {}

    async execute<T = boolean>(context: string): Promise<Result<T, Error>> {
        // Get the current user ID
        const currentUser = user$.peek();
        if (!currentUser || !currentUser.id) {
            return err(new Error("No user found")) as Result<T, Error>;
        }

        // Check if professional development already exists for the user
        const professionalDevelopment = getProfessionalDevelopment();
        if(!isNil(professionalDevelopment) && professionalDevelopment?.key_terms?.length > 0) {
            console.log("~~~~ GenerateAndSaveProfessionalDevelopmentAction: Professional development already exists - skipping");
            return ok(true) as Result<T, Error>;
        }

        // Generate professional development using the CreateProfessionalDevelopmentAction
        const createAction = new CreateProfessionalDevelopmentAction(this.llmProvider);
        const profDevResults = await createAction.execute(context);
        
        if (profDevResults.isErr()) {
            console.error("~~~ Error generating professional development: ", profDevResults.error);
            return err(profDevResults.error) as Result<T, Error>;
        }

        console.log("~~~~ GenerateAndSaveProfessionalDevelopmentAction execute profDevResults: ", profDevResults.value);
        
        // Save the generated professional development
        const result = await this.professionalDevelopmentService.createProfessionalDevelopment({
            ...profDevResults.value,
            user_id: currentUser.id
        });
        
        if (result.isErr()) {
            console.error("~~~ Error creating professional development: ", result.error);
            return err(result.error) as Result<T, Error>;
        }

        return ok(true) as Result<T, Error>;
    }
} 