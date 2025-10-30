package com.scalar.maven.webjar.authentication;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.scalar.maven.webjar.authentication.schemes.ScalarApiKeySecurityScheme;
import com.scalar.maven.webjar.authentication.schemes.ScalarHttpSecurityScheme;
import com.scalar.maven.webjar.authentication.schemes.ScalarOAuth2SecurityScheme;
import com.scalar.maven.webjar.authentication.schemes.ScalarSecurityScheme;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Represents the authentication options for Scalar.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarAuthenticationOptions {

    /**
     * Gets or sets the preferred security schemes.
     * Can be a single string, an array for OR relationship, or an array of arrays
     * for AND/OR relationships.
     */
    @JsonProperty("preferredSecurityScheme")
    private List<String> preferredSecuritySchemes;

    /**
     * Gets or sets the security schemes dictionary.
     * This dictionary allows configuring multiple security schemes by name,
     * enabling more flexible authentication configuration for OpenAPI operations.
     * The key represents the security scheme name as defined in the OpenAPI
     * document,
     * and the value contains the configuration for that specific security scheme.
     */
    private Map<String, ScalarSecurityScheme> securitySchemes;

    /**
     * Gets or sets the API key security schemes dictionary.
     * Used for Spring Boot property binding. These schemes are automatically
     * merged into the main securitySchemes map.
     * This field is not serialized to JSON.
     */
    @JsonIgnore
    private Map<String, ScalarApiKeySecurityScheme> apiKey;

    /**
     * Gets or sets the HTTP security schemes dictionary.
     * Used for Spring Boot property binding. These schemes are automatically
     * merged into the main securitySchemes map.
     * This field is not serialized to JSON.
     */
    @JsonIgnore
    private Map<String, ScalarHttpSecurityScheme> http;

    /**
     * Gets or sets the OAuth2 security schemes dictionary.
     * Used for Spring Boot property binding. These schemes are automatically
     * merged into the main securitySchemes map.
     * This field is not serialized to JSON.
     */
    @JsonIgnore
    private Map<String, ScalarOAuth2SecurityScheme> oauth2;

    /**
     * Creates a new ScalarAuthenticationOptions.
     */
    public ScalarAuthenticationOptions() {
        this.securitySchemes = new java.util.HashMap<>();
        this.apiKey = new java.util.HashMap<>();
        this.http = new java.util.HashMap<>();
        this.oauth2 = new java.util.HashMap<>();
    }

    /**
     * Gets the preferred security schemes.
     *
     * @return the preferred security schemes
     */
    public List<String> getPreferredSecuritySchemes() {
        return preferredSecuritySchemes;
    }

    /**
     * Sets the preferred security schemes.
     *
     * @param preferredSecuritySchemes the preferred security schemes
     */
    public void setPreferredSecuritySchemes(List<String> preferredSecuritySchemes) {
        this.preferredSecuritySchemes = preferredSecuritySchemes;
    }

    /**
     * Sets a single preferred security scheme (convenience method).
     * This is converted internally to a list for consistency.
     *
     * @param preferredSecurityScheme the preferred security scheme
     */
    public void setPreferredSecurityScheme(String preferredSecurityScheme) {
        if (preferredSecurityScheme != null) {
            this.preferredSecuritySchemes = List.of(preferredSecurityScheme);
        }
    }

    /**
     * Custom setter for preferredSecurityScheme that handles both string and list
     * values during JSON deserialization.
     * This is used by Jackson to deserialize both single values and arrays.
     *
     * @param value the preferred security scheme(s) - can be String or List<String>
     */
    @JsonSetter("preferredSecurityScheme")
    public void setPreferredSecuritySchemeFromJson(Object value) {
        if (value == null) {
            this.preferredSecuritySchemes = null;
        } else if (value instanceof String stringValue) {
            this.preferredSecuritySchemes = List.of(stringValue);
        } else if (value instanceof List rawList) {
            List<String> stringList = new ArrayList<>();
            for (Object item : rawList) {
                if (item instanceof String stringValue) {
                    stringList.add(stringValue);
                } else {
                    throw new IllegalArgumentException(
                            "preferredSecurityScheme list must contain only strings, found: " + item.getClass());
                }
            }
            this.preferredSecuritySchemes = stringList;
        } else {
            throw new IllegalArgumentException(
                    "preferredSecurityScheme must be a String or List<String>, got: " + value.getClass());
        }
    }

    /**
     * Gets the security schemes dictionary.
     *
     * @return the security schemes dictionary
     */
    public Map<String, ScalarSecurityScheme> getSecuritySchemes() {
        return securitySchemes;
    }

    /**
     * Sets the security schemes dictionary.
     *
     * @param securitySchemes the security schemes dictionary
     */
    public void setSecuritySchemes(Map<String, ScalarSecurityScheme> securitySchemes) {
        this.securitySchemes = securitySchemes;
    }

    /**
     * Gets the API key security schemes dictionary.
     *
     * @return the API key security schemes dictionary
     */
    public Map<String, ScalarApiKeySecurityScheme> getApiKey() {
        return apiKey;
    }

    /**
     * Sets the API key security schemes dictionary.
     *
     * @param apiKey the API key security schemes dictionary
     */
    public void setApiKey(Map<String, ScalarApiKeySecurityScheme> apiKey) {
        this.apiKey = apiKey;
        mergeSecuritySchemes();
    }

    /**
     * Gets the HTTP security schemes dictionary.
     *
     * @return the HTTP security schemes dictionary
     */
    public Map<String, ScalarHttpSecurityScheme> getHttp() {
        return http;
    }

    /**
     * Sets the HTTP security schemes dictionary.
     *
     * @param http the HTTP security schemes dictionary
     */
    public void setHttp(Map<String, ScalarHttpSecurityScheme> http) {
        this.http = http;
        mergeSecuritySchemes();
    }

    /**
     * Gets the OAuth2 security schemes dictionary.
     *
     * @return the OAuth2 security schemes dictionary
     */
    public Map<String, ScalarOAuth2SecurityScheme> getOauth2() {
        return oauth2;
    }

    /**
     * Sets the OAuth2 security schemes dictionary.
     *
     * @param oauth2 the OAuth2 security schemes dictionary
     */
    public void setOauth2(Map<String, ScalarOAuth2SecurityScheme> oauth2) {
        this.oauth2 = oauth2;
        mergeSecuritySchemes();
    }

    /**
     * Merges all typed security scheme maps into the main securitySchemes map.
     * This method is called automatically when any of the typed maps are set.
     */
    private void mergeSecuritySchemes() {
        // Clear existing schemes
        this.securitySchemes.clear();

        // Add API key schemes
        if (apiKey != null) {
            this.securitySchemes.putAll(apiKey);
        }

        // Add HTTP schemes
        if (http != null) {
            this.securitySchemes.putAll(http);
        }

        // Add OAuth2 schemes
        if (oauth2 != null) {
            this.securitySchemes.putAll(oauth2);
        }
    }
}
