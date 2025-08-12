from __future__ import annotations

import json
from enum import Enum
from typing_extensions import Annotated, Doc
from fastapi.responses import HTMLResponse


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


def get_scalar_api_reference(
    *,
    openapi_url: Annotated[
        str,
        Doc(
            """
            The OpenAPI URL that Scalar should load and use.
            This is normally done automatically by FastAPI using the default URL
            `/openapi.json`.
            """
        ),
    ],
    title: Annotated[
        str,
        Doc(
            """
            The HTML `<title>` content, normally shown in the browser tab.
            """
        ),
    ],
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
    scalar_theme: Annotated[
        str,
        Doc(
            """
            Custom CSS theme for Scalar.
            """
        ),
    ] = "",
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
    dark_mode: Annotated[
        bool,
        Doc(
            """
            Whether dark mode is on or off initially (light mode).
            Default is True which means dark mode is used.
            """
        ),
    ] = True,
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
            Whether to show the client button from the reference sidebar and modal
            Default is False which means the client button is shown.
            """
        ),
    ] = False,
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
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <title>{title}</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" href="{scalar_favicon_url}">
    <style>
      body {{
        margin: 0;
        padding: 0;
      }}
    </style>
    <style>
    {scalar_theme}
    </style>
    </head>
    <body>
    <noscript>
        Scalar requires Javascript to function. Please enable it to browse the documentation.
    </noscript>
    <script
      id="api-reference"
      data-url="{openapi_url}"
      data-proxy-url="{scalar_proxy_url}"></script>
    <script>
      var configuration = {{
        layout: "{layout.value}",
        showSidebar: {json.dumps(show_sidebar)},
        hideDownloadButton: {json.dumps(hide_download_button)},
        hideModels: {json.dumps(hide_models)},
        darkMode: {json.dumps(dark_mode)},
        searchHotKey: "{search_hot_key.value}",
        hiddenClients: {json.dumps(hidden_clients)},
        servers: {json.dumps(servers)},
        defaultOpenAllTags: {json.dumps(default_open_all_tags)},
        authentication: {json.dumps(authentication)},
        hideClientButton: {json.dumps(hide_client_button)},
        _integration: {json.dumps(integration)},
        theme: "{theme.value}",
      }}

      document.getElementById('api-reference').dataset.configuration =
        JSON.stringify(configuration)
    </script>
    <script src="{scalar_js_url}"></script>
    </body>
    </html>
    """
    return HTMLResponse(html)
