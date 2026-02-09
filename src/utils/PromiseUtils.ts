export const P_FALSE = Promise.resolve(false);
export const P_TRUE = Promise.resolve(true);
export const P_VOID = Promise.resolve();

/**
 * Waits for a specified number of milliseconds before resolving.
 *
 * @param {number} ms - The number of milliseconds to wait.
 * @return {Promise<void>} A promise that resolves after the specified number of milliseconds.
 */
export async function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function delayExec<T>(func: () => T, ms: number): Promise<T> {
    return new Promise<T>((resolve) => {
        setTimeout(() => {
            resolve(func());
        }, ms);
    });
}

export function awaitTrue(expression: () => boolean, timeout = 1000): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const time = Date.now();
        const iVal = setInterval(() => {
            if (expression()) {
                clearInterval(iVal);
                resolve(true);
                return;
            }
            if (Date.now() - time > timeout) {
                clearInterval(iVal);
                resolve(false);
            }
        }, 0);
    });
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPromiseLike(obj: any): obj is PromiseLike<any> {
    return obj && typeof obj.then === 'function';
}

export function isPromise(obj: any): obj is Promise<any> {
    return obj && typeof obj.then === 'function';
}
