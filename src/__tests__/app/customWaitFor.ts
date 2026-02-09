import {act, waitFor} from "@testing-library/react-native";

export async function customWaitFor(cb: () => Promise<void>, options?: any): Promise<any> {
    return await act(async () => {
        await waitFor(cb, options);
    })
}