"""
Tests for scalar_ninja core functionality.
"""

from django.conf import settings
from django.http import HttpResponse

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

from scalar_ninja import (
    DocumentDownloadType,
    Layout,
    OpenAPISource,
    ScalarConfig,
    ScalarViewer,
    SearchHotKey,
    Theme,
)
from scalar_ninja.scalar_ninja import get_scalar_api_reference


class TestLayout:
    """Test the Layout enum"""

    def test_layout_enum_values(self):
        """Test that Layout enum has correct values"""
        assert Layout.MODERN.value == "modern"
        assert Layout.CLASSIC.value == "classic"


class TestSearchHotKey:
    """Test the SearchHotKey enum"""

    def test_search_hot_key_enum_values(self):
        """Test that SearchHotKey enum has correct values"""
        assert SearchHotKey.K.value == "k"
        assert SearchHotKey.A.value == "a"
        assert SearchHotKey.Z.value == "z"
        assert SearchHotKey.S.value == "s"

    def test_all_alphabet_letters(self):
        """Test that all alphabet letters are available as hotkeys"""
        alphabet = "abcdefghijklmnopqrstuvwxyz"
        for letter in alphabet:
            assert hasattr(SearchHotKey, letter.upper())
            assert getattr(SearchHotKey, letter.upper()).value == letter


class TestTheme:
    """Test the Theme enum functionality"""

    def test_theme_enum_values(self):
        """Test that Theme enum has correct values"""
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

    def test_theme_enum_all_values(self):
        """Test that all theme values are unique and valid"""
        theme_values = [theme.value for theme in Theme]
        assert len(theme_values) == len(set(theme_values))  # All values are unique
        assert len(theme_values) == 12  # Total number of themes

        # Check that all values are strings
        for value in theme_values:
            assert isinstance(value, str)
            assert len(value) > 0


class TestDocumentDownloadType:
    """Test the DocumentDownloadType enum"""

    def test_document_download_type_enum_values(self):
        """Test that DocumentDownloadType enum has correct values"""
        assert DocumentDownloadType.JSON.value == "json"
        assert DocumentDownloadType.YAML.value == "yaml"
        assert DocumentDownloadType.BOTH.value == "both"
        assert DocumentDownloadType.NONE.value == "none"


class TestOpenAPISource:
    """Test the OpenAPISource model"""

    def test_basic_instantiation(self):
        """Test basic OpenAPISource instantiation"""
        source = OpenAPISource(title="Test API", url="/openapi.json")
        assert source.title == "Test API"
        assert source.url == "/openapi.json"
        assert source.slug is None
        assert source.content is None
        assert source.default is False

    def test_with_all_fields(self):
        """Test OpenAPISource with all fields"""
        source = OpenAPISource(
            title="Test API",
            slug="test-api",
            url="/openapi.json",
            default=True,
        )
        assert source.title == "Test API"
        assert source.slug == "test-api"
        assert source.url == "/openapi.json"
        assert source.default is True

    def test_with_content_string(self):
        """Test OpenAPISource with content as string"""
        content = '{"openapi": "3.0.0", "info": {"title": "Test"}}'
        source = OpenAPISource(title="Test API", content=content)
        assert source.content == content
        assert source.url is None

    def test_with_content_dict(self):
        """Test OpenAPISource with content as dict"""
        content = {"openapi": "3.0.0", "info": {"title": "Test"}}
        source = OpenAPISource(title="Test API", content=content)
        assert source.content == content
        assert source.url is None


class TestScalarConfig:
    """Test the ScalarConfig model"""

    def test_basic_instantiation(self):
        """Test basic ScalarConfig instantiation"""
        config = ScalarConfig(openapi_url="/api/openapi.json", title="Test API")
        assert config.openapi_url == "/api/openapi.json"
        assert config.title == "Test API"

    def test_default_values(self):
        """Test that ScalarConfig has correct default values"""
        config = ScalarConfig()
        assert config.openapi_url is None
        assert config.title is None
        assert config.content is None
        assert config.sources is None
        assert (
            config.scalar_js_url == "https://cdn.jsdelivr.net/npm/@scalar/api-reference"
        )
        assert config.scalar_proxy_url == ""
        assert config.scalar_favicon_url == "https://django-ninja.dev/img/favicon.png"
        assert config.layout == Layout.MODERN
        assert config.show_sidebar is True
        assert config.hide_download_button is False
        assert config.document_download_type == DocumentDownloadType.BOTH
        assert config.hide_test_request_button is False
        assert config.hide_models is False
        assert config.hide_search is False
        assert config.dark_mode is None
        assert config.force_dark_mode_state is None
        assert config.hide_dark_mode_toggle is False
        assert config.search_hot_key == SearchHotKey.K
        assert config.hidden_clients == []
        assert config.base_server_url == ""
        assert config.servers == []
        assert config.default_open_all_tags is False
        assert config.expand_all_model_sections is False
        assert config.expand_all_responses is False
        assert config.order_required_properties_first is True
        assert config.authentication == {}
        assert config.hide_client_button is False
        assert config.persist_auth is False
        assert config.with_default_fonts is True
        assert config.custom_css == ""
        assert config.integration is None
        assert config.theme == Theme.DEFAULT

    def test_with_custom_values(self):
        """Test ScalarConfig with custom values"""
        config = ScalarConfig(
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
            theme=Theme.MOON,
        )
        assert config.openapi_url == "/custom/openapi.json"
        assert config.title == "Custom API"
        assert config.scalar_js_url == "https://custom.cdn.com/scalar.js"
        assert config.scalar_proxy_url == "https://proxy.example.com"
        assert config.scalar_favicon_url == "https://example.com/favicon.ico"
        assert config.layout == Layout.CLASSIC
        assert config.show_sidebar is False
        assert config.hide_download_button is True
        assert config.hide_models is True
        assert config.dark_mode is False
        assert config.search_hot_key == SearchHotKey.S
        assert config.theme == Theme.MOON

    def test_with_sources(self):
        """Test ScalarConfig with sources"""
        sources = [
            OpenAPISource(title="API 1", url="/api1/openapi.json", default=True),
            OpenAPISource(title="API 2", url="/api2/openapi.json"),
        ]
        config = ScalarConfig(sources=sources, title="Multi-API Docs")
        assert len(config.sources) == 2
        assert config.sources[0].title == "API 1"
        assert config.sources[0].default is True
        assert config.sources[1].title == "API 2"

    def test_with_content(self):
        """Test ScalarConfig with direct content"""
        content = {"openapi": "3.0.0", "info": {"title": "Test"}}
        config = ScalarConfig(content=content, title="Test API")
        assert config.content == content

    def test_with_servers(self):
        """Test ScalarConfig with custom servers"""
        servers = [
            {"name": "Production", "url": "https://api.example.com"},
            {"name": "Development", "url": "http://localhost:8000"},
        ]
        config = ScalarConfig(servers=servers)
        assert len(config.servers) == 2
        assert config.servers[0]["name"] == "Production"

    def test_with_authentication(self):
        """Test ScalarConfig with authentication"""
        auth = {"apiKey": {"type": "apiKey", "in": "header", "name": "X-API-Key"}}
        config = ScalarConfig(authentication=auth)
        assert config.authentication == auth


class TestGetScalarApiReference:
    """Test the get_scalar_api_reference function"""

    def test_basic_functionality(self):
        """Test basic functionality with minimal parameters"""
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        response = get_scalar_api_reference(config)

        assert isinstance(response, HttpResponse)
        assert response.status_code == 200

        html_content = response.content.decode()
        assert "<!doctype html>" in html_content
        assert "<title>Test API</title>" in html_content
        assert 'Scalar.createApiReference("#app"' in html_content

    def test_default_parameters(self):
        """Test that default parameters are not included in config"""
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()

        # Check that only the URL is included in config
        assert '"url": "/openapi.json"' in html_content

        # Check that default values are NOT included in the config
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]

        assert "proxyUrl" not in config_section
        assert "layout" not in config_section
        assert "showSidebar" not in config_section
        assert "hideDownloadButton" not in config_section
        assert "hideModels" not in config_section
        assert "darkMode" not in config_section
        assert "searchHotKey" not in config_section
        assert "hiddenClients" not in config_section
        assert "servers" not in config_section
        assert "defaultOpenAllTags" not in config_section
        assert "authentication" not in config_section
        assert "hideClientButton" not in config_section
        assert "theme" not in config_section

    def test_default_openapi_url(self):
        """Test that default OpenAPI URL is used when none provided"""
        config = ScalarConfig(title="Test API")
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()
        # Should default to /api/openapi.json
        assert '"/api/openapi.json"' in html_content

    def test_default_title(self):
        """Test that default title is 'Scalar' when none provided"""
        config = ScalarConfig(openapi_url="/openapi.json")
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()
        assert "<title>Scalar</title>" in html_content

    def test_custom_parameters(self):
        """Test custom parameter values"""
        config = ScalarConfig(
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
            integration="django-ninja",
            theme=Theme.MOON,
        )
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()

        # Check custom values in the config
        assert '"url": "/custom/openapi.json"' in html_content
        assert '"proxyUrl": "https://proxy.example.com"' in html_content
        assert '"layout": "classic"' in html_content
        assert '"showSidebar": false' in html_content
        assert '"hideDownloadButton": true' in html_content
        assert '"hideModels": true' in html_content
        assert '"darkMode": false' in html_content
        assert '"searchHotKey": "s"' in html_content
        assert '"hiddenClients": ["client1", "client2"]' in html_content
        assert (
            '"servers": [{"name": "Production", "url": "https://api.example.com"}]'
            in html_content
        )
        assert '"defaultOpenAllTags": true' in html_content
        assert '"authentication": {"apiKey": "test-key"}' in html_content
        assert '"hideClientButton": true' in html_content
        assert '"_integration": "django-ninja"' in html_content
        assert '"theme": "moon"' in html_content

        # Check other HTML elements
        assert "<title>Custom API</title>" in html_content
        assert 'src="https://custom.cdn.com/scalar.js"' in html_content
        assert 'href="https://example.com/favicon.ico"' in html_content

    def test_theme_parameter_all_values(self):
        """Test all theme enum values work correctly"""
        for theme in Theme:
            config = ScalarConfig(
                openapi_url="/openapi.json",
                title=f"Test API - {theme.value}",
                theme=theme,
            )
            response = get_scalar_api_reference(config)

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

    def test_theme_default_value(self):
        """Test that the default theme is not included in config"""
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()

        # Look specifically in the JSON configuration
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]

        # Default theme should not be in config
        assert "theme" not in config_section

    def test_with_sources(self):
        """Test with multiple OpenAPI sources"""
        sources = [
            OpenAPISource(title="API 1", url="/api1/openapi.json", default=True),
            OpenAPISource(title="API 2", url="/api2/openapi.json"),
        ]
        config = ScalarConfig(sources=sources, title="Multi-API Docs")
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()

        # Should use sources, not url
        assert '"sources":' in html_content
        assert '"title": "API 1"' in html_content
        assert '"url": "/api1/openapi.json"' in html_content
        assert '"default": true' in html_content

    def test_with_content(self):
        """Test with direct OpenAPI content"""
        content = {"openapi": "3.0.0", "info": {"title": "Test"}}
        config = ScalarConfig(content=content, title="Test API")
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()

        # Should use content, not url
        assert '"content":' in html_content
        assert '"openapi": "3.0.0"' in html_content

    def test_document_download_type(self):
        """Test document download type configuration"""
        # Test JSON only
        config = ScalarConfig(
            openapi_url="/openapi.json",
            document_download_type=DocumentDownloadType.JSON,
        )
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()
        assert '"documentDownloadType": "json"' in html_content

        # Test YAML only
        config = ScalarConfig(
            openapi_url="/openapi.json",
            document_download_type=DocumentDownloadType.YAML,
        )
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()
        assert '"documentDownloadType": "yaml"' in html_content

        # Test NONE
        config = ScalarConfig(
            openapi_url="/openapi.json",
            document_download_type=DocumentDownloadType.NONE,
        )
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()
        assert '"documentDownloadType": "none"' in html_content

        # Test BOTH (default - should not be in config)
        config = ScalarConfig(
            openapi_url="/openapi.json",
            document_download_type=DocumentDownloadType.BOTH,
        )
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]
        assert "documentDownloadType" not in config_section

    def test_hide_download_button_backwards_compatibility(self):
        """Test that hide_download_button still works (deprecated)"""
        config = ScalarConfig(openapi_url="/openapi.json", hide_download_button=True)
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()
        assert '"hideDownloadButton": true' in html_content

    def test_additional_options(self):
        """Test additional configuration options specific to django-ninja"""
        config = ScalarConfig(
            openapi_url="/openapi.json",
            hide_test_request_button=True,
            hide_search=True,
            force_dark_mode_state="dark",
            hide_dark_mode_toggle=True,
            base_server_url="https://api.example.com",
            expand_all_model_sections=True,
            expand_all_responses=True,
            order_required_properties_first=False,
            persist_auth=True,
            with_default_fonts=False,
            custom_css="body { background: red; }",
        )
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()

        assert '"hideTestRequestButton": true' in html_content
        assert '"hideSearch": true' in html_content
        assert '"forceDarkModeState": "dark"' in html_content
        assert '"hideDarkModeToggle": true' in html_content
        assert '"baseServerURL": "https://api.example.com"' in html_content
        assert '"expandAllModelSections": true' in html_content
        assert '"expandAllResponses": true' in html_content
        assert '"orderRequiredPropertiesFirst": false' in html_content
        assert '"persistAuth": true' in html_content
        assert '"withDefaultFonts": false' in html_content
        assert '"customCss": "body { background: red; }"' in html_content

    def test_html_structure(self):
        """Test that the HTML structure is correct"""
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()

        # Check basic HTML structure
        assert "<!doctype html>" in html_content
        assert "<html>" in html_content
        assert "<head>" in html_content
        assert "<body>" in html_content
        assert "<title>Test API</title>" in html_content
        assert '<div id="app"></div>' in html_content
        assert "<script src=" in html_content

        # Check Scalar initialization
        assert 'Scalar.createApiReference("#app"' in html_content

    def test_favicon(self):
        """Test favicon configuration"""
        config = ScalarConfig(openapi_url="/openapi.json")
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()

        # Default favicon
        assert 'href="https://django-ninja.dev/img/favicon.png"' in html_content

        # Custom favicon
        config = ScalarConfig(
            openapi_url="/openapi.json",
            scalar_favicon_url="https://example.com/custom.ico",
        )
        response = get_scalar_api_reference(config)
        html_content = response.content.decode()
        assert 'href="https://example.com/custom.ico"' in html_content


class TestScalarViewer:
    """Test the ScalarViewer class"""

    def test_basic_instantiation_with_config(self):
        """Test ScalarViewer instantiation with config object"""
        config = ScalarConfig(openapi_url="/api/openapi.json", title="Test API")
        viewer = ScalarViewer(config=config)
        assert viewer.config == config

    def test_instantiation_with_kwargs(self):
        """Test ScalarViewer instantiation with kwargs"""
        viewer = ScalarViewer(openapi_url="/api/openapi.json", title="Test API")
        assert viewer.config.openapi_url == "/api/openapi.json"
        assert viewer.config.title == "Test API"

    def test_instantiation_with_default_openapi_url(self):
        """Test that default openapi_url is set when using kwargs"""
        viewer = ScalarViewer(title="Test API")
        assert viewer.config.openapi_url == "/api/openapi.json"

    def test_config_and_kwargs_merge(self):
        """Test that kwargs override config when both provided"""
        config = ScalarConfig(openapi_url="/api/openapi.json", title="Original Title")
        viewer = ScalarViewer(config=config, title="New Title")
        assert viewer.config.title == "New Title"
        assert viewer.config.openapi_url == "/api/openapi.json"

    def test_with_theme(self):
        """Test ScalarViewer with theme configuration"""
        viewer = ScalarViewer(title="Test API", theme=Theme.MOON)
        assert viewer.config.theme == Theme.MOON

    def test_with_layout(self):
        """Test ScalarViewer with layout configuration"""
        viewer = ScalarViewer(title="Test API", layout=Layout.CLASSIC)
        assert viewer.config.layout == Layout.CLASSIC


class TestEdgeCases:
    """Test edge cases and error conditions"""

    def test_empty_strings(self):
        """Test with empty string parameters"""
        config = ScalarConfig(
            openapi_url="",
            title="",
            scalar_js_url="https://cdn.jsdelivr.net/npm/@scalar/api-reference",
            scalar_proxy_url="",
            scalar_favicon_url="",
        )
        response = get_scalar_api_reference(config)

        assert isinstance(response, HttpResponse)
        html_content = response.content.decode()
        assert '"url": ""' in html_content
        assert "<title>Scalar</title>" in html_content

    def test_special_characters_in_title(self):
        """Test with special characters in title"""
        title_with_special_chars = "API & Documentation <script>alert('xss')</script>"
        config = ScalarConfig(
            openapi_url="/openapi.json", title=title_with_special_chars
        )
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()
        # The title should be included in the HTML
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
                        "scopes": {"read": "Read access", "write": "Write access"},
                    }
                },
            }
        }

        config = ScalarConfig(
            openapi_url="/openapi.json",
            title="Test API",
            authentication=complex_auth,
        )
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()
        # The complex JSON should be properly serialized
        assert "oauth2" in html_content
        assert "authorizationCode" in html_content

    def test_hidden_clients_dict_format(self):
        """Test hidden_clients parameter with dictionary format"""
        hidden_clients = {
            "target1": True,
            "target2": ["client1", "client2"],
            "target3": False,
        }

        config = ScalarConfig(
            openapi_url="/openapi.json", hidden_clients=hidden_clients
        )
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()
        # Check that the dict is properly serialized
        assert "hiddenClients" in html_content

    def test_servers_parameter(self):
        """Test servers parameter with multiple servers"""
        servers = [
            {"name": "Production", "url": "https://api.example.com"},
            {"name": "Staging", "url": "https://staging-api.example.com"},
            {"name": "Development", "url": "http://localhost:8000"},
        ]

        config = ScalarConfig(openapi_url="/openapi.json", servers=servers)
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()
        assert '"servers":' in html_content
        assert "Production" in html_content
        assert "Staging" in html_content
        assert "Development" in html_content

    def test_integration_none(self):
        """Test setting integration to None"""
        config = ScalarConfig(openapi_url="/openapi.json", integration=None)
        response = get_scalar_api_reference(config)

        html_content = response.content.decode()
        # When integration is None, it should not be included in config
        config_start = html_content.find('Scalar.createApiReference("#app", {')
        config_end = html_content.find("})", config_start)
        config_section = html_content[config_start:config_end]
        assert "_integration" not in config_section
