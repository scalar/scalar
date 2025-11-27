package com.scalar.maven.webflux;

import org.springframework.boot.actuate.autoconfigure.endpoint.condition.ConditionalOnAvailableEndpoint;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Auto-configuration for the Scalar API Reference integration in Spring WebFlux applications.
 *
 * <p>
 * This class provides automatic configuration for the Scalar API Reference
 * in Spring Boot WebFlux applications. It automatically creates the necessary beans
 * when the scalar integration is enabled.
 * </p>
 *
 * <p>
 * The auto-configuration is conditional on the {@code scalar.enabled} property
 * being set to {@code true} (which is the default).
 * </p>
 *
 * <p>
 * This configuration:
 * </p>
 * <ul>
 * <li>Enables configuration properties via {@link SpringBootScalarProperties}</li>
 * <li>Creates a {@link ScalarWebFluxController} bean for serving the API reference</li>
 * <li>Creates a {@link ScalarWebFluxActuatorEndpoint} bean when actuator is enabled</li>
 * </ul>
 */
@Configuration
@EnableConfigurationProperties(SpringBootScalarProperties.class)
@ConditionalOnProperty(prefix = "scalar", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ScalarWebFluxAutoConfiguration {

    /**
     * Creates a ScalarWebFluxController bean.
     *
     * @return a configured ScalarWebFluxController instance
     */
    @Bean
    @ConditionalOnMissingBean(ScalarWebFluxController.class)
    public ScalarWebFluxController scalarWebFluxController() {
        return new ScalarWebFluxController();
    }

    /**
     * Creates a ScalarWebFluxActuatorEndpoint bean when actuator support is enabled.
     * This endpoint exposes the Scalar UI at /actuator/scalar.
     *
     * @return a configured ScalarWebFluxActuatorEndpoint instance
     */
    @Bean
    @ConditionalOnProperty(prefix = "scalar", name = "actuatorEnabled", havingValue = "true")
    @ConditionalOnClass(name = "org.springframework.boot.actuate.endpoint.annotation.Endpoint")
    @ConditionalOnAvailableEndpoint(endpoint = ScalarWebFluxActuatorEndpoint.class)
    public ScalarWebFluxActuatorEndpoint scalarWebFluxActuatorEndpoint() {
        return new ScalarWebFluxActuatorEndpoint();
    }
}
