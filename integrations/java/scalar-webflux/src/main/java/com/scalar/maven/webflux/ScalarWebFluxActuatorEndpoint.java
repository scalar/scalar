package com.scalar.maven.webflux;

import com.scalar.maven.core.ScalarHtmlRenderer;
import com.scalar.maven.core.ScalarProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.boot.actuate.endpoint.web.annotation.WebEndpoint;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Actuator endpoint for serving the Scalar API Reference interface in Spring WebFlux applications.
 *
 * <p>
 * This endpoint provides access to the Scalar API Reference interface through
 * Spring Boot Actuator endpoints. It serves the same HTML content as the
 * regular ScalarWebFluxController but is accessible at the actuator path.
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
public class ScalarWebFluxActuatorEndpoint {

    @Autowired
    private ObjectProvider<SpringBootScalarProperties> propertiesProvider;

    /**
     * Serves the Scalar API Reference interface as an actuator endpoint.
     *
     * <p>
     * This method returns the same HTML content as the regular ScalarWebFluxController
     * but is accessible through the actuator endpoint system.
     * </p>
     *
     * @param request the HTTP request
     * @return a Mono containing a Resource with the HTML content for the API Reference
     * interface
     */
    @ReadOperation(produces = MediaType.TEXT_HTML_VALUE)
    public final Mono<Resource> scalarUi(ServerHttpRequest request) {
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
    @ReadOperation(produces = "application/javascript")
    public final Mono<Resource> scalarJs() {
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
