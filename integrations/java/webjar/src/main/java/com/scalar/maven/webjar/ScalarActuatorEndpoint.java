package com.scalar.maven.webjar;

import com.scalar.maven.webjar.internal.AbstractScalarController;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.boot.actuate.endpoint.web.annotation.WebEndpoint;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;

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
public class ScalarActuatorEndpoint extends AbstractScalarController {

    /**
     * Creates a new ScalarActuatorEndpoint with the specified properties.
     *
     * @param properties the configuration properties for the Scalar integration
     */
    public ScalarActuatorEndpoint(ScalarProperties properties) {
        super(properties);
    }

    /**
     * Serves the Scalar API Reference interface as an actuator endpoint.
     *
     * <p>
     * This method returns the same HTML content as the regular ScalarController
     * but is accessible through the actuator endpoint system.
     * </p>
     *
     * @param request the HTTP request
     * @return a ResponseEntity containing the HTML content for the API Reference
     *         interface
     * @throws IOException if the HTML template cannot be loaded
     */
    @ReadOperation(produces = MediaType.TEXT_HTML_VALUE)
    public final ResponseEntity<String> scalarUi(HttpServletRequest request) throws IOException {
        String basePath = properties.getPath();
        if (basePath == null || basePath.isEmpty()) {
            basePath = "/scalar";
        }

        String html = renderHtml(basePath, request);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    /**
     * Serves the JavaScript bundle for the Scalar API Reference.
     *
     * <p>
     * This endpoint returns the JavaScript file that powers the Scalar API
     * Reference interface. The file is served with the appropriate MIME type.
     * </p>
     *
     * @return a ResponseEntity containing the JavaScript bundle
     * @throws IOException if the JavaScript file cannot be loaded
     */
    @ReadOperation(produces = "application/javascript")
    public final ResponseEntity<byte[]> scalarJs() throws IOException {
        return getScalarJsContent();
    }

}
