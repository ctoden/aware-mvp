import {Result} from "neverthrow";
import {CoreValueType, ICoreValue, UserCoreValue} from "@src/models/UserCoreValue";

export interface CoreValuesActionService {
    clearCoreValues(): Promise<Result<boolean, Error>>;
    createCoreValue(value: ICoreValue, type?: CoreValueType): Promise<Result<UserCoreValue, Error>>;
    createCoreValues(values: ICoreValue[], type?: CoreValueType): Promise<Result<UserCoreValue[], Error>>;
}
