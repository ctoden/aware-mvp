# LLM-Powered Browser Tests

This directory contains tests that use Playwright combined with LLM for natural language navigation and verification of the Aware MVP app.

## Overview

Traditional end-to-end testing approaches like Playwright require specific selectors for UI elements, which can break when the UI changes. This approach uses LLM to interpret the current state of the application and determine how to interact with it based on natural language descriptions.

## Key Benefits

- **Resilient to UI Changes**: Tests describe what to do, not how to find specific elements
- **Natural Language Instructions**: Test steps are written in plain English
- **Adaptive Interactions**: The LLM can adapt to different UI layouts and find elements intelligently
- **Visual Verification**: Screenshots are captured at each step for debugging
- **Retry Logic**: Built-in retry mechanisms for more stable tests
- **Detailed Logging**: Comprehensive logging for easy troubleshooting

## Prerequisites

- Python 3.9+
- OpenAI API key (for LLM interaction)
- The Aware MVP app running at the configured URL

## Setup

1. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install Playwright browsers:
   ```bash
   python -m playwright install
   ```

4. Configure environment variables by copying the example file:
   ```bash
   cp .env.example .env
   ```

5. Edit `.env` to add your OpenAI API key and customize other settings.

## Running Tests

Run all tests:
```bash
python run_tests.py
```

Run a specific test:
```bash
python run_tests.py --test tests/test_signup_mbti_flow.py
```

Run with increased verbosity:
```bash
python run_tests.py --verbose
```

Run in headless mode:
```bash
python run_tests.py --headless
```

## Test Structure

- `lib/`: Core libraries and utilities
  - `llm_browser.py`: LLM-powered browser automation
  - `base_test.py`: Base test class for all tests
  - `utils.py`: Utility functions

- `tests/`: Test cases
  - `test_signup_mbti_flow.py`: Tests the sign-up and MBTI assessment flow
  - `test_user_insights.py`: Tests viewing and interacting with user insights

- `config/`: Configuration files
  - `config.py`: Loads and provides configuration settings

## How It Works

1. A test describes a step in natural language (e.g., "Click the sign-up button")
2. The LLM receives the page content and interprets what needs to be done
3. The LLM generates specific browser actions (click, input, etc.)
4. The framework executes these actions
5. Screenshots are taken at each step for verification
6. The process repeats for each test step

## Example Test Step

```python
result = await self.execute_step(
    browser,
    "Fill out the sign-up form with the test email and password",
    context="The form has fields for email and password",
    verify_elements=["Confirmation message or next button"]
)
```

## Debugging

- Screenshots are saved in the `screenshots/` directory
- Test data is saved in the `test_data/` directory
- Logs are saved in the `logs/` directory

## Adding New Tests

1. Create a new test file in the `tests/` directory
2. Extend the `BaseLLMTest` class
3. Implement test methods using the `execute_step` method
4. Run the new test to verify it works