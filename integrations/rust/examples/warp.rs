use warp::Filter;
use scalar_api_reference::warp::scalar_reply;
use serde_json::json;

#[tokio::main]
async fn main() {
    let scalar = warp::path("scalar")
        .map(|| {
            let config = json!({
                "url": "/openapi.json",
                "theme": "kepler",
                "layout": "classic"
            });
            // Using CDN (recommended)
            scalar_reply(&config, None)
        });

    println!("Server running on http://localhost:3030/scalar");
    warp::serve(scalar)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
