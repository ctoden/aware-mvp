import { observable } from "@legendapp/state";
import { AboutYouSectionType, getEntriesBySection, userAboutYou$ } from "@src/models/UserAboutYou";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import HeartIcon from "@src/components/icons/HeartIcon";
import PeopleGroupIcon from "@src/components/icons/PeopleGroupIcon";
import CareerBriefCaseIcon from "@src/components/icons/CareerBriefCaseIcon";

export interface SectionConfig {
    title: string;
    color: string;
    Icon: React.FC<{ width?: number; height?: number; fill?: string }>;
}

@injectable()
export class AboutYouViewModel extends ViewModel {
    public readonly aboutYou$ = userAboutYou$;
    
    constructor() {
        super('AboutYouViewModel');
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public getSelfAwarenessEntries$ = observable(() => 
        getEntriesBySection(AboutYouSectionType.SELF_AWARENESS)
    );

    public getRelationshipsEntries$ = observable(() => 
        getEntriesBySection(AboutYouSectionType.RELATIONSHIPS)
    );

    public getCareerDevelopmentEntries$ = observable(() => 
        getEntriesBySection(AboutYouSectionType.CAREER_DEVELOPMENT)
    );

    public static getSectionConfig(type: AboutYouSectionType): SectionConfig {
        switch (type) {
            case AboutYouSectionType.SELF_AWARENESS:
                return {
                    title: "Self-awareness",
                    color: "#4CAF50",
                    Icon: HeartIcon
                };
            case AboutYouSectionType.RELATIONSHIPS:
                return {
                    title: "Relationships",
                    color: "#FECF51",
                    Icon: PeopleGroupIcon
                };
            case AboutYouSectionType.CAREER_DEVELOPMENT:
                return {
                    title: "Career Development",
                    color: "#2196F3",
                    Icon: CareerBriefCaseIcon
                };
        }
    }
}

// Create singleton instance
export const aboutYouViewModel = new AboutYouViewModel(); 