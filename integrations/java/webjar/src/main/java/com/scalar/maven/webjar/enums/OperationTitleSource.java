package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the source for operation titles in the Scalar API Reference.
 */
public enum OperationTitleSource {
    /**
     * Use the operation summary as the title.
     */
    SUMMARY("summary"),

    /**
     * Use the operation path as the title.
     */
    PATH("path");

    private final String value;

    OperationTitleSource(String value) {
        this.value = value;
    }

    /**
     * Creates an OperationTitleSource from a string value.
     *
     * @param value the string value
     * @return the corresponding OperationTitleSource
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static OperationTitleSource fromValue(String value) {
        for (OperationTitleSource source : values()) {
            if (source.value.equals(value)) {
                return source;
            }
        }
        throw new IllegalArgumentException("Unknown operation title source: " + value);
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
