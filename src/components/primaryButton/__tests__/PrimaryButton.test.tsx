import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, Platform } from "react-native";
import PrimaryButton from "../PrimaryButton";

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

describe("PrimaryButton", () => {
  const mockProps = {
    leftIcon: "https://example.com/left-icon.png",
    rightIcon: "https://example.com/right-icon.png",
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with all props", () => {
    const { getByTestId } = render(
      <PrimaryButton {...mockProps}>
        <Text>Test Content</Text>
      </PrimaryButton>
    );

    expect(getByTestId("primary-button")).toBeTruthy();
    expect(getByTestId("left-icon")).toBeTruthy();
    expect(getByTestId("right-icon")).toBeTruthy();
  });

  it("renders correctly without icons", () => {
    const { getByTestId, queryByTestId } = render(
      <PrimaryButton onPress={mockProps.onPress}>
        <Text>Test Content</Text>
      </PrimaryButton>
    );

    expect(getByTestId("primary-button")).toBeTruthy();
    expect(queryByTestId("left-icon")).toBeNull();
    expect(queryByTestId("right-icon")).toBeNull();
  });

  it("handles onPress events when enabled", () => {
    const { getByTestId } = render(
      <PrimaryButton {...mockProps}>
        <Text>Test Content</Text>
      </PrimaryButton>
    );

    fireEvent.press(getByTestId("primary-button"));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it("does not trigger onPress when disabled", () => {
    const { getByTestId } = render(
      <PrimaryButton {...mockProps} disabled>
        <Text>Test Content</Text>
      </PrimaryButton>
    );

    fireEvent.press(getByTestId("primary-button"));
    expect(mockProps.onPress).not.toHaveBeenCalled();
  });

  it("applies active styles by default", () => {
    const { getByTestId } = render(
      <PrimaryButton {...mockProps}>
        <Text>Test Content</Text>
      </PrimaryButton>
    );

    const button = getByTestId("primary-button");
    const styles = button.props.style;
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderColor: "#212120",
          backgroundColor: "#212120",
          color: "#FFFFFF",
        }),
      ])
    );
  });
});