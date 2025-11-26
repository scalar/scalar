package com.scalar.maven.webmvc;

import com.scalar.maven.core.ScalarHtmlRenderer;
import com.scalar.maven.core.ScalarProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.boot.actuate.endpoint.web.annotation.WebEndpoint;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;

/**
 * Actuator endpoint for serving the Scalar API Reference interface in Spring WebMVC applications.
 *
 * <p>
 * This endpoint provides access to the Scalar API Reference interface through
 * Spring Boot Actuator endpoints. It serves the same HTML content as the
 * regular ScalarWebMvcController but is accessible at the actuator path.
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
 */
@Endpoint(id = "scalar")
@WebEndpoint(id = "scalar")
public class ScalarWebMvcActuatorEndpoint {

    @Autowired
    private ObjectProvider<SpringBootScalarProperties> propertiesProvider;

    /**
     * Serves the Scalar API Reference interface as an actuator endpoint.
     *
     * <p>
     * This method returns the same HTML content as the regular ScalarWebMvcController
     * but is accessible through the actuator endpoint system.
     * </p>
     *
     * @param request the HTTP request
     * @return a ResponseEntity containing the HTML content for the API Reference
     * interface
     * @throws IOException if the HTML template cannot be loaded
     */
    @ReadOperation(produces = MediaType.TEXT_HTML_VALUE)
    public final ResponseEntity<String> scalarUi(HttpServletRequest request) throws IOException {
        ScalarProperties properties = propertiesProvider.getObject();
        ScalarProperties configuredProperties = configureProperties(properties, request);

        String html = ScalarHtmlRenderer.render(configuredProperties);

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
        byte[] jsContent = ScalarHtmlRenderer.getScalarJsContent();
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/javascript"))
                .body(jsContent);
    }

    /**
     * Hook method that allows subclasses to configure properties before rendering.
     * Override this method to customize the ScalarProperties before they are
     * converted to JSON and rendered.
     *
     * @param properties the properties to configure
     * @param request    the HTTP request
     * @return the configured properties
     */
    protected ScalarProperties configureProperties(ScalarProperties properties, HttpServletRequest request) {
        return properties;
    }
}
