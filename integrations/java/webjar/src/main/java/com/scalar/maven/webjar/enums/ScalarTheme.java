package com.scalar.maven.webjar.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Represents the different themes available in Scalar.
 */
public enum ScalarTheme {
    /**
     * No theme applied.
     */
    NONE("none"),

    /**
     * Alternate theme.
     */
    ALTERNATE("alternate"),

    /**
     * Default theme.
     */
    DEFAULT("default"),

    /**
     * Moon theme.
     */
    MOON("moon"),

    /**
     * Purple theme.
     */
    PURPLE("purple"),

    /**
     * Solarized theme.
     */
    SOLARIZED("solarized"),

    /**
     * Blue Planet theme.
     */
    BLUE_PLANET("bluePlanet"),

    /**
     * Saturn theme.
     */
    SATURN("saturn"),

    /**
     * Kepler theme.
     */
    KEPLER("kepler"),

    /**
     * Mars theme.
     */
    MARS("mars"),

    /**
     * Deep Space theme.
     */
    DEEP_SPACE("deepSpace"),

    /**
     * Laserwave theme.
     */
    LASERWAVE("laserwave");

    private final String value;

    ScalarTheme(String value) {
        this.value = value;
    }

    /**
     * Creates a ScalarTheme from a string value.
     *
     * @param value the string value
     * @return the corresponding ScalarTheme
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static ScalarTheme fromValue(String value) {
        for (ScalarTheme theme : values()) {
            if (theme.value.equals(value)) {
                return theme;
            }
        }
        throw new IllegalArgumentException("Unknown theme: " + value);
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
