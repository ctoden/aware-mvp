import { hashArray, hashString, hashObject } from '../HashUtils';

describe('Hash Functions', () => {
    it('should hash a string correctly', () => {
        const str = 'example';
        const expectedHash = hashString(str);
        expect(hashString(str)).toBe(expectedHash);
    });

    it('should hash an array correctly', () => {
        const arr = ['example', 1, true];
        const expectedHash = hashArray(arr);
        expect(hashArray(arr)).toBe(expectedHash);
    });

    it('should hash an object correctly', () => {
        const obj = { key: 'value', num: 1, bool: true };
        const expectedHash = hashObject(obj);
        expect(hashObject(obj)).toBe(expectedHash);
    });

    it('should return different hashes for different inputs', () => {
        const str1 = 'example1';
        const str2 = 'example2';
        expect(hashString(str1)).not.toBe(hashString(str2));

        const arr1 = ['example1', 1, true];
        const arr2 = ['example2', 2, false];
        expect(hashArray(arr1)).not.toBe(hashArray(arr2));

        const obj1 = { key: 'value1', num: 1, bool: true };
        const obj2 = { key: 'value2', num: 2, bool: false };
        expect(hashObject(obj1)).not.toBe(hashObject(obj2));
    });

    it('should handle nested objects and arrays', () => {
        const nestedObj = { key: 'value', nested: { innerKey: 'innerValue' } };
        const expectedHash = hashObject(nestedObj);
        expect(hashObject(nestedObj)).toBe(expectedHash);

        const nestedArr = ['example', [1, true]];
        const expectedHashArr = hashArray(nestedArr);
        expect(hashArray(nestedArr)).toBe(expectedHashArr);
    });
});
