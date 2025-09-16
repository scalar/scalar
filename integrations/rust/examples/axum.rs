use axum::{routing::get, Router, response::Html};
use scalar_rust::axum::scalar_response;
use serde_json::json;

async fn scalar() -> Html<String> {
    let config = json!({
        "url": "/openapi.json",
        "theme": "purple",
    });
    scalar_response(&config)
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/scalar", get(scalar));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://localhost:3000/scalar");
    axum::serve(listener, app).await.unwrap();
}
