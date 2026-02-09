import {getFromEnv} from "@src/utils/EnvUtils";

export const test = getFromEnv("RUN_INTEGRATION_TESTS", 'false') === 'true' ? it : it.skip ;