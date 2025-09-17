# Scalar API Reference for Axum

Use our official Rust crate [`scalar_api_reference`](https://crates.io/crates/scalar_api_reference) to render the API
reference with Scalar in your Axum web application.

## Installation

Add the required dependencies to your `Cargo.toml`:

```toml
[dependencies]
scalar_api_reference = { version = "0.1.0", features = ["axum"] }
axum = "0.7"
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
```

## Usage

```rust
use axum::{Router};
use scalar_api_reference::axum::router;
use serde_json::json;

#[tokio::main]
async fn main() {
    let configuration = json!({
        // URL to your OpenAPI document
        // Learn more about the configuration: https://guides.scalar.com/scalar/scalar-api-references/configuration
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
    });

    let app = Router::new()
        .merge(router("/scalar", &configuration));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://localhost:3000/scalar");
    axum::serve(listener, app).await.unwrap();
}
```

### Separate Routes

If you need more control over routing, you can use separate routes:

```rust
use scalar_api_reference::axum::{routes};

let (scalar_route, asset_route) = routes("/scalar", &config);
let app = Router::new()
    .merge(scalar_route)
    .merge(asset_route);
```

### Individual Response Functions

You can also create individual responses without automatic routing:

```rust
use scalar_api_reference::axum::scalar_response;

// Create a response handler
async fn scalar_handler() -> Html<String> {
    let configuration = json!({
        "url": "/openapi.json",
    });

    scalar_response(&configuration, Some("/scalar/scalar.js"))
}
```
