import {isArrayLike} from "lodash";

export function getHash<T>(obj: T): string {
    let hashString: string;
    if(isArrayLike(obj)) {
        hashString = hashArray(obj as Array<any>).toFixed(0);
    } else {
        hashString = hashObject(obj).toFixed(0);
    }

    return hashString;
}

export function hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

export function hashArray(arr: any[]): number {
    let hash = 0;
    for (const item of arr) {
        if (typeof item === 'string') {
            hash += hashString(item);
        } else if (typeof item === 'object') {
            hash += hashObject(item);
        }
    }
    return hash;
}
export function hashObject(obj: any): number {
    let hash = 0;
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                hash += hashString(value);
            } else if (typeof value === 'object') {
                hash += hashObject(value);
            }
        }
    }
    return hash;
}