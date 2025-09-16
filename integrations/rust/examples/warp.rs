use scalar_api_reference::warp::routes;
use serde_json::json;

#[tokio::main]
async fn main() {
    let config = json!({
        "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
        "theme": "kepler",
        "layout": "classic"
    });

    let scalar = routes("scalar", &config);

    println!("Server running on http://localhost:3031/scalar");
    warp::serve(scalar)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
