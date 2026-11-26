package com.scalar.maven.core.config;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Agent Scalar configuration options.
 * Enables the AI chat interface in the API Reference or disables it entirely.
 *
 * @see <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarAgentOptions {

    /** Whether to hide the control for adding APIs in the agent chat. */
    private Boolean hideAddApi;

    /**
     * Agent Scalar key for production deployments. Required for Agent Scalar to
     * appear in production; when omitted, the agent is enabled only on localhost
     * with limited free messages.
     */
    private String key;

    /**
     * When true, disables the Agent Scalar chat interface for this source or
     * for the entire reference (when set at top level).
     */
    private Boolean disabled;

    /**
     * Creates agent options with no key and not disabled.
     */
    public ScalarAgentOptions() {
    }

    /**
     * Gets the Agent Scalar key.
     *
     * @return the key or null
     */
    public String getKey() {
        return key;
    }

    /**
     * Sets the Agent Scalar key.
     *
     * @param key the key
     */
    public void setKey(String key) {
        this.key = key;
    }

    /**
     * Gets whether the agent is disabled.
     *
     * @return true if disabled, false if enabled, null if not set
     */
    public Boolean getDisabled() {
        return disabled;
    }

    /**
     * Sets whether the agent is disabled.
     *
     * @param disabled true to disable, false or null to use default behavior
     */
    public void setDisabled(Boolean disabled) {
        this.disabled = disabled;
    }

    /**
     * Gets whether to hide the control for adding APIs in the agent chat.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Boolean getHideAddApi() {
        return hideAddApi;
    }

    /**
     * Sets whether to hide the control for adding APIs in the agent chat.
     *
     * @param hideAddApi the configured value, or null to use the frontend default
     */
    public void setHideAddApi(Boolean hideAddApi) {
        this.hideAddApi = hideAddApi;
    }
}
