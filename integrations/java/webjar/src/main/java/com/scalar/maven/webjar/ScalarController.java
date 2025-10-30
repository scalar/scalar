package com.scalar.maven.webjar;

import com.scalar.maven.webjar.internal.AbstractScalarController;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * REST controller for serving the Scalar API Reference interface.
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
 * This controller can be overridden by providing a custom
 * {@code ScalarController}
 * bean in the application context.
 * </p>
 *
 * @since 0.1.0
 */
@RestController
@ConditionalOnMissingBean(ScalarController.class)
public class ScalarController extends AbstractScalarController {

    private static final String DEFAULT_PATH = "/scalar";
    private static final String JS_FILENAME = "scalar.js";

    /**
     * Creates a new ScalarController with the specified properties.
     *
     * @param properties the configuration properties for the Scalar integration
     */
    public ScalarController(ScalarProperties properties) {
        super(properties);
    }

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
    @GetMapping("${scalar.path:" + DEFAULT_PATH + "}")
    public final ResponseEntity<String> getDocs(HttpServletRequest request) throws IOException {
        String basePath = properties.getPath();
        if (basePath == null || basePath.isEmpty()) {
            basePath = DEFAULT_PATH;
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
     * Reference
     * interface. The file is served with the appropriate MIME type.
     * </p>
     *
     * @return a ResponseEntity containing the JavaScript bundle
     * @throws IOException if the JavaScript file cannot be loaded
     */
    @GetMapping("${scalar.path:" + DEFAULT_PATH + "}/" + JS_FILENAME)
    public final ResponseEntity<byte[]> getScalarJs() throws IOException {
        return getScalarJsContent();
    }

}
