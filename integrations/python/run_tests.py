#!/usr/bin/env python3
"""
Test runner for scalar-api-reference shared package.
This script runs all tests and provides a summary.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_tests():
    """Run all tests for the scalar-api-reference package"""

    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    print("🧪 Running Scalar API Reference Shared Package Tests")
    print("=" * 50)

    # Check if pytest is available
    try:
        import pytest
    except ImportError:
        print("❌ pytest is not installed. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pytest"], check=True)

    # Run the tests
    print("📋 Running unit tests...")
    result = subprocess.run([
        sys.executable, "-m", "pytest",
        "tests/",
        "-v",
        "--tb=short",
        "--color=yes"
    ])

    if result.returncode == 0:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    run_tests()
