"""Tests specifically for the Intro screen sequence."""
import pytest
import asyncio
import sys
import os
from typing import Dict, Any
from loguru import logger

# Add parent directory to path to find modules when running directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from lib.base_test import BaseLLMTest
from lib.utils import generate_random_email, generate_random_password, save_test_data


class TestIntroScreen(BaseLLMTest):
    """Test the intro screen sequence with detailed steps."""
    
    @pytest.mark.asyncio
    async def test_intro_screen_navigation(self, browser):
        """Test navigation through the intro screens with detailed steps."""
        logger.info("Starting intro screen test - verifying navigation through the 3 intro screens")
        
        # Use the shared helper method to navigate to the auth screen
        result = await self.navigate_to_auth_screen(browser)
        
        # Verify that navigation was successful
        assert result["success"], f"Failed to navigate to auth screen: {result.get('error', 'Unknown error')}"
        
        # Test completed - we've successfully navigated the 3 intro screens
        logger.success("Successfully navigated through all three intro screens to reach the auth screen")
        
    @pytest.mark.asyncio
    async def test_navigate_to_signup(self, browser):
        """Test navigation to the sign up screen."""
        logger.info("Starting test to navigate through intro screens to the sign up screen")
        
        # Use the shared helper method to navigate to the sign up screen
        result = await self.navigate_to_signup_screen(browser)
        
        # Verify that navigation was successful
        assert result["success"], f"Failed to navigate to sign up screen: {result.get('error', 'Unknown error')}"
        
        logger.success("Successfully navigated to the sign up screen")
        
    @pytest.mark.asyncio
    async def test_navigate_to_signin(self, browser):
        """Test navigation to the sign in screen."""
        logger.info("Starting test to navigate through intro screens to the sign in screen")
        
        # Use the shared helper method to navigate to the sign in screen
        result = await self.navigate_to_signin_screen(browser)
        
        # Verify that navigation was successful
        assert result["success"], f"Failed to navigate to sign in screen: {result.get('error', 'Unknown error')}"
        
        logger.success("Successfully navigated to the sign in screen")
        
    @pytest.mark.asyncio
    async def test_intro_screen_content(self, browser):
        """Test the content and visuals of each intro screen."""
        logger.info("Starting test to verify content of each intro screen")
        
        # Step 1: Click the Get Started button
        await self.execute_step(
            browser,
            "Click the Get Started button on the initial Welcome screen",
            context="Look for a prominent button on the very first screen"
        )
        await asyncio.sleep(1)
        
        # Step 2: Analyze the FIRST intro screen
        first_screen_context = """
        You're now on the FIRST intro screen. Without clicking any buttons yet,
        analyze the content of this screen:
        - What is the main heading/title?
        - What visual elements are present (images, illustrations)?
        - What key features or benefits are described?
        - What is the call-to-action button labeled as?
        
        After analyzing, provide a brief summary of what this screen is trying to communicate.
        Do NOT click any buttons yet.
        """
        
        result = await self.execute_step(
            browser,
            "Analyze the content of the FIRST intro screen",
            context=first_screen_context
        )
        
        # Now proceed to the second screen
        await self.execute_step(
            browser,
            "Click the Continue button to proceed to the next screen",
            context="Look for a button at the bottom of the screen"
        )
        await asyncio.sleep(1.5)
        
        # Step 3: Analyze the SECOND intro screen
        second_screen_context = """
        You're now on the SECOND intro screen. Without clicking any buttons yet,
        analyze the content of this screen:
        - What is the main heading/title?
        - What visual elements are present (images, illustrations)?
        - What key features or benefits are described?
        - What is the call-to-action button labeled as?
        
        After analyzing, provide a brief summary of what this screen is trying to communicate.
        Do NOT click any buttons yet.
        """
        
        result = await self.execute_step(
            browser,
            "Analyze the content of the SECOND intro screen",
            context=second_screen_context
        )
        
        # Now proceed to the third screen
        await self.execute_step(
            browser,
            "Click the Continue button to proceed to the next screen",
            context="Look for a button at the bottom of the screen"
        )
        await asyncio.sleep(1.5)
        
        # Step 4: Analyze the THIRD intro screen
        third_screen_context = """
        You're now on the THIRD intro screen. Without clicking any buttons yet,
        analyze the content of this screen:
        - What is the main heading/title?
        - What visual elements are present (images, illustrations)?
        - What key features or benefits are described?
        - What is the call-to-action button labeled as?
        
        After analyzing, provide a brief summary of what this screen is trying to communicate.
        Do NOT click any buttons yet.
        """
        
        result = await self.execute_step(
            browser,
            "Analyze the content of the THIRD intro screen",
            context=third_screen_context
        )
        
        # Complete the intro sequence to finish the test
        await self.execute_step(
            browser,
            "Click the Continue button to complete the intro sequence",
            context="Look for a button at the bottom of the screen"
        )
        
        logger.success("Successfully analyzed content of all three intro screens")


if __name__ == "__main__":
    pytest.main(["-v", "browser-use-tests/tests/test_intro_screen.py"])