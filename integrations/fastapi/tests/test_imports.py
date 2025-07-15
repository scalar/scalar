"""
Simple test to verify that all imports work correctly.
This is useful for catching import issues early.
"""

import pytest


def test_scalar_fastapi_imports():
    """Test that all scalar_fastapi imports work correctly"""

    # Test main function import
    from scalar_fastapi import get_scalar_api_reference
    assert callable(get_scalar_api_reference)

    # Test enum imports
    from scalar_fastapi import Layout, SearchHotKey, Theme
    assert Layout.MODERN.value == "modern"
    assert Layout.CLASSIC.value == "classic"
    assert SearchHotKey.K.value == "k"
    assert SearchHotKey.A.value == "a"
    assert SearchHotKey.Z.value == "z"

    # Test Theme enum values
    assert Theme.DEFAULT.value == "default"
    assert Theme.ALTERNATE.value == "alternate"
    assert Theme.MOON.value == "moon"
    assert Theme.PURPLE.value == "purple"
    assert Theme.SOLARIZED.value == "solarized"
    assert Theme.BLUE_PLANET.value == "bluePlanet"
    assert Theme.SATURN.value == "saturn"
    assert Theme.KEPLER.value == "kepler"
    assert Theme.MARS.value == "mars"
    assert Theme.DEEP_SPACE.value == "deepSpace"
    assert Theme.LASERWAVE.value == "laserwave"
    assert Theme.NONE.value == "none"


def test_fastapi_imports():
    """Test that FastAPI imports work correctly"""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from fastapi.responses import HTMLResponse

    # Verify we can create a FastAPI app
    app = FastAPI()
    assert app is not None

    # Verify we can create a test client
    client = TestClient(app)
    assert client is not None


def test_pytest_imports():
    """Test that pytest imports work correctly"""
    import pytest

    # Verify pytest is available
    assert pytest is not None


def test_typing_imports():
    """Test that typing imports work correctly"""
    from typing_extensions import Annotated, Doc

    # Verify typing extensions are available
    assert Annotated is not None
    assert Doc is not None


def test_theme_enum_completeness():
    """Test that all expected theme values are available"""
    from scalar_fastapi import Theme

    # Check that all expected themes are present
    expected_themes = [
        "default", "alternate", "moon", "purple", "solarized",
        "bluePlanet", "saturn", "kepler", "mars", "deepSpace",
        "laserwave", "none"
    ]

    actual_themes = [theme.value for theme in Theme]

    for expected_theme in expected_themes:
        assert expected_theme in actual_themes, f"Theme '{expected_theme}' not found in Theme enum"

    assert len(actual_themes) == len(expected_themes), "Number of themes doesn't match expected count"


def test_theme_enum_uniqueness():
    """Test that all theme values are unique"""
    from scalar_fastapi import Theme

    theme_values = [theme.value for theme in Theme]
    unique_values = set(theme_values)

    assert len(theme_values) == len(unique_values), "Theme enum contains duplicate values"
