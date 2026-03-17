"""Test that all public imports work correctly."""


def test_all_imports():
    from scalar_api_reference import (
        AgentConfig,
        DocumentDownloadType,
        Layout,
        OpenAPISource,
        ScalarConfig,
        SearchHotKey,
        Theme,
        render_html,
        scalar_theme,
    )

    assert callable(render_html)
    assert isinstance(scalar_theme, str)
    assert len(scalar_theme) > 0

    assert Layout.MODERN.value == "modern"
    assert SearchHotKey.K.value == "k"
    assert Theme.DEFAULT.value == "default"
    assert DocumentDownloadType.BOTH.value == "both"

    source = OpenAPISource(title="Test", url="/openapi.json")
    assert source.title == "Test"

    agent = AgentConfig(key="test")
    assert agent.key == "test"

    config = ScalarConfig(openapi_url="/openapi.json")
    assert config.openapi_url == "/openapi.json"


def test_theme_completeness():
    from scalar_api_reference import Theme

    expected = [
        "default", "alternate", "moon", "purple", "solarized",
        "bluePlanet", "deepSpace", "saturn", "kepler", "elysiajs",
        "fastify", "mars", "laserwave", "none",
    ]
    actual = [t.value for t in Theme]
    for e in expected:
        assert e in actual
    assert len(actual) == len(expected)
