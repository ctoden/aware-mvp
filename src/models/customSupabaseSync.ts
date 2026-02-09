import {Database} from "@src/models/database.types";
import {DependencyService} from "@src/core/injection/DependencyService";
import {createClient} from "@supabase/supabase-js";
import {configureSynced} from "@legendapp/state/sync";
import {syncedSupabase} from "@legendapp/state/sync-plugins/supabase";
import {observablePersistAsyncStorage} from "@legendapp/state/persist-plugins/async-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {generateUUID} from "@src/utils/UUIDUtil";
import {SUPABASE_CLIENT_KEY} from "@src/constants";

export const generateId = generateUUID;

export function supabaseSync() {
    const supabase = DependencyService.resolveSafe<ReturnType<typeof createClient<Database>>>(
        SUPABASE_CLIENT_KEY
    );

    if(!supabase) {
        console.warn('Supabase client is not initialized yet, sync will be retried later');
        return null;
    }

    return configureSynced(syncedSupabase, {
        // Use React Native Async Storage
        persist: {
            plugin: observablePersistAsyncStorage({
                AsyncStorage,
            }),
        },
        generateId,
        supabase,
        changesSince: 'last-sync',
        fieldCreatedAt: 'created_at',
        fieldUpdatedAt: 'updated_at',
        // Optionally enable soft deletes
        fieldDeleted: 'deleted',
    })
}

export function asyncStorageSync() {
    return configureSynced({
        persist: {
            plugin: observablePersistAsyncStorage({
                AsyncStorage
            })
        }
    })
}

// export const customSync = memoize(_customSync());

