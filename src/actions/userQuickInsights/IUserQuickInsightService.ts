import { Result } from "neverthrow";
import { UserQuickInsight } from "@src/models/UserQuickInsightModel";

export interface IUserQuickInsightService {
  fetchUserInsights(): Promise<Result<UserQuickInsight[], Error>>;
  createInsight(title: string, description: string): Promise<Result<UserQuickInsight, Error>>;
  updateInsight(id: string, updates: Partial<Pick<UserQuickInsight, "title" | "description">>): Promise<Result<UserQuickInsight, Error>>;
  deleteInsight(id: string): Promise<Result<boolean, Error>>;
  generateQuickInsight(): Promise<Result<UserQuickInsight, Error>>;
} 