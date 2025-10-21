package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Specifies the available download formats for API documentation.
 */
public enum DocumentDownloadType {
    /**
     * Download documentation in JSON format.
     */
    JSON("json"),

    /**
     * Download documentation in YAML format.
     */
    YAML("yaml"),

    /**
     * Download documentation in both JSON and YAML formats.
     */
    BOTH("both"),

    /**
     * Show the regular link to the OpenAPI document.
     */
    DIRECT("direct"),

    /**
     * Do not allow documentation downloads.
     */
    NONE("none");

    private final String value;

    DocumentDownloadType(String value) {
        this.value = value;
    }

    /**
     * Creates a DocumentDownloadType from a string value.
     *
     * @param value the string value
     * @return the corresponding DocumentDownloadType
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static DocumentDownloadType fromValue(String value) {
        for (DocumentDownloadType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown document download type: " + value);
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
