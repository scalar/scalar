use actix_web::{App, HttpServer};
use scalar_api_reference::actix_web::config;
use serde_json::json;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config_json = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "kepler",
    });

    println!("Server running on http://localhost:8080/scalar");

    HttpServer::new(move || App::new().configure(config("/scalar", &config_json)))
        .bind("127.0.0.1:8080")?
        .run()
        .await
}
