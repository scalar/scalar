package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the theme mode for the Scalar API Reference.
 */
public enum ThemeMode {
    /**
     * Light theme mode.
     */
    LIGHT("light"),

    /**
     * Dark theme mode.
     */
    DARK("dark");

    private final String value;

    ThemeMode(String value) {
        this.value = value;
    }

    /**
     * Creates a ThemeMode from a string value.
     *
     * @param value the string value
     * @return the corresponding ThemeMode
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static ThemeMode fromValue(String value) {
        for (ThemeMode mode : values()) {
            if (mode.value.equals(value)) {
                return mode;
            }
        }
        throw new IllegalArgumentException("Unknown theme mode: " + value);
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
