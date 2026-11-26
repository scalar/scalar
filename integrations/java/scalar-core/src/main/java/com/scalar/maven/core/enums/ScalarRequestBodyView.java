package com.scalar.maven.core.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** The initial view of the request body editor. */
public enum ScalarRequestBodyView {
    /** Display the form editor when available. */
    FORM("form"),
    /** Display the raw request body. */
    RAW("raw");

    private final String value;

    ScalarRequestBodyView(String value) {
        this.value = value;
    }

    /**
     * @param value the frontend configuration value
     * @return the corresponding request body view
     * @throws IllegalArgumentException if the value is not recognized
     */
    @JsonCreator
    public static ScalarRequestBodyView fromValue(String value) {
        for (ScalarRequestBodyView view : values()) {
            if (view.value.equals(value)) {
                return view;
            }
        }
        throw new IllegalArgumentException("Unknown request body view: " + value);
    }

    /** @return the frontend configuration value */
    @JsonValue
    public String getValue() {
        return value;
    }
}
