#!/usr/bin/env python
"""Script to run browser-use tests with various options."""
import argparse
import subprocess
import sys
import os
from pathlib import Path


def main():
    """Main entry point for the test runner."""
    parser = argparse.ArgumentParser(description="Run browser-use tests")
    parser.add_argument(
        "--headless", 
        action="store_true", 
        help="Run tests in headless mode"
    )
    parser.add_argument(
        "--parallel", 
        action="store_true", 
        help="Run tests in parallel"
    )
    parser.add_argument(
        "--browser", 
        choices=["chromium", "firefox", "webkit"],
        default="chromium",
        help="Browser type to use"
    )
    parser.add_argument(
        "--test", 
        help="Specific test file or directory to run"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Increase verbosity"
    )
    parser.add_argument(
        "--debug", "-d",
        action="store_true",
        help="Run in debug mode with additional logging"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=60000,
        help="Set timeout for browser actions in milliseconds"
    )
    
    args = parser.parse_args()
    
    # Set environment variables based on args
    env = os.environ.copy()
    
    if args.headless:
        env["HEADLESS"] = "true"
    else:
        env["HEADLESS"] = "false"
        
    env["BROWSER_TYPE"] = args.browser
    env["DEFAULT_TIMEOUT"] = str(args.timeout)
    
    if args.debug:
        env["PYTHONPATH"] = "."
        env["DEBUG"] = "true"
        env["LOG_LEVEL"] = "DEBUG"
    
    # Build the pytest command
    cmd = ["python", "-m", "pytest"]
    
    # Add options
    if args.verbose:
        cmd.append("-v")
        
    if args.parallel:
        cmd.append("-xvs")
        
    # Add test path if specified
    if args.test:
        cmd.append(args.test)
        
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, env=env)
    
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())