# Scalar FastAPI Integration Tests

This directory contains comprehensive automated tests for the Scalar FastAPI integration.

## Test Structure

- `test_scalar_fastapi.py` - Unit tests for the `get_scalar_api_reference` function
- `test_integration.py` - Integration tests for FastAPI applications with Scalar
- `requirements.txt` - Test dependencies

## Running Tests

### Option 1: Using the test runner script (Recommended)

```bash
# Run all tests
python run_tests.py

# Run specific test file
python run_tests.py test_scalar_fastapi.py

# Run specific test function
python run_tests.py test_scalar_fastapi.py test_basic_functionality

# Get help
python run_tests.py --help
```

### Option 2: Using pytest directly

```bash
# Install test dependencies
pip install -r tests/requirements.txt

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_scalar_fastapi.py -v

# Run specific test class
pytest tests/test_scalar_fastapi.py::TestGetScalarApiReference -v

# Run specific test function
pytest tests/test_scalar_fastapi.py::TestGetScalarApiReference::test_basic_functionality -v

# Run with coverage
pytest tests/ --cov=scalar_fastapi --cov-report=html
```

### Option 3: Using the playground for manual testing

```bash
cd playground
pip install -r requirements.txt
uvicorn main:app --reload
```

Then visit `http://127.0.0.1:8000/scalar` to see the Scalar interface.
