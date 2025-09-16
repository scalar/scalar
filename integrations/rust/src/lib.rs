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

/// Render Scalar HTML with embedded configuration and optional JS bundle URL
pub fn render_scalar(config_json: &str, js_bundle_url: Option<&str>) -> String {
    let html_template = include_str!("../ui/index.html");
    let js_url = js_bundle_url.unwrap_or("https://cdn.jsdelivr.net/npm/@scalar/api-reference");
    html_template
        .replace("__CONFIGURATION__", config_json)
        .replace("__JS_BUNDLE_URL__", js_url)
}

/// Return the Scalar HTML with embedded config and optional JS bundle URL
pub fn scalar_html(config: &Value, js_bundle_url: Option<&str>) -> String {
    render_scalar(&config.to_string(), js_bundle_url)
}

/// Return the Scalar HTML with embedded config using CDN JS bundle URL
pub fn scalar_html_default(config: &Value) -> String {
    scalar_html(config, None)
}

/// Return the Scalar HTML with embedded config from a JSON string and optional JS bundle URL
pub fn scalar_html_from_json(config_json: &str, js_bundle_url: Option<&str>) -> Result<String, serde_json::Error> {
    let config: Value = serde_json::from_str(config_json)?;
    Ok(scalar_html(&config, js_bundle_url))
}

/// Return the Scalar HTML with embedded config from a JSON string using CDN JS bundle URL
pub fn scalar_html_from_json_default(config_json: &str) -> Result<String, serde_json::Error> {
    scalar_html_from_json(config_json, None)
}

#[cfg(feature = "axum")]
pub mod axum {
    use axum::response::Html;
    use serde_json::Value;
    use super::scalar_html;

    /// Create an Axum HTML response with Scalar documentation
    pub fn scalar_response(config: &Value, js_bundle_url: Option<&str>) -> Html<String> {
        Html(scalar_html(config, js_bundle_url))
    }

    /// Create an Axum HTML response from JSON string
    pub fn scalar_response_from_json(config_json: &str, js_bundle_url: Option<&str>) -> Result<Html<String>, serde_json::Error> {
        let config: Value = serde_json::from_str(config_json)?;
        Ok(scalar_response(&config, js_bundle_url))
    }
}

#[cfg(feature = "actix-web")]
pub mod actix_web {
    use actix_web::{HttpResponse, http::header::ContentType};
    use serde_json::Value;
    use super::scalar_html;

    /// Create an Actix-web HttpResponse with Scalar documentation
    pub fn scalar_response(config: &Value, js_bundle_url: Option<&str>) -> HttpResponse {
        HttpResponse::Ok()
            .content_type(ContentType::html())
            .body(scalar_html(config, js_bundle_url))
    }

    /// Create an Actix-web HttpResponse from JSON string
    pub fn scalar_response_from_json(config_json: &str, js_bundle_url: Option<&str>) -> Result<HttpResponse, serde_json::Error> {
        let config: Value = serde_json::from_str(config_json)?;
        Ok(scalar_response(&config, js_bundle_url))
    }
}

#[cfg(feature = "warp")]
pub mod warp {
    use warp::reply::html;
    use serde_json::Value;
    use super::scalar_html;

    /// Create a Warp HTML reply with Scalar documentation
    pub fn scalar_reply(config: &Value, js_bundle_url: Option<&str>) -> impl warp::Reply {
        html(scalar_html(config, js_bundle_url))
    }

    /// Create a Warp HTML reply from JSON string
    pub fn scalar_reply_from_json(config_json: &str, js_bundle_url: Option<&str>) -> Result<impl warp::Reply, serde_json::Error> {
        let config: Value = serde_json::from_str(config_json)?;
        Ok(scalar_reply(&config, js_bundle_url))
    }
}

#[cfg(test)]
mod tests {
    use crate::{scalar_html, scalar_html_from_json, scalar_html_default, scalar_html_from_json_default, get_asset, get_asset_with_mime, get_mime_type};
    use serde_json::json;

    #[test]
    fn test_scalar_html_generation() {
        let config = json!({
            "url": "/openapi.json",
            "theme": "purple"
        });

        // Test with custom JS bundle URL
        let html1 = scalar_html(&config, Some("/custom-scalar.js"));
        assert!(html1.contains("/openapi.json"));
        assert!(html1.contains("purple"));
        assert!(html1.contains("/custom-scalar.js"));
        assert!(html1.contains("<html"));
        assert!(html1.contains("</html>"));

        // Test with default CDN URL
        let html2 = scalar_html(&config, None);
        assert!(html2.contains("/openapi.json"));
        assert!(html2.contains("purple"));
        assert!(html2.contains("https://cdn.jsdelivr.net/npm/@scalar/api-reference"));
        assert!(html2.contains("<html"));
        assert!(html2.contains("</html>"));
    }

    #[test]
    fn test_scalar_html_from_json() {
        let config_json = r#"{"url": "/api.json", "theme": "blue"}"#;

        // Test with custom JS bundle URL
        let html1 = scalar_html_from_json(config_json, Some("/bundle.js")).unwrap();
        assert!(html1.contains("/api.json"));
        assert!(html1.contains("blue"));
        assert!(html1.contains("/bundle.js"));

        // Test with default CDN URL
        let html2 = scalar_html_from_json(config_json, None).unwrap();
        assert!(html2.contains("/api.json"));
        assert!(html2.contains("blue"));
        assert!(html2.contains("https://cdn.jsdelivr.net/npm/@scalar/api-reference"));
    }

    #[test]
    fn test_convenience_functions() {
        let config = json!({
            "url": "/test.json",
            "theme": "green"
        });

        // Test scalar_html_default
        let html1 = scalar_html_default(&config);
        assert!(html1.contains("/test.json"));
        assert!(html1.contains("green"));
        assert!(html1.contains("https://cdn.jsdelivr.net/npm/@scalar/api-reference"));

        // Test scalar_html_from_json_default
        let config_json = r#"{"url": "/test2.json", "theme": "red"}"#;
        let html2 = scalar_html_from_json_default(config_json).unwrap();
        assert!(html2.contains("/test2.json"));
        assert!(html2.contains("red"));
        assert!(html2.contains("https://cdn.jsdelivr.net/npm/@scalar/api-reference"));
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
