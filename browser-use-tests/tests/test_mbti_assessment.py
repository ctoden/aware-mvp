"""Tests specifically for completing the MBTI assessment."""
import pytest
import asyncio
from typing import Dict, Any
from loguru import logger

from lib.base_test import BaseLLMTest
from lib.utils import load_test_data, save_test_data, generate_random_email, generate_random_password


class TestMBTIAssessment(BaseLLMTest):
    """Test the MBTI assessment workflow specifically."""
    
    @pytest.mark.asyncio
    async def test_mbti_assessment_completion(self, browser):
        """Test the MBTI assessment completion process."""
        # Try to load existing test data, or create new credentials
        test_data = load_test_data("signup_test_data.json")
        
        if not test_data or "email" not in test_data:
            # Generate new test data
            test_email = generate_random_email()
            test_password = generate_random_password()
            test_data = {
                "email": test_email,
                "password": test_password
            }
            save_test_data(test_data, "signup_test_data.json")
            
            # We need to sign up first
            logger.info(f"No existing account found. Creating new account with email: {test_email}")
            
            # Quick sign up flow
            await self._perform_signup(browser, test_email, test_password)
        else:
            # Sign in with existing account
            logger.info(f"Using existing account with email: {test_data['email']}")
            
            # Quick sign in flow
            await self._perform_signin(browser, test_data["email"], test_data["password"])
        
        # Step 1: Navigate to assessment selection (if not already there)
        await self._navigate_to_assessment_screen(browser)
        
        # Step 2: Select MBTI assessment
        mbti_selection_context = """
        We need to find and select the MBTI assessment. On the Choose Assessment screen, 
        there should be several assessment options displayed as cards or buttons.
        Look for "MBTI" or "Myers-Briggs Type Indicator" and click on it.
        """
        
        result = await self.execute_step(
            browser,
            "Select the MBTI assessment from available options",
            context=mbti_selection_context
        )
        assert result["success"], "Failed to select MBTI assessment"
        
        await browser._save_screenshot("mbti_selected")
        await asyncio.sleep(1)
        
        # Step 3: Complete each trait section one by one
        # Note: The UI might present each trait on separate screens or all on one screen
        
        # 3.1: Extraversion vs Introversion
        ei_context = """
        We need to select Extraversion (E) over Introversion (I).
        Look for radio buttons, sliders, or options to select Extraversion.
        The options might be labeled as "E" and "I" or as "Extraversion" and "Introversion".
        Select the option corresponding to Extraversion (E).
        
        If there are multiple trait selections on one screen, focus only on the E/I selection for now.
        If after selecting, there's a "Next" button to proceed to the next trait, click it.
        """
        
        result = await self.execute_step(
            browser,
            "Select Extraversion (E) over Introversion (I) and proceed if needed",
            context=ei_context
        )
        assert result["success"], "Failed to select Extraversion"
        
        await browser._save_screenshot("e_selected")
        await asyncio.sleep(1)
        
        # 3.2: Sensing vs Intuition
        sn_context = """
        We need to select Intuition (N) over Sensing (S).
        Look for radio buttons, sliders, or options to select Intuition.
        The options might be labeled as "N" and "S" or as "Intuition" and "Sensing".
        Select the option corresponding to Intuition (N).
        
        If after selecting, there's a "Next" button to proceed to the next trait, click it.
        """
        
        result = await self.execute_step(
            browser,
            "Select Intuition (N) over Sensing (S) and proceed if needed",
            context=sn_context
        )
        assert result["success"], "Failed to select Intuition"
        
        await browser._save_screenshot("n_selected")
        await asyncio.sleep(1)
        
        # 3.3: Thinking vs Feeling
        tf_context = """
        We need to select Feeling (F) over Thinking (T).
        Look for radio buttons, sliders, or options to select Feeling.
        The options might be labeled as "F" and "T" or as "Feeling" and "Thinking".
        Select the option corresponding to Feeling (F).
        
        If after selecting, there's a "Next" button to proceed to the next trait, click it.
        """
        
        result = await self.execute_step(
            browser,
            "Select Feeling (F) over Thinking (T) and proceed if needed",
            context=tf_context
        )
        assert result["success"], "Failed to select Feeling"
        
        await browser._save_screenshot("f_selected")
        await asyncio.sleep(1)
        
        # 3.4: Judging vs Perceiving
        jp_context = """
        We need to select Perceiving (P) over Judging (J).
        Look for radio buttons, sliders, or options to select Perceiving.
        The options might be labeled as "P" and "J" or as "Perceiving" and "Judging".
        Select the option corresponding to Perceiving (P).
        
        If this is the last trait, there might be a "Done" or "Complete" button instead of "Next".
        """
        
        result = await self.execute_step(
            browser,
            "Select Perceiving (P) over Judging (J) and click Done if it's the last trait",
            context=jp_context
        )
        assert result["success"], "Failed to select Perceiving"
        
        await browser._save_screenshot("p_selected")
        await asyncio.sleep(1)
        
        # Check if we need to explicitly submit the assessment
        submit_check_context = """
        Check if we need to submit the assessment:
        - If there's a "Done", "Complete", "Submit" or "Finish" button visible, we need to click it
        - If we've already moved to a new screen after the last trait selection, we might not need to submit
        
        Look for any submit button and click it if found.
        """
        
        result = await self.execute_step(
            browser,
            "Submit the completed MBTI assessment if needed",
            context=submit_check_context
        )
        
        await browser._save_screenshot("mbti_submitted")
        await asyncio.sleep(2)
        
        # Step 5: Verify assessment was saved and handle Almost Done screen
        verify_context = """
        We should now be on an "Almost Done" screen or a screen showing our MBTI results.
        If we're on an "Almost Done" screen, look for a button to continue/proceed and click it.
        
        Our goal is to verify the assessment was saved - look for:
        - A confirmation message
        - The MBTI type "ENFP" displayed somewhere
        - A profile or dashboard showing MBTI as a completed assessment
        """
        
        result = await self.execute_step(
            browser,
            "Verify the MBTI assessment was completed and continue from Almost Done screen if needed",
            context=verify_context
        )
        assert result["success"], "Failed to verify MBTI assessment was saved"
        
        await asyncio.sleep(1)
        
        # Test completed successfully
        logger.success("Successfully completed MBTI assessment with result ENFP")
    
    # Helper methods
    
    async def _perform_signup(self, browser, email, password):
        """Quick sign up helper method."""
        # Navigate to sign up screen using the shared helper
        result = await self.navigate_to_signup_screen(browser)
        if not result.get("success", False):
            logger.error(f"Failed to navigate to sign up screen: {result.get('error', 'Unknown error')}")
            raise AssertionError(f"Failed to navigate to sign up screen: {result.get('error', 'Unknown error')}")
        
        # Fill the form
        signup_context = f"""
        Fill out the sign up form with:
        Email: {email}
        Password: {password}
        Then submit the form by clicking the Create Account button.
        """
        
        await self.execute_step(
            browser,
            "Complete the sign up form and submit",
            context=signup_context
        )
        
        # We're now at the Welcome screen, continue to assessment selection
        await self.execute_step(
            browser,
            "Click the Next or Continue button to proceed to assessment selection",
            context="Look for a button at the bottom of the Welcome screen to continue to assessment selection"
        )
        await asyncio.sleep(1)
    
    async def _perform_signin(self, browser, email, password):
        """Quick sign in helper method."""
        # Navigate to sign in screen using the shared helper
        result = await self.navigate_to_signin_screen(browser)
        if not result.get("success", False):
            logger.error(f"Failed to navigate to sign in screen: {result.get('error', 'Unknown error')}")
            raise AssertionError(f"Failed to navigate to sign in screen: {result.get('error', 'Unknown error')}")
        
        # Fill the form
        signin_context = f"""
        Fill out the sign in form with:
        Email: {email}
        Password: {password}
        Then submit the form by clicking the Sign In button.
        """
        
        await self.execute_step(
            browser,
            "Complete the sign in form and submit",
            context=signin_context
        )
        await asyncio.sleep(2)
    
    async def _navigate_to_assessment_screen(self, browser):
        """Helper to navigate to the assessment screen."""
        assessment_context = """
        We need to navigate to the screen where we can add assessments.
        After login, we should be on or near the Choose Assessment screen.
        
        The flow might be:
        - If on the Welcome screen: look for a Continue/Next button at the bottom
        - If on a dashboard: look for an "Add Assessment" button or a menu item labeled "Assessments"
        - Look for a screen showing assessment options like "MBTI", "Enneagram", etc.
        
        Our goal is to reach the screen where we can select which assessment to take.
        """
        
        result = await self.execute_step(
            browser,
            "Navigate to the assessment selection screen where MBTI is an option",
            context=assessment_context
        )
        
        await browser._save_screenshot("assessment_screen")
        
        # If we can't find the assessment options right away, we might need another action
        if not result.get("success", False):
            logger.warning("First attempt to find assessment screen failed, trying to find Add Assessment button")
            
            add_assessment_context = """
            Look for an "Add Assessment", "Choose Assessment", or "+" button that would allow us to 
            add a new assessment. This might be on a profile page, dashboard, or dedicated assessments page.
            """
            
            result = await self.execute_step(
                browser,
                "Find and click the Add Assessment button",
                context=add_assessment_context
            )
            
            await browser._save_screenshot("after_clicking_add_assessment")
            await asyncio.sleep(1)


if __name__ == "__main__":
    pytest.main(["-v", "test_mbti_assessment.py"])