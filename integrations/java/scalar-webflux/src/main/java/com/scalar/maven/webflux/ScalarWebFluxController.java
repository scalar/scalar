package com.scalar.maven.webflux;

import com.scalar.maven.core.ScalarConstants;
import com.scalar.maven.core.ScalarHtmlRenderer;
import com.scalar.maven.core.ScalarProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * REST controller for serving the Scalar API Reference interface in Spring WebFlux applications.
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
 * {@link #configureProperties(ScalarProperties, ServerHttpRequest)} method.
 * </p>
 */
@RestController
@ConditionalOnMissingBean(ScalarWebFluxController.class)
public class ScalarWebFluxController {

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
     * @return a Mono containing a Resource with the HTML content for the API Reference
     * interface
     */
    @GetMapping(value = "${scalar.path:/scalar}", produces = MediaType.TEXT_HTML_VALUE)
    public final Mono<Resource> getDocs(ServerHttpRequest request) {
        return Mono.fromCallable(() -> {
                    ScalarProperties properties = propertiesProvider.getObject();
                    ScalarProperties configuredProperties = configureProperties(properties, request);
                    String html = ScalarHtmlRenderer.render(configuredProperties);
                    Resource resource = new ByteArrayResource(html.getBytes(StandardCharsets.UTF_8));
                    return resource;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorMap(IOException.class, e -> new RuntimeException("Failed to render HTML", e));
    }

    /**
     * Serves the JavaScript bundle for the Scalar API Reference.
     *
     * <p>
     * This endpoint returns the JavaScript file that powers the Scalar API
     * Reference interface. The file is served with the appropriate MIME type.
     * </p>
     *
     * @return a Mono containing a Resource with the JavaScript bundle
     */
    @GetMapping(value = "${scalar.path:/scalar}/" + ScalarConstants.JS_FILENAME, produces = "application/javascript")
    public final Mono<Resource> getScalarJs() {
        return Mono.fromCallable(() -> {
                    byte[] jsContent = ScalarHtmlRenderer.getScalarJsContent();
                    Resource resource = new ByteArrayResource(jsContent);
                    return resource;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorMap(IOException.class, e -> new RuntimeException("Failed to load JavaScript bundle", e));
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
    protected ScalarProperties configureProperties(ScalarProperties properties, ServerHttpRequest request) {
        return properties;
    }
}
