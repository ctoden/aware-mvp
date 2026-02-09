"""Tests for the sign-up and MBTI assessment flow."""
import pytest
import asyncio
from typing import Dict, Any
from loguru import logger

from lib.base_test import BaseLLMTest
from lib.utils import generate_random_email, generate_random_password, save_test_data


class TestSignupMBTIFlow(BaseLLMTest):
    """Test the complete user sign-up and MBTI assessment flow."""
    
    @pytest.mark.asyncio
    async def test_full_signup_mbti_flow(self, browser):
        """Test the complete user sign-up flow and MBTI assessment process."""
        # Generate test data
        test_email = generate_random_email()
        test_password = generate_random_password()
        test_data = {
            "email": test_email,
            "password": test_password
        }
        
        # Save test data for potential future use
        save_test_data(test_data, "signup_test_data.json")
        
        logger.info(f"Starting sign-up test with email: {test_email}")
        
        # Step 1: Navigate through the welcome screen
        welcome_context = """
        The app should start on the Welcome screen, which has a "Get Started" or similar button.
        This button needs to be clicked to begin the sign-up process.
        """
        
        result = await self.execute_step(
            browser,
            "Click the button to get started with the application",
            context=welcome_context,
            verify_elements=["Sign up form or button"]
        )
        assert result["success"], "Failed to navigate from welcome screen"
        
        # Step 2: Navigate to sign-up form if not already there
        signup_context = """
        The user needs to go to the sign-up screen. If we're on a screen with 
        options for "Sign Up" and "Sign In", click the "Sign Up" option.
        If we're already on the sign-up form, we can proceed directly to entering data.
        """
        
        result = await self.execute_step(
            browser,
            "Navigate to the sign-up form if not already there",
            context=signup_context,
            verify_elements=["Email input field", "Password input field"]
        )
        assert result["success"], "Failed to navigate to sign-up form"
        
        # Step 3: Fill out the sign-up form
        signup_form_context = f"""
        Fill out the sign-up form with the following information:
        - Email: {test_email}
        - Password: {test_password}
        
        After filling out the form, submit it by clicking the sign-up/create account button.
        """
        
        result = await self.execute_step(
            browser,
            "Fill out the sign-up form and create a new account",
            context=signup_form_context,
            verify_elements=["Confirmation or next step button"]
        )
        assert result["success"], "Failed to complete sign-up form submission"
        
        # Step 4: Navigate through the introduction screens
        intro_context = """
        After signing up, the app will likely show some introduction screens.
        These screens explain the app's features and functionality.
        Navigate through these introduction screens by clicking the "Next" 
        or similar buttons until reaching a screen that asks about assessments.
        """
        
        result = await self.execute_step(
            browser,
            "Navigate through all introduction screens by clicking the next or continue buttons",
            context=intro_context,
            verify_elements=["Assessment selection screen or add assessment button"]
        )
        assert result["success"], "Failed to navigate through introduction screens"
        
        # Step 5: Add an MBTI assessment
        mbti_selection_context = """
        We need to add the MBTI (Myers-Briggs Type Indicator) assessment.
        Look for a button or option to add an assessment, then select MBTI
        from the available assessment options.
        """
        
        result = await self.execute_step(
            browser,
            "Add an MBTI assessment by finding and selecting the MBTI option",
            context=mbti_selection_context,
            verify_elements=["MBTI input form or trait selection"]
        )
        assert result["success"], "Failed to select MBTI assessment"
        
        # Step 6: Complete the MBTI assessment
        mbti_type = "ENFP"  # We'll use a fixed type for this test
        mbti_test_context = f"""
        We need to complete the MBTI assessment by selecting options that would result in an {mbti_type} personality type.
        For MBTI, we need to select:
        - E (Extraversion) over I (Introversion)
        - N (Intuition) over S (Sensing)
        - F (Feeling) over T (Thinking)
        - P (Perceiving) over J (Judging)
        
        The exact UI may vary, but look for radio buttons, sliders, or other UI elements that let you select these preferences.
        After making all selections, submit the assessment.
        """
        
        result = await self.execute_step(
            browser,
            f"Complete the MBTI assessment by selecting options for {mbti_type} personality type",
            context=mbti_test_context,
            verify_elements=["Confirmation or completion message"]
        )
        assert result["success"], "Failed to complete MBTI assessment"
        
        # Step 7: Verify assessment completion and profile view
        profile_context = """
        After completing the MBTI assessment, we should see the user's profile or a summary screen.
        This screen should show the MBTI results or a confirmation that the assessment was completed.
        """
        
        result = await self.execute_step(
            browser,
            "Verify that the MBTI assessment was successfully completed and results are shown",
            context=profile_context,
            verify_elements=["MBTI results or assessment completion indicator"]
        )
        assert result["success"], "Failed to verify assessment completion"
        
        # Test completed successfully
        logger.success(f"Successfully completed sign-up and MBTI assessment flow with email: {test_email}")


if __name__ == "__main__":
    pytest.main(["-v", "test_signup_mbti_flow.py"])