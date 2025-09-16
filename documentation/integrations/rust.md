# Scalar API Reference for Rust

A Rust crate for embedding Scalar API documentation in web applications.

## Features

- Embed Scalar's HTML/JS assets directly into your Rust binary
- Framework-agnostic core with optional integrations for popular web frameworks
- Simple configuration injection via JSON

## Supported Frameworks

- **Axum** (feature: `axum`)
- **Actix-web** (feature: `actix-web`)
- **Warp** (feature: `warp`)

## Basic Usage

Add to your `Cargo.toml`:

```toml
[dependencies]
scalar_api_reference = "0.1.0"
serde_json = "1.0"
```

### Core API

```rust
use scalar_api_reference::{scalar_html, scalar_html_default, get_asset};
use serde_json::json;

// Generate HTML with configuration using CDN (recommended)
let config = json!({
    "url": "/openapi.json",
    "theme": "purple"
});

// Using CDN fallback (recommended for most use cases)
let html1 = scalar_html(&config, None);
// or use the convenience function
let html2 = scalar_html_default(&config);

// Using custom JS bundle URL
let html3 = scalar_html(&config, Some("/custom-scalar.js"));

// Get static assets
if let Some(js_content) = get_asset("scalar.js") {
    // Serve the JavaScript file
}
```

## Framework Examples

### Axum

```toml
[dependencies]
scalar_api_reference = { version = "0.1.0", features = ["axum"] }
axum = "0.7"
serde_json = "1.0"
```

```rust
use axum::Router;
use scalar_api_reference::axum::router;
use serde_json::json;

#[tokio::main]
async fn main() {
    let config = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "purple",
    });

    let app = Router::new()
        .merge(router("/docs", &config));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://localhost:3000/docs");
    axum::serve(listener, app).await.unwrap();
}
```

### Actix-web

```toml
[dependencies]
scalar_api_reference = { version = "0.1.0", features = ["actix-web"] }
actix-web = "4.0"
serde_json = "1.0"
```

```rust
use actix_web::{App, HttpServer};
use scalar_api_reference::actix_web::config;
use serde_json::json;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config_json = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "kepler",
    });

    println!("Server running on http://localhost:8080/docs");

    HttpServer::new(move || {
        App::new()
            .configure(config("/docs", &config_json))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

### Warp

```toml
[dependencies]
scalar_api_reference = { version = "0.1.0", features = ["warp"] }
warp = "0.3"
serde_json = "1.0"
```

```rust
use scalar_api_reference::warp::routes;
use serde_json::json;

#[tokio::main]
async fn main() {
    let config = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "kepler",
        "layout": "classic"
    });

    let scalar_routes = routes("docs", &config);

    println!("Server running on http://localhost:3030/docs");
    warp::serve(scalar_routes)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
```

**Note:** For Warp, the path should not include leading slashes (e.g., use `"docs"` instead of `"/docs"`). This is due to Warp's path handling requirements. The Warp integration supports common paths like `"scalar"`, `"docs"`, and `"api"` with dynamic JS asset serving. Documentation is served at `/docs` and JS is served at `/docs/scalar.js`.

## Simplified API

The examples above use the new simplified API that automatically handles both serving the Scalar HTML documentation and its bundled JavaScript asset. This eliminates the need to manually set up routes for both the documentation and the JS file.

### Available Functions

- **Axum**: `scalar_api_reference::axum::router(path, config)` - Returns a complete Router
- **Actix-web**: `scalar_api_reference::actix_web::config(path, config)` - Returns a configuration function
- **Warp**: `scalar_api_reference::warp::routes(path, config)` - Returns a complete Filter

All functions automatically:
- Serve the Scalar HTML documentation at the specified path
- Serve the bundled JavaScript at `{path}/scalar.js`
- Handle proper MIME types and headers
- Use the bundled JS file (no CDN dependency)

**Warp Note:** The Warp integration supports common paths (`"scalar"`, `"docs"`, `"api"`) with dynamic JS asset serving. For other paths, it falls back to serving JS at `scalar/scalar.js`.

## Static Asset Serving

If you need to serve additional static assets (CSS, JS, images), use the asset functions:

```rust
use scalar_api_reference::get_asset_with_mime;

// In your route handler
if let Some((mime_type, content)) = get_asset_with_mime("scalar.js") {
    // Return response with proper MIME type and content
}
```

## JS Bundle URL Options

The library supports two ways to load the Scalar JavaScript bundle:

### CDN (Recommended)
By default, the library uses the CDN-hosted version of Scalar:
```rust
// Uses https://cdn.jsdelivr.net/npm/@scalar/api-reference
let html = scalar_html(&config, None);
```

### Custom Bundle URL
You can provide your own JS bundle URL:
```rust
// Uses your custom URL
let html = scalar_html(&config, Some("/path/to/scalar.js"));
```

### Convenience Functions
For the simplest usage, use the convenience functions that default to CDN:
```rust
// Uses CDN automatically
let html = scalar_html_default(&config);
```

## Configuration

The configuration object supports all standard Scalar options. Common options include:

- `url`: Path to your OpenAPI document
- `layout`: Layout style ("classic" or "modern")
- `theme`: [Theme name (e.g., "purple", "blue", "green")](https://guides.scalar.com/scalar/scalar-api-references/themes)
- `darkMode`: Enable dark mode

See the documentation for [the complete configuration reference](https://guides.scalar.com/scalar/scalar-api-references/configuration).

## Community integrations

### Utopia

For the wonderful Utoipa, there's a Utoipa-scalar crate:

https://github.com/juhaku/utoipa/tree/master/utoipa-scalar

### Aide

There's [a wonderful package to generate OpenAPI files for Rust](https://github.com/tamasfe/aide) (called Aide) and it comes with Scalar.

Set the `api_route` to use `Scalar` to get started:

```rust
use aide::{
    axum::{
        routing::{get_with},
        ApiRouter, IntoApiResponse,
    },
    openapi::OpenApi,
    scalar::Scalar,
};

// …

let router: ApiRouter = ApiRouter::new()
    .api_route_with(
        "/",
        get_with(
            Scalar::new("/docs/private/api.json")
                .with_title("Aide Axum")
                .axum_handler(),
            |op| op.description("This documentation page."),
        ),
        |p| p.security_requirement("ApiKey"),
    )

// …
```

If you want to use Scalar with Actix or any other web framework, you can do that too with the crate [scalar-doc](https://crates.io/crates/scalar-doc).

To get started with Actix, first install the crate and activate `actix` feature :

```bash
cargo add scalar-doc -F actix
```

You can use the following code

```rust
use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use scalar_doc::scalar_actix::ActixDocumentation;

#[get("/")]
async fn doc() -> impl Responder {
    ActixDocumentation::new("Api Documentation title", "/openapi")
        .theme(scalar_doc::Theme::Kepler)
        .service()
}

#[get("/openapi")]
async fn openapi() -> impl Responder {
    let open = include_str!("openapi.json");
    HttpResponse::Ok().body(open)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(doc).service(openapi))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
```
