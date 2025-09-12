from __future__ import annotations

import json
from enum import Enum
from typing_extensions import Annotated, Doc
from fastapi.responses import HTMLResponse
from typing import List, Dict, Any, Union, Optional
from pydantic import BaseModel, Field


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


class OpenAPISource(BaseModel):
    """Configuration for a single OpenAPI source"""

    title: Optional[str] = Field(
        default=None,
        description="Display name for the API. If not provided, will fallback to 'API #1', 'API #2', etc."
    )

    slug: Optional[str] = Field(
        default=None,
        description="URL identifier for the API. If not provided, will be auto-generated from the title or index."
    )

    url: Optional[str] = Field(
        default=None,
        description="URL to the OpenAPI document (JSON or YAML). Mutually exclusive with content."
    )

    content: Optional[Union[str, Dict[str, Any]]] = Field(
        default=None,
        description="Direct OpenAPI content as string (JSON/YAML) or dictionary. Mutually exclusive with url."
    )

    default: bool = Field(
        default=False,
        description="Whether this source should be the default when multiple sources are provided."
    )

    class Config:
        extra = "forbid"  # Don't allow extra fields


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
}
.scalar-card:nth-of-type(3) {
  display: none;
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
        list[dict[str, str]],
        Doc(
            """
            A list of dictionaries with the keys being the server name and the value being the server URL.
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
    ] = 'fastapi',
    theme: Annotated[
        Theme,
        Doc(
            """
            The theme to use for Scalar.
            Default is "default".
            """
        ),
    ] = Theme.DEFAULT,
) -> HTMLResponse:
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

    if layout != Layout.MODERN:
        config["layout"] = layout.value

    if not show_sidebar:  # Default is True
        config["showSidebar"] = show_sidebar

    # Handle download button configuration
    if hide_download_button:  # Deprecated, but still supported for backwards compatibility
        config["hideDownloadButton"] = hide_download_button
    elif document_download_type != DocumentDownloadType.BOTH:  # Default is BOTH
        config["documentDownloadType"] = document_download_type.value

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

    if search_hot_key != SearchHotKey.K:  # Default is K
        config["searchHotKey"] = search_hot_key.value

    if hidden_clients:  # Default is []
        config["hiddenClients"] = hidden_clients

    if base_server_url:  # Default is empty string
        config["baseServerURL"] = base_server_url

    if servers:  # Default is []
        config["servers"] = servers

    if default_open_all_tags:  # Default is False
        config["defaultOpenAllTags"] = default_open_all_tags

    if expand_all_model_sections:  # Default is False
        config["expandAllModelSections"] = expand_all_model_sections

    if expand_all_responses:  # Default is False
        config["expandAllResponses"] = expand_all_responses

    if not order_required_properties_first:  # Default is True
        config["orderRequiredPropertiesFirst"] = order_required_properties_first

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

    if theme != Theme.DEFAULT:  # Default is DEFAULT
        config["theme"] = theme.value

    html = f"""
<!doctype html>
<html>
    <head>
        {f'<title>{title if title else "Scalar"}</title>'}
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" href="{scalar_favicon_url}">
        <style>
            body {{
                margin: 0;
                padding: 0;
            }}

            {scalar_theme if theme.value == Theme.DEFAULT.value else ""}
        </style>
    </head>
    <body>
        <div id="app"></div>

        <!-- Load the Script -->
        <script src="{scalar_js_url}"></script>

        <!-- Initialize the Scalar API Reference -->
        <script>
            Scalar.createApiReference("#app", {json.dumps(config)})
        </script>
    </body>
    </html>
    """
    return HTMLResponse(html)
