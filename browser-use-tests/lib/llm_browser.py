"""LLM-powered browser automation module."""
import asyncio
import os
from typing import Optional, List, Dict, Any, Callable, Union
from pathlib import Path
import time
import json

from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from openai import AsyncOpenAI
from loguru import logger

from config.config import OPENAI_API_KEY, BASE_URL, DEFAULT_TIMEOUT, NAVIGATION_TIMEOUT, HEADLESS, BROWSER_TYPE, SCREENSHOT_DIR


class LLMBrowser:
    """Browser automation with LLM capabilities for natural language interaction."""
    
    def __init__(self, 
                 model: str = "gpt-4o",
                 base_url: str = BASE_URL,
                 headless: bool = HEADLESS,
                 browser_type: str = BROWSER_TYPE,
                 default_timeout: int = DEFAULT_TIMEOUT,
                 navigation_timeout: int = NAVIGATION_TIMEOUT,
                 screenshot_dir: str = SCREENSHOT_DIR,
                 api_key: str = OPENAI_API_KEY):
        """Initialize the LLM Browser.
        
        Args:
            model: OpenAI model to use
            base_url: Base URL of the application
            headless: Whether to run browser in headless mode
            browser_type: Type of browser to use (chromium, firefox, webkit)
            default_timeout: Default timeout for browser operations in ms
            navigation_timeout: Navigation timeout in ms
            screenshot_dir: Directory to save screenshots
            api_key: OpenAI API key
        """
        self.model = model
        self.base_url = base_url
        self.headless = headless
        self.browser_type = browser_type
        self.default_timeout = default_timeout
        self.navigation_timeout = navigation_timeout
        
        # Create screenshot directory if it doesn't exist
        self.screenshot_dir = Path(screenshot_dir)
        self.screenshot_dir.mkdir(exist_ok=True, parents=True)
        
        # Initialize OpenAI client
        self.client = AsyncOpenAI(api_key=api_key)
        
        # Playwright instances will be set during start()
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        
    async def start(self):
        """Start the browser session."""
        logger.info(f"Starting {self.browser_type} browser")
        
        if self.browser:
            logger.warning("Browser is already started. Stopping existing browser first.")
            await self.stop()
            
        # Start playwright and launch browser
        self.playwright = await async_playwright().start()
        
        # Get the browser instance based on browser_type
        if self.browser_type == "chromium":
            self.browser = await self.playwright.chromium.launch(headless=self.headless)
        elif self.browser_type == "firefox":
            self.browser = await self.playwright.firefox.launch(headless=self.headless)
        elif self.browser_type == "webkit":
            self.browser = await self.playwright.webkit.launch(headless=self.headless)
        else:
            raise ValueError(f"Unsupported browser type: {self.browser_type}")
        
        # Create context and page
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        
        # Set timeouts
        self.page.set_default_timeout(self.default_timeout)
        self.page.set_default_navigation_timeout(self.navigation_timeout)
        
        # Navigate to base URL
        await self.page.goto(self.base_url)
        logger.info(f"Navigated to {self.base_url}")
        
        # Take initial screenshot
        await self._save_screenshot("initial_load")
        
        return self
    
    async def stop(self):
        """Stop the browser session."""
        if self.browser:
            logger.info("Closing browser")
            await self.browser.close()
            self.browser = None
            self.page = None
            
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
    
    async def execute_task(self, task_description: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Execute a task described in natural language.
        
        Args:
            task_description: Natural language description of the task
            context: Additional context about the application state
            
        Returns:
            Dictionary with task execution results
        """
        if not self.browser or not self.page:
            raise RuntimeError("Browser is not started. Call start() first.")
            
        # Get page contents and screenshot for context
        page_content = await self.page.content()
        screenshot_path = await self._save_screenshot(f"pre_task_{int(time.time())}")
        
        # Build prompt with all relevant context
        prompt = self._build_task_prompt(task_description, page_content, context)
        
        # Get LLM response with browser actions
        actions = await self._get_llm_actions(prompt)
        
        # Execute the actions
        results = await self._execute_actions(actions)
        
        # Take post-action screenshot
        await self._save_screenshot(f"post_task_{int(time.time())}")
        
        return {
            "task": task_description,
            "actions": actions,
            "results": results,
            "success": all(result.get("success", False) for result in results)
        }
    
    async def verify_element(self, description: str) -> bool:
        """Verify if an element described in natural language exists on the page.
        
        Args:
            description: Natural language description of the element
            
        Returns:
            True if the element is found, False otherwise
        """
        if not self.browser or not self.page:
            raise RuntimeError("Browser is not started. Call start() first.")
        
        page_content = await self.page.content()
        
        prompt = f"""
        You are an AI assistant helping with browser automation. Based on the following page content,
        determine if an element matching this description exists: "{description}"
        
        If it exists, provide the most appropriate selector to find it.
        If it doesn't exist, explain why it might not be found.
        
        Page Content:
        {page_content}
        
        Return your response in this JSON format:
        {{
            "exists": true/false,
            "selector": "selector string if exists",
            "explanation": "explanation of your reasoning"
        }}
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a browser automation expert that analyzes HTML and finds elements."},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.content
        logger.debug(f"LLM verification result: {result}")
        
        try:
            parsed = json.loads(result)
            
            if parsed.get("exists", False) and parsed.get("selector"):
                # Double-check by trying to find the element
                try:
                    element = await self.page.query_selector(parsed["selector"])
                    return element is not None
                except Exception as e:
                    logger.warning(f"Failed to verify element with selector {parsed['selector']}: {e}")
                    return False
            else:
                return False
                
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return False
    
    async def _save_screenshot(self, name: str) -> str:
        """Save a screenshot of the current page.
        
        Args:
            name: Name of the screenshot file
            
        Returns:
            Path to the saved screenshot
        """
        if not self.page:
            raise RuntimeError("Browser is not started. Call start() first.")
            
        filename = f"{name}.png"
        path = self.screenshot_dir / filename
        
        await self.page.screenshot(path=str(path))
        logger.debug(f"Saved screenshot to {path}")
        
        return str(path)
    
    def _build_task_prompt(self, task: str, page_content: str, context: Optional[str]) -> str:
        """Build prompt for the LLM to generate browser actions.
        
        Args:
            task: The task to execute
            page_content: HTML content of the current page
            context: Additional context about the application
            
        Returns:
            Formatted prompt string
        """
        prompt = f"""
        You are an AI assistant helping with browser automation. Your task is to:
        
        {task}
        
        Based on the current page content, determine what browser actions should be taken to accomplish this task.
        Focus on identifying the right elements and interactions.
        
        Current page content:
        {page_content[:10000]}  # Truncated to avoid token limits
        """
        
        if context:
            prompt += f"\n\nAdditional context:\n{context}"
            
        prompt += """
        Return your response as a JSON object with an "actions" key containing an array of actions. Each action should have:
        1. A "type" (click, input, wait, navigate, etc.)
        2. Necessary parameters for that action type
        3. A "description" explaining why this action is needed
        
        Example:
        {
          "actions": [
            {
              "type": "click",
              "selector": "button.sign-up",
              "description": "Click the Sign Up button to begin registration"
            },
            {
              "type": "input",
              "selector": "input[name='email']",
              "value": "test@example.com",
              "description": "Enter email address in the email field"
            }
          ]
        }
        """
        
        return prompt
    
    async def _get_llm_actions(self, prompt: str) -> List[Dict[str, Any]]:
        """Get actions from LLM based on prompt.
        
        Args:
            prompt: Prompt for the LLM
            
        Returns:
            List of action dictionaries
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a browser automation expert that helps users interact with web applications."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            result = response.choices[0].message.content
            logger.debug(f"LLM response: {result}")
            
            parsed = json.loads(result)
            actions = parsed.get("actions", [])
                
            return actions
            
        except Exception as e:
            logger.error(f"Failed to get LLM actions: {e}")
            return []
    
    async def _execute_actions(self, actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute a list of browser actions.
        
        Args:
            actions: List of action dictionaries from LLM
            
        Returns:
            List of result dictionaries (one per action)
        """
        if not self.browser or not self.page:
            raise RuntimeError("Browser is not started. Call start() first.")
            
        results = []
        
        for i, action in enumerate(actions):
            action_type = action.get("type", "").lower()
            logger.info(f"Executing action {i+1}/{len(actions)}: {action_type} - {action.get('description', '')}")
            
            result = {
                "action": action,
                "success": False,
                "error": None
            }
            
            try:
                if action_type == "click":
                    await self.page.click(action["selector"])
                    result["success"] = True
                
                elif action_type == "input" or action_type == "fill":
                    await self.page.fill(action["selector"], action["value"])
                    result["success"] = True
                
                elif action_type == "type":
                    await self.page.type(action["selector"], action["value"])
                    result["success"] = True
                
                elif action_type == "wait":
                    if "selector" in action:
                        await self.page.wait_for_selector(action["selector"], timeout=action.get("timeout", self.default_timeout))
                        result["success"] = True
                    elif "time" in action:
                        await asyncio.sleep(action["time"] / 1000)  # Convert ms to seconds
                        result["success"] = True
                    elif "navigation" in action and action["navigation"]:
                        await self.page.wait_for_navigation(timeout=action.get("timeout", self.navigation_timeout))
                        result["success"] = True
                    elif "load_state" in action:
                        await self.page.wait_for_load_state(action["load_state"], timeout=action.get("timeout", self.navigation_timeout))
                        result["success"] = True
                    else:
                        # Default to a short wait if no specific wait type is provided
                        await asyncio.sleep(1)
                        result["success"] = True
                
                elif action_type == "navigate":
                    await self.page.goto(action["url"])
                    result["success"] = True
                
                elif action_type == "select":
                    if "value" in action:
                        await self.page.select_option(action["selector"], value=action["value"])
                    elif "label" in action:
                        await self.page.select_option(action["selector"], label=action["label"])
                    elif "index" in action:
                        await self.page.select_option(action["selector"], index=action["index"])
                    result["success"] = True
                
                elif action_type == "check":
                    await self.page.check(action["selector"])
                    result["success"] = True
                
                elif action_type == "uncheck":
                    await self.page.uncheck(action["selector"])
                    result["success"] = True
                
                elif action_type == "press":
                    await self.page.press(action["selector"], action["key"])
                    result["success"] = True
                
                elif action_type == "screenshot":
                    await self._save_screenshot(action.get("name", f"custom_screenshot_{i}"))
                    result["success"] = True
                
                else:
                    result["error"] = f"Unknown action type: {action_type}"
                
                # Take a screenshot after each action for debugging
                await self._save_screenshot(f"action_{i}_{action_type}")
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Failed to execute action {i+1}: {error_msg}")
                result["error"] = error_msg
                
                # Take a screenshot of the error state
                await self._save_screenshot(f"action_{i}_{action_type}_error")
            
            results.append(result)
            
            # If any action fails and it's not the last one, decide whether to continue
            if not result["success"] and i < len(actions) - 1:
                # For now, we'll continue despite errors, but log it
                logger.warning(f"Continuing with next action despite error in action {i+1}")
        
        return results