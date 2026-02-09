import React from "react";
import { render } from "@testing-library/react-native";
import IconButton from "../IconButton";

describe("IconButton", () => {
  const mockProps = {
    source: "https://example.com/icon.png",
    testID: "test-icon",
  };

  it("renders correctly", () => {
    const { getByTestId } = render(<IconButton {...mockProps} />);
    expect(getByTestId("test-icon")).toBeTruthy();
  });

  it("applies custom styles", () => {
    const customStyle = { width: 32 };
    const { getByTestId } = render(
      <IconButton {...mockProps} style={customStyle} />
    );
    const iconElement = getByTestId("test-icon");
    expect(iconElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });
});
