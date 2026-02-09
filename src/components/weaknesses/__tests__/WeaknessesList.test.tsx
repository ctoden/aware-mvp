import { render } from "@testing-library/react-native";
import { userWeaknesses$, WeaknessType } from "@src/models/UserWeakness";
import { WeaknessesList } from "../WeaknessesList";
import * as React from "react";

describe("WeaknessesList", () => {
    beforeEach(() => {
        userWeaknesses$.set(null);
    });

    it("renders empty list when no weaknesses are available", () => {
        const { getByText } = render(<WeaknessesList />);
        expect(getByText("Weaknesses")).toBeTruthy();
    });

    it("renders weaknesses correctly when provided", () => {
        const mockWeaknesses = {
            "1": {
                id: "1",
                user_id: "user1",
                title: "Test Weakness 1",
                description: "Test Description 1",
                weakness_type: WeaknessType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            "2": {
                id: "2",
                user_id: "user1",
                title: "Test Weakness 2",
                description: "Test Description 2",
                weakness_type: WeaknessType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };

        userWeaknesses$.set(mockWeaknesses);

        const { getByText } = render(<WeaknessesList />);
        expect(getByText("Test Weakness 1")).toBeTruthy();
        expect(getByText("Test Description 1")).toBeTruthy();
        expect(getByText("Test Weakness 2")).toBeTruthy();
        expect(getByText("Test Description 2")).toBeTruthy();
    });

    it("updates displayed weaknesses when observable state changes", () => {
        const { getByText, rerender } = render(<WeaknessesList />);

        const initialWeaknesses = {
            "1": {
                id: "1",
                user_id: "user1",
                title: "Initial Weakness",
                description: "Initial Description",
                weakness_type: WeaknessType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };

        userWeaknesses$.set(initialWeaknesses);
        rerender(<WeaknessesList />);
        expect(getByText("Initial Weakness")).toBeTruthy();
        expect(getByText("Initial Description")).toBeTruthy();

        const updatedWeaknesses = {
            "1": {
                id: "1",
                user_id: "user1",
                title: "Updated Weakness",
                description: "Updated Description",
                weakness_type: WeaknessType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };

        userWeaknesses$.set(updatedWeaknesses);
        rerender(<WeaknessesList />);
        expect(getByText("Updated Weakness")).toBeTruthy();
        expect(getByText("Updated Description")).toBeTruthy();
    });
}); 