package com.scalar.maven.playground;

import com.scalar.maven.core.ScalarProperties;
import com.scalar.maven.webflux.ScalarWebFluxController;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.RestController;

/**
 * Custom Scalar WebFlux controller for the playground application.
 *
 * <p>
 * This controller extends {@link ScalarWebFluxController} and overrides the
 * {@link #configureProperties(ScalarProperties, ServerHttpRequest)} method
 * to set a custom page title.
 * </p>
 */
@RestController
public class CustomScalarWebFluxController extends ScalarWebFluxController {

    /**
     * Configures the Scalar properties before rendering.
     * This implementation sets a custom page title.
     *
     * @param properties the properties to configure
     * @param request    the HTTP request
     * @return the configured properties with custom page title
     */
    @Override
    protected ScalarProperties configureProperties(ScalarProperties properties, ServerHttpRequest request) {
        properties.setPageTitle("Scalar API Reference - WebFlux");
        return properties;
    }
}

