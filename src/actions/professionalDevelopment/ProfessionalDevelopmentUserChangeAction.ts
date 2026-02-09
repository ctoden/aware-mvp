import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { IProfessionalDevelopmentService } from "./IProfessionalDevelopmentService";
import { clearProfessionalDevelopment, setProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";

export class ProfessionalDevelopmentUserChangeAction implements Action<boolean> {
    name = "ProfessionalDevelopmentUserChangeAction";
    description = "Updates professional development when user changes";

    constructor(private professionalDevelopmentService: IProfessionalDevelopmentService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        try {
            const change = payload;
            const user = change?.value;
            
            if (user?.id) {
                const result = await this.professionalDevelopmentService.fetchProfessionalDevelopment(user.id);
                
                if (result.isOk()) {
                    setProfessionalDevelopment(result.value);
                    return ok(true as unknown as T);
                } else {
                    console.error("~~~ Error fetching professional development: ", result.error);
                    return err(result.error) as unknown as Result<T, Error>;
                }
            } else {
                clearProfessionalDevelopment();
                return ok(true as unknown as T);
            }
        } catch (error) {
            console.error("~~~ Error in ProfessionalDevelopmentUserChangeAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in ProfessionalDevelopmentUserChangeAction")) as unknown as Result<T, Error>;
        }
    }
} 