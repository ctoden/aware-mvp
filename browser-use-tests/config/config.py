"""Configuration management for the browser-use tests."""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI API key for LLM interaction
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

# Base URL for the application being tested
BASE_URL: str = os.getenv("BASE_URL", "http://localhost:19006")

# Timeout configurations
DEFAULT_TIMEOUT: int = int(os.getenv("DEFAULT_TIMEOUT", "30000"))
NAVIGATION_TIMEOUT: int = int(os.getenv("NAVIGATION_TIMEOUT", "60000"))

# Browser configuration
HEADLESS: bool = os.getenv("HEADLESS", "false").lower() == "true"
BROWSER_TYPE: str = os.getenv("BROWSER_TYPE", "chromium")  # chromium, firefox, webkit

# Screenshot directory
SCREENSHOT_DIR: str = os.getenv("SCREENSHOT_DIR", "screenshots")

# Test data
TEST_EMAIL: str = os.getenv("TEST_EMAIL", "test@example.com")
TEST_PASSWORD: str = os.getenv("TEST_PASSWORD", "TestPassword123!")