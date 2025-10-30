package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents PKCE (Proof Key for Code Exchange) options for OAuth2 flows.
 */
public enum Pkce {
    /**
     * Use SHA-256 for PKCE.
     */
    SHA_256("SHA-256"),

    /**
     * Use plain text for PKCE.
     */
    PLAIN("plain"),

    /**
     * Do not use PKCE.
     */
    NO("no");

    private final String value;

    Pkce(String value) {
        this.value = value;
    }

    /**
     * Creates a Pkce from a string value.
     *
     * @param value the string value
     * @return the corresponding Pkce
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static Pkce fromValue(String value) {
        for (Pkce pkce : values()) {
            if (pkce.value.equals(value)) {
                return pkce;
            }
        }
        throw new IllegalArgumentException("Unknown PKCE value: " + value);
    }

    /**
     * Gets the string value for JSON serialization.
     *
     * @return the string value
     */
    @JsonValue
    public String getValue() {
        return value;
    }
}
