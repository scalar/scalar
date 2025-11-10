"""
Simple test to verify that all imports work correctly.
This is useful for catching import issues early.
"""

from django.conf import settings

# Configure Django settings if not already configured
# This MUST be done before importing Django Ninja
if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY="test-secret-key",
        ROOT_URLCONF=__name__,
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
        ],
        MIDDLEWARE=[],
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
    )


def test_scalar_ninja_imports():
    """Test that all scalar_ninja imports work correctly"""

    # Test main imports
    from scalar_ninja import (
        DocumentDownloadType,
        Layout,
        OpenAPISource,
        ScalarConfig,
        ScalarViewer,
        SearchHotKey,
        Theme,
    )

    assert callable(ScalarViewer)
    assert ScalarConfig is not None
    assert OpenAPISource is not None
    assert DocumentDownloadType is not None
    assert Layout is not None
    assert SearchHotKey is not None
    assert Theme is not None


def test_document_download_type_enum():
    """Test that DocumentDownloadType enum has correct values"""
    from scalar_ninja import DocumentDownloadType

    assert DocumentDownloadType.JSON.value == "json"
    assert DocumentDownloadType.YAML.value == "yaml"
    assert DocumentDownloadType.BOTH.value == "both"
    assert DocumentDownloadType.NONE.value == "none"


def test_layout_enum():
    """Test that Layout enum has correct values"""
    from scalar_ninja import Layout

    assert Layout.MODERN.value == "modern"
    assert Layout.CLASSIC.value == "classic"


def test_search_hot_key_enum():
    """Test that SearchHotKey enum has correct values"""
    from scalar_ninja import SearchHotKey

    # Test a few key values
    assert SearchHotKey.K.value == "k"
    assert SearchHotKey.A.value == "a"
    assert SearchHotKey.Z.value == "z"
    assert SearchHotKey.S.value == "s"

    # Test that all alphabet letters are present
    alphabet = "abcdefghijklmnopqrstuvwxyz"
    for letter in alphabet:
        assert hasattr(SearchHotKey, letter.upper())
        assert getattr(SearchHotKey, letter.upper()).value == letter


def test_theme_enum():
    """Test that Theme enum has correct values"""
    from scalar_ninja import Theme

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


def test_theme_enum_completeness():
    """Test that all expected theme values are available"""
    from scalar_ninja import Theme

    # Check that all expected themes are present
    expected_themes = [
        "default",
        "alternate",
        "moon",
        "purple",
        "solarized",
        "bluePlanet",
        "saturn",
        "kepler",
        "mars",
        "deepSpace",
        "laserwave",
        "none",
    ]

    actual_themes = [theme.value for theme in Theme]

    for expected_theme in expected_themes:
        assert expected_theme in actual_themes, (
            f"Theme '{expected_theme}' not found in Theme enum"
        )

    assert len(actual_themes) == len(expected_themes), (
        "Number of themes doesn't match expected count"
    )


def test_theme_enum_uniqueness():
    """Test that all theme values are unique"""
    from scalar_ninja import Theme

    theme_values = [theme.value for theme in Theme]
    unique_values = set(theme_values)

    assert len(theme_values) == len(unique_values), (
        "Theme enum contains duplicate values"
    )

    # Check that all values are strings
    for value in theme_values:
        assert isinstance(value, str)
        assert len(value) > 0


def test_django_imports():
    """Test that Django imports work correctly"""
    from django.http import HttpResponse
    from ninja import NinjaAPI

    # Verify we can create a Django HttpResponse
    response = HttpResponse("test")
    assert response is not None

    # Verify we can create a Ninja API
    api = NinjaAPI()
    assert api is not None


def test_pydantic_imports():
    """Test that Pydantic imports work correctly"""
    from pydantic import BaseModel, Field

    # Verify Pydantic is available
    assert BaseModel is not None
    assert Field is not None


def test_openapi_source_model():
    """Test that OpenAPISource model can be instantiated"""
    from scalar_ninja import OpenAPISource

    # Test basic instantiation
    source = OpenAPISource(title="Test API", url="/openapi.json")
    assert source.title == "Test API"
    assert source.url == "/openapi.json"
    assert source.default is False

    # Test with content
    source2 = OpenAPISource(title="Test API 2", content='{"openapi": "3.0.0"}')
    assert source2.content == '{"openapi": "3.0.0"}'
    assert source2.url is None


def test_scalar_config_model():
    """Test that ScalarConfig model can be instantiated"""
    from scalar_ninja import ScalarConfig, Theme, Layout

    # Test basic instantiation
    config = ScalarConfig(openapi_url="/api/openapi.json", title="Test API")
    assert config.openapi_url == "/api/openapi.json"
    assert config.title == "Test API"

    # Test with theme
    config_with_theme = ScalarConfig(
        openapi_url="/api/openapi.json", title="Test API", theme=Theme.MOON
    )
    assert config_with_theme.theme == Theme.MOON

    # Test with layout
    config_with_layout = ScalarConfig(
        openapi_url="/api/openapi.json", title="Test API", layout=Layout.CLASSIC
    )
    assert config_with_layout.layout == Layout.CLASSIC
