import { Result, ok, err } from "neverthrow";
import { LlmMessage } from "@src/providers/llm/LlmProvider";
import { AwareBotPrompt } from "@src/prompts/AwareBotPrompt";
import { UserAssessment, userAssessments$ } from "@src/models/UserAssessment";
import { UserCoreValue, userCoreValues$ } from "@src/models/UserCoreValue";
import { UserInnerCircle, userInnerCircle$ } from "@src/models/UserInnerCircle";
import { UserMainInterest, userMainInterests$ } from "@src/models/UserMainInterest";
import { ProfessionalDevelopment, professionalDevelopment$ } from "@src/models/ProfessionalDevelopment";
import { UserLongTermGoal, userLongTermGoals$ } from "@src/models/UserLongTermGoal";
import { UserShortTermGoal, userShortTermGoals$ } from "@src/models/UserShortTermGoal";
import { UserWeakness, userWeaknesses$ } from "@src/models/UserWeakness";
import { UserProfile, userProfile$ } from "@src/models/UserProfile";
import { CareerHistoryEntry, careerHistory$ } from "@src/models/CareerHistoryModel";
import dayjs from "dayjs";

export interface ILlmMessageBuilderService {
    createContextMessages(params: {
        userProfile: UserProfile | null;
        assessments: UserAssessment[];
        coreValues: UserCoreValue[];
        innerCircle: UserInnerCircle[];
        mainInterests: UserMainInterest[];
        professionalDevelopment: ProfessionalDevelopment | null;
        longTermGoals: UserLongTermGoal[];
        shortTermGoals: UserShortTermGoal[];
        weaknesses: UserWeakness[];
        careerHistory: CareerHistoryEntry[];
    }): Result<LlmMessage[], Error>;
}

export function getUserContextFromModels() {
    return {
        userProfile: userProfile$.peek(),
        assessments: userAssessments$.peek() ?? [],
        coreValues: Object.values(userCoreValues$.peek() ?? {}),
        innerCircle: userInnerCircle$.peek() ?? [],
        mainInterests: Object.values(userMainInterests$.peek() ?? {}),
        professionalDevelopment: professionalDevelopment$.peek() ?? null,
        longTermGoals: Object.values(userLongTermGoals$.peek() ?? {}),
        shortTermGoals: Object.values(userShortTermGoals$.peek() ?? {}),
        weaknesses: Object.values(userWeaknesses$.peek() ?? {}),
        careerHistory: careerHistory$.peek() ?? []
    }
}

export class LlmMessageBuilderService implements ILlmMessageBuilderService {
    createContextMessages(params: {
        userProfile: UserProfile | null;
        assessments: UserAssessment[];
        coreValues: UserCoreValue[];
        innerCircle: UserInnerCircle[];
        mainInterests: UserMainInterest[];
        professionalDevelopment: ProfessionalDevelopment | null;
        longTermGoals: UserLongTermGoal[];
        shortTermGoals: UserShortTermGoal[];
        weaknesses: UserWeakness[];
        careerHistory: CareerHistoryEntry[];
    }): Result<LlmMessage[], Error> {
        try {
            const systemMessage: LlmMessage = {
                role: 'system',
                content: AwareBotPrompt
            };

            let userContextContent = "This is some background about me:\n\n";

            // Add User Profile Information
            if (params.userProfile) {
                userContextContent += "Personal Information:\n";
                if (params.userProfile.full_name) {
                    userContextContent += `Name: ${params.userProfile.full_name}\n`;
                }
                if (params.userProfile.birth_date) {
                    const birthDate = typeof params.userProfile.birth_date === 'string' 
                        ? dayjs(params.userProfile.birth_date).toDate()
                        : params.userProfile.birth_date;
                    userContextContent += `Birth Date: ${dayjs(birthDate).format('MM/DD/YYYY')}\n`;
                }
                if (params.userProfile.primary_occupation) {
                    userContextContent += `Primary Occupation: ${params.userProfile.primary_occupation}\n`;
                }
                if (params.userProfile.family_story) {
                    userContextContent += `Family Story: ${params.userProfile.family_story}\n`;
                }
                userContextContent += "\n";
            }

            // Add Assessments
            userContextContent += "Summaries of assessments I have taken:\n";
            params.assessments.forEach(assessment => {
                userContextContent += `${assessment.assessment_type}: ${assessment.assessment_summary}\n`;
            });
            userContextContent += "\n";

            // Add Core Values
            userContextContent += "My Core Values:\n";
            params.coreValues.forEach(value => {
                userContextContent += `${value.title}\n`;
            });
            userContextContent += "\n";

            // Add Inner Circle
            userContextContent += "Some of my close friends and family:\n";
            params.innerCircle.forEach(member => {
                userContextContent += `${member.relationship_type}: ${member.name}\n`;
            });
            userContextContent += "\n";

            // Add Main Interests
            userContextContent += "My Main Interests:\n";
            params.mainInterests.forEach(interest => {
                userContextContent += `${interest.interest}\n`;
            });
            userContextContent += "\n";

            // Add Professional Development
            if (params.professionalDevelopment) {
                userContextContent += "My Professional Development:\n";
                userContextContent += `Essential Qualities: ${params.professionalDevelopment.key_terms?.join(', ')}\n`;
                userContextContent += `Leadership Style: ${params.professionalDevelopment.leadership_style_title}\n`;
                userContextContent += `Goal Setting Style: ${params.professionalDevelopment.goal_setting_style_title}\n`;
                userContextContent += "\n";
            }

            // Add Long Term Goals
            userContextContent += "My Long Term Goals:\n";
            params.longTermGoals.forEach(goal => {
                userContextContent += `${goal.goal}\n`;
            });
            userContextContent += "\n";

            // Add Short Term Goals
            userContextContent += "My Short Term Goals:\n";
            params.shortTermGoals.forEach(goal => {
                userContextContent += `${goal.goal}\n`;
            });
            userContextContent += "\n";

            // Add Weaknesses
            userContextContent += "My Weaknesses:\n";
            params.weaknesses.forEach(weakness => {
                userContextContent += `${weakness.title}\n`;
            });

            // Add Career History
            if (params.careerHistory && params.careerHistory.length > 0) {
                userContextContent += "\nMy Career History:\n";
                params.careerHistory.forEach(entry => {
                    userContextContent += `${entry.position_text}\n`;
                });
            }

            const userContextMessage: LlmMessage = {
                role: 'user',
                content: userContextContent
            };

            return ok([systemMessage, userContextMessage]);
        } catch (error) {
            if (error instanceof Error) {
                return err(error);
            }
            return err(new Error("An unknown error occurred while creating context messages"));
        }
    }
} 