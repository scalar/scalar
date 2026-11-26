package com.scalar.maven.core.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the text direction for the Scalar API Reference.
 */
public enum TextDirection {
    /**
     * Derive direction from the locale.
     */
    AUTO("auto"),

    /** Left-to-right text. */
    LTR("ltr"),

    /**
     * Right-to-left text.
     */
    RTL("rtl");

    private final String value;

    TextDirection(String value) {
        this.value = value;
    }

    /**
     * Creates a TextDirection from a string value.
     *
     * @param value the string value
     * @return the corresponding TextDirection
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static TextDirection fromValue(String value) {
        for (TextDirection direction : values()) {
            if (direction.value.equals(value)) {
                return direction;
            }
        }
        throw new IllegalArgumentException("Unknown text direction: " + value);
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
