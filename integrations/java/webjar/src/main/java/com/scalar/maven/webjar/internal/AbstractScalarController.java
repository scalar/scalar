package com.scalar.maven.webjar.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.webjar.ScalarProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Abstract base class for Scalar API Reference controllers.
 *
 * <p>
 * This abstract class provides shared functionality for rendering the Scalar
 * API
 * Reference interface. It encapsulates common logic for HTML template loading,
 * placeholder replacement, and configuration serialization.
 * </p>
 *
 * <p>
 * Subclasses can override the
 * {@link #configureProperties(ScalarProperties, HttpServletRequest)}
 * method to customize the properties before they are serialized to JSON.
 * </p>
 *
 * @since 0.1.0
 */
public abstract class AbstractScalarController {

    private static final String JS_FILENAME = "scalar.js";
    private static final String HTML_TEMPLATE_PATH = "/META-INF/resources/webjars/scalar/index.html";

    protected final ScalarProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * Creates a new AbstractScalarController with the specified properties.
     *
     * @param properties the configuration properties for the Scalar integration
     */
    protected AbstractScalarController(ScalarProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Renders the complete HTML content for the Scalar API Reference interface.
     *
     * @param basePath the base path for the Scalar interface (used for JS bundle
     *                 URL)
     * @param request  the HTTP request
     * @return the rendered HTML content
     * @throws IOException if the HTML template cannot be loaded
     */
    protected String renderHtml(String basePath, HttpServletRequest request) throws IOException {
        // Load the template HTML
        InputStream inputStream = getClass().getResourceAsStream(HTML_TEMPLATE_PATH);
        if (inputStream == null) {
            throw new IOException("HTML template not found at: " + HTML_TEMPLATE_PATH);
        }

        String html = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

        // Replace the placeholders with actual values
        String bundleUrl = buildJsBundleUrl(basePath);
        String injectedHtml = html
                .replace("__JS_BUNDLE_URL__", bundleUrl)
                .replace("__CONFIGURATION__", buildConfigurationJson(request));

        return injectedHtml;
    }

    /**
     * Builds the CDN URL for the Scalar JavaScript file.
     *
     * @param basePath the base path for the Scalar interface
     * @return the complete URL for the JavaScript bundle
     */
    protected String buildJsBundleUrl(String basePath) {
        if (basePath == null || basePath.isEmpty()) {
            basePath = "/scalar";
        }

        // Remove trailing slash to avoid double slashes when concatenating
        if (basePath.endsWith("/")) {
            basePath = basePath.substring(0, basePath.length() - 1);
        }

        return basePath + "/" + JS_FILENAME;
    }

    /**
     * Serves the JavaScript bundle content for the Scalar API Reference.
     *
     * <p>
     * This method loads and returns the JavaScript file that powers the Scalar API
     * Reference interface. It is used by both the regular controller and the
     * actuator endpoint.
     * </p>
     *
     * @return a ResponseEntity containing the JavaScript bundle content
     * @throws IOException if the JavaScript file cannot be loaded
     */
    protected ResponseEntity<byte[]> getScalarJsContent() throws IOException {
        InputStream inputStream = getClass().getResourceAsStream("/META-INF/resources/webjars/scalar/" + JS_FILENAME);
        if (inputStream == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] jsContent = inputStream.readAllBytes();

        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/javascript"))
                .body(jsContent);
    }

    /**
     * Hook method that allows derived classes to configure properties before
     * serialization.
     * Override this method to customize the ScalarProperties before they are
     * converted to JSON.
     *
     * @param properties the properties to configure
     * @param request    the HTTP request
     * @return the configured properties (may be the same instance or a modified
     * copy)
     */
    protected ScalarProperties configureProperties(ScalarProperties properties, HttpServletRequest request) {
        return properties;
    }

    /**
     * Builds the configuration JSON for the Scalar API Reference.
     *
     * @param request the HTTP request
     * @return the configuration JSON as a string
     */
    private String buildConfigurationJson(HttpServletRequest request) {
        try {
            ScalarProperties configuredProperties = configureProperties(this.properties, request);
            ScalarConfiguration config = ScalarConfigurationMapper.map(configuredProperties);
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize Scalar configuration", e);
        }
    }
}
