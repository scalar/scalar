import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from typing import Union

from scalar_fastapi import get_scalar_api_reference, Layout, SearchHotKey


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
        assert "<!DOCTYPE html>" in html_content
        assert "<html>" in html_content
        assert "<head>" in html_content
        assert "<body>" in html_content
        
        # Check title
        assert f"<title>{app.title} - Scalar</title>" in html_content
        
        # Check OpenAPI URL
        assert f'data-url="{app.openapi_url}"' in html_content
        
        # Check default configuration
        assert 'layout: "modern"' in html_content
        assert 'showSidebar: true' in html_content
        assert 'darkMode: true' in html_content
        assert '_integration: "fastapi"' in html_content

    def test_scalar_custom_endpoint(self, client, app):
        """Test scalar endpoint with custom configuration"""
        response = client.get("/scalar-custom")
        
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        
        html_content = response.text
        
        # Check custom configuration
        assert 'layout: "classic"' in html_content
        assert 'darkMode: false' in html_content
        assert 'hideDownloadButton: true' in html_content
        assert 'hideModels: true' in html_content
        assert 'showSidebar: false' in html_content
        assert 'searchHotKey: "s"' in html_content
        
        # Check servers configuration
        assert '"name": "Production"' in html_content
        assert '"url": "https://api.example.com"' in html_content
        assert '"name": "Development"' in html_content
        assert '"url": "http://localhost:8000"' in html_content
        
        # Check authentication configuration
        assert '"type": "apiKey"' in html_content
        assert '"in": "header"' in html_content
        assert '"name": "X-API-Key"' in html_content

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

    def test_scalar_uses_correct_openapi_url(self, client, app):
        """Test that scalar uses the correct OpenAPI URL"""
        response = client.get("/scalar")
        html_content = response.text
        
        # The scalar endpoint should reference the app's openapi_url
        expected_url = app.openapi_url or "/openapi.json"
        assert f'data-url="{expected_url}"' in html_content

    def test_scalar_theme_included(self, client):
        """Test that the default theme CSS is included"""
        response = client.get("/scalar")
        html_content = response.text
        
        # Check that theme CSS is included
        assert "--scalar-color-1: #2a2f45;" in html_content
        assert "--scalar-color-accent: #009485;" in html_content
        assert "--scalar-background-1: #fff;" in html_content

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
        assert 'var configuration = {' in html_content
        assert 'document.getElementById(\'api-reference\').dataset.configuration =' in html_content
        assert 'JSON.stringify(configuration)' in html_content

    def test_scalar_noscript_message(self, client):
        """Test that noscript message is included"""
        response = client.get("/scalar")
        html_content = response.text
        
        assert "<noscript>" in html_content
        assert "Scalar requires Javascript to function" in html_content

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
        # Test both scalar endpoints
        response1 = client.get("/scalar")
        response2 = client.get("/scalar-custom")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # They should have different titles
        assert "Test API - Scalar" in response1.text
        assert "Test API - Custom Scalar" in response2.text
        
        # They should have different configurations
        assert 'layout: "modern"' in response1.text
        assert 'layout: "classic"' in response2.text


class TestScalarConfiguration:
    """Test various Scalar configuration options"""
    
    def test_layout_configuration(self, client):
        """Test different layout configurations"""
        # Test modern layout (default)
        response = client.get("/scalar")
        assert 'layout: "modern"' in response.text
        
        # Test classic layout
        response = client.get("/scalar-custom")
        assert 'layout: "classic"' in response.text

    def test_theme_configuration(self, client):
        """Test theme configuration"""
        response = client.get("/scalar")
        html_content = response.text
        
        # Check that default theme is applied
        assert "--scalar-color-1: #2a2f45;" in html_content
        assert "--scalar-color-accent: #009485;" in html_content

    def test_sidebar_configuration(self, client):
        """Test sidebar configuration"""
        # Default should show sidebar
        response = client.get("/scalar")
        assert 'showSidebar: true' in response.text
        
        # Custom should hide sidebar
        response = client.get("/scalar-custom")
        assert 'showSidebar: false' in response.text

    def test_dark_mode_configuration(self, client):
        """Test dark mode configuration"""
        # Default should be dark mode
        response = client.get("/scalar")
        assert 'darkMode: true' in response.text
        
        # Custom should be light mode
        response = client.get("/scalar-custom")
        assert 'darkMode: false' in response.text

    def test_search_hotkey_configuration(self, client):
        """Test search hotkey configuration"""
        # Default should be 'k'
        response = client.get("/scalar")
        assert 'searchHotKey: "k"' in response.text
        
        # Custom should be 's'
        response = client.get("/scalar-custom")
        assert 'searchHotKey: "s"' in response.text 
