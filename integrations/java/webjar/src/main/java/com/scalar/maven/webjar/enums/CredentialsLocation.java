package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents where OAuth2 credentials should be sent in HTTP requests.
 */
public enum CredentialsLocation {
    /**
     * Send credentials in the HTTP header.
     */
    HEADER("header"),

    /**
     * Send credentials in the HTTP body.
     */
    BODY("body");

    private final String value;

    CredentialsLocation(String value) {
        this.value = value;
    }

    /**
     * Creates a CredentialsLocation from a string value.
     *
     * @param value the string value
     * @return the corresponding CredentialsLocation
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static CredentialsLocation fromValue(String value) {
        for (CredentialsLocation location : values()) {
            if (location.value.equals(value)) {
                return location;
            }
        }
        throw new IllegalArgumentException("Unknown credentials location: " + value);
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
