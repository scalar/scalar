# Scalar API Reference for Actix-web

Use our official Rust crate [`scalar_api_reference`](https://crates.io/crates/scalar_api_reference) to render the API
reference with Scalar in your Actix-web application.

## Installation

Add the required dependencies to your `Cargo.toml`:

```toml
[dependencies]
scalar_api_reference = { version = "0.1.0", features = ["actix-web"] }
actix-web = "4.0"
serde_json = "1.0"
```

## Usage

```rust
use actix_web::{App, HttpServer};
use scalar_api_reference::actix_web::config;
use serde_json::json;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let configuration = json!({
        // URL to your OpenAPI document
        // Learn more about the configuration: https://guides.scalar.com/scalar/scalar-api-references/configuration
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
    });

    println!("Server running on http://localhost:8080/scalar");

    HttpServer::new(move || {
        App::new()
            .configure(config("/scalar", &configuration))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```
