use rust_embed::RustEmbed;
use serde_json::Value;

/// Embedded UI assets
#[derive(RustEmbed)]
#[folder = "ui/"]
struct Assets;

/// Get a static asset by path
pub fn get_asset(path: &str) -> Option<Vec<u8>> {
    Assets::get(path).map(|d| d.data.into())
}

/// Get a static asset with MIME type information
pub fn get_asset_with_mime(path: &str) -> Option<(String, Vec<u8>)> {
    let asset = Assets::get(path)?;
    let mime_type = get_mime_type(path);
    Some((mime_type, asset.data.into()))
}

/// Determine MIME type based on file extension
pub fn get_mime_type(path: &str) -> String {
    match path.split('.').last() {
        Some("html") => "text/html".to_string(),
        Some("js") => "application/javascript".to_string(),
        Some("css") => "text/css".to_string(),
        Some("json") => "application/json".to_string(),
        Some("png") => "image/png".to_string(),
        Some("svg") => "image/svg+xml".to_string(),
        Some("ico") => "image/x-icon".to_string(),
        _ => "application/octet-stream".to_string(),
    }
}

/// Render Scalar HTML with embedded configuration
pub fn render_scalar(config_json: &str) -> String {
    let html_template = include_str!("../ui/index.html");
    html_template.replace("__CONFIGURATION__", config_json)
}

/// Return the Scalar HTML with embedded config
pub fn scalar_html(config: &Value) -> String {
    render_scalar(&config.to_string())
}

/// Return the Scalar HTML with embedded config from a JSON string
pub fn scalar_html_from_json(config_json: &str) -> Result<String, serde_json::Error> {
    let config: Value = serde_json::from_str(config_json)?;
    Ok(scalar_html(&config))
}

#[cfg(feature = "axum")]
pub mod axum {
    use axum::response::Html;
    use serde_json::Value;
    use super::scalar_html;

    /// Create an Axum HTML response with Scalar documentation
    pub fn scalar_response(config: &Value) -> Html<String> {
        Html(scalar_html(config))
    }

    /// Create an Axum HTML response from JSON string
    pub fn scalar_response_from_json(config_json: &str) -> Result<Html<String>, serde_json::Error> {
        let config: Value = serde_json::from_str(config_json)?;
        Ok(scalar_response(&config))
    }
}

#[cfg(feature = "actix-web")]
pub mod actix_web {
    use actix_web::{HttpResponse, http::header::ContentType};
    use serde_json::Value;
    use super::scalar_html;

    /// Create an Actix-web HttpResponse with Scalar documentation
    pub fn scalar_response(config: &Value) -> HttpResponse {
        HttpResponse::Ok()
            .content_type(ContentType::html())
            .body(scalar_html(config))
    }

    /// Create an Actix-web HttpResponse from JSON string
    pub fn scalar_response_from_json(config_json: &str) -> Result<HttpResponse, serde_json::Error> {
        let config: Value = serde_json::from_str(config_json)?;
        Ok(scalar_response(&config))
    }
}

#[cfg(feature = "warp")]
pub mod warp {
    use warp::reply::html;
    use serde_json::Value;
    use super::scalar_html;

    /// Create a Warp HTML reply with Scalar documentation
    pub fn scalar_reply(config: &Value) -> impl warp::Reply {
        html(scalar_html(config))
    }

    /// Create a Warp HTML reply from JSON string
    pub fn scalar_reply_from_json(config_json: &str) -> Result<impl warp::Reply, serde_json::Error> {
        let config: Value = serde_json::from_str(config_json)?;
        Ok(scalar_reply(&config))
    }
}

#[cfg(test)]
mod tests {
    use crate::{scalar_html, scalar_html_from_json, get_asset, get_asset_with_mime, get_mime_type};
    use serde_json::json;

    #[test]
    fn test_scalar_html_generation() {
        let config = json!({
            "url": "/openapi.json",
            "theme": "purple"
        });

        let html = scalar_html(&config);

        // Check that the HTML contains our config
        assert!(html.contains("/openapi.json"));
        assert!(html.contains("purple"));
        assert!(html.contains("<html"));
        assert!(html.contains("</html>"));
    }

    #[test]
    fn test_scalar_html_from_json() {
        let config_json = r#"{"url": "/api.json", "theme": "blue"}"#;

        let html = scalar_html_from_json(config_json).unwrap();

        assert!(html.contains("/api.json"));
        assert!(html.contains("blue"));
    }

    #[test]
    fn test_get_asset() {
        // Test that we can get the HTML template
        let html_asset = get_asset("index.html");
        assert!(html_asset.is_some());

        // Test that we can get the JS file
        let js_asset = get_asset("scalar.js");
        assert!(js_asset.is_some());

        // Test non-existent asset
        let non_existent = get_asset("non-existent.txt");
        assert!(non_existent.is_none());
    }

    #[test]
    fn test_get_asset_with_mime() {
        let (mime_type, content) = get_asset_with_mime("index.html").unwrap();
        assert_eq!(mime_type, "text/html");
        assert!(!content.is_empty());

        let (mime_type, content) = get_asset_with_mime("scalar.js").unwrap();
        assert_eq!(mime_type, "application/javascript");
        assert!(!content.is_empty());
    }

    #[test]
    fn test_mime_type_detection() {
        assert_eq!(get_mime_type("index.html"), "text/html");
        assert_eq!(get_mime_type("style.css"), "text/css");
        assert_eq!(get_mime_type("script.js"), "application/javascript");
        assert_eq!(get_mime_type("data.json"), "application/json");
        assert_eq!(get_mime_type("image.png"), "image/png");
        assert_eq!(get_mime_type("icon.svg"), "image/svg+xml");
        assert_eq!(get_mime_type("favicon.ico"), "image/x-icon");
        assert_eq!(get_mime_type("unknown.xyz"), "application/octet-stream");
    }
}
