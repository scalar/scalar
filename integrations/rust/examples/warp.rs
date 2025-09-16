use warp::Filter;
use scalar_api_reference::{warp::scalar_reply, get_asset_with_mime};
use serde_json::json;

#[tokio::main]
async fn main() {
    // Scalar documentation using bundled JS file
    let scalar = warp::path("scalar")
        .map(|| {
            let config = json!({
                "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json",
                "theme": "kepler",
                "layout": "classic"
            });
            // Using bundled JS file
            scalar_reply(&config, Some("/scalar.js"))
        });

    // Serve the bundled JS file
    let scalar_js = warp::path("scalar.js")
        .and_then(|| async {
            match get_asset_with_mime("scalar.js") {
                Some((mime_type, content)) => {
                    Ok::<_, warp::Rejection>(warp::reply::with_header(
                        warp::reply::with_status(content, warp::http::StatusCode::OK),
                        "content-type",
                        mime_type,
                    ))
                }
                None => {
                    Ok::<_, warp::Rejection>(warp::reply::with_header(
                        warp::reply::with_status(Vec::<u8>::new(), warp::http::StatusCode::NOT_FOUND),
                        "content-type",
                        "text/plain",
                    ))
                }
            }
        });

    let routes = scalar.or(scalar_js);

    println!("Server running on http://localhost:3030/scalar");
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
