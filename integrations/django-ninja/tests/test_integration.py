"""
Integration tests for Django Ninja with Scalar.
"""

import pytest
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

# Now we can safely import Django Ninja and other Django-dependent modules
from django.test import RequestFactory
from ninja import NinjaAPI, Schema

from scalar_ninja import (
    Layout,
    ScalarConfig,
    ScalarViewer,
    SearchHotKey,
    Theme,
)


@pytest.fixture
def request_factory():
    """Create a Django request factory"""
    return RequestFactory()


@pytest.fixture
def api():
    """Create a test Django Ninja API"""

    class ItemSchema(Schema):
        name: str
        description: str = None
        price: float

    api = NinjaAPI(title="Test API", version="1.0.0")

    @api.get("/")
    def read_root(request):
        return {"Hello": "World"}

    @api.get("/items/{item_id}")
    def read_item(request, item_id: int, q: str = None):
        return {"item_id": item_id, "q": q}

    @api.post("/items/")
    def create_item(request, item: ItemSchema):
        return {"item": item.dict(), "created": True}

    return api


class TestDjangoNinjaIntegration:
    """Integration tests for Django Ninja with Scalar"""

    def test_scalar_viewer_instantiation(self, api):
        """Test that ScalarViewer can be instantiated"""
        viewer = ScalarViewer(title="Test API - Scalar")
        assert viewer is not None
        assert isinstance(viewer, ScalarViewer)

    def test_scalar_viewer_with_api(self, api, request_factory):
        """Test ScalarViewer with Django Ninja API"""
        viewer = ScalarViewer(
            openapi_url="/api/openapi.json", title=api.title + " - Scalar"
        )

        # Create a mock request
        request = request_factory.get("/api/docs")

        # Render the page
        response = viewer.render_page(request, api)

        assert response.status_code == 200
        html_content = response.content.decode()

        # Check basic HTML structure
        assert "<!doctype html>" in html_content
        assert "<html>" in html_content
        assert "<head>" in html_content
        assert "<body>" in html_content

        # Check title
        assert f"<title>{api.title} - Scalar</title>" in html_content

        # Check OpenAPI URL in config
        assert '"/api/openapi.json"' in html_content

    def test_scalar_viewer_default_config(self, api, request_factory):
        """Test ScalarViewer with default configuration"""
        viewer = ScalarViewer()

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        assert response.status_code == 200
        html_content = response.content.decode()

        # Check that default values are NOT included in the config
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]

        assert "layout" not in config_section
        assert "showSidebar" not in config_section
        assert "darkMode" not in config_section
        assert "theme" not in config_section

    def test_scalar_viewer_custom_config(self, api, request_factory):
        """Test ScalarViewer with custom configuration"""
        viewer = ScalarViewer(
            openapi_url="/api/openapi.json",
            title="Custom API - Scalar",
            layout=Layout.CLASSIC,
            dark_mode=False,
            hide_download_button=True,
            hide_models=True,
            show_sidebar=False,
            search_hot_key=SearchHotKey.S,
            theme=Theme.MOON,
            servers=[
                {"name": "Production", "url": "https://api.example.com"},
                {"name": "Development", "url": "http://localhost:8000"},
            ],
            authentication={
                "apiKey": {"type": "apiKey", "in": "header", "name": "X-API-Key"}
            },
        )

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        assert response.status_code == 200
        html_content = response.content.decode()

        # Check custom configuration
        assert '"layout": "classic"' in html_content
        assert '"darkMode": false' in html_content
        assert '"hideDownloadButton": true' in html_content
        assert '"hideModels": true' in html_content
        assert '"showSidebar": false' in html_content
        assert '"searchHotKey": "s"' in html_content
        assert '"theme": "moon"' in html_content

        # Check servers configuration
        assert '"name": "Production"' in html_content
        assert '"url": "https://api.example.com"' in html_content
        assert '"name": "Development"' in html_content
        assert '"url": "http://localhost:8000"' in html_content

        # Check authentication configuration
        assert '"type": "apiKey"' in html_content
        assert '"in": "header"' in html_content
        assert '"name": "X-API-Key"' in html_content

    def test_scalar_viewer_theme_config(self, api, request_factory):
        """Test ScalarViewer with theme configuration"""
        viewer = ScalarViewer(
            openapi_url="/api/openapi.json",
            title="Theme Test",
            theme=Theme.PURPLE,
        )

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        assert response.status_code == 200
        html_content = response.content.decode()

        # Check theme configuration
        assert '"theme": "purple"' in html_content
        assert "<title>Theme Test</title>" in html_content

        # Check that other defaults are NOT present
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]

        assert "layout" not in config_section
        assert "showSidebar" not in config_section
        assert "darkMode" not in config_section

    def test_scalar_script_included(self, api, request_factory):
        """Test that the Scalar JavaScript is included"""
        viewer = ScalarViewer()

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()

        # Check that the Scalar script is included
        assert (
            'src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"' in html_content
        )

    def test_scalar_configuration_script(self, api, request_factory):
        """Test that the configuration script is properly generated"""
        viewer = ScalarViewer()

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()

        # Check configuration script structure
        assert 'Scalar.createApiReference("#app"' in html_content
        assert '"url": "/api/openapi.json"' in html_content

    def test_scalar_favicon_included(self, api, request_factory):
        """Test that favicon is included"""
        viewer = ScalarViewer()

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()

        assert 'href="https://django-ninja.dev/img/favicon.png"' in html_content

    def test_scalar_meta_tags(self, api, request_factory):
        """Test that proper meta tags are included"""
        viewer = ScalarViewer()

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()

        assert '<meta charset="utf-8"/>' in html_content
        assert (
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            in html_content
        )

    def test_multiple_scalar_viewers(self, api, request_factory):
        """Test that multiple scalar viewers can coexist"""
        viewer1 = ScalarViewer(title="Test API - Scalar")
        viewer2 = ScalarViewer(
            title="Test API - Custom Scalar",
            layout=Layout.CLASSIC,
            theme=Theme.MOON,
        )
        viewer3 = ScalarViewer(title="Test API - Theme Test", theme=Theme.PURPLE)

        request = request_factory.get("/api/docs")

        response1 = viewer1.render_page(request, api)
        response2 = viewer2.render_page(request, api)
        response3 = viewer3.render_page(request, api)

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response3.status_code == 200

        # They should have different titles
        assert "Test API - Scalar" in response1.content.decode()
        assert "Test API - Custom Scalar" in response2.content.decode()
        assert "Test API - Theme Test" in response3.content.decode()

        # They should have different configurations
        config1_start = response1.content.decode().find(
            'Scalar.createApiReference("#app", {'
        )
        config1_end = response1.content.decode().find("})", config1_start)
        config1_section = response1.content.decode()[config1_start:config1_end]

        config3_start = response3.content.decode().find(
            'Scalar.createApiReference("#app", {'
        )
        config3_end = response3.content.decode().find("})", config3_start)
        config3_section = response3.content.decode()[config3_start:config3_end]

        assert "layout" not in config1_section  # Default layout not included
        assert '"layout": "classic"' in response2.content.decode()
        assert "layout" not in config3_section  # Default layout not included

        # They should have different themes
        assert "theme" not in config1_section  # Default theme not included
        assert '"theme": "moon"' in response2.content.decode()
        assert '"theme": "purple"' in response3.content.decode()


class TestScalarConfiguration:
    """Test various Scalar configuration options"""

    def test_layout_configuration(self, api, request_factory):
        """Test different layout configurations"""
        # Test modern layout (default) - should not be in config
        viewer = ScalarViewer()
        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)
        html_content = response.content.decode()

        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]
        assert "layout" not in config_section

        # Test classic layout
        viewer = ScalarViewer(layout=Layout.CLASSIC)
        response = viewer.render_page(request, api)
        html_content = response.content.decode()
        assert '"layout": "classic"' in html_content

    def test_theme_configuration(self, api, request_factory):
        """Test theme configuration"""
        request = request_factory.get("/api/docs")

        # Test default theme - should not be in config
        viewer = ScalarViewer()
        response = viewer.render_page(request, api)
        html_content = response.content.decode()

        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]
        assert "theme" not in config_section

        # Test custom theme
        viewer = ScalarViewer(theme=Theme.MOON)
        response = viewer.render_page(request, api)
        html_content = response.content.decode()
        assert '"theme": "moon"' in html_content

        # Test another theme
        viewer = ScalarViewer(theme=Theme.PURPLE)
        response = viewer.render_page(request, api)
        html_content = response.content.decode()
        assert '"theme": "purple"' in html_content

    def test_sidebar_configuration(self, api, request_factory):
        """Test sidebar configuration"""
        request = request_factory.get("/api/docs")

        # Default should not show sidebar config (since it's default)
        viewer = ScalarViewer()
        response = viewer.render_page(request, api)
        html_content = response.content.decode()

        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]
        assert "showSidebar" not in config_section

        # Custom should hide sidebar
        viewer = ScalarViewer(show_sidebar=False)
        response = viewer.render_page(request, api)
        html_content = response.content.decode()
        assert '"showSidebar": false' in html_content

    def test_dark_mode_configuration(self, api, request_factory):
        """Test dark mode configuration"""
        request = request_factory.get("/api/docs")

        # Default should not show dark mode config (since it's default)
        viewer = ScalarViewer()
        response = viewer.render_page(request, api)
        html_content = response.content.decode()

        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]
        assert "darkMode" not in config_section

        # Custom should be light mode
        viewer = ScalarViewer(dark_mode=False)
        response = viewer.render_page(request, api)
        html_content = response.content.decode()
        assert '"darkMode": false' in html_content

    def test_search_hotkey_configuration(self, api, request_factory):
        """Test search hotkey configuration"""
        request = request_factory.get("/api/docs")

        # Default should not show search hotkey config (since it's default)
        viewer = ScalarViewer()
        response = viewer.render_page(request, api)
        html_content = response.content.decode()

        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]
        assert "searchHotKey" not in config_section

        # Custom should be 's'
        viewer = ScalarViewer(search_hot_key=SearchHotKey.S)
        response = viewer.render_page(request, api)
        html_content = response.content.decode()
        assert '"searchHotKey": "s"' in html_content


class TestThemeIntegration:
    """Test theme integration specifically"""

    def test_all_theme_values_work(self, api, request_factory):
        """Test that all theme values can be used in Django Ninja integration"""
        request = request_factory.get("/api/docs")

        # Test each theme
        for theme in Theme:
            viewer = ScalarViewer(title=f"Test API - {theme.value}", theme=theme)

            response = viewer.render_page(request, api)
            assert response.status_code == 200

            html_content = response.content.decode()

            # Look specifically in the JSON configuration
            config_start = html_content.find('Scalar.createApiReference("#app", {')
            config_end = html_content.find("})", config_start)
            config_section = html_content[config_start:config_end]

            if theme != Theme.DEFAULT:
                assert f'"theme": "{theme.value}"' in config_section
            else:
                assert "theme" not in config_section
            assert f"<title>Test API - {theme.value}</title>" in html_content

    def test_theme_with_complex_configuration(self, api, request_factory):
        """Test theme with complex configuration"""
        viewer = ScalarViewer(
            title="Complex Theme Test",
            theme=Theme.DEEP_SPACE,
            layout=Layout.CLASSIC,
            dark_mode=False,
            show_sidebar=False,
            hide_download_button=True,
            hide_models=True,
            search_hot_key=SearchHotKey.A,
            servers=[{"name": "Test", "url": "https://test.com"}],
            authentication={"bearer": {"type": "http", "scheme": "bearer"}},
            hide_client_button=True,
            default_open_all_tags=True,
        )

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        assert response.status_code == 200
        html_content = response.content.decode()

        # Check all configuration values including theme
        assert '"theme": "deepSpace"' in html_content
        assert '"layout": "classic"' in html_content
        assert '"darkMode": false' in html_content
        assert '"showSidebar": false' in html_content
        assert '"hideDownloadButton": true' in html_content
        assert '"hideModels": true' in html_content
        assert '"searchHotKey": "a"' in html_content
        assert '"hideClientButton": true' in html_content
        assert '"defaultOpenAllTags": true' in html_content


class TestConfigObject:
    """Test using ScalarConfig object with ScalarViewer"""

    def test_viewer_with_config_object(self, api, request_factory):
        """Test ScalarViewer with ScalarConfig object"""
        config = ScalarConfig(
            openapi_url="/api/openapi.json",
            title="Config Object Test",
            theme=Theme.SOLARIZED,
            layout=Layout.CLASSIC,
        )
        viewer = ScalarViewer(config=config)

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        assert response.status_code == 200
        html_content = response.content.decode()

        assert "<title>Config Object Test</title>" in html_content
        assert '"theme": "solarized"' in html_content
        assert '"layout": "classic"' in html_content

    def test_viewer_config_override(self, api, request_factory):
        """Test that kwargs override config object"""
        config = ScalarConfig(
            openapi_url="/api/openapi.json",
            title="Original Title",
            theme=Theme.MOON,
        )
        viewer = ScalarViewer(
            config=config, title="Overridden Title", theme=Theme.PURPLE
        )

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()

        assert "<title>Overridden Title</title>" in html_content
        assert '"theme": "purple"' in html_content


class TestAdditionalFeatures:
    """Test additional features specific to django-ninja integration"""

    def test_hide_test_request_button(self, api, request_factory):
        """Test hide_test_request_button configuration"""
        viewer = ScalarViewer(hide_test_request_button=True)

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()
        assert '"hideTestRequestButton": true' in html_content

    def test_hide_search(self, api, request_factory):
        """Test hide_search configuration"""
        viewer = ScalarViewer(hide_search=True)

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()
        assert '"hideSearch": true' in html_content

    def test_force_dark_mode_state(self, api, request_factory):
        """Test force_dark_mode_state configuration"""
        viewer = ScalarViewer(force_dark_mode_state="dark")

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()
        assert '"forceDarkModeState": "dark"' in html_content

    def test_custom_css(self, api, request_factory):
        """Test custom_css configuration"""
        custom_css = "body { background: #f0f0f0; }"
        viewer = ScalarViewer(custom_css=custom_css)

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()
        assert f'"customCss": "{custom_css}"' in html_content

    def test_persist_auth(self, api, request_factory):
        """Test persist_auth configuration"""
        viewer = ScalarViewer(persist_auth=True)

        request = request_factory.get("/api/docs")
        response = viewer.render_page(request, api)

        html_content = response.content.decode()
        assert '"persistAuth": true' in html_content
