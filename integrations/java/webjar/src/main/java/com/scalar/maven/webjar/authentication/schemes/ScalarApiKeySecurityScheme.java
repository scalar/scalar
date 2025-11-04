package com.scalar.maven.webjar.authentication.schemes;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Represents a security scheme that uses HTTP header authentication.
 * This scheme is used to prefill or overwrite HTTP header values for authentication purposes
 * when making API requests. It allows specifying a custom header name and value pair.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarApiKeySecurityScheme extends ScalarSecurityScheme {

    /**
     * Gets or sets the name of the HTTP header to be used for authentication.
     * Common examples include "Authorization", "X-API-Key", or custom header names.
     */
    private String name;

    /**
     * Gets or sets the value of the HTTP header to be used for authentication.
     * This value will be sent as-is in the specified header. For example, "Bearer token123" or "ApiKey abc123".
     */
    private String value;

    /**
     * Creates a new ScalarApiKeySecurityScheme.
     */
    public ScalarApiKeySecurityScheme() {
    }

    /**
     * Creates a new ScalarApiKeySecurityScheme with the specified name and value.
     *
     * @param name  the header name
     * @param value the header value
     */
    public ScalarApiKeySecurityScheme(String name, String value) {
        this.name = name;
        this.value = value;
    }

    /**
     * Gets the name of the HTTP header.
     *
     * @return the header name
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name of the HTTP header.
     *
     * @param name the header name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the value of the HTTP header.
     *
     * @return the header value
     */
    public String getValue() {
        return value;
    }

    /**
     * Sets the value of the HTTP header.
     *
     * @param value the header value
     */
    public void setValue(String value) {
        this.value = value;
    }
}
