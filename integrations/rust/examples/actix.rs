use actix_web::{web, App, HttpServer, Result};
use scalar_rust::actix_web::scalar_response;
use serde_json::json;

async fn scalar() -> Result<actix_web::HttpResponse> {
    let config = json!({
        "url": "/openapi.json",
        "theme": "kepler",
    });
    Ok(scalar_response(&config))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Server running on http://localhost:8080/scalar");

    HttpServer::new(|| {
        App::new()
            .route("/scalar", web::get().to(scalar))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
