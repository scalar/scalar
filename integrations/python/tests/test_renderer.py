import json

from scalar_api_reference import (
    AgentConfig,
    DocumentDownloadType,
    Layout,
    OpenAPISource,
    ScalarConfig,
    SearchHotKey,
    Theme,
    render_html,
)


class TestRenderHtml:
    def test_basic_functionality(self):
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        html = render_html(config)

        assert "<!doctype html>" in html
        assert "<title>Test API</title>" in html
        assert 'Scalar.createApiReference("#app"' in html
        assert '"url": "/openapi.json"' in html

    def test_default_openapi_url(self):
        config = ScalarConfig(title="Test API")
        html = render_html(config, default_openapi_url="/openapi.json")

        assert '"url": "/openapi.json"' in html

    def test_default_title(self):
        config = ScalarConfig(openapi_url="/openapi.json")
        html = render_html(config)

        assert "<title>Scalar</title>" in html

    def test_default_parameters_not_in_config(self):
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        html = render_html(config)

        config_start = html.find('Scalar.createApiReference("#app", {')
        config_end = html.find("})", config_start)
        config_section = html[config_start:config_end]

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
        assert "agent" not in config_section
        assert "showDeveloperTools" not in config_section
        assert "telemetry" not in config_section

    def test_custom_parameters(self):
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
            servers=[{"url": "https://api.example.com", "description": "Production"}],
            default_open_all_tags=True,
            authentication={"apiKey": "test-key"},
            hide_client_button=True,
            integration="custom",
            theme=Theme.MOON,
        )
        html = render_html(config)

        assert '"url": "/custom/openapi.json"' in html
        assert '"proxyUrl": "https://proxy.example.com"' in html
        assert '"layout": "classic"' in html
        assert '"showSidebar": false' in html
        assert '"hideDownloadButton": true' in html
        assert '"hideModels": true' in html
        assert '"darkMode": false' in html
        assert '"searchHotKey": "s"' in html
        assert '"hiddenClients": ["client1", "client2"]' in html
        assert '"defaultOpenAllTags": true' in html
        assert '"authentication": {"apiKey": "test-key"}' in html
        assert '"hideClientButton": true' in html
        assert '"_integration": "custom"' in html
        assert '"theme": "moon"' in html
        assert "<title>Custom API</title>" in html
        assert 'src="https://custom.cdn.com/scalar.js"' in html
        assert 'href="https://example.com/favicon.ico"' in html

    def test_theme_all_values(self):
        for theme in Theme:
            config = ScalarConfig(
                openapi_url="/openapi.json",
                title=f"Test API - {theme.value}",
                theme=theme,
            )
            html = render_html(config)

            config_start = html.find('Scalar.createApiReference("#app", {')
            config_end = html.find("})", config_start)
            config_section = html[config_start:config_end]

            if theme != Theme.DEFAULT:
                assert f'"theme": "{theme.value}"' in config_section
            else:
                assert "theme" not in config_section
            assert f"<title>Test API - {theme.value}</title>" in html

    def test_top_level_agent_disabled(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            agent=AgentConfig(disabled=True),
        )
        html = render_html(config)
        assert '"agent": {"disabled": true}' in html

    def test_per_source_agent(self):
        config = ScalarConfig(
            sources=[
                OpenAPISource(
                    title="API",
                    url="/openapi.json",
                    agent=AgentConfig(key="my-key"),
                ),
            ],
            title="Test",
        )
        html = render_html(config)
        assert '"sources"' in html
        assert '"agent"' in html
        assert '"key": "my-key"' in html

    def test_with_content(self):
        content = {"openapi": "3.0.0", "info": {"title": "Test"}}
        config = ScalarConfig(content=content, title="Test API")
        html = render_html(config)
        assert '"content":' in html
        assert '"openapi": "3.0.0"' in html

    def test_sources_precedence(self):
        sources = [
            OpenAPISource(title="API 1", url="/api1/openapi.json", default=True),
        ]
        config = ScalarConfig(sources=sources, title="Multi-API Docs")
        html = render_html(config)
        assert '"sources":' in html

    def test_document_download_type(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            document_download_type=DocumentDownloadType.JSON,
        )
        html = render_html(config)
        assert '"documentDownloadType": "json"' in html

    def test_developer_tools_visibility(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            show_developer_tools="never",
        )
        html = render_html(config)
        assert '"showDeveloperTools": "never"' in html

    def test_telemetry_disabled(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            telemetry=False,
        )
        html = render_html(config)
        assert '"telemetry": false' in html

    def test_overrides(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            overrides={"customKey": "customValue"},
        )
        html = render_html(config)
        assert '"customKey": "customValue"' in html

    def test_html_structure(self):
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        html = render_html(config)

        assert "<!doctype html>" in html
        assert "<html>" in html
        assert "<head>" in html
        assert "<body>" in html
        assert "<title>Test API</title>" in html
        assert '<div id="app"></div>' in html
        assert "<script src=" in html
        assert 'Scalar.createApiReference("#app"' in html

    def test_favicon_not_rendered_when_empty(self):
        config = ScalarConfig(openapi_url="/openapi.json")
        html = render_html(config)
        assert "shortcut icon" not in html

    def test_favicon_rendered_when_set(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            scalar_favicon_url="https://example.com/favicon.ico",
        )
        html = render_html(config)
        assert 'href="https://example.com/favicon.ico"' in html

    def test_additional_options(self):
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
        html = render_html(config)

        assert '"hideTestRequestButton": true' in html
        assert '"hideSearch": true' in html
        assert '"forceDarkModeState": "dark"' in html
        assert '"hideDarkModeToggle": true' in html
        assert '"baseServerURL": "https://api.example.com"' in html
        assert '"expandAllModelSections": true' in html
        assert '"expandAllResponses": true' in html
        assert '"orderRequiredPropertiesFirst": false' in html
        assert '"persistAuth": true' in html
        assert '"withDefaultFonts": false' in html
        assert '"customCss": "body { background: red; }"' in html

    def test_integration_none(self):
        config = ScalarConfig(openapi_url="/openapi.json", integration=None)
        html = render_html(config)
        config_start = html.find('Scalar.createApiReference("#app", {')
        config_end = html.find("})", config_start)
        config_section = html[config_start:config_end]
        assert "_integration" not in config_section
