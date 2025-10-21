package com.scalar.maven.webjar.authentication.schemes;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.scalar.maven.webjar.authentication.flows.ScalarFlows;

import java.util.List;

/**
 * Represents a security scheme that uses OAuth 2.0 authentication.
 * This scheme is used to prefill or overwrite OAuth 2.0 authentication values
 * when making API requests. It specifies flows and default scopes to be used
 * during the authorization process.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarOAuth2SecurityScheme extends ScalarSecurityScheme {

    /**
     * Gets or sets the OAuth 2.0 flows configuration for this security scheme.
     * Contains configuration for different OAuth flow types like implicit, password,
     * client credentials, or authorization code. The configured flows determine how
     * the authentication process is handled.
     */
    private ScalarFlows flows;

    /**
     * Gets or sets the default OAuth 2.0 scopes to request during authorization.
     * These scopes are prefilled or used to overwrite the requested scopes when initiating
     * the OAuth flow.
     */
    @JsonProperty("x-default-scopes")
    private List<String> defaultScopes;

    /**
     * Creates a new ScalarOAuth2SecurityScheme.
     */
    public ScalarOAuth2SecurityScheme() {
    }

    /**
     * Gets the OAuth 2.0 flows configuration.
     *
     * @return the flows configuration
     */
    public ScalarFlows getFlows() {
        return flows;
    }

    /**
     * Sets the OAuth 2.0 flows configuration.
     *
     * @param flows the flows configuration
     */
    public void setFlows(ScalarFlows flows) {
        this.flows = flows;
    }

    /**
     * Gets the default OAuth 2.0 scopes.
     *
     * @return the default scopes
     */
    public List<String> getDefaultScopes() {
        return defaultScopes;
    }

    /**
     * Sets the default OAuth 2.0 scopes.
     *
     * @param defaultScopes the default scopes
     */
    public void setDefaultScopes(List<String> defaultScopes) {
        this.defaultScopes = defaultScopes;
    }
}
