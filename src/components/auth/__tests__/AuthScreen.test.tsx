import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AuthScreen } from "../AuthScreen";

describe("AuthScreen", () => {
  it("renders correctly", () => {
    const { getByText } = render(<AuthScreen />);

    expect(getByText("aware")).toBeTruthy();
    expect(getByText("Get started")).toBeTruthy();
    expect(getByText("Begin your journey of self-discovery")).toBeTruthy();
    expect(getByText("Continue with phone")).toBeTruthy();
    expect(getByText("Continue with email")).toBeTruthy();
  });
});
