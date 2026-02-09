import React from "react";
import { render } from "@testing-library/react-native";
import { MainInterestsScreen } from "../MainInterestsScreen";

describe("MainInterestsScreen", () => {
    it("renders correctly", () => {
        const { getByText } = render(<MainInterestsScreen />);
        expect(getByText("What do you want to focus on?")).toBeTruthy();
        expect(getByText("Select all that apply")).toBeTruthy();
    });
});