package com.scalar.maven.webjar.authentication;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
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
     * Creates a new ScalarAuthenticationOptions.
     */
    public ScalarAuthenticationOptions() {
        this.securitySchemes = new java.util.HashMap<>();
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
}
