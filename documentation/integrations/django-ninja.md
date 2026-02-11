# Scalar API Reference for Django Ninja

The easiest way to render a modern and beautiful API reference based on your Django Ninja OpenAPI document.

![Screenshot of the Django Ninja integration](../assets/screenshots/django-ninja.png)

## Installation

```bash
pip install scalar-ninja
```

## Usage

Integrating Scalar with Django Ninja is simple.

### Basic Usage

Just pass the `ScalarViewer` instance to the `docs` parameter of the NinjaAPI instance.

```python
from ninja import NinjaAPI
from scalar_ninja import ScalarViewer

api = NinjaAPI(
    version="1.0.0",
    title="API Reference",
    description="API Reference for the Scalar Django Ninja Plugin",
    docs=ScalarViewer(),
)

@api.get("/add")
def add(request, a: int, b: int):
    return {"result": a + b}


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
```

This renders a beautiful API reference at `/api/docs` based on your API.

### Advanced Usage

You can configure `ScalarViewer` by passing `ScalarConfig` to the method. Detailed configuration options are listed [here](#configuration).

```python
from ninja import NinjaAPI
from scalar_ninja import ScalarConfig, ScalarViewer

scalar_config = ScalarConfig(
    show_sidebar=False,
    force_dark_mode_state="dark",
)

api = NinjaAPI(
    version="1.0.0",
    title="API Reference",
    description="API Reference for the Scalar Django Ninja Plugin",
    docs=ScalarViewer(scalar_config),
)
```

For backwards compatibility you can also add the available configuration options as `kwargs` to `ScalarViewer`:

```python
from ninja import NinjaAPI
from scalar_ninja import ScalarViewer

api = NinjaAPI(
    version="1.0.0",
    title="API Reference",
    description="API Reference for the Scalar Django Ninja Plugin",
    docs=ScalarViewer(show_sidebar=False, force_dark_mode_state="dark"),
    docs_url="/docs/",
)
```

It's recommend to use `ScalarConfig` to have a fully typed configuration.

## Configuration

Currently available [configuration options](../configuration.md) are listed below.

### Core Configuration

- `openapi_url` (default `None`) - The OpenAPI URL that Scalar should load and use. This is normally done automatically by Django Ninja using the default URL `/api/openapi.json`. If `content` or `sources` are provided, this parameter is ignored.
- `content` (default `None`) - Directly pass an OpenAPI/Swagger document as a string (JSON or YAML) or as a dictionary. If `sources` are provided, this parameter is ignored.
- `sources` (default `None`) - Add multiple OpenAPI documents to render all of them. Each source can have a title, slug, url, content, and default flag.
- `title` (default `"Scalar"`) - The title of the API reference page

### OpenAPISource Configuration

When using multiple sources, each `OpenAPISource` can be configured with:

- `title` (default `None`) - Display name for the API. If not provided, will fallback to 'API #1', 'API #2', etc.
- `slug` (default `None`) - URL identifier for the API. If not provided, will be auto-generated from the title or index.
- `url` (default `None`) - URL to the OpenAPI document (JSON or YAML). Mutually exclusive with content.
- `content` (default `None`) - Direct OpenAPI content as string (JSON/YAML) or dictionary. Mutually exclusive with url.
- `default` (default `False`) - Whether this source should be the default when multiple sources are provided.
- `agent` (default `None`) - Agent Scalar configuration for this source. Object with optional `key` (string) for production and optional `disabled` (boolean) to turn off for this source.

### Display Options

- `layout` (default `Layout.MODERN`) - Options: [Layout](#Layout)
- `show_sidebar` (default `True`)
- `hide_models` (default `False`)
- `hide_search` (default `False`) - Whether to show the sidebar search bar
- `hide_test_request_button` (default `False`) - Whether to show the "Test Request" button
- `hide_download_button` (default `False`) - **Deprecated**: Use `document_download_type` instead
- `document_download_type` (default `DocumentDownloadType.BOTH`) - Sets the file type of the document to download. Options: [DocumentDownloadType](#DocumentDownloadType)

### Theme and Appearance

- `dark_mode` (default `True`)
- `force_dark_mode_state` (default `None`) - Force dark mode state to always be this state. Can be 'dark' or 'light'
- `hide_dark_mode_toggle` (default `False`) - Whether to show the dark mode toggle
- `with_default_fonts` (default `True`) - Whether to use default fonts (Inter and JetBrains Mono)
- `custom_css` (default `""`) - Custom CSS string to apply to the API reference

### Search and Navigation

- `search_hot_key` (default `SearchHotKey.K`) - Options: [SearchHotKey](#SearchHotKey)
- `default_open_all_tags` (default `False`)
- `expand_all_model_sections` (default `False`) - Whether to expand all model sections by default
- `expand_all_responses` (default `False`) - Whether to expand all response sections by default
- `order_required_properties_first` (default `True`) - Whether to order required properties first in schema objects

### Server Configuration

- `base_server_url` (default `""`) - If you want to prefix all relative servers with a base URL
- `servers` (default `[]`)
- `hidden_clients` (default `[]`)

### Authentication

- `authentication` (default `{}`)
- `hide_client_button` (default `False`) - Whether to show the client button from the reference sidebar and modal
- `persist_auth` (default `False`) - Whether to persist authentication credentials in local storage

### Advanced

- `scalar_js_url` (default `"https://cdn.jsdelivr.net/npm/@scalar/api-reference"`)
- `scalar_proxy_url` (default `None`)
- `scalar_favicon_url` (default `"https://django-ninja.dev/img/favicon.png"`)
- `integration` (default `None`)
- `theme` (default `Theme.DEFAULT`) - Options: [Theme](#Theme)
- `agent` (default `None`) - Agent Scalar configuration (e.g. `AgentConfig(disabled=True)` to disable globally). Same shape as per-source agent: optional `key`, optional `disabled`.

### Agent Scalar

Agent Scalar adds an AI chat interface to your API reference. Users can ask questions about your API and get contextual answers based on your OpenAPI document.

- Enabled by default on `http://localhost` for testing (10 free messages)
- Does not appear in production unless a key is provided
- Requires an [Agent Scalar key](../guides/agent/key.md) for production deployments
- Your OpenAPI document is uploaded on first message

To enable Agent Scalar in production, pass your key. With a single document (no sources):

```python
from scalar_ninja import AgentConfig, ScalarConfig, ScalarViewer

api = NinjaAPI(
    docs=ScalarViewer(ScalarConfig(
        openapi_url="/api/openapi.json",
        agent=AgentConfig(key="put-your-agent-scalar-key-here"),
    )),
)
```

With multiple sources, set the key per source:

```python
from scalar_ninja import AgentConfig, OpenAPISource, ScalarConfig, ScalarViewer

api = NinjaAPI(
    docs=ScalarViewer(ScalarConfig(
        sources=[
            OpenAPISource(
                url="https://example.com/openapi.json",
                agent=AgentConfig(key="put-your-agent-scalar-key-here"),
            ),
        ],
    )),
)
```

To disable Agent Scalar entirely:

```python
from scalar_ninja import AgentConfig, ScalarConfig, ScalarViewer

api = NinjaAPI(
    docs=ScalarViewer(ScalarConfig(agent=AgentConfig(disabled=True))),
)
```

### DocumentDownloadType

```python
from scalar_ninja import DocumentDownloadType

# Available options:
DocumentDownloadType.JSON    # Download as JSON only
DocumentDownloadType.YAML    # Download as YAML only
DocumentDownloadType.BOTH    # Download as both JSON and YAML
DocumentDownloadType.NONE    # Hide download button
```

### Layout

```python
from scalar_ninja import Layout

# Available options:
Layout.MODERN    # Modern layout
Layout.CLASSIC   # Classic layout
```

### SearchHotKey

```python
from scalar_ninja import SearchHotKey

# All letters from A to Z, e.g.:
SearchHotKey.K   # Use 'K' key for 'Cmd+K' (Mac) / 'Ctrl+K' (Windows/Linux)
```

### Theme

```python
from scalar_ninja import Theme

# Available options:
Theme.DEFAULT   # Default theme
Theme.NONE      # No theme
