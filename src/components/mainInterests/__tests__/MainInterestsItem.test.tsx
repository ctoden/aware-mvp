import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { MainInterestsItem } from "../MainInterestsItem";

describe("MainInterestsItem", () => {
    it("renders correctly with props", () => {
        const { getByText } = render(
            <MainInterestsItem emoji="📈" text="Career growth" />
        );
        expect(getByText("📈 Career growth")).toBeTruthy();
    });

    it("handles selection state", () => {
        const { getByRole } = render(
            <MainInterestsItem emoji="📈" text="Career growth" />
        );
        const button = getByRole("button");
        fireEvent.press(button);
        expect(button.props.accessibilityState.selected).toBe(true);
    });
});