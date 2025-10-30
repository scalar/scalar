package com.scalar.maven.webjar.authentication.flows;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.scalar.maven.webjar.enums.CredentialsLocation;

/**
 * Represents the OAuth2 Client Credentials flow configuration.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClientCredentialsFlow extends OAuthFlow {

    /**
     * Gets or sets the client secret used for authentication.
     */
    private String clientSecret;

    /**
     * Gets or sets the token URL to be used for this flow.
     */
    private String tokenUrl;

    /**
     * Gets or sets the location where authentication credentials should be placed in HTTP requests.
     */
    @JsonProperty("x-scalar-credentials-location")
    private CredentialsLocation credentialsLocation;

    /**
     * Creates a new ClientCredentialsFlow.
     */
    public ClientCredentialsFlow() {
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
