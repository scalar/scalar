package com.scalar.maven.webjar.authentication.flows;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * Base class containing common properties for all OAuth2 flows.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class OAuthFlow {

    /**
     * Gets or sets the URL to be used for obtaining refresh tokens.
     */
    private String refreshUrl;

    /**
     * Gets or sets the preselected scopes for the request.
     */
    private List<String> selectedScopes;

    /**
     * Gets or sets the client ID associated with the OAuth flow.
     */
    @JsonProperty("x-scalar-client-id")
    private String clientId;

    /**
     * Gets or sets the authentication token.
     */
    private String token;

    /**
     * Gets or sets additional query parameters that should be included in the auth request.
     */
    @JsonProperty("x-scalar-security-query")
    private Map<String, String> additionalQueryParameters;

    /**
     * Gets or sets additional body parameters that should be included in the token request.
     */
    @JsonProperty("x-scalar-security-body")
    private Map<String, String> additionalBodyParameters;

    /**
     * Gets or sets the name of the token used in the OAuth flow.
     */
    @JsonProperty("x-tokenName")
    private String tokenName;

    /**
     * Creates a new OAuthFlow.
     */
    protected OAuthFlow() {
    }

    /**
     * Gets the refresh URL.
     *
     * @return the refresh URL
     */
    public String getRefreshUrl() {
        return refreshUrl;
    }

    /**
     * Sets the refresh URL.
     *
     * @param refreshUrl the refresh URL
     */
    public void setRefreshUrl(String refreshUrl) {
        this.refreshUrl = refreshUrl;
    }

    /**
     * Gets the selected scopes.
     *
     * @return the selected scopes
     */
    public List<String> getSelectedScopes() {
        return selectedScopes;
    }

    /**
     * Sets the selected scopes.
     *
     * @param selectedScopes the selected scopes
     */
    public void setSelectedScopes(List<String> selectedScopes) {
        this.selectedScopes = selectedScopes;
    }

    /**
     * Gets the client ID.
     *
     * @return the client ID
     */
    public String getClientId() {
        return clientId;
    }

    /**
     * Sets the client ID.
     *
     * @param clientId the client ID
     */
    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    /**
     * Gets the token.
     *
     * @return the token
     */
    public String getToken() {
        return token;
    }

    /**
     * Sets the token.
     *
     * @param token the token
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * Gets the additional query parameters.
     *
     * @return the additional query parameters
     */
    public Map<String, String> getAdditionalQueryParameters() {
        return additionalQueryParameters;
    }

    /**
     * Sets the additional query parameters.
     *
     * @param additionalQueryParameters the additional query parameters
     */
    public void setAdditionalQueryParameters(Map<String, String> additionalQueryParameters) {
        this.additionalQueryParameters = additionalQueryParameters;
    }

    /**
     * Gets the additional body parameters.
     *
     * @return the additional body parameters
     */
    public Map<String, String> getAdditionalBodyParameters() {
        return additionalBodyParameters;
    }

    /**
     * Sets the additional body parameters.
     *
     * @param additionalBodyParameters the additional body parameters
     */
    public void setAdditionalBodyParameters(Map<String, String> additionalBodyParameters) {
        this.additionalBodyParameters = additionalBodyParameters;
    }

    /**
     * Gets the token name.
     *
     * @return the token name
     */
    public String getTokenName() {
        return tokenName;
    }

    /**
     * Sets the token name.
     *
     * @param tokenName the token name
     */
    public void setTokenName(String tokenName) {
        this.tokenName = tokenName;
    }
}
