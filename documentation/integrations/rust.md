# Rust

There’s [a wonderful package to generate OpenAPI files for Rust](https://github.com/tamasfe/aide) already.
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
