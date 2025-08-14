import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from typing import Union

from scalar_fastapi import get_scalar_api_reference, Layout, SearchHotKey, Theme


@pytest.fixture
def app():
    """Create a test FastAPI application"""
    app = FastAPI(title="Test API")

    @app.get("/")
    def read_root():
        return {"Hello": "World"}

    @app.get("/items/{item_id}")
    def read_item(item_id: int, q: Union[str, None] = None):
        return {"item_id": item_id, "q": q}

    @app.post("/items/")
    def create_item(item: dict):
        return {"item": item, "created": True}

    @app.get("/scalar", include_in_schema=False)
    async def scalar_html():
        return get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title=app.title + " - Scalar",
        )

    @app.get("/scalar-custom", include_in_schema=False)
    async def scalar_custom_html():
        return get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title=app.title + " - Custom Scalar",
            layout=Layout.CLASSIC,
            dark_mode=False,
            hide_download_button=True,
            hide_models=True,
            show_sidebar=False,
            search_hot_key=SearchHotKey.S,
            theme=Theme.MOON,
            servers=[
                {"name": "Production", "url": "https://api.example.com"},
                {"name": "Development", "url": "http://localhost:8000"}
            ],
            authentication={
                "apiKey": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "X-API-Key"
                }
            }
        )

    @app.get("/scalar-theme-test", include_in_schema=False)
    async def scalar_theme_test_html():
        return get_scalar_api_reference(
            openapi_url=app.openapi_url,
            title=app.title + " - Theme Test",
            theme=Theme.PURPLE,
        )

    return app


@pytest.fixture
def client(app):
    """Create a test client for the FastAPI application"""
    return TestClient(app)


class TestFastAPIIntegration:
    """Integration tests for FastAPI with Scalar"""

    def test_basic_endpoints_work(self, client):
        """Test that basic API endpoints work"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"Hello": "World"}

        response = client.get("/items/123?q=test")
        assert response.status_code == 200
        assert response.json() == {"item_id": 123, "q": "test"}

        response = client.post("/items/", json={"name": "test item"})
        assert response.status_code == 200
        assert response.json() == {"item": {"name": "test item"}, "created": True}

    def test_scalar_endpoint_returns_html(self, client, app):
        """Test that the scalar endpoint returns proper HTML"""
        response = client.get("/scalar")

        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

        html_content = response.text

        # Check basic HTML structure
        assert "<!doctype html>" in html_content
        assert "<html>" in html_content
        assert "<head>" in html_content
        assert "<body>" in html_content

        # Check title
        assert f"<title>{app.title} - Scalar</title>" in html_content

        # Check OpenAPI URL in config
        assert '"url": "/openapi.json"' in html_content

        # Check that default values are NOT included in the config
        # Look specifically in the JSON configuration, not in the entire HTML
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find('})', config_start)
        config_section = html_content[config_start:config_end]

        assert 'layout' not in config_section
        assert 'showSidebar' not in config_section
        assert 'darkMode' not in config_section
        assert '_integration' in config_section
        assert 'theme' not in config_section

    def test_scalar_custom_endpoint(self, client, app):
        """Test scalar endpoint with custom configuration"""
        response = client.get("/scalar-custom")

        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

        html_content = response.text

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

    def test_scalar_theme_endpoint(self, client, app):
        """Test scalar endpoint with theme configuration"""
        response = client.get("/scalar-theme-test")

        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

        html_content = response.text

        # Check theme configuration
        assert '"theme": "purple"' in html_content
        assert f"<title>{app.title} - Theme Test</title>" in html_content

        # Check that other defaults are NOT present (since they're default values)
        # Look specifically in the JSON configuration
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find('})', config_start)
        config_section = html_content[config_start:config_end]

        assert 'layout' not in config_section
        assert 'showSidebar' not in config_section
        assert 'darkMode' not in config_section

    def test_openapi_schema_endpoint(self, client):
        """Test that the OpenAPI schema endpoint works"""
        response = client.get("/openapi.json")

        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]

        schema = response.json()

        # Check basic OpenAPI structure
        assert "openapi" in schema
        assert "info" in schema
        assert "paths" in schema

        # Check that our endpoints are in the schema
        assert "/" in schema["paths"]
        assert "/items/{item_id}" in schema["paths"]
        assert "/items/" in schema["paths"]

        # Check that scalar endpoint is NOT in the schema (include_in_schema=False)
        assert "/scalar" not in schema["paths"]
        assert "/scalar-custom" not in schema["paths"]
        assert "/scalar-theme-test" not in schema["paths"]

    def test_scalar_uses_correct_openapi_url(self, client, app):
        """Test that scalar uses the correct OpenAPI URL"""
        response = client.get("/scalar")
        html_content = response.text

        # The scalar endpoint should reference the app's openapi_url in config
        expected_url = app.openapi_url or "/openapi.json"
        assert f'"url": "{expected_url}"' in html_content

    def test_scalar_script_included(self, client):
        """Test that the Scalar JavaScript is included"""
        response = client.get("/scalar")
        html_content = response.text

        # Check that the Scalar script is included
        assert 'src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"' in html_content

    def test_scalar_configuration_script(self, client):
        """Test that the configuration script is properly generated"""
        response = client.get("/scalar")
        html_content = response.text

        # Check configuration script structure
        assert 'Scalar.createApiReference("#app"' in html_content
        # The new implementation uses json.dumps(config, indent=2) which produces formatted JSON
        # We should check for the actual JSON structure, not the Python code
        assert '"url": "/openapi.json"' in html_content

    def test_scalar_favicon_included(self, client):
        """Test that favicon is included"""
        response = client.get("/scalar")
        html_content = response.text

        assert 'href="https://fastapi.tiangolo.com/img/favicon.png"' in html_content

    def test_scalar_meta_tags(self, client):
        """Test that proper meta tags are included"""
        response = client.get("/scalar")
        html_content = response.text

        assert '<meta charset="utf-8"/>' in html_content
        assert '<meta name="viewport" content="width=device-width, initial-scale=1">' in html_content

    def test_multiple_scalar_endpoints(self, client):
        """Test that multiple scalar endpoints can coexist"""
        # Test all scalar endpoints
        response1 = client.get("/scalar")
        response2 = client.get("/scalar-custom")
        response3 = client.get("/scalar-theme-test")

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response3.status_code == 200

        # They should have different titles
        assert "Test API - Scalar" in response1.text
        assert "Test API - Custom Scalar" in response2.text
        assert "Test API - Theme Test" in response3.text

        # They should have different configurations
        # Look specifically in the JSON configuration for each response
        config1_start = response1.text.find('Scalar.createApiReference("#app", {')
        config1_end = response1.text.find('})', config1_start)
        config1_section = response1.text[config1_start:config1_end]

        config3_start = response3.text.find('Scalar.createApiReference("#app", {')
        config3_end = response3.text.find('})', config3_start)
        config3_section = response3.text[config3_start:config3_end]

        assert 'layout' not in config1_section  # Default layout not included
        assert '"layout": "classic"' in response2.text
        assert 'layout' not in config3_section  # Default layout not included

        # They should have different themes
        assert 'theme' not in config1_section  # Default theme not included
        assert '"theme": "moon"' in response2.text
        assert '"theme": "purple"' in response3.text


class TestScalarConfiguration:
    """Test various Scalar configuration options"""

    def test_layout_configuration(self, client):
        """Test different layout configurations"""
        # Test modern layout (default) - should not be in config
        response = client.get("/scalar")
        config_start = response.text.find('Scalar.createApiReference("#app", {')
        config_end = response.text.find('})', config_start)
        config_section = response.text[config_start:config_end]
        assert 'layout' not in config_section

        # Test classic layout
        response = client.get("/scalar-custom")
        assert '"layout": "classic"' in response.text

    def test_theme_configuration(self, client):
        """Test theme configuration"""
        # Test default theme - should not be in config
        response = client.get("/scalar")
        config_start = response.text.find('Scalar.createApiReference("#app", {')
        config_end = response.text.find('})', config_start)
        config_section = response.text[config_start:config_end]
        assert 'theme' not in config_section

        # Test custom theme
        response = client.get("/scalar-custom")
        assert '"theme": "moon"' in response.text

        # Test theme-only endpoint
        response = client.get("/scalar-theme-test")
        assert '"theme": "purple"' in response.text

    def test_sidebar_configuration(self, client):
        """Test sidebar configuration"""
        # Default should not show sidebar config (since it's default)
        response = client.get("/scalar")
        config_start = response.text.find('Scalar.createApiReference("#app", {')
        config_end = response.text.find('})', config_start)
        config_section = response.text[config_start:config_end]
        assert 'showSidebar' not in config_section

        # Custom should hide sidebar
        response = client.get("/scalar-custom")
        assert '"showSidebar": false' in response.text

    def test_dark_mode_configuration(self, client):
        """Test dark mode configuration"""
        # Default should not show dark mode config (since it's default)
        response = client.get("/scalar")
        config_start = response.text.find('Scalar.createApiReference("#app", {')
        config_end = response.text.find('})', config_start)
        config_section = response.text[config_start:config_end]
        assert 'darkMode' not in config_section

        # Custom should be light mode
        response = client.get("/scalar-custom")
        assert '"darkMode": false' in response.text

    def test_search_hotkey_configuration(self, client):
        """Test search hotkey configuration"""
        # Default should not show search hotkey config (since it's default)
        response = client.get("/scalar")
        config_start = response.text.find('Scalar.createApiReference("#app", {')
        config_end = response.text.find('})', config_start)
        config_section = response.text[config_start:config_end]
        assert 'searchHotKey' not in config_section

        # Custom should be 's'
        response = client.get("/scalar-custom")
        assert '"searchHotKey": "s"' in response.text


class TestThemeIntegration:
    """Test theme integration specifically"""

    def test_all_theme_values_work(self, client):
        """Test that all theme values can be used in FastAPI integration"""
        app = FastAPI(title="Theme Test API")

        # Create endpoints for each theme
        for theme in Theme:
            @app.get(f"/scalar-{theme.value}", include_in_schema=False)
            async def scalar_theme_html(theme=theme):
                return get_scalar_api_reference(
                    openapi_url=app.openapi_url,
                    title=f"Test API - {theme.value}",
                    theme=theme
                )

        test_client = TestClient(app)

        # Test each theme endpoint
        for theme in Theme:
            response = test_client.get(f"/scalar-{theme.value}")
            assert response.status_code == 200

            # Look specifically in the JSON configuration
            config_start = response.text.find('Scalar.createApiReference("#app", {')
            config_end = response.text.find('})', config_start)
            config_section = response.text[config_start:config_end]

            if theme != Theme.DEFAULT:
                assert f'"theme": "{theme.value}"' in config_section
            else:
                assert 'theme' not in config_section
            assert f"<title>Test API - {theme.value}</title>" in response.text

    def test_theme_with_complex_configuration(self, client):
        """Test theme with complex configuration"""
        app = FastAPI(title="Complex Theme API")

        @app.get("/scalar-complex", include_in_schema=False)
        async def scalar_complex_html():
            return get_scalar_api_reference(
                openapi_url=app.openapi_url,
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
                default_open_all_tags=True
            )

        test_client = TestClient(app)
        response = test_client.get("/scalar-complex")

        assert response.status_code == 200
        html_content = response.text

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
