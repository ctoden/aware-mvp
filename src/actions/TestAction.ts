import { ok, err, Result } from "neverthrow";
import { Action } from "./Action";

export class TestAction implements Action<string> {
    name: string;
    description: string;
    shouldSucceed: boolean;
    executionDelay: number;
    result: string;

    constructor(
        name: string,
        description: string,
        result = "Success",
        shouldSucceed = true,
        executionDelay = 100
    ) {
        this.name = name;
        this.description = description;
        this.result = result;
        this.shouldSucceed = shouldSucceed;
        this.executionDelay = executionDelay;
    }

    async execute<T = string>(): Promise<Result<T, Error>> {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, this.executionDelay));
        
        if (this.shouldSucceed) {
            return ok(this.result as unknown as T);
        } else {
            return err(new Error(`Action ${this.name} failed intentionally`));
        }
    }
} 