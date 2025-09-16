use axum::{routing::get, Router, response::Html, response::Response, http::StatusCode, body::Body};
use axum::response::IntoResponse;
use scalar_api_reference::{axum::scalar_response, get_asset_with_mime};
use serde_json::json;

async fn scalar() -> Html<String> {
    let config = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "purple",
    });
    // Using bundled JS file
    scalar_response(&config, Some("/scalar.js"))
}

async fn serve_scalar_js() -> impl IntoResponse {
    match get_asset_with_mime("scalar.js") {
        Some((mime_type, content)) => {
            Response::builder()
                .status(StatusCode::OK)
                .header("content-type", mime_type)
                .body(Body::from(content))
                .unwrap()
        }
        None => {
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("Not found"))
                .unwrap()
        }
    }
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/scalar", get(scalar))
        .route("/scalar.js", get(serve_scalar_js));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://localhost:3000/scalar");
    axum::serve(listener, app).await.unwrap();
}
