use actix_web::{web, App, HttpServer, Result, HttpResponse, HttpRequest};
use scalar_api_reference::{actix_web::scalar_response, get_asset_with_mime};
use serde_json::json;

async fn scalar() -> Result<actix_web::HttpResponse> {
    let config = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "kepler",
    });
    // Using bundled JS file
    Ok(scalar_response(&config, Some("/scalar.js")))
}

async fn serve_scalar_js(_req: HttpRequest) -> Result<HttpResponse> {
    match get_asset_with_mime("scalar.js") {
        Some((mime_type, content)) => {
            Ok(HttpResponse::Ok()
                .content_type(mime_type)
                .body(content))
        }
        None => {
            Ok(HttpResponse::NotFound().body("Not found"))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Server running on http://localhost:8080/scalar");

    HttpServer::new(|| {
        App::new()
            .route("/scalar", web::get().to(scalar))
            .route("/scalar.js", web::get().to(serve_scalar_js))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
