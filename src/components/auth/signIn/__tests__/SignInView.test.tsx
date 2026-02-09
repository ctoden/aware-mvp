import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SignInView } from "../SignInView"

describe("SignInModal", () => {
    const mockOnSignIn = jest.fn();
    const mockOnCreateAccount = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders correctly", () => {
        const { getByText } = render(
            <SignInView onSignIn={mockOnSignIn} onCreateAccount={mockOnCreateAccount} />
    );

        expect(getByText("Sign in to your account")).toBeTruthy();
    });

    it("handles sign in submission", () => {
        const { getByText, getByLabelText } = render(
            <SignInView onSignIn={mockOnSignIn} onCreateAccount={mockOnCreateAccount} />
    );

        const emailInput = getByLabelText("Email input");
        const passwordInput = getByLabelText("Password input");
        const loginButton = getByText("Log In");

        fireEvent.changeText(emailInput, "test@example.com");
        fireEvent.changeText(passwordInput, "password123");
        fireEvent.press(loginButton);

        expect(mockOnSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    });

    it("handles create account navigation", () => {
        const { getByText } = render(
            <SignInView onSignIn={mockOnSignIn} onCreateAccount={mockOnCreateAccount} />
    );

        const createAccountLink = getByText("Don't have an account, create one here");
        fireEvent.press(createAccountLink);

        expect(mockOnCreateAccount).toHaveBeenCalled();
    });
});