package com.scalar.maven.webjar;

import org.springframework.boot.actuate.autoconfigure.endpoint.condition.ConditionalOnAvailableEndpoint;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Auto-configuration for the Scalar API Reference integration.
 *
 * <p>This class provides automatic configuration for the Scalar API Reference
 * in Spring Boot applications. It automatically creates the necessary beans
 * when the scalar integration is enabled.</p>
 *
 * <p>The auto-configuration is conditional on the {@code scalar.enabled} property
 * being set to {@code true} (which is the default).</p>
 *
 * <p>This configuration:</p>
 * <ul>
 *   <li>Enables configuration properties via {@link ScalarProperties}</li>
 *   <li>Creates a {@link ScalarController} bean for serving the API reference</li>
 * </ul>
 *
 * @since 0.1.0
 */
@Configuration
@EnableConfigurationProperties(ScalarProperties.class)
@ConditionalOnProperty(prefix = "scalar", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ScalarAutoConfiguration {

    /**
     * Creates a ScalarController bean configured with the ScalarProperties.
     *
     * @param properties the configuration properties for the Scalar integration
     * @return a configured ScalarController instance
     */
    @Bean
    public ScalarController scalarController(ScalarProperties properties) {
        return new ScalarController(properties);
    }

    /**
     * Creates a ScalarActuatorEndpoint bean when actuator support is enabled.
     * This endpoint exposes the Scalar UI at /actuator/scalar.
     *
     * @param properties the configuration properties for the Scalar integration
     * @return a configured ScalarActuatorEndpoint instance
     */
    @Bean
    @ConditionalOnProperty(prefix = "scalar", name = "actuatorEnabled", havingValue = "true")
    @ConditionalOnClass(name = "org.springframework.boot.actuate.endpoint.annotation.Endpoint")
    @ConditionalOnAvailableEndpoint(endpoint = ScalarActuatorEndpoint.class)
    public ScalarActuatorEndpoint scalarActuatorEndpoint(ScalarProperties properties) {
        return new ScalarActuatorEndpoint(properties);
    }
}
