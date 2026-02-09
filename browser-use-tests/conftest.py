"""Pytest configuration for browser-use tests."""
import pytest
import os
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger
import sys


# Load environment variables from .env file
load_dotenv()

# Configure logger
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "browser-use-tests/logs/tests.log",
    rotation="10 MB",
    retention="1 week",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG"
)

# Create logs directory if it doesn't exist
Path("browser-use-tests/logs").mkdir(exist_ok=True, parents=True)
Path("browser-use-tests/test_data").mkdir(exist_ok=True, parents=True)

# Create a pytest hook to capture test status and add more detailed logging
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    # Execute all other hooks to obtain the report object
    outcome = yield
    rep = outcome.get_result()

    # Set a report attribute for each phase of a call
    setattr(item, f"rep_{rep.when}", rep)
    
    # Log test status
    if rep.when == "call":
        if rep.passed:
            logger.success(f"Test PASSED: {item.name}")
        elif rep.failed:
            logger.error(f"Test FAILED: {item.name}")
            if rep.longrepr:
                logger.error(f"Error: {rep.longrepr}")
        elif rep.skipped:
            logger.warning(f"Test SKIPPED: {item.name}")
            if rep.longrepr:
                logger.warning(f"Reason: {rep.longrepr}")