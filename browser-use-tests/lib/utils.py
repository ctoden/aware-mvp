"""Utility functions for browser-use tests."""
import random
import string
import time
import os
from pathlib import Path
from typing import Optional, Dict, Any
import json
from loguru import logger


def generate_random_email() -> str:
    """Generate a random email address for testing.
    
    Returns:
        Random email address
    """
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test.{random_str}@example.com"


def generate_random_password(length: int = 12) -> str:
    """Generate a random password for testing.
    
    Args:
        length: Length of the password
        
    Returns:
        Random password string
    """
    # Ensure we have at least one of each required character type
    lowercase = random.choice(string.ascii_lowercase)
    uppercase = random.choice(string.ascii_uppercase)
    digit = random.choice(string.digits)
    special = random.choice('!@#$%^&*()_-+=')
    
    # Fill the rest with random characters
    remaining_length = length - 4
    remaining_chars = ''.join(random.choices(
        string.ascii_letters + string.digits + '!@#$%^&*()_-+=', 
        k=remaining_length
    ))
    
    # Combine all parts and shuffle
    all_chars = lowercase + uppercase + digit + special + remaining_chars
    char_list = list(all_chars)
    random.shuffle(char_list)
    
    return ''.join(char_list)


def save_test_data(data: Dict[str, Any], filename: str = "test_data.json") -> str:
    """Save test data to a file for future use.
    
    Args:
        data: Dictionary of test data
        filename: Name of the file to save
        
    Returns:
        Path to the saved file
    """
    data_dir = Path("browser-use-tests/test_data")
    data_dir.mkdir(exist_ok=True, parents=True)
    
    # Add timestamp to data
    data["timestamp"] = time.time()
    
    # Ensure filename has .json extension
    if not filename.endswith(".json"):
        filename += ".json"
    
    file_path = data_dir / filename
    
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)
    
    logger.info(f"Saved test data to {file_path}")
    return str(file_path)


def load_test_data(filename: str = "test_data.json") -> Optional[Dict[str, Any]]:
    """Load test data from a file.
    
    Args:
        filename: Name of the file to load
        
    Returns:
        Dictionary of test data or None if file doesn't exist
    """
    data_dir = Path("browser-use-tests/test_data")
    
    # Ensure filename has .json extension
    if not filename.endswith(".json"):
        filename += ".json"
    
    file_path = data_dir / filename
    
    if not file_path.exists():
        logger.warning(f"Test data file not found: {file_path}")
        return None
    
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        
        logger.info(f"Loaded test data from {file_path}")
        return data
    except Exception as e:
        logger.error(f"Failed to load test data: {e}")
        return None