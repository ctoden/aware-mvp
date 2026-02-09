"""Base test class for LLM-powered browser tests."""
import asyncio
import pytest
from typing import Optional, Dict, Any, List
from loguru import logger

from lib.llm_browser import LLMBrowser


class BaseLLMTest:
    """Base class for all LLM-powered browser tests."""
    
    # Class variables for test configuration
    llm_model = "gpt-4o"
    
    @pytest.fixture
    async def browser(self):
        """Fixture to provide LLM Browser for tests."""
        browser = LLMBrowser(model=self.llm_model)
        await browser.start()
        
        try:
            yield browser
        finally:
            await browser.stop()
    
    async def navigate_to_auth_screen(self, browser: LLMBrowser) -> Dict[str, Any]:
        """
        Shared helper method to navigate through the three intro screens to reach the auth screen.
        
        Args:
            browser: LLM Browser instance
            
        Returns:
            Result dictionary with success status and other information
        """
        logger.info("Navigating through intro screens to reach auth screen")
        
        # Step 1: Click the Get Started button on the very first Welcome screen
        welcome_context = """
        The app starts on the initial Welcome screen with a prominent "Get Started" button.
        This is the very first screen users see when opening the app for the first time.
        Click the "Get Started" button to begin the intro sequence.
        """
        
        result = await self.execute_step(
            browser,
            "Click the Get Started button on the initial Welcome screen",
            context=welcome_context
        )
        if not result.get("success", False):
            logger.error("Failed to click Get Started button")
            return {"success": False, "stage": "get_started", "error": "Failed to click Get Started button"}
        
        # Wait briefly for animation
        await asyncio.sleep(2)
        
        # Step 2: Navigate through FIRST intro screen
        intro1_context = """
        You should now be on the FIRST intro screen of three.
        This is part of the onboarding flow that explains the app's features.
        Look for a "Continue" button at the bottom of the screen and click it.
        This is the FIRST of THREE intro screens we need to navigate through.
        """
        
        result = await self.execute_step(
            browser,
            "Click the Continue button on the FIRST intro screen",
            context=intro1_context
        )
        if not result.get("success", False):
            logger.error("Failed to navigate past first intro screen")
            return {"success": False, "stage": "intro1", "error": "Failed to navigate past first intro screen"}
        
        # Wait briefly for animation
        await asyncio.sleep(1.5)
        
        # Step 3: Navigate through SECOND intro screen
        intro2_context = """
        You should now be on the SECOND intro screen of three.
        This screen continues explaining the app's features or benefits.
        Look for a "Continue" button at the bottom of the screen and click it.
        This is the SECOND of THREE intro screens we need to navigate through.
        """
        
        result = await self.execute_step(
            browser,
            "Click the Continue button on the SECOND intro screen",
            context=intro2_context
        )
        if not result.get("success", False):
            logger.error("Failed to navigate past second intro screen")
            return {"success": False, "stage": "intro2", "error": "Failed to navigate past second intro screen"}
        
        await asyncio.sleep(1.5)
        
        # Step 4: Navigate through THIRD intro screen
        intro3_context = """
        You should now be on the THIRD and FINAL intro screen of the three-screen sequence.
        This screen concludes the explanation of the app's features or benefits.
        Look for a "Continue" button at the bottom of the screen and click it.
        After this screen, we expect to reach the authentication screen.
        """
        
        result = await self.execute_step(
            browser,
            "Click the Continue button on the THIRD and FINAL intro screen",
            context=intro3_context
        )
        if not result.get("success", False):
            logger.error("Failed to navigate past third intro screen")
            return {"success": False, "stage": "intro3", "error": "Failed to navigate past third intro screen"}
        
        await asyncio.sleep(1.5)
        
        # Verify we reached the auth screen
        auth_screen_context = """
        After completing the three intro screens, we should now be on the authentication screen.
        This screen typically has options to Sign In or Sign Up.
        Verify we've reached this authentication screen.
        """
        
        result = await self.execute_step(
            browser,
            "Verify we've reached the authentication screen with Sign In/Sign Up options",
            context=auth_screen_context,
            verify_elements=["Sign In button", "Sign Up button or Create Account button"]
        )
        if not result.get("success", False):
            logger.error("Failed to reach the authentication screen")
            return {"success": False, "stage": "auth_verification", "error": "Failed to reach the authentication screen"}
        
        logger.success("Successfully navigated to auth screen")
        return {"success": True, "stage": "complete", "message": "Successfully navigated to auth screen"}
    
    async def navigate_to_signup_screen(self, browser: LLMBrowser) -> Dict[str, Any]:
        """
        Navigate to the Sign Up screen by going through intro screens and selecting Sign Up on the auth screen.
        
        Args:
            browser: LLM Browser instance
            
        Returns:
            Result dictionary with success status and other information
        """
        # First navigate to auth screen
        auth_result = await self.navigate_to_auth_screen(browser)
        if not auth_result.get("success", False):
            return auth_result
        
        # Now click the Sign Up button
        signup_context = """
        On the authentication screen, look for a "Sign Up" or "Create Account" button and click it.
        This will take us to the screen where we can create a new account.
        """
        
        result = await self.execute_step(
            browser,
            "Click the Sign Up or Create Account button",
            context=signup_context
        )
        if not result.get("success", False):
            logger.error("Failed to navigate to sign up screen")
            return {"success": False, "stage": "signup_navigation", "error": "Failed to click Sign Up button"}
        
        await asyncio.sleep(1)
        logger.success("Successfully navigated to sign up screen")
        return {"success": True, "stage": "complete", "message": "Successfully navigated to sign up screen"}
    
    async def navigate_to_signin_screen(self, browser: LLMBrowser) -> Dict[str, Any]:
        """
        Navigate to the Sign In screen by going through intro screens and selecting Sign In on the auth screen.
        
        Args:
            browser: LLM Browser instance
            
        Returns:
            Result dictionary with success status and other information
        """
        # First navigate to auth screen
        auth_result = await self.navigate_to_auth_screen(browser)
        if not auth_result.get("success", False):
            return auth_result
        
        # Now click the Sign In button
        signin_context = """
        On the authentication screen, look for a "Sign In" or "Login" button and click it.
        This will take us to the screen where we can sign in to an existing account.
        """
        
        result = await self.execute_step(
            browser,
            "Click the Sign In button",
            context=signin_context
        )
        if not result.get("success", False):
            logger.error("Failed to navigate to sign in screen")
            return {"success": False, "stage": "signin_navigation", "error": "Failed to click Sign In button"}
        
        await asyncio.sleep(1)
        logger.success("Successfully navigated to sign in screen")
        return {"success": True, "stage": "complete", "message": "Successfully navigated to sign in screen"}
    
    async def execute_step(self, 
                          browser: LLMBrowser, 
                          description: str, 
                          context: Optional[str] = None,
                          verify_elements: Optional[List[str]] = None,
                          max_retries: int = 3,
                          timeout: int = 30000) -> Dict[str, Any]:
        """Execute a test step with retry logic.
        
        Args:
            browser: LLM Browser instance
            description: Natural language description of the step
            context: Additional context for the LLM
            verify_elements: List of elements to verify after the step
            max_retries: Maximum number of retries for the step
            
        Returns:
            Results of the step execution
        """
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                logger.info(f"Executing step: {description}")
                
                # Execute the step
                result = await browser.execute_task(description, context)
                
                # Verify elements if needed
                if verify_elements and result.get("success"):
                    all_verified = True
                    for element_desc in verify_elements:
                        verified = await browser.verify_element(element_desc)
                        if not verified:
                            all_verified = False
                            logger.warning(f"Element verification failed: {element_desc}")
                    
                    result["all_elements_verified"] = all_verified
                
                # If successful, return the result
                if result.get("success"):
                    logger.success(f"Step completed successfully")
                    return result
                    
                # Otherwise, retry
                logger.warning(f"Step failed, retrying ({retry_count+1}/{max_retries})")
                retry_count += 1
                
                # Wait before retrying
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error executing step: {e}")
                retry_count += 1
                
                # Wait before retrying
                await asyncio.sleep(2)
        
        # If we get here, all retries failed
        logger.error(f"Step failed after {max_retries} retries: {description}")
        return {"success": False, "error": f"Failed after {max_retries} retries"}