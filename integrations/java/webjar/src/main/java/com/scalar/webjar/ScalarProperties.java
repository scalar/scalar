package com.scalar.maven.webjar;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the Scalar API Reference integration.
 * 
 * <p>This class provides configuration options for customizing the Scalar API Reference
 * endpoint in Spring Boot applications.</p>
 * 
 * <p>Example usage in application.properties:</p>
 * <pre>
 * scalar.url=https://my-api-spec.json
 * scalar.path=/docs
 * scalar.enabled=true
 * </pre>
 * 
 * @since 0.1.0
 */
@ConfigurationProperties(prefix = "scalar")
public class ScalarProperties {

    /**
     * The URL of the OpenAPI specification to display in the API reference.
     * Defaults to a sample specification from the Scalar Galaxy CDN.
     */
    private String url = "https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json";
    
    /**
     * Whether the Scalar API Reference is enabled.
     * Defaults to true.
     */
    private boolean enabled = true;
    
    /**
     * The path where the API reference will be available.
     * Defaults to "/scalar".
     */
    private String path = "/scalar";

    /**
     * Gets the URL of the OpenAPI specification.
     * 
     * @return the OpenAPI specification URL
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL of the OpenAPI specification.
     * 
     * @param url the OpenAPI specification URL
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Checks if the Scalar API Reference is enabled.
     * 
     * @return true if enabled, false otherwise
     */
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Sets whether the Scalar API Reference is enabled.
     * 
     * @param enabled true to enable, false to disable
     */
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    /**
     * Gets the path where the API reference will be available.
     * 
     * @return the API reference path
     */
    public String getPath() {
        return path;
    }

    /**
     * Sets the path where the API reference will be available.
     * 
     * @param path the API reference path
     */
    public void setPath(String path) {
        this.path = path;
    }
}
