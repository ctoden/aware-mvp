import { Result } from "neverthrow";

export interface Action<T> {
    name: string;
    description: string;
    execute<T>(...args: any[]): Promise<Result<T, Error>>;
}