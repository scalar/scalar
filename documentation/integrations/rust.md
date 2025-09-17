# Scalar API Reference for Rust

We provide an official Rust crate for rendering the Scalar API documentation in web applications.

## Features

* Embed Scalar's HTML/JS assets directly into your Rust binary
* Framework-agnostic core with optional integrations for popular web frameworks
* Simple configuration injection via JSON
* Automatic asset serving with proper MIME types

## Integrations

* [Axum (feature: `axum`)](https://guides.scalar.com/scalar/scalar-api-references/integrations/rust/axum)
* [Actix-web (feature: `actix-web`)](https://guides.scalar.com/scalar/scalar-api-references/integrations/rust/actix-web)
* [Warp (feature: `warp`)](https://guides.scalar.com/scalar/scalar-api-references/integrations/rust/warp)

There are a few community integrations, too:

* [utoipa-scalar](https://github.com/juhaku/utoipa/tree/master/utoipa-scalar)
* [Aide](https://github.com/tamasfe/aide)
* [scalar-doc](https://crates.io/crates/scalar-doc) (framework-agnostic)

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
scalar_api_reference = "0.1.0"
serde_json = "1.0"
```

## Usage

```rust
use scalar_api_reference::{scalar_html, scalar_html_default, get_asset, get_asset_with_mime};
use serde_json::json;

// Generate HTML with configuration using CDN
let config = json!({
    "url": "/openapi.json",
    "theme": "purple"
});

// Using CDN fallback
let html1 = scalar_html(&config, None);
// or use the convenience function
let html2 = scalar_html_default(&config);

// Using custom JS bundle URL
let html3 = scalar_html(&config, Some("/custom-scalar.js"));

// Get static assets
if let Some(js_content) = get_asset("scalar.js") {
    // Serve the JavaScript file
}

// Get static assets with MIME type
if let Some((mime_type, content)) = get_asset_with_mime("scalar.js") {
    // Serve the JavaScript file with proper MIME type
}
```

### Static Asset Serving

If you need to serve additional static assets (CSS, JS, images), use the asset functions:

```rust
use scalar_api_reference::get_asset_with_mime;

// In your route handler
if let Some((mime_type, content)) = get_asset_with_mime("scalar.js") {
    // Return response with proper MIME type and content
}
```

### JS Bundle URL Options

The library supports two ways to load the Scalar JavaScript bundle:

#### CDN

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

* `url`: Path to your OpenAPI document
* `layout`: Layout style ("classic" or "modern")
* `theme`: [Theme name (e.g., "purple", "blue", "green")](https://guides.scalar.com/scalar/scalar-api-references/themes)
* `darkMode`: Enable dark mode

See the documentation for [the complete configuration reference](https://guides.scalar.com/scalar/scalar-api-references/configuration).

