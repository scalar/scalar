# Scalar API Reference for Rust

There's [a wonderful package to generate OpenAPI files for Rust](https://github.com/tamasfe/aide) already.
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
