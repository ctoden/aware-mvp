export interface Injectable<T> {
    new (): T;
}

export interface InjectableWithArgs<T> {
    new (...args: any[]): T;
}

export type InjectCtor<T> = Injectable<T> | InjectableWithArgs<T>;