import { Err, err, Ok, ok, Result } from "neverthrow";
import { isError } from "lodash";

export type BoolResult = Result<boolean, Error>;

export const BR_TRUE: Ok<boolean, Error> = ok(true) as Ok<boolean, Error>;
export const BR_FALSE: Ok<boolean, Error> = ok(false) as Ok<boolean, Error>;

export const BR_ERR = (input: string | Error): Err<boolean, Error> => {
    if (isError(input)) {
        return err(input as Error);
    }
    return err(new Error(input as string));
};

export function isResultTrue(result: BoolResult): boolean {
    return result.isOk() && result.value;
}

export function areResultsTrue(results: Array<BoolResult>): boolean {
    return results.filter((val) => !isResultTrue(val)).length === 0;
}

export function areResultsOkay<T>(results: Array<Result<T, Error>>): boolean {
    return results.filter((val) => val.isErr()).length === 0;
}
