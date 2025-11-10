# Scalar Django Ninja Integration Tests

This directory contains comprehensive tests for the `scalar_ninja` integration package.

## Test Structure

The test suite is organized into three main test files:

### 1. `test_imports.py`
Tests basic imports and enum values to catch import issues early.

**Coverage:**
- Import verification for all public API components
- Layout enum values
- SearchHotKey enum values (all alphabet letters)
- Theme enum values and completeness
- DocumentDownloadType enum values
- Django and Pydantic imports
- Model instantiation (OpenAPISource, ScalarConfig)

### 2. `test_scalar_ninja.py`
Tests core functionality of the scalar_ninja package.

**Coverage:**
- Enum classes (Layout, SearchHotKey, Theme, DocumentDownloadType)
- OpenAPISource model with various configurations
- ScalarConfig model with default and custom values
- `get_scalar_api_reference()` function with various configurations
- Theme parameter testing for all theme values
- Document download type configurations
- Additional configuration options (hide_test_request_button, hide_search, etc.)
- HTML structure and output validation
- Edge cases and special characters
- Complex JSON structures in configuration

### 3. `test_integration.py`
Integration tests with Django Ninja API.

**Coverage:**
- ScalarViewer instantiation and usage
- Integration with Django Ninja NinjaAPI
- Multiple viewers with different configurations
- Layout, theme, and sidebar configurations
- Dark mode and search hotkey configurations
- All theme values in integration context
- ScalarConfig object usage with ScalarViewer
- Additional Django-ninja specific features
- Meta tags and HTML structure in rendered output

## Running the Tests

### Prerequisites

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Or install the package with test dependencies:

```bash
pip install -e ".[test]"
```

### Run All Tests

```bash
# From the tests directory
pytest

# From the project root
pytest tests/

# With verbose output
pytest -v

# With coverage report
pytest --cov=scalar_ninja --cov-report=html
```

### Run Specific Test Files

```bash
# Run only import tests
pytest tests/test_imports.py

# Run only core functionality tests
pytest tests/test_scalar_ninja.py

# Run only integration tests
pytest tests/test_integration.py
```

### Run Specific Test Classes or Methods

```bash
# Run a specific test class
pytest tests/test_scalar_ninja.py::TestTheme

# Run a specific test method
pytest tests/test_integration.py::TestDjangoNinjaIntegration::test_scalar_viewer_with_api
```

## Test Coverage

The test suite provides comprehensive coverage of:

1. **Enums and Constants**
   - All enum values are tested
   - Uniqueness and completeness of enum values

2. **Models**
   - OpenAPISource with URL and content variations
   - ScalarConfig with all configuration options
   - Default values and custom values

3. **Core Functionality**
   - HTML generation
   - Configuration serialization
   - Default value filtering (only non-default values in output)
   - Multiple OpenAPI sources
   - Direct content vs URL loading

4. **Integration**
   - Django Ninja API integration
   - ScalarViewer render_page method
   - Multiple viewers with different configurations
   - Request handling

5. **Edge Cases**
   - Empty strings
   - Special characters in titles
   - Complex JSON structures
   - Dictionary and list configurations

## Test Fixtures

### `request_factory`
A Django RequestFactory instance for creating mock HTTP requests.

### `api`
A test Django Ninja API with sample endpoints:
- `GET /` - Root endpoint
- `GET /items/{item_id}` - Item detail endpoint
- `POST /items/` - Item creation endpoint

## Continuous Integration

These tests are designed to run in CI/CD pipelines. They require:
- Python 3.8+
- Django 4.2+
- django-ninja 1.1+
- pytest 7.4+

## Adding New Tests

When adding new features to `scalar_ninja`, please:

1. Add unit tests to `test_scalar_ninja.py` for new configuration options
2. Add integration tests to `test_integration.py` for new viewer features
3. Update `test_imports.py` if adding new public API components
4. Ensure all tests pass before submitting a PR

## Test Inspiration

These tests are inspired by and maintain parity with the FastAPI integration tests, ensuring consistent quality across all Scalar integrations.

