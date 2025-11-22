package com.scalar.maven.playground;

import com.scalar.maven.core.ScalarProperties;
import com.scalar.maven.webmvc.ScalarWebMvcController;
import com.scalar.maven.webmvc.SpringBootScalarProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.RestController;

/**
 * Custom Scalar WebMVC controller for the playground application.
 *
 * <p>
 * This controller extends {@link ScalarWebMvcController} and overrides the
 * {@link #configureProperties(ScalarProperties, HttpServletRequest)} method
 * to set a custom page title.
 * </p>
 */
@RestController
public class CustomScalarWebMvcController extends ScalarWebMvcController {

    /**
     * Creates a new CustomScalarWebMvcController with the specified properties.
     *
     * @param properties the configuration properties for the Scalar integration
     */
    public CustomScalarWebMvcController(SpringBootScalarProperties properties) {
        super(properties);
    }

    /**
     * Configures the Scalar properties before rendering.
     * This implementation sets a custom page title.
     *
     * @param properties the properties to configure
     * @param request    the HTTP request
     * @return the configured properties with custom page title
     */
    @Override
    protected ScalarProperties configureProperties(ScalarProperties properties, HttpServletRequest request) {
        properties.setPageTitle("Scalar API Reference - WebMVC");
        return properties;
    }
}

