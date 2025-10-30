package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the layout for the Scalar API Reference.
 */
public enum ScalarLayout {
    /**
     * Modern layout style.
     */
    MODERN("modern"),

    /**
     * Classic layout style.
     */
    CLASSIC("classic");

    private final String value;

    ScalarLayout(String value) {
        this.value = value;
    }

    /**
     * Creates a ScalarLayout from a string value.
     *
     * @param value the string value
     * @return the corresponding ScalarLayout
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static ScalarLayout fromValue(String value) {
        for (ScalarLayout layout : values()) {
            if (layout.value.equals(value)) {
                return layout;
            }
        }
        throw new IllegalArgumentException("Unknown layout: " + value);
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
