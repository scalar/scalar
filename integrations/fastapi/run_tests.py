#!/usr/bin/env python3
"""
Test runner for scalar-fastapi integration.
This script runs all tests and provides a summary.
"""

import subprocess
import sys
import os
from pathlib import Path


def run_tests():
    """Run all tests for the scalar-fastapi integration"""

    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    print("🧪 Running Scalar FastAPI Integration Tests")
    print("=" * 50)

    # Check if pytest is available
    try:
        import pytest
    except ImportError:
        print("❌ pytest is not installed. Installing test dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "tests/requirements.txt"], check=True)

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


def run_specific_test(test_file=None, test_function=None):
    """Run a specific test file or function"""

    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    cmd = [sys.executable, "-m", "pytest", "-v", "--tb=short", "--color=yes"]

    if test_file:
        cmd.append(f"tests/{test_file}")

    if test_function:
        cmd.append(f"-k {test_function}")

    subprocess.run(cmd)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help" or sys.argv[1] == "-h":
            print("Usage:")
            print("  python run_tests.py                    # Run all tests")
            print("  python run_tests.py test_file.py       # Run specific test file")
            print("  python run_tests.py test_file.py func  # Run specific test function")
        elif len(sys.argv) == 2:
            run_specific_test(sys.argv[1])
        elif len(sys.argv) == 3:
            run_specific_test(sys.argv[1], sys.argv[2])
    else:
        run_tests()
