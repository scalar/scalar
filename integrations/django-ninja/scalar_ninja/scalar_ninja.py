from typing import Optional

from django.http import HttpResponse
from ninja.openapi.docs import DocsBase

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


def get_scalar_api_reference(config: ScalarConfig) -> HttpResponse:
    """Render a Scalar API Reference page wrapped in a Django HttpResponse."""
    html = render_html(config, default_openapi_url="/api/openapi.json")
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
            # Set Django Ninja defaults when using kwargs
            if "openapi_url" not in kwargs:
                kwargs["openapi_url"] = "/api/openapi.json"
            if "scalar_favicon_url" not in kwargs:
                kwargs["scalar_favicon_url"] = "https://django-ninja.dev/img/favicon.png"
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
