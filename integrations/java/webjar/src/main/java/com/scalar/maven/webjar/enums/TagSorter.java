package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the sorting method for tags in the Scalar API Reference.
 */
public enum TagSorter {
    /**
     * Sort tags alphabetically.
     */
    ALPHA("alpha");

    private final String value;

    TagSorter(String value) {
        this.value = value;
    }

    /**
     * Creates a TagSorter from a string value.
     *
     * @param value the string value
     * @return the corresponding TagSorter
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static TagSorter fromValue(String value) {
        for (TagSorter sorter : values()) {
            if (sorter.value.equals(value)) {
                return sorter;
            }
        }
        throw new IllegalArgumentException("Unknown tag sorter: " + value);
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
