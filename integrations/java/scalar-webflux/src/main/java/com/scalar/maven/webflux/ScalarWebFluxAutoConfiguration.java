package com.scalar.maven.webflux;

import com.scalar.maven.core.config.ScalarPathRouting;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;

import org.springframework.boot.actuate.autoconfigure.endpoint.condition.ConditionalOnAvailableEndpoint;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.result.method.RequestMappingInfo;
import org.springframework.web.reactive.result.method.annotation.RequestMappingHandlerMapping;

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

    /**
     * Registers the opted-in documentation subtree after annotated routes are initialized.
     * Exact application endpoints, including the JavaScript bundle, keep precedence.
     *
     * @param propertiesProvider the configured properties
     * @param controllerProvider the Scalar controller, including application customizations
     * @param mappingProvider the application's annotated request mapping provider
     * @return the route registration callback
     */
    @Bean
    public SmartInitializingSingleton scalarPathRouting(
            ObjectProvider<SpringBootScalarProperties> propertiesProvider,
            ObjectProvider<ScalarWebFluxController> controllerProvider,
            @Qualifier("requestMappingHandlerMapping") ObjectProvider<RequestMappingHandlerMapping> mappingProvider) {
        return () -> {
            SpringBootScalarProperties properties = propertiesProvider.getObject();
            ScalarPathRouting routing = properties.getPathRouting();
            if (routing == null) {
                return;
            }
            RequestMappingHandlerMapping mapping = mappingProvider.getObject();
            String basePath = java.util.Objects.requireNonNull(routing.getBasePath(), "pathRouting.basePath is required");
            String pattern = "/".equals(basePath) ? "/**" : basePath + "/**";
            RequestMappingInfo.BuilderConfiguration options = new RequestMappingInfo.BuilderConfiguration();
            options.setPatternParser(mapping.getPathPatternParser());
            options.setContentTypeResolver(mapping.getContentTypeResolver());
            try {
                // Annotation placeholders retain trailing slashes; add the normalized asset URL used by the HTML.
                String scalarPath = properties.getPath();
                if (scalarPath != null && scalarPath.endsWith("/")) {
                    String bundlePath = scalarPath.replaceAll("/+$", "") + "/scalar.js";
                    RequestMappingInfo bundle = RequestMappingInfo.paths(bundlePath)
                            .methods(RequestMethod.GET).produces("application/javascript").options(options).build();
                    mapping.registerMapping(bundle, controllerProvider.getObject(),
                            ScalarWebFluxController.class.getMethod("getScalarJs"));
                }
                if (!Boolean.FALSE.equals(properties.getUrlRouting())) {
                    RequestMappingInfo route = RequestMappingInfo.paths(pattern)
                            .methods(RequestMethod.GET).produces("text/html").options(options).build();
                    mapping.registerMapping(route, controllerProvider.getObject(),
                            ScalarWebFluxController.class.getMethod("getDocs", ServerHttpRequest.class));
                }
            } catch (NoSuchMethodException e) {
                throw new IllegalStateException("Scalar documentation handler is missing", e);
            }
        };
    }
}
