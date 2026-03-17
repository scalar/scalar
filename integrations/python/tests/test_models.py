from scalar_api_reference import (
    AgentConfig,
    DocumentDownloadType,
    Layout,
    OpenAPISource,
    ScalarConfig,
    SearchHotKey,
    Theme,
)


class TestAgentConfig:
    def test_agent_config_with_key(self):
        agent = AgentConfig(key="my-agent-key")
        assert agent.key == "my-agent-key"
        assert agent.disabled is None

    def test_agent_config_disabled(self):
        agent = AgentConfig(disabled=True)
        assert agent.disabled is True
        assert agent.key is None

    def test_agent_config_serialization(self):
        agent = AgentConfig(key="key123", disabled=False)
        dumped = agent.model_dump(exclude_none=True)
        assert dumped == {"key": "key123", "disabled": False}


class TestOpenAPISource:
    def test_basic_instantiation(self):
        source = OpenAPISource(title="Test API", url="/openapi.json")
        assert source.title == "Test API"
        assert source.url == "/openapi.json"
        assert source.slug is None
        assert source.content is None
        assert source.default is False

    def test_with_all_fields(self):
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
        content = '{"openapi": "3.0.0", "info": {"title": "Test"}}'
        source = OpenAPISource(title="Test API", content=content)
        assert source.content == content
        assert source.url is None

    def test_with_content_dict(self):
        content = {"openapi": "3.0.0", "info": {"title": "Test"}}
        source = OpenAPISource(title="Test API", content=content)
        assert source.content == content
        assert source.url is None

    def test_with_agent_config(self):
        source = OpenAPISource(
            url="/openapi.json",
            agent=AgentConfig(key="test-key"),
        )
        assert source.agent is not None
        assert source.agent.key == "test-key"
        assert source.agent.disabled is None

    def test_with_agent_disabled(self):
        source = OpenAPISource(
            url="/openapi.json",
            agent=AgentConfig(disabled=True),
        )
        assert source.agent.disabled is True


class TestScalarConfig:
    def test_basic_instantiation(self):
        config = ScalarConfig(openapi_url="/openapi.json", title="Test API")
        assert config.openapi_url == "/openapi.json"
        assert config.title == "Test API"

    def test_default_values(self):
        config = ScalarConfig()
        assert config.openapi_url is None
        assert config.title is None
        assert config.content is None
        assert config.sources is None
        assert config.scalar_js_url == "https://cdn.jsdelivr.net/npm/@scalar/api-reference"
        assert config.scalar_proxy_url == ""
        assert config.scalar_favicon_url == ""
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
        assert config.show_developer_tools == "localhost"
        assert config.telemetry is True
        assert config.agent is None
        assert config.overrides == {}

    def test_with_custom_values(self):
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
        assert config.layout == Layout.CLASSIC
        assert config.show_sidebar is False
        assert config.hide_download_button is True
        assert config.hide_models is True
        assert config.dark_mode is False
        assert config.search_hot_key == SearchHotKey.S
        assert config.theme == Theme.MOON

    def test_with_sources(self):
        sources = [
            OpenAPISource(title="API 1", url="/api1/openapi.json", default=True),
            OpenAPISource(title="API 2", url="/api2/openapi.json"),
        ]
        config = ScalarConfig(sources=sources, title="Multi-API Docs")
        assert len(config.sources) == 2
        assert config.sources[0].title == "API 1"
        assert config.sources[0].default is True

    def test_with_agent_config(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            agent=AgentConfig(disabled=True),
        )
        assert config.agent is not None
        assert config.agent.disabled is True

    def test_with_overrides(self):
        config = ScalarConfig(
            openapi_url="/openapi.json",
            overrides={"customKey": "customValue"},
        )
        assert config.overrides == {"customKey": "customValue"}
