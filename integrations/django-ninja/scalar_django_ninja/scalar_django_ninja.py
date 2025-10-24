import json
from enum import Enum
from django.http import HttpResponse
from ninja.openapi.docs import DocsBase
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Dict, Any, Union, Optional


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

    model_config = ConfigDict(extra="forbid")  # Don't allow extra fields


class ScalarConfig(BaseModel):
    """Configuration for Scalar API Reference"""

    openapi_url: Optional[str] = Field(
        default=None,
        description="The OpenAPI URL that Scalar should load and use. This is normally done automatically by FastAPI using the default URL `/api/openapi.json`. If content or sources are provided, this parameter is ignored.",
    )

    title: Optional[str] = Field(
        default=None,
        description="The HTML <title> content, normally shown in the browser tab. Defaults to 'Scalar' if not provided.",
    )

    content: Optional[Union[str, Dict[str, Any]]] = Field(
        default=None,
        description="Directly pass an OpenAPI/Swagger document as a string (JSON or YAML) or as a dictionary. If sources are provided, this parameter is ignored.",
    )

    sources: Optional[List[OpenAPISource]] = Field(
        default=None,
        description="Add multiple OpenAPI documents to render all of them. Each source can have a title, slug, url, content, and default flag.",
    )

    scalar_js_url: str = Field(
        default="https://cdn.jsdelivr.net/npm/@scalar/api-reference",
        description="The URL to use to load the Scalar JavaScript. It is normally set to a CDN URL.",
    )

    scalar_proxy_url: str = Field(
        default="",
        description="The URL to use to set the Scalar Proxy. It is normally set to a Scalar API URL (https://proxy.scalar.com).",
    )

    scalar_favicon_url: str = Field(
        default="https://django-ninja.dev/img/favicon.png",
        description="The URL of the favicon to use. It is normally shown in the browser tab.",
    )

    layout: Layout = Field(
        default=Layout.MODERN,
        description="The layout to use for Scalar. Default is 'modern'.",
    )

    show_sidebar: bool = Field(
        default=True,
        description="A boolean to show the sidebar. Default is True which means the sidebar is shown.",
    )

    hide_download_button: bool = Field(
        default=False,
        description="A boolean to hide the download button. @deprecated Use document_download_type instead.",
    )

    document_download_type: DocumentDownloadType = Field(
        default=DocumentDownloadType.BOTH,
        description="Sets the file type of the document to download, set to 'none' to hide the download button. Default is 'both'.",
    )

    hide_test_request_button: bool = Field(
        default=False,
        description="Whether to show the 'Test Request' button. Default is False which means the test request button is shown.",
    )

    hide_models: bool = Field(
        default=False,
        description="A boolean to hide all models. Default is False which means all models are shown.",
    )

    hide_search: bool = Field(
        default=False,
        description="Whether to show the sidebar search bar. Default is False which means the search bar is shown.",
    )

    dark_mode: Optional[bool] = Field(
        default=None,
        description="Whether dark mode is on or off initially (light mode). Default is None which means the dark mode is not set.",
    )

    force_dark_mode_state: Optional[str] = Field(
        default=None,
        description="Force dark mode state to always be this state no matter what. Can be 'dark' or 'light'. Default is None.",
    )

    hide_dark_mode_toggle: bool = Field(
        default=False,
        description="Whether to show the dark mode toggle. Default is False which means the dark mode toggle is shown.",
    )

    search_hot_key: SearchHotKey = Field(
        default=SearchHotKey.K,
        description="The hotkey to use for search. Default is 'k' (e.g. CMD+k).",
    )

    hidden_clients: Union[bool, Dict[str, Union[bool, List[str]]], List[str]] = Field(
        default_factory=list,
        description="A dictionary with the keys being the target names and the values being a boolean to hide all clients of the target or a list clients. Default is [] which means no clients are hidden.",
    )

    base_server_url: str = Field(
        default="",
        description="If you want to prefix all relative servers with a base URL, you can do so here. Default is empty string.",
    )

    servers: List[Dict[str, str]] = Field(
        default_factory=list,
        description="A list of dictionaries with the keys being the server name and the value being the server URL. Default is [] which means no servers are provided.",
    )

    default_open_all_tags: bool = Field(
        default=False,
        description="A boolean to open all tags by default. Default is False which means all tags are closed by default.",
    )

    expand_all_model_sections: bool = Field(
        default=False,
        description="Whether to expand all model sections by default. Default is False which means model sections are closed by default.",
    )

    expand_all_responses: bool = Field(
        default=False,
        description="Whether to expand all response sections by default. Default is False which means response sections are closed by default.",
    )

    order_required_properties_first: bool = Field(
        default=True,
        description="Whether to order required properties first in schema objects. Default is True which means required properties are shown first.",
    )

    authentication: Dict[str, Any] = Field(
        default_factory=dict,
        description="A dictionary of additional authentication information. Default is {} which means no authentication information is provided.",
    )

    hide_client_button: bool = Field(
        default=False,
        description="Whether to show the client button from the reference sidebar and modal. Default is False which means the client button is shown.",
    )

    persist_auth: bool = Field(
        default=False,
        description="Whether to persist authentication credentials in local storage. Default is False which means authentication is not persisted.",
    )

    with_default_fonts: bool = Field(
        default=True,
        description="Whether to use default fonts (Inter and JetBrains Mono). Default is True which means default fonts are used.",
    )

    custom_css: str = Field(
        default="",
        description="Custom CSS string to apply to the API reference. Default is empty string.",
    )

    integration: Optional[str] = Field(
        default=None,
        description="The integration type. Default is None. Set to a different value to override.",
    )

    theme: Theme = Field(
        default=Theme.DEFAULT,
        description="The theme to use for Scalar. Default is 'default'.",
    )

    model_config = ConfigDict(
        extra="forbid",
        use_enum_values=False,  # Keep enum objects instead of converting to values
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
}
.scalar-card:nth-of-type(3) {
  display: none;
}"""


def get_scalar_api_reference(config: ScalarConfig) -> HttpResponse:
    # Build configuration object with only non-default values
    js_config = {}

    # Handle sources vs content vs URL - sources takes highest precedence
    if config.sources is not None:
        # Convert Pydantic models to dictionaries, filtering out None values
        sources_dict = []
        for source in config.sources:
            source_dict = source.model_dump(exclude_none=True)
            sources_dict.append(source_dict)
        js_config["sources"] = sources_dict
    elif config.content is not None:
        js_config["content"] = config.content
    elif config.openapi_url is not None:
        js_config["url"] = config.openapi_url
    else:
        # Default to the standard Django Ninja OpenAPI URL
        js_config["url"] = "/api/openapi.json"

    # Only add options that differ from defaults
    if config.scalar_proxy_url:
        js_config["proxyUrl"] = config.scalar_proxy_url

    if config.layout != Layout.MODERN:
        js_config["layout"] = config.layout.value

    if not config.show_sidebar:  # Default is True
        js_config["showSidebar"] = config.show_sidebar

    # Handle download button configuration
    if (
        config.hide_download_button
    ):  # Deprecated, but still supported for backwards compatibility
        js_config["hideDownloadButton"] = config.hide_download_button
    elif config.document_download_type != DocumentDownloadType.BOTH:  # Default is BOTH
        js_config["documentDownloadType"] = config.document_download_type.value

    if config.hide_test_request_button:  # Default is False
        js_config["hideTestRequestButton"] = config.hide_test_request_button

    if config.hide_models:  # Default is False
        js_config["hideModels"] = config.hide_models

    if config.hide_search:  # Default is False
        js_config["hideSearch"] = config.hide_search

    if config.dark_mode is not None:  # Default is None
        js_config["darkMode"] = config.dark_mode

    if config.force_dark_mode_state:  # Default is None
        js_config["forceDarkModeState"] = config.force_dark_mode_state

    if config.hide_dark_mode_toggle:  # Default is False
        js_config["hideDarkModeToggle"] = config.hide_dark_mode_toggle

    if config.search_hot_key != SearchHotKey.K:  # Default is K
        js_config["searchHotKey"] = config.search_hot_key.value

    if config.hidden_clients:  # Default is []
        js_config["hiddenClients"] = config.hidden_clients

    if config.base_server_url:  # Default is empty string
        js_config["baseServerURL"] = config.base_server_url

    if config.servers:  # Default is []
        js_config["servers"] = config.servers

    if config.default_open_all_tags:  # Default is False
        js_config["defaultOpenAllTags"] = config.default_open_all_tags

    if config.expand_all_model_sections:  # Default is False
        js_config["expandAllModelSections"] = config.expand_all_model_sections

    if config.expand_all_responses:  # Default is False
        js_config["expandAllResponses"] = config.expand_all_responses

    if not config.order_required_properties_first:  # Default is True
        js_config["orderRequiredPropertiesFirst"] = (
            config.order_required_properties_first
        )

    if config.authentication:  # Default is {}
        js_config["authentication"] = config.authentication

    if config.hide_client_button:  # Default is False
        js_config["hideClientButton"] = config.hide_client_button

    if config.persist_auth:  # Default is False
        js_config["persistAuth"] = config.persist_auth

    if not config.with_default_fonts:  # Default is True
        js_config["withDefaultFonts"] = config.with_default_fonts

    if config.custom_css:  # Default is empty string
        js_config["customCss"] = config.custom_css

    if config.integration:
        js_config["_integration"] = config.integration

    if config.theme != Theme.DEFAULT:  # Default is DEFAULT
        js_config["theme"] = config.theme.value

    html = f"""
<!doctype html>
<html>
    <head>
        {f"<title>{config.title if config.title else 'Scalar'}</title>"}
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" href="{config.scalar_favicon_url}">
        <style>
            body {{
                margin: 0;
                padding: 0;
            }}

            {scalar_theme if config.theme.value == Theme.DEFAULT.value else ""}
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
    return HttpResponse(html)


class ScalarViewer(DocsBase):
    """Django Ninja docs viewer for Scalar API Reference.

    All configuration options are documented in the ScalarConfig model.
    You can pass configuration either as individual parameters or as a ScalarConfig instance.
    """

    def __init__(self, config: Optional[ScalarConfig] = None, **kwargs):
        """Initialize ScalarViewer.

        Args:
            config: Optional ScalarConfig instance with all settings
            **kwargs: Individual configuration parameters (see ScalarConfig for options); used for backwards compatibility

        Example:
            # Using kwargs
            viewer = ScalarViewer(title="My API", theme=Theme.MOON)

            # Using config object (preferred because type safe)
            config = ScalarConfig(title="My API", theme=Theme.MOON)
            viewer = ScalarViewer(config=config)
        """
        if config is None:
            # Set default for openapi_url when using kwargs
            if "openapi_url" not in kwargs:
                kwargs["openapi_url"] = "/api/openapi.json"
            self.config = ScalarConfig(**kwargs)
        else:
            # If both config and kwargs provided, update config with kwargs
            if kwargs:
                config_dict = config.model_dump()
                config_dict.update(kwargs)
                self.config = ScalarConfig(**config_dict)
            else:
                self.config = config

    def render_page(self, request, api):
        return get_scalar_api_reference(self.config)
