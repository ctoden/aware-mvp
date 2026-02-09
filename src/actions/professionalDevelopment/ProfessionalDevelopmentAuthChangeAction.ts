import { setProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";
import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { IProfessionalDevelopmentService } from "./IProfessionalDevelopmentService";

export class ProfessionalDevelopmentAuthChangeAction implements Action<boolean> {
    name = "ProfessionalDevelopmentAuthChangeAction";
    description = "Updates professional development when user authentication changes";

    constructor(private professionalDevelopmentService: IProfessionalDevelopmentService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        try {
            const userId = payload?.user?.id || payload?.id;
            if (userId) {
                const result = await this.professionalDevelopmentService.fetchProfessionalDevelopment(userId);
                
                if (result.isOk()) {
                    setProfessionalDevelopment(result.value);
                    return ok(true as unknown as T);
                } else {
                    console.error("~~~ Error fetching professional development: ", result.error);
                    return err(result.error) as unknown as Result<T, Error>;
                }
            } else {
                // Don't clear data when there's no session
                return ok(true as unknown as T);
            }
        } catch (error) {
            console.error("~~~ Error in ProfessionalDevelopmentAuthChangeAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in ProfessionalDevelopmentAuthChangeAction")) as unknown as Result<T, Error>;
        }
    }
} 