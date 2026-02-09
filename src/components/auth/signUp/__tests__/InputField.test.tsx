import React from "react";
import { render } from "@testing-library/react-native";
import { InputField } from "../InputField";
import {observable} from "@legendapp/state";

describe("InputField", () => {
  it("renders correctly with basic props", () => {
    const value = observable("Test Value");
    const { getByLabelText } = render(
      <InputField
        label="Test Label"
        id="test"
        value={value}
        onChange={() => {}}
      />
    );

    const input = getByLabelText("Test Label");
    expect(input).toBeTruthy();
    expect(input.props.value).toBe("Test Value");
  });

  it("renders prefix when provided", () => {
    const value = observable("");
    const { getByText } = render(
      <InputField
        label="Username"
        id="username"
        prefix="@"
        value={value}
        onChange={() => {}}
      />
    );

    expect(getByText("@")).toBeTruthy();
  });
});
