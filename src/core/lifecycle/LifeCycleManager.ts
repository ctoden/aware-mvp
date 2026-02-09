import {Result} from "neverthrow";
import {hasIn, memoize} from "lodash";

export interface LifeCycleConfig {
    userId?: string;
    [key: string]: any;
}

export interface LifeCycleManager {
    initialize(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;
    end(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;
}

export function hasLifeCycle(obj: any): obj is LifeCycleManager {
    return (
        obj &&
        typeof obj.initialize === "function" &&
        typeof obj.end === "function"
    );
}

export function getObjectName(obj: any): string {
    if (!obj) return "undefined";
    if (typeof obj === "string") return obj;
    if (obj.name) return obj.name;
    if (obj.constructor && obj.constructor.name) return obj.constructor.name;
    return "unknown";
}