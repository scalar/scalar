package com.scalar.maven.core;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.core.internal.ScalarConfiguration;
import com.scalar.maven.core.internal.ScalarConfigurationMapper;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

/**
 * Static utility class for rendering HTML content for the Scalar API Reference interface.
 *
 * <p>
 * This class is framework-agnostic and provides the core HTML rendering
 * functionality. It loads the HTML template, serializes the configuration to JSON,
 * and replaces placeholders with actual values.
 * </p>
 */
public final class ScalarHtmlRenderer {

    private static final String HTML_TEMPLATE_PATH = "/META-INF/resources/webjars/scalar/index.html";
    private static final String JS_BUNDLE_PATH = "/META-INF/resources/webjars/scalar/" + ScalarConstants.JS_FILENAME;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ScalarHtmlRenderer() {
        // Utility class - prevent instantiation
    }

    /**
     * Normalizes the base path by returning the default path if the provided
     * base path is null or empty.
     *
     * @param basePath the base path to normalize
     * @return the normalized base path, or {@link ScalarConstants#DEFAULT_PATH} if null or empty
     */
    private static String normalizeBasePath(String basePath) {
        if (basePath == null || basePath.isEmpty()) {
            return ScalarConstants.DEFAULT_PATH;
        }
        return basePath;
    }

    /**
     * Renders the complete HTML content for the Scalar API Reference interface.
     *
     * @param properties the configuration properties for the Scalar integration
     * @return the rendered HTML content
     * @throws IOException if the HTML template cannot be loaded
     */
    public static String render(ScalarProperties properties) throws IOException {
        Objects.requireNonNull(properties, "properties must not be null");

        String basePath = normalizeBasePath(properties.getPath());

        // Load the template HTML
        InputStream templateStream = ScalarHtmlRenderer.class.getResourceAsStream(HTML_TEMPLATE_PATH);
        if (templateStream == null) {
            throw new IOException("HTML template not found at: " + HTML_TEMPLATE_PATH);
        }

        String html;
        try (InputStream inputStream = templateStream) {
            html = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }

        // Build the JS bundle URL from the base path
        String bundleUrl = buildJsBundleUrl(basePath);
        String pageTitle = Objects.requireNonNullElse(properties.getPageTitle(), "Scalar API Reference");

        // Serialize configuration to JSON
        String configurationJson = buildConfigurationJson(properties);

        // Replace placeholders
        return html
                .replace("__JS_BUNDLE_URL__", bundleUrl)
                .replace("__PAGE_TITLE__", pageTitle)
                .replace("__CONFIGURATION__", configurationJson);
    }

    /**
     * Builds the URL for the Scalar JavaScript bundle based on the base path.
     *
     * @param basePath the base path
     * @return the complete URL for the JavaScript bundle
     */
    private static String buildJsBundleUrl(String basePath) {
        // Remove trailing slash to avoid double slashes when concatenating
        String path = basePath;
        if (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }

        return path + "/" + ScalarConstants.JS_FILENAME;
    }

    /**
     * Builds the configuration JSON for the Scalar API Reference.
     *
     * @param properties the properties to serialize
     * @return the configuration JSON as a string
     */
    private static String buildConfigurationJson(ScalarProperties properties) {
        try {
            ScalarConfiguration config = ScalarConfigurationMapper.map(properties);
            return OBJECT_MAPPER.writeValueAsString(config);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize Scalar configuration", e);
        }
    }

    /**
     * Gets the JavaScript bundle content.
     *
     * @return the JavaScript bundle content as bytes
     * @throws IOException if the JavaScript file cannot be loaded
     */
    public static byte[] getScalarJsContent() throws IOException {
        InputStream jsStream = ScalarHtmlRenderer.class.getResourceAsStream(JS_BUNDLE_PATH);
        if (jsStream == null) {
            throw new IOException("JavaScript bundle not found at: " + JS_BUNDLE_PATH);
        }

        try (InputStream inputStream = jsStream) {
            return inputStream.readAllBytes();
        }
    }
}
