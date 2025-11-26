package com.scalar.maven.webmvc;

import org.springframework.boot.actuate.autoconfigure.endpoint.condition.ConditionalOnAvailableEndpoint;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Auto-configuration for the Scalar API Reference integration in Spring WebMVC applications.
 *
 * <p>
 * This class provides automatic configuration for the Scalar API Reference
 * in Spring Boot WebMVC applications. It automatically creates the necessary beans
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
 * <li>Creates a {@link ScalarWebMvcController} bean for serving the API reference</li>
 * <li>Creates a {@link ScalarWebMvcActuatorEndpoint} bean when actuator is enabled</li>
 * </ul>
 */
@Configuration
@EnableConfigurationProperties(SpringBootScalarProperties.class)
@ConditionalOnProperty(prefix = "scalar", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ScalarWebMvcAutoConfiguration {

    /**
     * Creates a ScalarWebMvcController bean.
     *
     * @return a configured ScalarWebMvcController instance
     */
    @Bean
    @ConditionalOnMissingBean(ScalarWebMvcController.class)
    public ScalarWebMvcController scalarWebMvcController() {
        return new ScalarWebMvcController();
    }

    /**
     * Creates a ScalarWebMvcActuatorEndpoint bean when actuator support is enabled.
     * This endpoint exposes the Scalar UI at /actuator/scalar.
     *
     * @return a configured ScalarWebMvcActuatorEndpoint instance
     */
    @Bean
    @ConditionalOnProperty(prefix = "scalar", name = "actuatorEnabled", havingValue = "true")
    @ConditionalOnClass(name = "org.springframework.boot.actuate.endpoint.annotation.Endpoint")
    @ConditionalOnAvailableEndpoint(endpoint = ScalarWebMvcActuatorEndpoint.class)
    public ScalarWebMvcActuatorEndpoint scalarWebMvcActuatorEndpoint() {
        return new ScalarWebMvcActuatorEndpoint();
    }
}
