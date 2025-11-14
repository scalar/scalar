package com.scalar.maven.webmvc;

import com.scalar.maven.core.ScalarProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Spring Boot configuration properties wrapper for Scalar API Reference integration.
 *
 * <p>
 * This class extends {@link ScalarProperties} and adds Spring Boot's
 * {@link ConfigurationProperties} annotation to enable automatic property binding
 * from Spring Boot configuration files (e.g., application.properties, application.yml).
 * </p>
 *
 * <p>
 * This wrapper allows the core {@link ScalarProperties} class to remain
 * framework-agnostic while providing Spring Boot-specific functionality in the
 * WebMVC integration module.
 * </p>
 *
 * <p>
 * Example usage in application.properties:
 * </p>
 *
 * <pre>
 * scalar.url=https://my-api-spec.json
 * scalar.path=/docs
 * scalar.enabled=true
 * scalar.showSidebar=true
 * scalar.hideModels=false
 * scalar.darkMode=true
 * scalar.theme=default
 * scalar.layout=modern
 * </pre>
 */
@ConfigurationProperties(prefix = "scalar")
public final class SpringBootScalarProperties extends ScalarProperties {
    // All functionality is inherited from ScalarProperties
    // This class only adds the @ConfigurationProperties annotation
}

