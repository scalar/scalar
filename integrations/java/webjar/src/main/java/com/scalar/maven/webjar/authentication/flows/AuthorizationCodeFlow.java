package com.scalar.maven.webjar.authentication.flows;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.scalar.maven.webjar.enums.CredentialsLocation;
import com.scalar.maven.webjar.enums.Pkce;

/**
 * Represents the OAuth2 Authorization Code flow configuration.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthorizationCodeFlow extends OAuthFlow {

    /**
     * Gets or sets the authorization URL to be used for this flow.
     */
    private String authorizationUrl;

    /**
     * Gets or sets the token URL to be used for this flow.
     */
    private String tokenUrl;

    /**
     * Gets or sets the client secret used for authentication.
     */
    private String clientSecret;

    /**
     * Gets or sets whether to use PKCE (Proof Key for Code Exchange) for the authorization code flow.
     */
    @JsonProperty("x-usePkce")
    private Pkce pkce;

    /**
     * Gets or sets the redirect URI for the authorization code flow.
     */
    @JsonProperty("x-scalar-redirect-uri")
    private String redirectUri;

    /**
     * Gets or sets the location where authentication credentials should be placed in HTTP requests.
     */
    @JsonProperty("x-scalar-credentials-location")
    private CredentialsLocation credentialsLocation;

    /**
     * Creates a new AuthorizationCodeFlow.
     */
    public AuthorizationCodeFlow() {
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
     * Gets the token URL.
     *
     * @return the token URL
     */
    public String getTokenUrl() {
        return tokenUrl;
    }

    /**
     * Sets the token URL.
     *
     * @param tokenUrl the token URL
     */
    public void setTokenUrl(String tokenUrl) {
        this.tokenUrl = tokenUrl;
    }

    /**
     * Gets the client secret.
     *
     * @return the client secret
     */
    public String getClientSecret() {
        return clientSecret;
    }

    /**
     * Sets the client secret.
     *
     * @param clientSecret the client secret
     */
    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    /**
     * Gets the PKCE setting.
     *
     * @return the PKCE setting
     */
    public Pkce getPkce() {
        return pkce;
    }

    /**
     * Sets the PKCE setting.
     *
     * @param pkce the PKCE setting
     */
    public void setPkce(Pkce pkce) {
        this.pkce = pkce;
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

    /**
     * Gets the credentials location.
     *
     * @return the credentials location
     */
    public CredentialsLocation getCredentialsLocation() {
        return credentialsLocation;
    }

    /**
     * Sets the credentials location.
     *
     * @param credentialsLocation the credentials location
     */
    public void setCredentialsLocation(CredentialsLocation credentialsLocation) {
        this.credentialsLocation = credentialsLocation;
    }
}
