"""Tests for viewing and interacting with user insights."""
import pytest
import asyncio
from typing import Dict, Any
from loguru import logger

from lib.base_test import BaseLLMTest
from lib.utils import load_test_data


class TestUserInsights(BaseLLMTest):
    """Test the user insights features."""
    
    @pytest.mark.asyncio
    async def test_view_user_insights(self, browser):
        """Test viewing user insights after completing assessments."""
        # Load test data from previous sign-up if available
        test_data = load_test_data("signup_test_data.json")
        
        if test_data and "email" in test_data and "password" in test_data:
            # If we have saved credentials, let's try to use them
            login_context = f"""
            Sign in with the existing account:
            - Email: {test_data['email']}
            - Password: {test_data['password']}
            """
            
            # Step 1: Sign in with existing account
            result = await self.execute_step(
                browser,
                "Sign in with the existing test account",
                context=login_context,
                verify_elements=["User profile or dashboard"]
            )
            
            if not result.get("success"):
                logger.warning("Failed to sign in with existing account, skipping this test")
                pytest.skip("Could not sign in with existing account")
        else:
            logger.warning("No existing test account found, skipping this test")
            pytest.skip("No existing test account found")
            
        # Step 2: Navigate to insights section
        insights_context = """
        Navigate to the section of the app that shows user insights or analysis.
        This might be called "Insights", "Analysis", "Quick Insights", or similar.
        The goal is to view the insights generated based on the user's assessment results.
        """
        
        result = await self.execute_step(
            browser,
            "Navigate to the user insights or analysis section",
            context=insights_context,
            verify_elements=["Insight cards or content"]
        )
        assert result["success"], "Failed to navigate to insights section"
        
        # Step 3: View a specific insight
        view_insight_context = """
        Select and view the details of one specific insight.
        Click on an insight card or item to see more details about that particular insight.
        """
        
        result = await self.execute_step(
            browser,
            "Select and view details for a specific insight",
            context=view_insight_context,
            verify_elements=["Detailed insight content"]
        )
        assert result["success"], "Failed to view specific insight details"
        
        # Step 4: Interact with insight (like, share, etc.)
        interact_context = """
        Interact with the insight by using any available actions.
        This could include liking the insight, sharing it, saving it,
        or any other interactive elements on the insight detail page.
        """
        
        result = await self.execute_step(
            browser,
            "Interact with the insight using available actions (like, share, etc.)",
            context=interact_context
        )
        
        # Step 5: Navigate back to the insights list
        back_context = """
        Navigate back to the main insights list or overview page.
        This might involve clicking a back button, a breadcrumb,
        or a navigation element.
        """
        
        result = await self.execute_step(
            browser,
            "Navigate back to the main insights list",
            context=back_context,
            verify_elements=["Multiple insight cards or list view"]
        )
        assert result["success"], "Failed to navigate back to insights list"
        
        # Test completed successfully
        logger.success("Successfully viewed and interacted with user insights")


if __name__ == "__main__":
    pytest.main(["-v", "test_user_insights.py"])