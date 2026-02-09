import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CreateAccount } from "../CreateAccount";

describe("CreateAccount", () => {
  it("renders correctly", () => {
    const { getByText, getAllByRole } = render(<CreateAccount />);

    expect(getByText("Create an account")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Done")).toBeTruthy();
    expect(getAllByRole("button")).toHaveLength(3);
  });

  it("handles input changes", () => {
    const { getByLabelText } = render(<CreateAccount />);

    const nameInput = getByLabelText("Name");
    fireEvent.changeText(nameInput, "John Doe");
    expect(nameInput.props.value).toBe("John Doe");

    const emailInput = getByLabelText("Email Address");
    fireEvent.changeText(emailInput, "john@example.com");
    expect(emailInput.props.value).toBe("john@example.com");

    const phoneInput = getByLabelText("Phone number");
    fireEvent.changeText(phoneInput, "+1234567890");
    expect(phoneInput.props.value).toBe("+1234567890");
  });
});
