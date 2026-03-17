from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from typing_extensions import Annotated, Doc, Literal
from fastapi.responses import HTMLResponse

from scalar_api_reference import (
    AgentConfig as _AgentConfig,
    DocumentDownloadType,
    Layout,
    OpenAPISource,
    ScalarConfig,
    SearchHotKey,
    Theme,
    render_html,
    scalar_theme,
)

# Backward-compatible alias: FastAPI historically exported AgentScalarConfig
AgentScalarConfig = _AgentConfig


def get_scalar_api_reference(
    *,
    openapi_url: Annotated[
        str | None,
        Doc(
            """
            The OpenAPI URL that Scalar should load and use.
            This is normally done automatically by FastAPI using the default URL
            `/openapi.json`. If content or sources are provided, this parameter is ignored.
            """
        ),
    ] = None,
    title: Annotated[
        str | None,
        Doc(
            """
            The HTML `<title>` content, normally shown in the browser tab.
            Defaults to "Scalar" if not provided.
            """
        ),
    ] = None,
    content: Annotated[
        str | dict | None,
        Doc(
            """
            Directly pass an OpenAPI/Swagger document as a string (JSON or YAML) or as a dictionary.
            If provided, this takes precedence over openapi_url. If sources are provided, this parameter is ignored.
            """
        ),
    ] = None,
    sources: Annotated[
        List[OpenAPISource] | None,
        Doc(
            """
            Add multiple OpenAPI documents to render all of them.
            Each source can have a title, slug, url, content, and default flag.
            If provided, this takes precedence over content and openapi_url.
            """
        ),
    ] = None,
    scalar_js_url: Annotated[
        str,
        Doc(
            """
            The URL to use to load the Scalar JavaScript.
            It is normally set to a CDN URL.
            """
        ),
    ] = "https://cdn.jsdelivr.net/npm/@scalar/api-reference",
    scalar_proxy_url: Annotated[
        str,
        Doc(
            """
            The URL to use to set the Scalar Proxy.
            It is normally set to a Scalar API URL (https://proxy.scalar.com), but default is empty
            """
        ),
    ] = "",
    scalar_favicon_url: Annotated[
        str,
        Doc(
            """
            The URL of the favicon to use. It is normally shown in the browser tab.
            """
        ),
    ] = "https://fastapi.tiangolo.com/img/favicon.png",
    layout: Annotated[
        Layout,
        Doc(
            """
            The layout to use for Scalar.
            Default is "modern".
            """
        ),
    ] = Layout.MODERN,
    show_sidebar: Annotated[
        bool,
        Doc(
            """
            A boolean to show the sidebar.
            Default is True which means the sidebar is shown.
            """
        ),
    ] = True,
    hide_download_button: Annotated[
        bool,
        Doc(
            """
            A boolean to hide the download button.
            Default is False which means the download button is shown.
            @deprecated Use document_download_type instead
            """
        ),
    ] = False,
    document_download_type: Annotated[
        DocumentDownloadType,
        Doc(
            """
            Sets the file type of the document to download, set to 'none' to hide the download button.
            Default is 'both'.
            """
        ),
    ] = DocumentDownloadType.BOTH,
    hide_test_request_button: Annotated[
        bool,
        Doc(
            """
            Whether to show the "Test Request" button.
            Default is False which means the test request button is shown.
            """
        ),
    ] = False,
    hide_models: Annotated[
        bool,
        Doc(
            """
            A boolean to hide all models.
            Default is False which means all models are shown.
            """
        ),
    ] = False,
    hide_search: Annotated[
        bool,
        Doc(
            """
            Whether to show the sidebar search bar.
            Default is False which means the search bar is shown.
            """
        ),
    ] = False,
    dark_mode: Annotated[
        bool,
        Doc(
            """
            Whether dark mode is on or off initially (light mode).
            Default is None which means the dark mode is not set.
            """
        ),
    ] = None,
    force_dark_mode_state: Annotated[
        str | None,
        Doc(
            """
            Force dark mode state to always be this state no matter what.
            Can be 'dark' or 'light'. Default is None.
            """
        ),
    ] = None,
    hide_dark_mode_toggle: Annotated[
        bool,
        Doc(
            """
            Whether to show the dark mode toggle.
            Default is False which means the dark mode toggle is shown.
            """
        ),
    ] = False,
    search_hot_key: Annotated[
        SearchHotKey,
        Doc(
            """
            The hotkey to use for search.
            Default is "k" (e.g. CMD+k).
            """
        ),
    ] = SearchHotKey.K,
    hidden_clients: Annotated[
        bool | dict[str, bool | list[str]] | list[str],
        Doc(
            """
            A dictionary with the keys being the target names and the values being a boolean to hide all clients of the target or a list clients.
            If a boolean is provided, it will hide all the clients with that name.
            Backwards compatibility: If a list of strings is provided, it will hide the clients with the name and the list of strings.
            Default is [] which means no clients are hidden.
            """
        ),
    ] = [],
    base_server_url: Annotated[
        str,
        Doc(
            """
            If you want to prefix all relative servers with a base URL, you can do so here.
            Default is empty string.
            """
        ),
    ] = "",
    servers: Annotated[
        list[dict[str, Any]],
        Doc(
            """
            List of OpenAPI Server Objects. Each item must have a required 'url' (string) and may have
            optional 'description' (string) and 'variables' (map). Example:
            [{"url": "https://api.example.com", "description": "Production"}].
            Default is [] which means no servers are provided.
            """
        ),
    ] = [],
    default_open_all_tags: Annotated[
        bool,
        Doc(
            """
            A boolean to open all tags by default.
            Default is False which means all tags are closed by default.
            """
        ),
    ] = False,
    expand_all_model_sections: Annotated[
        bool,
        Doc(
            """
            Whether to expand all model sections by default.
            Default is False which means model sections are closed by default.
            """
        ),
    ] = False,
    expand_all_responses: Annotated[
        bool,
        Doc(
            """
            Whether to expand all response sections by default.
            Default is False which means response sections are closed by default.
            """
        ),
    ] = False,
    order_required_properties_first: Annotated[
        bool,
        Doc(
            """
            Whether to order required properties first in schema objects.
            Default is True which means required properties are shown first.
            """
        ),
    ] = True,
    authentication: Annotated[
        dict,
        Doc(
            """
            A dictionary of additional authentication information.
            Default is {} which means no authentication information is provided.
            """
        ),
    ] = {},
    hide_client_button: Annotated[
        bool,
        Doc(
            """
            Whether to show the client button from the reference sidebar and modal.
            Default is False which means the client button is shown.
            """
        ),
    ] = False,
    persist_auth: Annotated[
        bool,
        Doc(
            """
            Whether to persist authentication credentials in local storage.
            Default is False which means authentication is not persisted.
            """
        ),
    ] = False,
    with_default_fonts: Annotated[
        bool,
        Doc(
            """
            Whether to use default fonts (Inter and JetBrains Mono).
            Default is True which means default fonts are used.
            """
        ),
    ] = True,
    custom_css: Annotated[
        str,
        Doc(
            """
            Custom CSS string to apply to the API reference.
            Default is empty string.
            """
        ),
    ] = "",
    integration: Annotated[
        str | None,
        Doc(
            """
            The integration type. Default is 'fastapi'.
            Set to None or a different value to override.
            """
        ),
    ] = "fastapi",
    theme: Annotated[
        Theme,
        Doc(
            """
            The theme to use for Scalar.
            Default is "default".
            """
        ),
    ] = Theme.DEFAULT,
    show_developer_tools: Annotated[
        Literal["always", "localhost", "never"],
        Doc(
            """
            Control the visibility of developer tools.
            Options are 'always', 'localhost', or 'never'.
            Default is 'localhost'.
            """
        )
    ] = "localhost",
    telemetry: Annotated[
        bool,
        Doc(
            """
            Whether to enable telemetry.
            Only tracks whether a request was sent through the API client.
            Default is True which means telemetry is enabled.

            See: https://scalar.com/products/api-references/configuration#configuration__configuration-options__properties__telemetry
            """
        ),
    ] = True,
    agent: Annotated[
        AgentScalarConfig | None,
        Doc(
            """
            Agent Scalar config: set to AgentScalarConfig(disabled=True) to disable Agent entirely,
            or use per-source agent on OpenAPISource for keys.
            See: https://scalar.com/products/api-references/configuration#agent-scalar
            """
        ),
    ] = None,
    overrides: Annotated[
        Dict[str, Any],
        Doc(
            """
            A dictionary of additional configuration overrides to pass to Scalar.
            Default is {} which means no overrides are provided.
            """
        ),
    ] = {},
) -> HTMLResponse:
    config = ScalarConfig(
        openapi_url=openapi_url,
        title=title,
        content=content,
        sources=sources,
        scalar_js_url=scalar_js_url,
        scalar_proxy_url=scalar_proxy_url,
        scalar_favicon_url=scalar_favicon_url,
        layout=layout,
        show_sidebar=show_sidebar,
        hide_download_button=hide_download_button,
        document_download_type=document_download_type,
        hide_test_request_button=hide_test_request_button,
        hide_models=hide_models,
        hide_search=hide_search,
        dark_mode=dark_mode,
        force_dark_mode_state=force_dark_mode_state,
        hide_dark_mode_toggle=hide_dark_mode_toggle,
        search_hot_key=search_hot_key,
        hidden_clients=hidden_clients,
        base_server_url=base_server_url,
        servers=servers,
        default_open_all_tags=default_open_all_tags,
        expand_all_model_sections=expand_all_model_sections,
        expand_all_responses=expand_all_responses,
        order_required_properties_first=order_required_properties_first,
        authentication=authentication,
        hide_client_button=hide_client_button,
        persist_auth=persist_auth,
        with_default_fonts=with_default_fonts,
        custom_css=custom_css,
        integration=integration,
        theme=theme,
        show_developer_tools=show_developer_tools,
        telemetry=telemetry,
        agent=agent,
        overrides=overrides,
    )
    html = render_html(config, default_openapi_url="/openapi.json")
    return HTMLResponse(html)
