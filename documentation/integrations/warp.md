# Scalar API Reference for Warp

Use our official Rust crate [`scalar_api_reference`](https://crates.io/crates/scalar_api_reference) to render the API
reference with Scalar in your Warp application.

## Installation

Add the required dependencies to your `Cargo.toml`:

```toml
[dependencies]
scalar_api_reference = { version = "0.1.0", features = ["warp"] }
warp = "0.3"
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
```

## Usage

```rust
use scalar_api_reference::warp::routes;
use serde_json::json;

#[tokio::main]
async fn main() {
    let configuration = json!({
        // URL to your OpenAPI document
        // Learn more about the configuration: https://guides.scalar.com/scalar/scalar-api-references/configuration
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
    });

    let scalar = routes("scalar", &configuration);

    println!("Server running on http://localhost:3030/scalar");
    warp::serve(scalar)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
```

**Note:** For Warp, the path should not include leading slashes (e.g., use `"scalar"` instead of `"/scalar"`). This is due to Warp's path handling requirements. The Warp integration supports common paths like `"scalar"`, `"docs"`, and `"api"` with dynamic JS asset serving. Documentation is served at `/scalar` and JS is served at `/scalar/scalar.js`.
