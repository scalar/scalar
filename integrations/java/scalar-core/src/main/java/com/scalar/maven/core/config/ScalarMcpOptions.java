package com.scalar.maven.core.config;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * MCP (Model Context Protocol) configuration options.
 * When provided, enables MCP integration so users can connect their API
 * reference to MCP-compatible tools.
 *
 * @see <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarMcpOptions {

    /**
     * Display name for the MCP server.
     */
    private String name;

    /**
     * URL of the MCP server.
     */
    private String url;

    /**
     * When true, disables the MCP integration.
     */
    private Boolean disabled;

    /**
     * Creates empty MCP options.
     */
    public ScalarMcpOptions() {
    }

    /**
     * Gets the display name for the MCP server.
     *
     * @return the name or null
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the display name for the MCP server.
     *
     * @param name the name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the URL of the MCP server.
     *
     * @return the URL or null
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL of the MCP server.
     *
     * @param url the URL
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets whether the MCP integration is disabled.
     *
     * @return true if disabled, false if enabled, null if not set
     */
    public Boolean getDisabled() {
        return disabled;
    }

    /**
     * Sets whether the MCP integration is disabled.
     *
     * @param disabled true to disable, false or null to use default behavior
     */
    public void setDisabled(Boolean disabled) {
        this.disabled = disabled;
    }
}
