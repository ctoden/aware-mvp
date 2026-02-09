import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';
import {set} from "lodash";

if (Platform.OS !== 'web' && !global.crypto) {
    set(global, 'crypto', {
        getRandomValues: ExpoCrypto.getRandomValues,
        subtle: {
            digest: async (algorithm: string | { name: string }, data: ArrayBuffer) => {
                // Convert algorithm object or string to the expected CryptoDigestAlgorithm
                const algorithmName = typeof algorithm === 'string' ? algorithm : algorithm.name;
                return await ExpoCrypto.digest(
                    algorithmName as ExpoCrypto.CryptoDigestAlgorithm,
                    data
                );
            }
        },
        randomUUID: ExpoCrypto.randomUUID
    } as Crypto);
}
