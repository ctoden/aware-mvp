import { Result } from "neverthrow";
import { ProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";

export interface IProfessionalDevelopmentService {
    clearProfessionalDevelopment(): Promise<Result<boolean, Error>>;
    createProfessionalDevelopment(value: Partial<ProfessionalDevelopment>): Promise<Result<ProfessionalDevelopment, Error>>;
    fetchProfessionalDevelopment(userId: string): Promise<Result<ProfessionalDevelopment, Error>>;
    updateProfessionalDevelopment(updates: Partial<ProfessionalDevelopment>): Promise<Result<ProfessionalDevelopment, Error>>;
} 