import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, Platform } from "react-native";
import SecondaryButton from "../SecondaryButton";

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

describe("SecondaryButton", () => {
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
      <SecondaryButton {...mockProps}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    expect(getByTestId("secondary-button")).toBeTruthy();
    expect(getByTestId("left-icon")).toBeTruthy();
    expect(getByTestId("right-icon")).toBeTruthy();
  });

  it("renders correctly without icons", () => {
    const { getByTestId, queryByTestId } = render(
      <SecondaryButton onPress={mockProps.onPress}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    expect(getByTestId("secondary-button")).toBeTruthy();
    expect(queryByTestId("left-icon")).toBeNull();
    expect(queryByTestId("right-icon")).toBeNull();
  });

  it("renders correctly with only left icon", () => {
    const { getByTestId, queryByTestId } = render(
      <SecondaryButton onPress={mockProps.onPress} leftIcon={mockProps.leftIcon}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    expect(getByTestId("secondary-button")).toBeTruthy();
    expect(getByTestId("left-icon")).toBeTruthy();
    expect(queryByTestId("right-icon")).toBeNull();
  });

  it("renders correctly with only right icon", () => {
    const { getByTestId, queryByTestId } = render(
      <SecondaryButton onPress={mockProps.onPress} rightIcon={mockProps.rightIcon}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    expect(getByTestId("secondary-button")).toBeTruthy();
    expect(queryByTestId("left-icon")).toBeNull();
    expect(getByTestId("right-icon")).toBeTruthy();
  });

  it("handles onPress events when enabled", () => {
    const { getByTestId } = render(
      <SecondaryButton {...mockProps}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    fireEvent.press(getByTestId("secondary-button"));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it("does not trigger onPress when disabled", () => {
    const { getByTestId } = render(
      <SecondaryButton {...mockProps} disabled>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    fireEvent.press(getByTestId("secondary-button"));
    expect(mockProps.onPress).not.toHaveBeenCalled();
  });

  it("applies active styles by default", () => {
    const { getByTestId } = render(
      <SecondaryButton {...mockProps}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    const button = getByTestId("secondary-button");
    const styles = button.props.style;
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderColor: "rgba(33, 33, 32, 1)",
          color: "#212120",
          backgroundColor: "transparent",
        }),
      ])
    );
  });

  it("applies pressed styles when pressed", () => {
    const { getByTestId } = render(
      <SecondaryButton {...mockProps}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    const button = getByTestId("secondary-button");
    fireEvent(button, 'pressIn');
    
    const styles = button.props.style;
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderWidth: 2,
          backgroundColor: "rgba(33, 33, 32, 0.1)",
        }),
      ])
    );
  });

  it.skip("applies pressed styles on web", () => {
    // Mock Platform.OS as web
    const originalPlatform = Platform.OS;
    Platform.OS = 'web';
    
    const { getByTestId } = render(
      <SecondaryButton {...mockProps}>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    const button = getByTestId("secondary-button");
    // Trigger hover by simulating mouseEnter
    fireEvent(button, 'mouseEnter');
    
    const styles = button.props.style;
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderWidth: 2,
          backgroundColor: "rgba(33, 33, 32, 0.1)",
        }),
      ])
    );

    // Restore Platform.OS
    Platform.OS = originalPlatform;
  });

  it("applies disabled styles when disabled prop is true", () => {
    const { getByTestId } = render(
      <SecondaryButton {...mockProps} disabled>
        <Text>Test Content</Text>
      </SecondaryButton>
    );

    const button = getByTestId("secondary-button");
    const styles = button.props.style;
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderColor: "rgba(212, 199, 182, 1)",
          color: "#D4C7B6",
          backgroundColor: "transparent",
        }),
      ])
    );
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it("renders children correctly", () => {
    const testMessage = "Test Content";
    const { getByText } = render(
      <SecondaryButton {...mockProps}>
        <Text>{testMessage}</Text>
      </SecondaryButton>
    );

    expect(getByText(testMessage)).toBeTruthy();
  });
});
