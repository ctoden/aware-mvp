import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { LlmService } from "@src/services/LlmService";
import { GenerateInsightArticleAction, InsightArticle } from "@src/actions/aboutYou/GenerateInsightArticleAction";
import { getSelectedAboutYou, selectedAboutYou$ } from "@src/models/UserAboutYou";
import { observable } from "@legendapp/state";
import { err, ok, Result } from "neverthrow";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";

@injectable()
export class InsightDetailViewModel extends ViewModel {
    private readonly _llmService!: LlmService;
    // Cache for insight articles
    private readonly _insightCache: Map<string, InsightArticle> = new Map();

    // Observable state
    readonly article$ = observable<InsightArticle | null>(null);
    readonly isLoading$ = observable<boolean>(false);
    readonly error$ = observable<string | null>(null);
    readonly currentSelectionId$ = observable<string | null>(null);

    constructor() {
        super('InsightDetailViewModel');
        this._llmService = this.addDependency(LlmService);
    }

    protected async onInitialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.clear();
        return ok(true);
    }

    public clear() {
        this.article$.set(null);
        this.isLoading$.set(false);
        this.error$.set(null);
        this.currentSelectionId$.set(null);
    }

    async generateInsight(): Promise<Result<InsightArticle, Error>> {
        const selectedAboutYou = getSelectedAboutYou();
        if (!selectedAboutYou) {
            this.error$.set('No about you entry selected');
            return err(new Error('No about you entry selected'));
        }

        // Set the current selection ID
        this.currentSelectionId$.set(selectedAboutYou.id);

        // Check cache first
        const cachedArticle = this._insightCache.get(selectedAboutYou.id);
        if (cachedArticle) {
            this.article$.set(cachedArticle);
            return ok(cachedArticle);
        }

        if(!this._llmService.llmProvider)  {
            this.error$.set('LLM provider not initialized');
            return err(new Error('LLM provider not initialized'));
        }

        try {
            this.isLoading$.set(true);
            this.error$.set(null);

            const generateInsightAction = new GenerateInsightArticleAction(this._llmService.llmProvider);
            const result = await generateInsightAction.execute({
                sectionType: selectedAboutYou.section_type,
                title: selectedAboutYou.title,
                description: selectedAboutYou.description
            });

            if (result.isOk()) {
                const article = result.value;
                // Store in cache
                this._insightCache.set(selectedAboutYou.id, article);
                this.article$.set(article);
            } else {
                this.error$.set(result.error.message);
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isLoading$.set(false);
        }
    }
    
    // Force regeneration of insight data regardless of cache
    async refreshInsight(): Promise<Result<InsightArticle, Error>> {
        const selectedAboutYou = getSelectedAboutYou();
        if (!selectedAboutYou) {
            this.error$.set('No about you entry selected');
            return err(new Error('No about you entry selected'));
        }
        
        // Clear the cache for this item
        this.clearCacheItem(selectedAboutYou.id);
        
        // Generate the insight
        return this.generateInsight();
    }

    getArticle(): InsightArticle | null {
        return this.article$.peek();
    }

    getError(): string | null {
        return this.error$.peek();
    }
    
    // Fixed to resolve linter error - use peek() from observable instead of defining a method
    // that conflicts with a property in the base class
    getIsLoading(): boolean {
        return this.isLoading$.peek();
    }
    
    // Cache related methods
    clearCache(): void {
        this._insightCache.clear();
    }
    
    clearCacheItem(id: string): void {
        this._insightCache.delete(id);
    }
    
    hasCachedInsight(id: string): boolean {
        return this._insightCache.has(id);
    }
} 
