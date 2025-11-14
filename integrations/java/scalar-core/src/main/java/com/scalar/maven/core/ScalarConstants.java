package com.scalar.maven.core;

/**
 * Constants used across the Scalar Java integration.
 * <p>
 * This class provides shared constants to avoid duplication across different
 * modules and classes.
 * </p>
 */
public final class ScalarConstants {

    /**
     * The default path where the Scalar API Reference interface is available.
     */
    public static final String DEFAULT_PATH = "/scalar";

    /**
     * The filename of the JavaScript bundle for the Scalar API Reference.
     */
    public static final String JS_FILENAME = "scalar.js";

    private ScalarConstants() {
        // Utility class - prevent instantiation
    }
}

