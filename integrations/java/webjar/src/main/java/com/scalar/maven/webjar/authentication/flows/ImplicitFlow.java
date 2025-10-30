package com.scalar.maven.webjar.authentication.flows;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Represents the OAuth2 Implicit flow configuration.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ImplicitFlow extends OAuthFlow {

    /**
     * Gets or sets the authorization URL to be used for this flow.
     */
    private String authorizationUrl;

    /**
     * Gets or sets the redirect URI for the implicit flow.
     */
    @JsonProperty("x-scalar-redirect-uri")
    private String redirectUri;

    /**
     * Creates a new ImplicitFlow.
     */
    public ImplicitFlow() {
    }

    /**
     * Gets the authorization URL.
     *
     * @return the authorization URL
     */
    public String getAuthorizationUrl() {
        return authorizationUrl;
    }

    /**
     * Sets the authorization URL.
     *
     * @param authorizationUrl the authorization URL
     */
    public void setAuthorizationUrl(String authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
    }

    /**
     * Gets the redirect URI.
     *
     * @return the redirect URI
     */
    public String getRedirectUri() {
        return redirectUri;
    }

    /**
     * Sets the redirect URI.
     *
     * @param redirectUri the redirect URI
     */
    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }
}
