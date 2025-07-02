import json
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.responses import HTMLResponse

from scalar_fastapi import (
    get_scalar_api_reference,
    Layout,
    SearchHotKey,
)


class TestLayout:
    def test_layout_enum_values(self):
        """Test that Layout enum has correct values"""
        assert Layout.MODERN.value == "modern"
        assert Layout.CLASSIC.value == "classic"


class TestSearchHotKey:
    def test_search_hot_key_enum_values(self):
        """Test that SearchHotKey enum has correct values"""
        assert SearchHotKey.K.value == "k"
        assert SearchHotKey.A.value == "a"
        assert SearchHotKey.Z.value == "z"


class TestGetScalarApiReference:
    def test_basic_functionality(self):
        """Test basic functionality with minimal parameters"""
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API"
        )
        
        assert isinstance(response, HTMLResponse)
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        
        html_content = response.body.decode()
        assert "<!DOCTYPE html>" in html_content
        assert "<title>Test API</title>" in html_content
        assert 'data-url="/openapi.json"' in html_content

    def test_default_parameters(self):
        """Test that default parameters are correctly set"""
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API"
        )
        
        html_content = response.body.decode()
        
        # Check default values
        assert 'data-proxy-url=""' in html_content
        assert 'href="https://fastapi.tiangolo.com/img/favicon.png"' in html_content
        assert 'src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"' in html_content
        assert 'layout: "modern"' in html_content
        assert 'showSidebar: true' in html_content
        assert 'hideDownloadButton: false' in html_content
        assert 'hideModels: false' in html_content
        assert 'darkMode: true' in html_content
        assert 'searchHotKey: "k"' in html_content
        assert 'hiddenClients: []' in html_content
        assert 'servers: []' in html_content
        assert 'defaultOpenAllTags: false' in html_content
        assert 'authentication: {}' in html_content
        assert 'hideClientButton: false' in html_content
        assert '_integration: "fastapi"' in html_content

    def test_custom_parameters(self):
        """Test custom parameter values"""
        response = get_scalar_api_reference(
            openapi_url="/custom/openapi.json",
            title="Custom API",
            scalar_js_url="https://custom.cdn.com/scalar.js",
            scalar_proxy_url="https://proxy.example.com",
            scalar_favicon_url="https://example.com/favicon.ico",
            layout=Layout.CLASSIC,
            show_sidebar=False,
            hide_download_button=True,
            hide_models=True,
            dark_mode=False,
            search_hot_key=SearchHotKey.S,
            hidden_clients=["client1", "client2"],
            servers=[{"name": "Production", "url": "https://api.example.com"}],
            default_open_all_tags=True,
            authentication={"apiKey": "test-key"},
            hide_client_button=True,
            integration="custom"
        )
        
        html_content = response.body.decode()
        
        # Check custom values
        assert 'data-url="/custom/openapi.json"' in html_content
        assert "<title>Custom API</title>" in html_content
        assert 'src="https://custom.cdn.com/scalar.js"' in html_content
        assert 'data-proxy-url="https://proxy.example.com"' in html_content
        assert 'href="https://example.com/favicon.ico"' in html_content
        assert 'layout: "classic"' in html_content
        assert 'showSidebar: false' in html_content
        assert 'hideDownloadButton: true' in html_content
        assert 'hideModels: true' in html_content
        assert 'darkMode: false' in html_content
        assert 'searchHotKey: "s"' in html_content
        assert 'hiddenClients: ["client1", "client2"]' in html_content
        assert 'servers: [{"name": "Production", "url": "https://api.example.com"}]' in html_content
        assert 'defaultOpenAllTags: true' in html_content
        assert 'authentication: {"apiKey": "test-key"}' in html_content
        assert 'hideClientButton: true' in html_content
        assert '_integration: "custom"' in html_content

    def test_hidden_clients_dict_format(self):
        """Test hidden_clients parameter with dictionary format"""
        hidden_clients = {
            "target1": True,
            "target2": ["client1", "client2"],
            "target3": False
        }
        
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API",
            hidden_clients=hidden_clients
        )
        
        html_content = response.body.decode()
        expected_json = json.dumps(hidden_clients)
        assert f'hiddenClients: {expected_json}' in html_content

    def test_servers_parameter(self):
        """Test servers parameter with multiple servers"""
        servers = [
            {"name": "Production", "url": "https://api.example.com"},
            {"name": "Staging", "url": "https://staging-api.example.com"},
            {"name": "Development", "url": "http://localhost:8000"}
        ]
        
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API",
            servers=servers
        )
        
        html_content = response.body.decode()
        expected_json = json.dumps(servers)
        assert f'servers: {expected_json}' in html_content

    def test_authentication_parameter(self):
        """Test authentication parameter with complex configuration"""
        auth_config = {
            "apiKey": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key"
            },
            "bearer": {
                "type": "http",
                "scheme": "bearer"
            }
        }
        
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API",
            authentication=auth_config
        )
        
        html_content = response.body.decode()
        expected_json = json.dumps(auth_config)
        assert f'authentication: {expected_json}' in html_content

    def test_custom_theme(self):
        """Test custom theme CSS"""
        custom_theme = """
        .custom-theme {
            --scalar-color-1: #ff0000;
            --scalar-color-accent: #00ff00;
        }
        """
        
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API",
            scalar_theme=custom_theme
        )
        
        html_content = response.body.decode()
        assert custom_theme in html_content

    def test_integration_none(self):
        """Test setting integration to None"""
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API",
            integration=None
        )
        
        html_content = response.body.decode()
        assert '_integration: null' in html_content

    def test_html_structure(self):
        """Test that the generated HTML has proper structure"""
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API"
        )
        
        html_content = response.body.decode()
        
        # Check essential HTML elements
        assert "<!DOCTYPE html>" in html_content
        assert "<html>" in html_content
        assert "<head>" in html_content
        assert "<body>" in html_content
        assert "</html>" in html_content
        
        # Check meta tags
        assert '<meta charset="utf-8"/>' in html_content
        assert '<meta name="viewport" content="width=device-width, initial-scale=1">' in html_content
        
        # Check script tags
        assert 'id="api-reference"' in html_content
        assert '<script src=' in html_content
        
        # Check noscript tag
        assert "<noscript>" in html_content
        assert "Scalar requires Javascript to function" in html_content

    def test_configuration_script(self):
        """Test that the configuration script is properly generated"""
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API"
        )
        
        html_content = response.body.decode()
        
        # Check that configuration script exists
        assert 'var configuration = {' in html_content
        assert 'document.getElementById(\'api-reference\').dataset.configuration =' in html_content
        assert 'JSON.stringify(configuration)' in html_content


class TestFastAPIIntegration:
    """Test the integration with FastAPI"""
    
    def test_fastapi_integration(self):
        """Test that the function works with FastAPI"""
        app = FastAPI()
        
        @app.get("/scalar", include_in_schema=False)
        async def scalar_html():
            return get_scalar_api_reference(
                openapi_url=app.openapi_url,
                title=app.title + " - Scalar",
            )
        
        @app.get("/")
        def read_root():
            return {"Hello": "World"}
        
        client = TestClient(app)
        
        # Test the scalar endpoint
        response = client.get("/scalar")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        
        html_content = response.text
        assert "<!DOCTYPE html>" in html_content
        assert f"<title>{app.title} - Scalar</title>" in html_content
        assert f'data-url="{app.openapi_url}"' in html_content

    def test_fastapi_with_custom_config(self):
        """Test FastAPI integration with custom configuration"""
        app = FastAPI(title="Custom API")
        
        @app.get("/scalar", include_in_schema=False)
        async def scalar_html():
            return get_scalar_api_reference(
                openapi_url=app.openapi_url,
                title=app.title + " - Scalar",
                layout=Layout.CLASSIC,
                dark_mode=False,
                hide_download_button=True
            )
        
        client = TestClient(app)
        
        response = client.get("/scalar")
        assert response.status_code == 200
        
        html_content = response.text
        assert 'layout: "classic"' in html_content
        assert 'darkMode: false' in html_content
        assert 'hideDownloadButton: true' in html_content


class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_empty_strings(self):
        """Test with empty string parameters"""
        response = get_scalar_api_reference(
            openapi_url="",
            title="",
            scalar_js_url="",
            scalar_proxy_url="",
            scalar_favicon_url=""
        )
        
        assert isinstance(response, HTMLResponse)
        html_content = response.body.decode()
        assert 'data-url=""' in html_content
        assert "<title></title>" in html_content

    def test_special_characters_in_title(self):
        """Test with special characters in title"""
        title_with_special_chars = "API & Documentation <script>alert('xss')</script>"
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title=title_with_special_chars
        )
        
        html_content = response.body.decode()
        # The title should be properly escaped in the HTML
        assert title_with_special_chars in html_content

    def test_complex_json_in_configuration(self):
        """Test with complex JSON structures in configuration"""
        complex_auth = {
            "oauth2": {
                "type": "oauth2",
                "flows": {
                    "authorizationCode": {
                        "authorizationUrl": "https://example.com/oauth/authorize",
                        "tokenUrl": "https://example.com/oauth/token",
                        "scopes": {
                            "read": "Read access",
                            "write": "Write access"
                        }
                    }
                }
            }
        }
        
        response = get_scalar_api_reference(
            openapi_url="/openapi.json",
            title="Test API",
            authentication=complex_auth
        )
        
        html_content = response.body.decode()
        # The complex JSON should be properly serialized
        assert "oauth2" in html_content
        assert "authorizationCode" in html_content 
