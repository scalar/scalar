package com.scalar.maven.webmvc;

import com.scalar.maven.core.config.ScalarPathRouting;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMethod;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.boot.actuate.autoconfigure.endpoint.condition.ConditionalOnAvailableEndpoint;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

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
            ObjectProvider<ScalarWebMvcController> controllerProvider,
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
            RequestMappingInfo.BuilderConfiguration options = mapping.getBuilderConfiguration();
            try {
                // Annotation placeholders retain trailing slashes; add the normalized asset URL used by the HTML.
                String scalarPath = properties.getPath();
                if (scalarPath != null && scalarPath.endsWith("/")) {
                    String bundlePath = scalarPath.replaceAll("/+$", "") + "/scalar.js";
                    RequestMappingInfo bundle = RequestMappingInfo.paths(bundlePath)
                            .methods(RequestMethod.GET).produces("application/javascript").options(options).build();
                    mapping.registerMapping(bundle, controllerProvider.getObject(),
                            ScalarWebMvcController.class.getMethod("getScalarJs"));
                }
                if (!Boolean.FALSE.equals(properties.getUrlRouting())) {
                    RequestMappingInfo route = RequestMappingInfo.paths(pattern)
                            .methods(RequestMethod.GET).produces("text/html").options(options).build();
                    mapping.registerMapping(route, controllerProvider.getObject(),
                            ScalarWebMvcController.class.getMethod("getDocs", HttpServletRequest.class));
                }
            } catch (NoSuchMethodException e) {
                throw new IllegalStateException("Scalar documentation handler is missing", e);
            }
        };
    }
}
