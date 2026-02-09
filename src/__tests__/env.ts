import {get} from "lodash";

export function getFromEnv(key: string , defaultValue?: string): string | undefined {
    const processVal = process.env[key];
    const globalVal = get(global, `test.env.${key}`, defaultValue);
    return processVal ?? globalVal ?? defaultValue;
}