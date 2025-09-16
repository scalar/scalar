# Scalar API Reference for Rust

A Rust crate for embedding Scalar API documentation in web applications.

## Features

- Embed Scalar's HTML/JS assets directly into your Rust binary
- Framework-agnostic core with optional integrations for popular web frameworks
- Simple configuration injection via JSON
- Static asset serving support

## Supported Frameworks

- **Axum** (feature: `axum`)
- **Actix-web** (feature: `actix-web`)
- **Warp** (feature: `warp`)

## Basic Usage

Add to your `Cargo.toml`:

```toml
[dependencies]
scalar-api-reference = "0.1.0"
serde_json = "1.0"
```

### Core API

```rust
use scalar_rust::{scalar_html, get_asset};
use serde_json::json;

// Generate HTML with configuration
let config = json!({
    "url": "/openapi.json",
    "theme": "purple"
});

let html = scalar_html(&config);

// Get static assets
if let Some(js_content) = get_asset("scalar.js") {
    // Serve the JavaScript file
}
```

## Framework Examples

### Axum

```toml
[dependencies]
scalar-api-reference = { version = "0.1.0", features = ["axum"] }
axum = "0.7"
serde_json = "1.0"
```

```rust
use axum::{routing::get, Router, response::Html};
use scalar_rust::axum::scalar_response;
use serde_json::json;

async fn scalar() -> Html<String> {
    let config = json!({
        "url": "/openapi.json"
    });
    scalar_response(&config)
}

let app = Router::new()
    .route("/scalar", get(scalar));
```

### Actix-web

```toml
[dependencies]
scalar-api-reference = { version = "0.1.0", features = ["actix-web"] }
actix-web = "4.0"
serde_json = "1.0"
```

```rust
use actix_web::{web, App, HttpServer, Result};
use scalar_rust::actix_web::scalar_response;
use serde_json::json;

async fn scalar() -> Result<actix_web::HttpResponse> {
    let config = json!({
        "url": "/openapi.json"
    });
    Ok(scalar_response(&config))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/scalar", web::get().to(scalar))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

### Warp

```toml
[dependencies]
scalar-api-reference = { version = "0.1.0", features = ["warp"] }
warp = "0.3"
serde_json = "1.0"
```

```rust
use warp::Filter;
use scalar_rust::warp::scalar_reply;
use serde_json::json;

#[tokio::main]
async fn main() {
    let scalar = warp::path("scalar")
        .map(|| {
            let config = json!({
                "url": "/openapi.json"
            });
            scalar_reply(&config)
        });

    warp::serve(scalar)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
```

## Static Asset Serving

If you need to serve additional static assets (CSS, JS, images), use the asset functions:

```rust
use scalar_rust::get_asset_with_mime;

// In your route handler
if let Some((mime_type, content)) = get_asset_with_mime("scalar.js") {
    // Return response with proper MIME type and content
}
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
