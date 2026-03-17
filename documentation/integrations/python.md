# API Reference for Python

We provide official Python packages for rendering Scalar API documentation. A shared core library (`scalar-api-reference`) provides the configuration models and rendering, while framework-specific packages (FastAPI, Django Ninja) add tight integration with each framework.

## Features

* Pydantic v2 configuration with full type safety
* Enums for themes, layouts, search hotkeys, and download types
* Multiple OpenAPI source support
* Agent (AI chat) integration
* Auto-generated from the TypeScript source of truth

## Integrations

* [FastAPI](fastapi.md) — official
* [Django Ninja](django-ninja.md) — official
* [Django](django.md) — community
* [Flask](flask.md) — community

## Installation

```bash
pip install scalar-api-reference
```

## Usage

```python
from scalar_api_reference import ScalarConfig, render_html

config = ScalarConfig(
    openapi_url="/openapi.json",
    theme="purple",
)

html = render_html(config)
```

## Configuration

`ScalarConfig` is a Pydantic v2 model with the following fields, grouped by category:

**Core**
* `openapi_url` — URL to your OpenAPI document
* `content` — inline OpenAPI document (string or dict)
* `sources` — list of `OpenAPISource` for multiple documents
* `title` — HTML `<title>` content (defaults to `"Scalar"`)

**Display**
* `show_sidebar` — show the sidebar (default: `True`)
* `hide_models` — hide all schema models (default: `False`)
* `hide_client_button` — hide the client button (default: `False`)
* `hide_test_request_button` — hide the "Test Request" button (default: `False`)
* `hide_search` — hide the sidebar search bar (default: `False`)
* `default_open_all_tags` — open all tags by default (default: `False`)
* `expand_all_model_sections` — expand model sections by default (default: `False`)
* `expand_all_responses` — expand response sections by default (default: `False`)
* `order_required_properties_first` — show required properties first (default: `True`)
* `show_developer_tools` — `"always"`, `"localhost"`, or `"never"` (default: `"localhost"`)

**Theme**
* `theme` — a `Theme` enum value (default: `Theme.DEFAULT`)
* `dark_mode` — enable dark mode initially (default: `None`)
* `force_dark_mode_state` — lock to `"dark"` or `"light"`
* `hide_dark_mode_toggle` — hide the toggle (default: `False`)
* `custom_css` — custom CSS string
* `with_default_fonts` — use Inter and JetBrains Mono (default: `True`)

**Search / Navigation**
* `search_hot_key` — a `SearchHotKey` enum value (default: `SearchHotKey.K`)
* `layout` — a `Layout` enum value (default: `Layout.MODERN`)
* `document_download_type` — a `DocumentDownloadType` enum value (default: `DocumentDownloadType.BOTH`)

**Server**
* `base_server_url` — prefix for relative server URLs
* `servers` — list of OpenAPI Server Objects
* `scalar_proxy_url` — URL for the Scalar proxy

**Auth**
* `authentication` — dict of authentication information
* `persist_auth` — persist credentials in local storage (default: `False`)

**Advanced**
* `scalar_js_url` — URL to the Scalar JavaScript bundle (defaults to CDN)
* `scalar_favicon_url` — favicon URL
* `integration` — integration type identifier
* `hidden_clients` — hide specific HTTP clients
* `overrides` — dict of additional config overrides
* `telemetry` — enable usage telemetry (default: `True`)

See the [full configuration reference](../configuration.md) for details.

## Models

### OpenAPISource

Use `OpenAPISource` when rendering multiple OpenAPI documents:

```python
from scalar_api_reference import ScalarConfig, OpenAPISource, render_html

config = ScalarConfig(
    sources=[
        OpenAPISource(
            title="Pet Store",
            url="https://petstore3.swagger.io/api/v3/openapi.json",
            default=True,
        ),
        OpenAPISource(
            title="Internal API",
            url="/openapi.json",
        ),
    ]
)

html = render_html(config)
```

Fields: `title`, `slug`, `url`, `content`, `default`, `agent`.

### AgentConfig

Configure the Agent (AI chat) per source or globally:

```python
from scalar_api_reference import AgentConfig

# Enable with a key
agent = AgentConfig(key="your-agent-scalar-key")

# Disable entirely
agent = AgentConfig(disabled=True)
```

## Enums

### Theme

Available values: `DEFAULT`, `ALTERNATE`, `MOON`, `PURPLE`, `SOLARIZED`, `BLUE_PLANET`, `DEEP_SPACE`, `SATURN`, `KEPLER`, `ELYSIAJS`, `FASTIFY`, `MARS`, `LASERWAVE`, `NONE`.

```python
from scalar_api_reference import ScalarConfig, Theme

config = ScalarConfig(openapi_url="/openapi.json", theme=Theme.PURPLE)
```

### Layout

Available values: `MODERN`, `CLASSIC`.

### SearchHotKey

Any single letter `A`–`Z`. Default is `K` (Cmd+K / Ctrl+K).

### DocumentDownloadType

Available values: `YAML`, `JSON`, `BOTH`, `DIRECT`, `NONE`.

## Agent

Agent adds an AI chat interface to your API reference. It is enabled by default on localhost with a limited free tier (10 messages). For production, you need an [Agent key](../guides/agent/key.md).

To set an Agent API key:

```python
from scalar_api_reference import ScalarConfig, AgentConfig, render_html

config = ScalarConfig(
    openapi_url="/openapi.json",
    agent=AgentConfig(key="your-agent-scalar-key"),
)

html = render_html(config)
```

To disable Agent:

```python
config = ScalarConfig(
    openapi_url="/openapi.json",
    agent=AgentConfig(disabled=True),
)
```

With multiple sources, you can set an agent key per document:

```python
from scalar_api_reference import ScalarConfig, OpenAPISource, AgentConfig, render_html

config = ScalarConfig(
    sources=[
        OpenAPISource(
            url="https://api.example.com/openapi/v1.json",
            agent=AgentConfig(key="your-key-for-api-v1"),
        ),
        OpenAPISource(
            url="https://api.example.com/openapi/v2.json",
        ),
    ]
)

html = render_html(config)
```

For more details, see [Agent configuration](../configuration.md#agent) and [How to get an Agent key](../guides/agent/key.md).
