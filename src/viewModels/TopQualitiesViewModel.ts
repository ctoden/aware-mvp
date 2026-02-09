import { observable } from "@legendapp/state";
import { userTopQualities$ } from "@src/models/UserTopQuality";
import { ViewModel } from "./ViewModel";
import { ok, Result } from "neverthrow";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";

export class TopQualitiesViewModel extends ViewModel {
    private readonly expanded$ = observable(false);
    private readonly DEFAULT_VISIBLE_COUNT = 4;

    constructor() {
        super("TopQualitiesViewModel");
    }

    protected async onInitialize(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    public getExpanded(): boolean {
        return this.expanded$.get();
    }

    public toggleExpanded(): void {
        this.expanded$.set(!this.expanded$.get());
    }

    public getVisibleQualities() {
        const qualities = userTopQualities$.get();
        if (!qualities) return [];
        
        const qualityArray = Object.values(qualities);
        return this.expanded$.get() 
            ? qualityArray 
            : qualityArray.slice(0, this.DEFAULT_VISIBLE_COUNT);
    }

    public getFooterText(): string {
        return this.expanded$.get() ? "Show less" : "View all qualities";
    }
}
