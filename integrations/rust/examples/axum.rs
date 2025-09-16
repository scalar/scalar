use axum::{Router};
use scalar_api_reference::axum::router;
use serde_json::json;

#[tokio::main]
async fn main() {
    let config = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "purple",
    });

    let app = Router::new()
        .merge(router("/scalar", &config));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://localhost:3000/scalar");
    axum::serve(listener, app).await.unwrap();
}
