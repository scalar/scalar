# Scalar API Reference Plugin for FastAPI

![Screenshot of the FastAPI integration](/screenshots/fastapi.png)

## Installation

```bash
pip install scalar-fastapi
```

## Usage

FastAPI makes it super easy to enable Scalar with their out of the box OpenAPI support.

### Basic Usage

```python
from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        # Your OpenAPI document
        openapi_url=app.openapi_url,
        # Avoid CORS issues (optional)
        scalar_proxy_url="https://proxy.scalar.com",
    )
```

### Multiple OpenAPI Sources

You can now display multiple OpenAPI documents in a single Scalar instance:

```python
from scalar_fastapi import get_scalar_api_reference, OpenAPISource

@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        sources=[
            OpenAPISource(
                title="User API",
                url="/openapi.json",
                default=True
            ),
            OpenAPISource(
                title="Admin API",
                url="/admin/openapi.json"
            ),
            OpenAPISource(
                title="External API",
                content='{"openapi": "3.0.0", ...}'
            )
        ],
        title="My API Documentation"
    )
```

### Direct OpenAPI Content

You can pass OpenAPI content directly as a string or dictionary:

```python
@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        content='{"openapi": "3.0.0", "info": {"title": "My API"}}',
        title="My API"
    )
```

## Configuration

Currently available [configuration options](https://guides.scalar.com/scalar/scalar-api-references/configuration) are listed below.

### Core Configuration

- `openapi_url` (default `None`) - The OpenAPI URL that Scalar should load. If `content` or `sources` are provided, this parameter is ignored.
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

### Display Options

- `layout` (default `Layout.MODERN`)
- `show_sidebar` (default `True`)
- `hide_models` (default `False`)
- `hide_search` (default `False`) - Whether to show the sidebar search bar
- `hide_test_request_button` (default `False`) - Whether to show the "Test Request" button
- `hide_download_button` (default `False`) - **Deprecated**: Use `document_download_type` instead
- `document_download_type` (default `DocumentDownloadType.BOTH`) - Sets the file type of the document to download. Options: `JSON`, `YAML`, `BOTH`, `NONE`

### DocumentDownloadType

```python
from scalar_fastapi import DocumentDownloadType

# Available options:
DocumentDownloadType.JSON    # Download as JSON only
DocumentDownloadType.YAML    # Download as YAML only
DocumentDownloadType.BOTH    # Download as both JSON and YAML
DocumentDownloadType.NONE    # Hide download button
```

### Theme and Appearance

- `dark_mode` (default `True`)
- `force_dark_mode_state` (default `None`) - Force dark mode state to always be this state. Can be 'dark' or 'light'
- `hide_dark_mode_toggle` (default `False`) - Whether to show the dark mode toggle
- `with_default_fonts` (default `True`) - Whether to use default fonts (Inter and JetBrains Mono)
- `custom_css` (default `""`) - Custom CSS string to apply to the API reference

### Search and Navigation

- `search_hot_key` (default `SearchHotKey.K`)
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
- `integration` (default `None`)
- `theme` (default `Theme.DEFAULT`)

### Layout

```python
from scalar_fastapi import Layout

# Available options:
Layout.MODERN    # Modern layout
Layout.CLASSIC   # Classic layout
```

### SearchHotKey

```python
from scalar_fastapi import SearchHotKey

# Available options:
SearchHotKey.K    # Use 'K' key
SearchHotKey.CMD_K # Use 'Cmd+K' (Mac) / 'Ctrl+K' (Windows/Linux)
SearchHotKey.NONE # Disable hotkey
```

### Theme

```python
from scalar_fastapi import Theme

# Available options:
Theme.DEFAULT # Default theme
Theme.NONE    # No theme
