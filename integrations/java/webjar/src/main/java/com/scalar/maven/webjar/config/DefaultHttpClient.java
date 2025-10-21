package com.scalar.maven.webjar.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.scalar.maven.webjar.enums.ScalarClient;
import com.scalar.maven.webjar.enums.ScalarTarget;

/**
 * Represents the default HTTP client configuration for the Scalar API
 * reference.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DefaultHttpClient {

    /**
     * Gets or sets the target key for the HTTP client.
     */
    private ScalarTarget targetKey;

    /**
     * Gets or sets the client key for the HTTP client.
     */
    private ScalarClient clientKey;

    /**
     * Creates a new DefaultHttpClient.
     */
    public DefaultHttpClient() {
    }

    /**
     * Creates a new DefaultHttpClient with the specified target and client keys.
     *
     * @param targetKey the target key
     * @param clientKey the client key
     */
    public DefaultHttpClient(ScalarTarget targetKey, ScalarClient clientKey) {
        this.targetKey = targetKey;
        this.clientKey = clientKey;
    }

    /**
     * Gets the target key.
     *
     * @return the target key
     */
    public ScalarTarget getTargetKey() {
        return targetKey;
    }

    /**
     * Sets the target key.
     *
     * @param targetKey the target key
     */
    public void setTargetKey(ScalarTarget targetKey) {
        this.targetKey = targetKey;
    }

    /**
     * Gets the client key.
     *
     * @return the client key
     */
    public ScalarClient getClientKey() {
        return clientKey;
    }

    /**
     * Sets the client key.
     *
     * @param clientKey the client key
     */
    public void setClientKey(ScalarClient clientKey) {
        this.clientKey = clientKey;
    }
}
