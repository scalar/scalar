from __future__ import annotations

import json

from .config import ScalarConfig
from .enums import DocumentDownloadType, Layout, SearchHotKey, Theme
from .theme import scalar_theme


def render_html(config: ScalarConfig, default_openapi_url: str = "") -> str:
    """Render a Scalar API Reference HTML page from the given config.

    Args:
        config: A ScalarConfig instance with all rendering options.
        default_openapi_url: Fallback URL when config has no openapi_url,
            content, or sources set (e.g. "/openapi.json" for FastAPI).

    Returns:
        A complete HTML document string.
    """
    js_config: dict = {}

    # Handle sources vs content vs URL - sources takes highest precedence
    if config.sources is not None:
        sources_dict = []
        for source in config.sources:
            source_dict = source.model_dump(exclude_none=True)
            sources_dict.append(source_dict)
        js_config["sources"] = sources_dict
    elif config.content is not None:
        js_config["content"] = config.content
    elif config.openapi_url is not None:
        js_config["url"] = config.openapi_url
    elif default_openapi_url:
        js_config["url"] = default_openapi_url

    # Only add options that differ from defaults
    if config.scalar_proxy_url:
        js_config["proxyUrl"] = config.scalar_proxy_url

    if config.agent is not None:
        js_config["agent"] = config.agent.model_dump(exclude_none=True)

    if config.layout != Layout.MODERN:
        js_config["layout"] = config.layout.value

    if not config.show_sidebar:
        js_config["showSidebar"] = config.show_sidebar

    # Handle download button configuration
    if config.hide_download_button:
        js_config["hideDownloadButton"] = config.hide_download_button
    elif config.document_download_type != DocumentDownloadType.BOTH:
        js_config["documentDownloadType"] = config.document_download_type.value

    if config.hide_test_request_button:
        js_config["hideTestRequestButton"] = config.hide_test_request_button

    if config.hide_models:
        js_config["hideModels"] = config.hide_models

    if config.hide_search:
        js_config["hideSearch"] = config.hide_search

    if config.dark_mode is not None:
        js_config["darkMode"] = config.dark_mode

    if config.force_dark_mode_state:
        js_config["forceDarkModeState"] = config.force_dark_mode_state

    if config.hide_dark_mode_toggle:
        js_config["hideDarkModeToggle"] = config.hide_dark_mode_toggle

    if config.search_hot_key != SearchHotKey.K:
        js_config["searchHotKey"] = config.search_hot_key.value

    if config.hidden_clients:
        js_config["hiddenClients"] = config.hidden_clients

    if config.base_server_url:
        js_config["baseServerURL"] = config.base_server_url

    if config.servers:
        js_config["servers"] = config.servers

    if config.default_open_all_tags:
        js_config["defaultOpenAllTags"] = config.default_open_all_tags

    if config.expand_all_model_sections:
        js_config["expandAllModelSections"] = config.expand_all_model_sections

    if config.expand_all_responses:
        js_config["expandAllResponses"] = config.expand_all_responses

    if not config.order_required_properties_first:
        js_config["orderRequiredPropertiesFirst"] = config.order_required_properties_first

    if config.authentication:
        js_config["authentication"] = config.authentication

    if config.hide_client_button:
        js_config["hideClientButton"] = config.hide_client_button

    if config.persist_auth:
        js_config["persistAuth"] = config.persist_auth

    if not config.with_default_fonts:
        js_config["withDefaultFonts"] = config.with_default_fonts

    if config.custom_css:
        js_config["customCss"] = config.custom_css

    if config.integration:
        js_config["_integration"] = config.integration

    if config.theme != Theme.DEFAULT:
        js_config["theme"] = config.theme.value

    if config.show_developer_tools != "localhost":
        js_config["showDeveloperTools"] = config.show_developer_tools

    if not config.telemetry:
        js_config["telemetry"] = config.telemetry

    if config.overrides:
        js_config.update(config.overrides)

    title = config.title if config.title else "Scalar"
    theme_css = scalar_theme if config.theme.value == Theme.DEFAULT.value else ""
    favicon_link = (
        f'<link rel="shortcut icon" href="{config.scalar_favicon_url}">'
        if config.scalar_favicon_url
        else ""
    )

    html = f"""
<!doctype html>
<html>
    <head>
        <title>{title}</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        {favicon_link}
        <style>
            body {{
                margin: 0;
                padding: 0;
            }}

            {theme_css}
        </style>
    </head>
    <body>
        <div id="app"></div>

        <!-- Load the Script -->
        <script src="{config.scalar_js_url}"></script>

        <!-- Initialize the Scalar API Reference -->
        <script>
            Scalar.createApiReference("#app", {json.dumps(js_config)})
        </script>
    </body>
    </html>
    """
    return html
