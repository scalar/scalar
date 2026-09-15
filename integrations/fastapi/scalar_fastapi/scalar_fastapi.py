from __future__ import annotations

import json
from enum import Enum
from html import escape as escape_html
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from typing_extensions import Annotated, Doc, Literal
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from fastapi import FastAPI


class Layout(Enum):
    MODERN = "modern"
    CLASSIC = "classic"


class SearchHotKey(Enum):
    A = "a"
    B = "b"
    C = "c"
    D = "d"
    E = "e"
    F = "f"
    G = "g"
    H = "h"
    I = "i"
    J = "j"
    K = "k"
    L = "l"
    M = "m"
    N = "n"
    O = "o"
    P = "p"
    Q = "q"
    R = "r"
    S = "s"
    T = "t"
    U = "u"
    V = "v"
    W = "w"
    X = "x"
    Y = "y"
    Z = "z"


class Theme(Enum):
    ALTERNATE = "alternate"
    DEFAULT = "default"
    MOON = "moon"
    PURPLE = "purple"
    SOLARIZED = "solarized"
    BLUE_PLANET = "bluePlanet"
    SATURN = "saturn"
    KEPLER = "kepler"
    MARS = "mars"
    DEEP_SPACE = "deepSpace"
    LASERWAVE = "laserwave"
    NONE = "none"


class DocumentDownloadType(Enum):
    JSON = "json"
    YAML = "yaml"
    BOTH = "both"
    NONE = "none"


class AgentScalarConfig(BaseModel):
    """
    Agent Scalar configuration: AI chat in the API reference.
    Use key for production; use disabled=True to turn off Agent entirely.
    See: https://scalar.com/products/api-references/configuration#agent-scalar
    """

    model_config = ConfigDict(extra="forbid")

    key: Optional[str] = Field(
        default=None,
        description="Agent Scalar key for production. Required for Agent beyond localhost.",
    )

    disabled: Optional[bool] = Field(
        default=None,
        description="Set to True to disable Agent Scalar entirely.",
    )


class OpenAPISource(BaseModel):
    """Configuration for a single OpenAPI source"""

    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = Field(
        default=None,
        description="Display name for the API. If not provided, will fallback to 'API #1', 'API #2', etc.",
    )

    slug: Optional[str] = Field(
        default=None,
        description="URL identifier for the API. If not provided, will be auto-generated from the title or index.",
    )

    url: Optional[str] = Field(
        default=None,
        description="URL to the OpenAPI document (JSON or YAML). Mutually exclusive with content.",
    )

    content: Optional[Union[str, Dict[str, Any]]] = Field(
        default=None,
        description="Direct OpenAPI content as string (JSON/YAML) or dictionary. Mutually exclusive with url.",
    )

    default: bool = Field(
        default=False,
        description="Whether this source should be the default when multiple sources are provided.",
    )

    agent: Optional[AgentScalarConfig] = Field(
        default=None,
        description="Optional Agent Scalar config for this source (key, disabled). See configuration docs.",
    )


scalar_theme = """
/* basic theme */
.light-mode {
  --scalar-color-1: #1b1b1b;
  --scalar-color-2: #757575;
  --scalar-color-3: #8e8e8e;
  --scalar-color-accent: #009485;

  --scalar-background-1: #fff;
  --scalar-background-2: #fcfcfc;
  --scalar-background-3: #f8f8f8;
  --scalar-background-accent: #ecf8f6;

  --scalar-border-color: rgba(0, 0, 0, 0.1);
}
.dark-mode {
  --scalar-color-1: rgba(255, 255, 255, 0.9);
  --scalar-color-2: rgba(255, 255, 255, 0.62);
  --scalar-color-3: rgba(255, 255, 255, 0.44);
  --scalar-color-accent: #00ccb8;

  --scalar-background-1: #1f2129;
  --scalar-background-2: #282a35;
  --scalar-background-3: #30323d;
  --scalar-background-accent: #223136;

  --scalar-border-color: rgba(255, 255, 255, 0.1);
}
/* Document Sidebar */
.light-mode .t-doc__sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-item-hover-color: currentColor;
  --scalar-sidebar-item-hover-background: var(--scalar-background-2);
  --scalar-sidebar-item-active-background: var(--scalar-background-accent);
  --scalar-sidebar-border-color: var(--scalar-border-color);
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-accent);
  --scalar-sidebar-search-background: transparent;
  --scalar-sidebar-search-border-color: var(--scalar-border-color);
  --scalar-sidebar-search--color: var(--scalar-color-3);
}

.dark-mode .sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-item-hover-color: currentColor;
  --scalar-sidebar-item-hover-background: var(--scalar-background-2);
  --scalar-sidebar-item-active-background: var(--scalar-background-accent);
  --scalar-sidebar-border-color: var(--scalar-border-color);
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-accent);
  --scalar-sidebar-search-background: transparent;
  --scalar-sidebar-search-border-color: var(--scalar-border-color);
  --scalar-sidebar-search--color: var(--scalar-color-3);
}

/* advanced */
.light-mode {
  --scalar-button-1: rgb(49 53 56);
  --scalar-button-1-color: #fff;
  --scalar-button-1-hover: rgb(28 31 33);

  --scalar-color-green: #009485;
  --scalar-color-red: #d52b2a;
  --scalar-color-yellow: #ffaa01;
  --scalar-color-blue: #0a52af;
  --scalar-color-orange: #953800;
  --scalar-color-purple: #8251df;

  --scalar-scrollbar-color: rgba(0, 0, 0, 0.18);
  --scalar-scrollbar-color-active: rgba(0, 0, 0, 0.36);
}
.dark-mode {
  --scalar-button-1: #f6f6f6;
  --scalar-button-1-color: #000;
  --scalar-button-1-hover: #e7e7e7;

  --scalar-color-green: #00ccb8;
  --scalar-color-red: #e5695b;
  --scalar-color-yellow: #ffaa01;
  --scalar-color-blue: #78bffd;
  --scalar-color-orange: #ffa656;
  --scalar-color-purple: #d2a8ff;

  --scalar-scrollbar-color: rgba(255, 255, 255, 0.24);
  --scalar-scrollbar-color-active: rgba(255, 255, 255, 0.48);
}
:root {
  --scalar-radius: 3px;
  --scalar-radius-lg: 6px;
  --scalar-radius-xl: 8px;
}"""


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
        Layout | str,
        Doc(
            """
            The layout to use for Scalar.
            Accepts a Layout member or its plain string value (e.g. "classic").
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
        DocumentDownloadType | str,
        Doc(
            """
            Sets the file type of the document to download, set to 'none' to hide the download button.
            Accepts a DocumentDownloadType member or its plain string value (e.g. "json").
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
        bool | None,
        Doc(
            """
            Whether dark mode is on or off initially (light mode).
            Default is None which means the dark mode is not set.
            """
        ),
    ] = None,
    force_dark_mode_state: Annotated[
        Literal["dark", "light"] | None,
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
        SearchHotKey | str,
        Doc(
            """
            The hotkey to use for search.
            Accepts a SearchHotKey member or a plain single-letter string (e.g. "s").
            Default is "k" (e.g. CMD+k).
            """
        ),
    ] = SearchHotKey.K,
    hidden_clients: Annotated[
        bool | dict[str, bool | list[str]] | list[str] | None,
        Doc(
            """
            A dictionary with the keys being the target names and the values being a boolean to hide all clients of the target or a list clients.
            If a boolean is provided, it will hide all the clients with that name.
            Backwards compatibility: If a list of strings is provided, it will hide the clients with the name and the list of strings.
            Default is [] which means no clients are hidden.
            """
        ),
    ] = None,
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
        list[dict[str, Any]] | None,
        Doc(
            """
            List of OpenAPI Server Objects. Each item must have a required 'url' (string) and may have
            optional 'description' (string) and 'variables' (map). Example:
            [{"url": "https://api.example.com", "description": "Production"}].
            Default is [] which means no servers are provided.
            """
        ),
    ] = None,
    plugin_urls: Annotated[
        list[str] | None,
        Doc(
            """
            URLs of ESM modules that provide additional API Reference plugins.
            Each module is imported in the browser before the API Reference mounts,
            and its default export is registered as a plugin.
            Default is [] which means no plugin URLs are provided.
            """
        ),
    ] = None,
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
    order_schema_properties_by: Annotated[
        Literal["alpha", "preserve"],
        Doc(
            """
            The order to use for schema properties.
            Use 'alpha' to sort alphabetically, or 'preserve' to keep the original order.
            Default is 'alpha'.
            """
        ),
    ] = "alpha",
    authentication: Annotated[
        dict | None,
        Doc(
            """
            A dictionary of additional authentication information.
            Default is {} which means no authentication information is provided.
            """
        ),
    ] = None,
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
        Theme | str,
        Doc(
            """
            The theme to use for Scalar.
            Accepts a Theme member or its plain string value (e.g. "moon").
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
        Dict[str, Any] | None,
        Doc(
            """
            A dictionary of additional configuration overrides to pass to Scalar.
            Default is {} which means no overrides are provided.
            """
        ),
    ] = None,
) -> HTMLResponse:
    # Accept either the enum members or their plain string values, so callers
    # can pass, for example, theme="moon" instead of theme=Theme.MOON.
    layout = layout.value if isinstance(layout, Enum) else layout
    theme = theme.value if isinstance(theme, Enum) else theme
    search_hot_key = search_hot_key.value if isinstance(search_hot_key, Enum) else search_hot_key
    document_download_type = (
        document_download_type.value
        if isinstance(document_download_type, Enum)
        else document_download_type
    )

    # Build configuration object with only non-default values
    config = {}

    # Handle sources vs content vs URL - sources takes highest precedence
    if sources is not None:
        # Convert Pydantic models to dictionaries, filtering out None values
        sources_dict = []
        for source in sources:
            source_dict = source.model_dump(exclude_none=True)
            sources_dict.append(source_dict)
        config["sources"] = sources_dict
    elif content is not None:
        config["content"] = content
    elif openapi_url is not None:
        config["url"] = openapi_url
    else:
        # Default to the standard FastAPI openapi URL
        config["url"] = "/openapi.json"

    # Only add options that differ from defaults
    if scalar_proxy_url:
        config["proxyUrl"] = scalar_proxy_url

    if agent is not None:
        config["agent"] = agent.model_dump(exclude_none=True)

    if layout != Layout.MODERN.value:
        config["layout"] = layout

    if not show_sidebar:  # Default is True
        config["showSidebar"] = show_sidebar

    # Handle download button configuration
    if (
        hide_download_button
    ):  # Deprecated, but still supported for backwards compatibility
        config["hideDownloadButton"] = hide_download_button
    elif document_download_type != DocumentDownloadType.BOTH.value:  # Default is BOTH
        config["documentDownloadType"] = document_download_type

    if hide_test_request_button:  # Default is False
        config["hideTestRequestButton"] = hide_test_request_button

    if hide_models:  # Default is False
        config["hideModels"] = hide_models

    if hide_search:  # Default is False
        config["hideSearch"] = hide_search

    if dark_mode is not None:  # Default is None
        config["darkMode"] = dark_mode

    if force_dark_mode_state:  # Default is None
        config["forceDarkModeState"] = force_dark_mode_state

    if hide_dark_mode_toggle:  # Default is False
        config["hideDarkModeToggle"] = hide_dark_mode_toggle

    if search_hot_key != SearchHotKey.K.value:  # Default is K
        config["searchHotKey"] = search_hot_key

    if hidden_clients:  # Default is []
        config["hiddenClients"] = hidden_clients

    if base_server_url:  # Default is empty string
        config["baseServerURL"] = base_server_url

    if servers:  # Default is []
        config["servers"] = servers

    if plugin_urls:  # Default is []
        config["pluginUrls"] = plugin_urls

    if default_open_all_tags:  # Default is False
        config["defaultOpenAllTags"] = default_open_all_tags

    if expand_all_model_sections:  # Default is False
        config["expandAllModelSections"] = expand_all_model_sections

    if expand_all_responses:  # Default is False
        config["expandAllResponses"] = expand_all_responses

    if not order_required_properties_first:  # Default is True
        config["orderRequiredPropertiesFirst"] = order_required_properties_first

    if order_schema_properties_by != "alpha":  # Default is alpha
        config["orderSchemaPropertiesBy"] = order_schema_properties_by

    if authentication:  # Default is {}
        config["authentication"] = authentication

    if hide_client_button:  # Default is False
        config["hideClientButton"] = hide_client_button

    if persist_auth:  # Default is False
        config["persistAuth"] = persist_auth

    if not with_default_fonts:  # Default is True
        config["withDefaultFonts"] = with_default_fonts

    if custom_css:  # Default is empty string
        config["customCss"] = custom_css

    if integration:
        config["_integration"] = integration

    if theme != Theme.DEFAULT.value:  # Default is DEFAULT
        config["theme"] = theme

    if show_developer_tools != "localhost":  # Default is 'localhost'
        config["showDeveloperTools"] = show_developer_tools

    if not telemetry:  # Default is True
        config["telemetry"] = telemetry

    if overrides:  # Default is {}
        config.update(overrides)

    # Escape the title so it cannot inject markup, and escape "</" in the
    # serialized config so a document that contains "</script>" cannot break
    # out of the inline <script> block below.
    page_title = escape_html(title) if title else "Scalar"
    config_json = json.dumps(config).replace("</", "<\\/")

    html = f"""
<!doctype html>
<html>
    <head>
        <title>{page_title}</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" href="{scalar_favicon_url}">
        <style>
            body {{
                margin: 0;
                padding: 0;
            }}

            {scalar_theme if theme == Theme.DEFAULT.value else ""}
        </style>
    </head>
    <body>
        <div id="app"></div>

        <!-- Load the Script -->
        <script src="{scalar_js_url}"></script>

        <!-- Initialize the Scalar API Reference -->
        <script>
            Scalar.createApiReference("#app", {config_json})
        </script>
    </body>
    </html>
    """
    return HTMLResponse(html)


def add_scalar_reference(
    app: FastAPI,
    *,
    route: str = "/scalar",
    include_in_schema: bool = False,
    **kwargs: Any,
) -> FastAPI:
    """
    Register a Scalar API Reference route on a FastAPI application.

    This is the one-line way to add Scalar to a FastAPI app. It wires up the
    route and fills in ``openapi_url`` and ``title`` from the app, so the common
    case is simply::

        from fastapi import FastAPI
        from scalar_fastapi import add_scalar_reference

        app = FastAPI()
        add_scalar_reference(app)

    Any keyword argument accepted by :func:`get_scalar_api_reference` can be
    passed through, for example ``add_scalar_reference(app, theme=Theme.KEPLER)``
    or a custom ``route="/docs/scalar"``.
    """
    # Fall back to the app's own values, but let callers override either one.
    kwargs.setdefault("openapi_url", app.openapi_url)
    kwargs.setdefault("title", app.title)

    @app.get(route, include_in_schema=include_in_schema)
    async def scalar_html() -> HTMLResponse:
        return get_scalar_api_reference(**kwargs)

    return app
