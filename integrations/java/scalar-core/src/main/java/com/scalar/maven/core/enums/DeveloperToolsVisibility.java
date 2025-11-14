package com.scalar.maven.core.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the visibility of the developer tools toolbar for the Scalar API Reference.
 */
public enum DeveloperToolsVisibility {
    /**
     * Always show the toolbar.
     */
    ALWAYS("always"),

    /**
     * Only show the toolbar on localhost or similar hosts.
     */
    LOCALHOST("localhost"),

    /**
     * Never show the toolbar.
     */
    NEVER("never");

    private final String value;

    DeveloperToolsVisibility(String value) {
        this.value = value;
    }

    /**
     * Creates a DeveloperToolsVisibility from a string value.
     *
     * @param value the string value
     * @return the corresponding DeveloperToolsVisibility
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static DeveloperToolsVisibility fromValue(String value) {
        for (DeveloperToolsVisibility visibility : values()) {
            if (visibility.value.equals(value)) {
                return visibility;
            }
        }
        throw new IllegalArgumentException("Unknown developer tools visibility: " + value);
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

