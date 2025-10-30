package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the sorting method for operations in the Scalar API Reference.
 */
public enum OperationSorter {
    /**
     * Sort operations alphabetically.
     */
    ALPHA("alpha"),

    /**
     * Sort operations by HTTP method.
     */
    METHOD("method");

    private final String value;

    OperationSorter(String value) {
        this.value = value;
    }

    /**
     * Creates an OperationSorter from a string value.
     *
     * @param value the string value
     * @return the corresponding OperationSorter
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static OperationSorter fromValue(String value) {
        for (OperationSorter sorter : values()) {
            if (sorter.value.equals(value)) {
                return sorter;
            }
        }
        throw new IllegalArgumentException("Unknown operation sorter: " + value);
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
