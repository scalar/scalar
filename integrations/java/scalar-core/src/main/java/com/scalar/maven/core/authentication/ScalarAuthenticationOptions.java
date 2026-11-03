package com.scalar.maven.core.authentication;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.scalar.maven.core.authentication.schemes.ScalarApiKeySecurityScheme;
import com.scalar.maven.core.authentication.schemes.ScalarHttpSecurityScheme;
import com.scalar.maven.core.authentication.schemes.ScalarOAuth2SecurityScheme;
import com.scalar.maven.core.authentication.schemes.ScalarSecurityScheme;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Represents the authentication options for Scalar.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarAuthenticationOptions {

    /** Whether users may add authentication schemes absent from the API description. */
    private Boolean createAnySecurityScheme;

    /**
     * Gets or sets the preferred security schemes.
     * Can be a single string, an array for OR relationship, or an array of arrays
     * for AND/OR relationships.
     */
    @JsonIgnore
    private List<String> preferredSecuritySchemes;

    @JsonIgnore
    private List<List<String>> preferredSecuritySchemeGroups;

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
    @JsonIgnore
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
        this.preferredSecuritySchemeGroups = null;
    }

    /**
     * Sets a single preferred security scheme (convenience method).
     * This is converted internally to a list for consistency.
     *
     * @param preferredSecurityScheme the preferred security scheme
     */
    public void setPreferredSecurityScheme(String preferredSecurityScheme) {
        setPreferredSecuritySchemes(preferredSecurityScheme == null ? null : List.of(preferredSecurityScheme));
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
            setPreferredSecuritySchemes(null);
        } else if (value instanceof String stringValue) {
            setPreferredSecurityScheme(stringValue);
        } else if (value instanceof List<?> entries) {
            if (entries.stream().allMatch(String.class::isInstance)) {
                setPreferredSecuritySchemes(entries.stream().map(String.class::cast).toList());
                return;
            }
            List<List<String>> groups = new ArrayList<>();
            for (Object entry : entries) {
                if (entry instanceof String name) {
                    groups.add(List.of(name));
                } else if (entry instanceof List<?> group && group.stream().allMatch(String.class::isInstance)) {
                    groups.add(group.stream().map(String.class::cast).toList());
                } else {
                    throw new IllegalArgumentException("Preferred schemes must be strings or lists of strings");
                }
            }
            setPreferredSecuritySchemeGroups(groups);
        } else {
            throw new IllegalArgumentException("Preferred schemes must be a string or list");
        }
    }

    /**
     * Gets alternatives of security schemes that must be used together.
     *
     * @return OR alternatives of AND groups, or null when the legacy flat list is used
     */
    @JsonIgnore
    public List<List<String>> getPreferredSecuritySchemeGroups() {
        return preferredSecuritySchemeGroups;
    }

    /**
     * Sets OR alternatives, each containing schemes that must be used together.
     * Replaces a previously configured flat list. The legacy flat-list getter then returns null.
     *
     * @param groups alternatives of AND groups, or null to clear preferences
     */
    public void setPreferredSecuritySchemeGroups(List<List<String>> groups) {
        this.preferredSecuritySchemeGroups = groups;
        this.preferredSecuritySchemes = null;
    }

    /**
     * Gets the frontend representation of the preferred schemes.
     *
     * @return the legacy flat list or the configured groups
     */
    @JsonProperty("preferredSecurityScheme")
    public Object getPreferredSecuritySchemeConfiguration() {
        return preferredSecuritySchemeGroups == null ? preferredSecuritySchemes : preferredSecuritySchemeGroups;
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

    /**
     * Gets whether users may add authentication schemes absent from the API description.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Boolean getCreateAnySecurityScheme() {
        return createAnySecurityScheme;
    }

    /**
     * Sets whether users may add authentication schemes absent from the API description.
     *
     * @param createAnySecurityScheme the configured value, or null to use the frontend default
     */
    public void setCreateAnySecurityScheme(Boolean createAnySecurityScheme) {
        this.createAnySecurityScheme = createAnySecurityScheme;
    }
}
