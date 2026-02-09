import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { DataService } from "./DataService";
import { LlmService } from "./LlmService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { user$ } from "@src/models/SessionModel";
import { DigDeeperQuestion, DigDeeperQuestionStatus, digDeeperQuestions$, getPendingQuestions, getDigDeeperQuestionsArray, upsertQuestion, clearQuestions } from "@src/models/DigDeeperQuestion";
import { generateUUID } from "@src/utils/UUIDUtil";
import { CreateDigDeeperQuestionsAction } from "@src/actions/digDeeper/CreateDigDeeperQuestionsAction";
import {getUserProfile, userProfile$} from "@src/models/UserProfile";
import { getUserLongTermGoalsArray } from "@src/models/UserLongTermGoal";
import { PromptContext } from "@src/prompts/digDeeperPromptTemplate";
import { isEmpty } from "lodash";
import { Observable } from "@legendapp/state";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";

@singleton()
export class DigDeeperService extends EventAwareService {
    private readonly _dataService!: DataService;
    private readonly _llmService!: LlmService;

    constructor() {
        super('DigDeeperService', [
            ChangeType.LOGIN  // Only listen for user session changes
        ]);
        this._dataService = this.addDependency(DataService);
        this._llmService = this.addDependency(LlmService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            await this.initializeCustomSubscriptions();
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        digDeeperQuestions$.set(null);
        return ok(true);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        if (event.type === ChangeType.LOGIN) {
            const session = event.payload;
            if (session?.user) {
                const result = await this.fetchUserQuestions(session.user.id);
                if (result.isOk()) {
                    const questionsMap = result.value.reduce((acc, question) => {
                        acc[question.id] = question;
                        return acc;
                    }, {} as Record<string, DigDeeperQuestion>);
                    digDeeperQuestions$.set(questionsMap);
                }
            } else {
                // Clear questions on logout
               // digDeeperQuestions$.set(null);
            }
        }
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // Subscribe to the observable for local state changes and sync with database
        this.onChange(digDeeperQuestions$, async (change) => {
            try {
                const userId = user$.peek()?.id;
                if (!userId) {
                    console.error('Cannot sync questions - no user logged in');
                    return;
                }

                const newState = change.value;
                if (!newState) {
                    // Handle clearing of questions
                    await this._dataService.deleteData('dig_deeper_questions', {
                        filter: [{ field: 'user_id', value: userId }]
                    });
                    return;
                }

                // Get current state from database
                const currentResult = await this._dataService.fetchData<DigDeeperQuestion>('dig_deeper_questions', {
                    filter: [{ field: 'user_id', value: userId }]
                });

                if (currentResult.isErr()) {
                    console.error('Failed to fetch current questions:', currentResult.error);
                    return;
                }

                const currentIds = new Set(currentResult.value.map(q => q.id));
                const newIds = new Set(Object.keys(newState));

                // Items to delete - in current but not in new
                const toDelete = currentResult.value.filter(q => !newIds.has(q.id));
                if (toDelete.length > 0) {
                    const deleteResult = await this._dataService.deleteData('dig_deeper_questions', {
                        filter: [{ field: 'id', value: toDelete.map(q => q.id) }]
                    });
                    if (deleteResult.isErr()) {
                        console.error('Failed to delete questions:', deleteResult.error);
                    }
                }

                // Items to upsert - in new but not in current or updated
                const toUpsert = Object.values(newState).filter(q => {
                    const currentQuestion = currentResult.value.find(cq => cq.id === q.id);
                    return !currentIds.has(q.id) || 
                           currentQuestion?.question !== q.question ||
                           currentQuestion?.answer !== q.answer ||
                           currentQuestion?.status !== q.status;
                });
                
                if (toUpsert.length > 0) {
                    const upsertResult = await this._dataService.upsertData('dig_deeper_questions', toUpsert);
                    if (upsertResult.isErr()) {
                        console.error('Failed to upsert questions:', upsertResult.error);
                    }
                }
            } catch (error) {
                console.error('Error syncing questions with database:', error);
            }
        });
        return ok(true);
    }

    async fetchUserQuestions(userId: string): Promise<Result<DigDeeperQuestion[], Error>> {
        try {
            const result = await this._dataService.fetchData<DigDeeperQuestion>('dig_deeper_questions', {
                filter: [{ field: 'user_id', value: userId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }
            


            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch dig deeper questions'));
        }
    }

    public createPromptContextFromUserData(): Result<PromptContext, Error> {
        const profile = getUserProfile();
        if (!profile) {
            return err(new Error('User profile not found'));
        }

        const longTermGoals = getUserLongTermGoalsArray();
        const userContext = {
            name: profile.full_name || 'User',
            personalityData: profile.summary ? [profile.summary] : [],
            currentRole: profile.primary_occupation || undefined,
            longTermGoals: longTermGoals.map((g: { goal: string }) => g.goal),
            // Add other data as needed
        };

        const questions = getDigDeeperQuestionsArray();
        const previousQuestions = questions
            .filter(q => q.status === DigDeeperQuestionStatus.ANSWERED || q.status === DigDeeperQuestionStatus.SKIPPED)
            .map(q => ({
                question: q.question,
                status: q.status === DigDeeperQuestionStatus.ANSWERED ? 'ANSWERED' as const : 'SKIPPED' as const
            }));

        return ok({
            userContext,
            previousQuestions
        });
    }

    async ensureMinimumPendingQuestions(minimumCount: number = 3, retryCount: number = 0): Promise<Result<boolean, Error>> {
        const MAX_RETRIES = 3;
        
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        if (retryCount >= MAX_RETRIES) {
            return err(new Error('Failed to generate minimum required questions after maximum retries'));
        }

        const pendingQuestions = getPendingQuestions();
        if (pendingQuestions.length >= minimumCount) {
            return ok(true);
        }

        let result: Result<DigDeeperQuestion[], Error>;

        const contextResult = this.createPromptContextFromUserData();
        if (contextResult.isErr()) {
            return err(contextResult.error);
        }
        result = await this.generateNewQuestions(contextResult.value);

        if (result.isErr()) {
            return err(result.error);
        }

        // If we still don't have enough questions after generation, try again with incremented retry count
        const updatedPendingQuestions = getPendingQuestions();
        if (updatedPendingQuestions.length < minimumCount) {
            return this.ensureMinimumPendingQuestions(minimumCount, retryCount + 1);
        }

        return ok(true);
    }

    async generateNewQuestions(userContextOrPromptContext: PromptContext): Promise<Result<DigDeeperQuestion[], Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        if (!this._llmService.llmProvider) {
            return err(new Error('LLM provider not initialized'));
        }

        const action = new CreateDigDeeperQuestionsAction(this._llmService.llmProvider);
        const questionsResult = await action.execute(userContextOrPromptContext);

        if (questionsResult.isErr()) {
            return err(questionsResult.error);
        }

        const newQuestions: DigDeeperQuestion[] = questionsResult.value.map(q => ({
            ...q,
            id: generateUUID(),
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        try {
            const result = await this._dataService.upsertData<DigDeeperQuestion>('dig_deeper_questions', newQuestions);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            result.value.forEach(upsertQuestion);
            

            
            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to save dig deeper questions'));
        }
    }

    async answerQuestion(id: string, answer: string): Promise<Result<DigDeeperQuestion, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const questions = digDeeperQuestions$.peek();
        const existingQuestion = questions?.[id];
        if (!existingQuestion) {
            return err(new Error('Question not found'));
        }

        const updatedQuestion: DigDeeperQuestion = {
            ...existingQuestion,
            answer,
            status: DigDeeperQuestionStatus.ANSWERED,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.updateData<DigDeeperQuestion>('dig_deeper_questions', updatedQuestion);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertQuestion(updatedQuestion);
            

            
            return ok(updatedQuestion);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to update question'));
        }
    }

    async skipQuestion(id: string): Promise<Result<DigDeeperQuestion, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const questions = digDeeperQuestions$.peek();
        const existingQuestion = questions?.[id];
        if (!existingQuestion) {
            return err(new Error('Question not found'));
        }

        const updatedQuestion: DigDeeperQuestion = {
            ...existingQuestion,
            status: DigDeeperQuestionStatus.SKIPPED,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.updateData<DigDeeperQuestion>('dig_deeper_questions', updatedQuestion);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertQuestion(updatedQuestion);
            

            
            return ok(updatedQuestion);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to skip question'));
        }
    }

    async clearQuestions(): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            const result = await this._dataService.deleteData('dig_deeper_questions', {
                filter: [{ field: 'user_id', value: userId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Clear local state
            clearQuestions();
            

            
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to clear questions'));
        }
    }

    hasUnansweredQuestions(): boolean {
        return getPendingQuestions().length > 0;
    }
} 