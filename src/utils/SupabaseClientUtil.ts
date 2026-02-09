import {Result, err, ok} from "neverthrow";
import {SupabaseClient} from "@supabase/supabase-js";
import {DependencyService} from "@src/core/injection/DependencyService";
import {GlobalContextService} from "@src/core/injection/GlobalContextService";
import {SUPABASE_CLIENT_KEY} from "@src/constants";
import {Platform} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFromEnv } from "./EnvUtils";

export function getDefaultClient(): Result<SupabaseClient, Error> {
    const supabaseUrl = getFromEnv('EXPO_PUBLIC_SUPABASE_URL');
    const supabaseAnonKey = getFromEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
        return err(new Error('Supabase URL or Anon Key is not set in environment variables.'));
    }


    let auth: any;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Mobile (iOS or Android) configuration
        auth = {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false, // Not needed for mobile
        }
    } else {
        // Web configuration
        auth = {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true, // Useful for web
        };
    }

    return ok(new SupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth
    }));
}

export async function initializeSupabaseClient(): Promise<Result<SupabaseClient, Error>> {
    let client = DependencyService.resolveSafe(SUPABASE_CLIENT_KEY)
        ?? GlobalContextService.FindInGlobal(SUPABASE_CLIENT_KEY) as SupabaseClient;

    if (!client) {
        const result = getDefaultClient();
        if (result.isErr()) {
            return err(result.error);
        }
        client = result.value;
        GlobalContextService.PutInGlobal(SUPABASE_CLIENT_KEY, client);
    }

    DependencyService.registerValue(SUPABASE_CLIENT_KEY, client);
    return ok(client as SupabaseClient);
} 