package com.scalar.maven.webjar;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.webjar.internal.ScalarConfiguration;
import com.scalar.maven.webjar.internal.ScalarConfigurationMapper;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.boot.actuate.endpoint.web.annotation.WebEndpoint;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Actuator endpoint for serving the Scalar API Reference interface.
 *
 * <p>
 * This endpoint provides access to the Scalar API Reference interface through
 * Spring Boot Actuator endpoints. It serves the same HTML content as the
 * regular ScalarController but is accessible at the actuator path.
 * </p>
 *
 * <p>
 * The endpoint is only enabled when {@code scalar.actuatorEnabled=true} is set
 * in the configuration properties.
 * </p>
 *
 * <p>
 * Access the endpoint at: {@code /actuator/scalar}
 * </p>
 *
 * @since 0.1.0
 */
@Endpoint(id = "scalar")
@WebEndpoint(id = "scalar")
public class ScalarActuatorEndpoint {

    private final ScalarProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * Creates a new ScalarActuatorEndpoint with the specified properties.
     *
     * @param properties the configuration properties for the Scalar integration
     */
    public ScalarActuatorEndpoint(ScalarProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Serves the Scalar API Reference interface as an actuator endpoint.
     *
     * <p>
     * This method returns the same HTML content as the regular ScalarController
     * but is accessible through the actuator endpoint system.
     * </p>
     *
     * @return a ResponseEntity containing the HTML content for the API reference
     * interface
     * @throws IOException if the HTML template cannot be loaded
     */
    @ReadOperation(produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> scalarUi() throws IOException {
        // Load the template HTML
        InputStream inputStream = getClass().getResourceAsStream("/META-INF/resources/webjars/scalar/index.html");
        if (inputStream == null) {
            return ResponseEntity.notFound().build();
        }

        String html = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

        // Replace the placeholders with actual values
        String cdnUrl = buildJsBundleUrl();
        String injectedHtml = html
                .replace("__JS_BUNDLE_URL__", cdnUrl)
                .replace("__CONFIGURATION__", buildConfigurationJson());

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(injectedHtml);
    }

    /**
     * Builds the CDN URL for the Scalar JavaScript file.
     * Uses the configured path if available, otherwise defaults to the actuator
     * path.
     *
     * @return the complete URL for the JavaScript bundle
     */
    private String buildJsBundleUrl() {
        String basePath = properties.getPath();

        if (basePath == null || basePath.isEmpty()) {
            basePath = "/scalar";
        }

        return basePath + "/scalar.js";
    }

    /**
     * Hook method that allows derived endpoint classes to configure properties
     * before serialization.
     * Override this method to customize the ScalarProperties before they are
     * converted to JSON.
     *
     * @param properties the properties to configure
     * @return the configured properties (may be the same instance or a modified
     * copy)
     */
    protected ScalarProperties configureProperties(ScalarProperties properties) {
        return properties;
    }

    /**
     * Builds the configuration JSON for the Scalar API Reference.
     *
     * @return the configuration JSON as a string
     */
    private String buildConfigurationJson() {
        try {
            ScalarProperties configuredProperties = configureProperties(this.properties);
            ScalarConfiguration config = ScalarConfigurationMapper.map(configuredProperties);
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize Scalar configuration", e);
        }
    }

}
