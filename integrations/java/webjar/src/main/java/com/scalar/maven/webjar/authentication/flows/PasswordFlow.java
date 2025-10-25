package com.scalar.maven.webjar.authentication.flows;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.scalar.maven.webjar.enums.CredentialsLocation;

/**
 * Represents the OAuth2 Password flow configuration.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PasswordFlow extends OAuthFlow {

    /**
     * Gets or sets the client secret used for authentication.
     */
    private String clientSecret;

    /**
     * Gets or sets the token URL to be used for this flow.
     */
    private String tokenUrl;

    /**
     * Gets or sets the default username for the password flow.
     */
    private String username;

    /**
     * Gets or sets the default password for the password flow.
     */
    private String password;

    /**
     * Gets or sets the location where authentication credentials should be placed in HTTP requests.
     */
    @JsonProperty("x-scalar-credentials-location")
    private CredentialsLocation credentialsLocation;

    /**
     * Creates a new PasswordFlow.
     */
    public PasswordFlow() {
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
     * Gets the username.
     *
     * @return the username
     */
    public String getUsername() {
        return username;
    }

    /**
     * Sets the username.
     *
     * @param username the username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * Gets the password.
     *
     * @return the password
     */
    public String getPassword() {
        return password;
    }

    /**
     * Sets the password.
     *
     * @param password the password
     */
    public void setPassword(String password) {
        this.password = password;
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
