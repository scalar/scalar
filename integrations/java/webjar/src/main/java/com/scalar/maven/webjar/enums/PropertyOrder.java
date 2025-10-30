package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the ordering method for schema properties in the Scalar API
 * Reference.
 */
public enum PropertyOrder {
    /**
     * Sort properties alphabetically.
     */
    ALPHA("alpha"),

    /**
     * Preserve the original order from the OpenAPI document.
     */
    PRESERVE("preserve");

    private final String value;

    PropertyOrder(String value) {
        this.value = value;
    }

    /**
     * Creates a PropertyOrder from a string value.
     *
     * @param value the string value
     * @return the corresponding PropertyOrder
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static PropertyOrder fromValue(String value) {
        for (PropertyOrder order : values()) {
            if (order.value.equals(value)) {
                return order;
            }
        }
        throw new IllegalArgumentException("Unknown property order: " + value);
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
