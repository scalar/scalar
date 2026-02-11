//! Type-safe configuration types for the Scalar API reference.
//!
//! Use these types to build configuration in code and serialize to `serde_json::Value`
//! for [`scalar_html`](crate::scalar_html) and framework-specific helpers.

use serde::Serialize;

/// Agent Scalar (AI chat) options.
///
/// Set a key for production use, or set `disabled: true` to turn off Agent Scalar.
/// On localhost, Agent Scalar is available with a limited free tier without a key.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentOptions {
    /// Agent Scalar API key. Required for production.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,

    /// When true, disables Agent Scalar for this scope (global or per-source).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}

impl AgentOptions {
    /// Create options that set the Agent Scalar API key.
    pub fn with_key(key: impl Into<String>) -> Self {
        Self {
            key: Some(key.into()),
            disabled: None,
        }
    }

    /// Create options that disable Agent Scalar.
    pub fn disabled() -> Self {
        Self {
            key: None,
            disabled: Some(true),
        }
    }
}

/// A single OpenAPI document source.
///
/// Used in the `sources` array for multi-document configuration.
/// Each source can have its own [`AgentOptions`] (e.g. API key).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Source {
    /// URL to the OpenAPI document.
    pub url: String,

    /// Optional Agent Scalar options for this document.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent: Option<AgentOptions>,
}

impl Source {
    /// Create a source with the given URL.
    pub fn new(url: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            agent: None,
        }
    }

    /// Set Agent Scalar options for this source.
    pub fn with_agent(mut self, agent: AgentOptions) -> Self {
        self.agent = Some(agent);
        self
    }
}
