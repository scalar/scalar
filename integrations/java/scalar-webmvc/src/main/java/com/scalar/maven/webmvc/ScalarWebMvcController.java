package com.scalar.maven.webmvc;

import com.scalar.maven.core.ScalarConstants;
import com.scalar.maven.core.ScalarHtmlRenderer;
import com.scalar.maven.core.ScalarProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * REST controller for serving the Scalar API Reference interface in Spring WebMVC applications.
 *
 * <p>
 * This controller provides endpoints for accessing the Scalar API Reference
 * interface and the associated JavaScript bundle. It automatically configures
 * the interface based on the provided {@link ScalarProperties}.
 * </p>
 *
 * <p>
 * The controller serves two main endpoints:
 * </p>
 * <ul>
 * <li>{@code /scalar} (or custom path) - The main API Reference interface</li>
 * <li>{@code /scalar/scalar.js} (or custom path) - The JavaScript bundle</li>
 * </ul>
 *
 * <p>
 * This controller can be extended to customize behavior by overriding the
 * {@link #configureProperties(ScalarProperties, HttpServletRequest)} method.
 * </p>
 */
@RestController
@ConditionalOnMissingBean(ScalarWebMvcController.class)
public class ScalarWebMvcController {

    @Autowired
    private ObjectProvider<SpringBootScalarProperties> propertiesProvider;

    /**
     * Serves the main API Reference interface.
     *
     * <p>
     * This endpoint returns an HTML page that displays the Scalar API Reference
     * interface. The page is configured with the OpenAPI specification URL from
     * the properties.
     * </p>
     *
     * @param request the HTTP request
     * @return a ResponseEntity containing the HTML content for the API Reference
     * interface
     * @throws IOException if the HTML template cannot be loaded
     */
    @GetMapping("${scalar.path:/scalar}")
    public final ResponseEntity<String> getDocs(HttpServletRequest request) throws IOException {
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
    @GetMapping("${scalar.path:/scalar}/" + ScalarConstants.JS_FILENAME)
    public final ResponseEntity<byte[]> getScalarJs() throws IOException {
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
