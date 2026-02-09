import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SocialButton } from "../SocialButton";

describe("SocialButton", () => {
  const mockOnPress = jest.fn();
  const defaultProps = {
    icon: "test-icon-url",
    text: "Test Button",
    onPress: mockOnPress,
  };

  it("renders correctly", () => {
    const { getByText } = render(<SocialButton {...defaultProps} />);
    expect(getByText("Test Button")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const { getByText } = render(<SocialButton {...defaultProps} />);
    fireEvent.press(getByText("Test Button"));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
