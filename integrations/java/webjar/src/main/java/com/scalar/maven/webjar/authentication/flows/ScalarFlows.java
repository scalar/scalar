package com.scalar.maven.webjar.authentication.flows;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Represents the available OAuth 2.0 flows for authentication.
 * This class defines the different OAuth 2.0 flow types that can be used for
 * authentication.
 * Each flow type has its own configuration properties that are used to prefill
 * or overwrite
 * values during the authentication process.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarFlows {

    /**
     * Gets or sets the implicit flow configuration.
     */
    private ImplicitFlow implicit;

    /**
     * Gets or sets the password flow configuration.
     */
    private PasswordFlow password;

    /**
     * Gets or sets the client credentials flow configuration.
     */
    private ClientCredentialsFlow clientCredentials;

    /**
     * Gets or sets the authorization code flow configuration.
     */
    private AuthorizationCodeFlow authorizationCode;

    /**
     * Creates a new ScalarFlows.
     */
    public ScalarFlows() {
    }

    /**
     * Gets the implicit flow configuration.
     *
     * @return the implicit flow configuration
     */
    public ImplicitFlow getImplicit() {
        return implicit;
    }

    /**
     * Sets the implicit flow configuration.
     *
     * @param implicit the implicit flow configuration
     */
    public void setImplicit(ImplicitFlow implicit) {
        this.implicit = implicit;
    }

    /**
     * Gets the password flow configuration.
     *
     * @return the password flow configuration
     */
    public PasswordFlow getPassword() {
        return password;
    }

    /**
     * Sets the password flow configuration.
     *
     * @param password the password flow configuration
     */
    public void setPassword(PasswordFlow password) {
        this.password = password;
    }

    /**
     * Gets the client credentials flow configuration.
     *
     * @return the client credentials flow configuration
     */
    public ClientCredentialsFlow getClientCredentials() {
        return clientCredentials;
    }

    /**
     * Sets the client credentials flow configuration.
     *
     * @param clientCredentials the client credentials flow configuration
     */
    public void setClientCredentials(ClientCredentialsFlow clientCredentials) {
        this.clientCredentials = clientCredentials;
    }

    /**
     * Gets the authorization code flow configuration.
     *
     * @return the authorization code flow configuration
     */
    public AuthorizationCodeFlow getAuthorizationCode() {
        return authorizationCode;
    }

    /**
     * Sets the authorization code flow configuration.
     *
     * @param authorizationCode the authorization code flow configuration
     */
    public void setAuthorizationCode(AuthorizationCodeFlow authorizationCode) {
        this.authorizationCode = authorizationCode;
    }
}
