import json
from enum import Enum
from django.http import HttpResponse
from ninja.openapi.docs import DocsBase
from typing_extensions import Annotated, Doc


class Layout(Enum):
    MODERN = "modern"
    CLASSIC = "classic"


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
        str,
        Doc(
            """
            The OpenAPI URL that Scalar should load and use.
            This is normally done automatically by Ninja using the default URL
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
    ],
    scalar_proxy_url: Annotated[
        str,
        Doc(
            """
            The URL to use to set the Scalar Proxy.
            It is normally set to a Scalar API URL (https://api.scalar.com/request-proxy), but default is empty # noqa: E501
            """
        ),
    ],
    scalar_favicon_url: Annotated[
        str,
        Doc(
            """
            The URL of the favicon to use. It is normally shown in the browser tab. # noqa: E501
            """
        ),
    ],
    scalar_theme: Annotated[
        str,
        Doc(
            """
            Custom CSS theme for Scalar.
            """
        ),
    ],
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
    hidden_clients: Annotated[
        bool | dict[str, bool | list[str]] | list[str] | None,
        Doc(
            """
            A dictionary with the keys being the target names and the values being a boolean to hide all clients of the target or a list clients.
            If a boolean is provided, it will hide all the clients with that name.
            Backwards compatibility: If a list of strings is provided, it will hide the clients with the name and the list of strings.
            Default is None which means no clients are hidden.
            """
        ),
    ] = None,
    servers: Annotated[
        list[dict[str, str]] | None,
        Doc(
            """
            A list of dictionaries with the keys being the server name and the value being the server URL.
            Default is None which means no servers are provided.
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
) -> HttpResponse:
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
        Scalar requires Javascript to function. Please enable it to browse the documentation. # noqa: E501
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
        hiddenClients: {json.dumps(hidden_clients or [])},
        servers: {json.dumps(servers or [])},
        defaultOpenAllTags: {json.dumps(default_open_all_tags)},
      }}

      document.getElementById('api-reference').dataset.configuration =
        JSON.stringify(configuration)
    </script>
    <script src="{scalar_js_url}"></script>
    </body>
    </html>
    """
    return HttpResponse(html)


class ScalarViewer(DocsBase):
    def __init__(
        self,
        title: str = "API Reference",
        openapi_url: str = "/api/openapi.json",
        scalar_js_url: str = "https://cdn.jsdelivr.net/npm/@scalar/api-reference",  # noqa: E501
        scalar_proxy_url: str = "",
        scalar_favicon_url: str = "",
        scalar_theme: str = scalar_theme,
        layout: Layout = Layout.MODERN,
        show_sidebar: bool = True,
        hide_download_button: bool = False,
        hide_models: bool = False,
        hidden_clients: bool | dict[str, bool | list[str]] | list[str] | None = None,
        servers: list[dict[str, str]] | None = None,
        default_open_all_tags: bool = False,
    ):
        self.title = title
        self.openapi_url = openapi_url
        self.scalar_js_url = scalar_js_url
        self.scalar_proxy_url = scalar_proxy_url
        self.scalar_favicon_url = scalar_favicon_url
        self.scalar_theme = scalar_theme
        self.layout = layout
        self.hidden_clients = hidden_clients
        self.show_sidebar = show_sidebar
        self.hide_download_button = hide_download_button
        self.hide_models = hide_models
        self.servers = servers
        self.default_open_all_tags = default_open_all_tags

    def render_page(self, request, api):
        return get_scalar_api_reference(
            openapi_url=self.openapi_url,
            title=self.title,
            scalar_js_url=self.scalar_js_url,
            scalar_proxy_url=self.scalar_proxy_url,
            scalar_favicon_url=self.scalar_favicon_url,
            scalar_theme=self.scalar_theme,
            hidden_clients=self.hidden_clients,
            layout=self.layout,
            show_sidebar=self.show_sidebar,
            hide_download_button=self.hide_download_button,
            hide_models=self.hide_models,
            servers=self.servers,
            default_open_all_tags=self.default_open_all_tags,
        )
