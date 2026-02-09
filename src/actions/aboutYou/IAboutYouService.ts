import { Result } from "neverthrow";
import { UserAboutYou, AboutYouSectionType } from "@src/models/UserAboutYou";

export interface IAboutYouService {
    clearAboutYouEntries(): Promise<Result<boolean, Error>>;
    createAboutYouEntry(entry: { title: string; description: string }, sectionType: AboutYouSectionType): Promise<Result<UserAboutYou, Error>>;
    fetchAboutYouEntries(): Promise<Result<UserAboutYou[], Error>>;
    limitAboutYouEntries(): Promise<Result<boolean, Error>>;
} 