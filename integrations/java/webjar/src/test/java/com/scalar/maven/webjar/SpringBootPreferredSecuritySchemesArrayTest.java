package com.scalar.maven.webjar;

import com.scalar.maven.webjar.authentication.ScalarAuthenticationOptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test class to verify Spring Boot configuration properties binding works
 * correctly for preferredSecuritySchemes with array syntax.
 */
@SpringBootTest(classes = SpringBootPreferredSecuritySchemesArrayTest.TestApplication.class)
@TestPropertySource(properties = {
        // Basic configuration
        "scalar.enabled=true",
        "scalar.url=https://test.example.com/openapi.json",

        // Authentication (array syntax - should work with list binding)
        "scalar.authentication.preferredSecuritySchemes[0]=my-oauth-scheme",
        "scalar.authentication.preferredSecuritySchemes[1]=my-api-key",

        // API Key authentication
        "scalar.authentication.apiKey.my-api-key.name=X-API-Key",

        // OAuth2 authentication
        "scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.authorizationUrl=https://auth.example.com/oauth/authorize",
        "scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.tokenUrl=https://auth.example.com/oauth/token",
})
class SpringBootPreferredSecuritySchemesArrayTest {

    @Autowired
    private ScalarProperties properties;

    @Test
    void shouldBindPreferredSecuritySchemesAsArray() {
        // Authentication with array syntax
        ScalarAuthenticationOptions auth = properties.getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPreferredSecuritySchemes()).isNotNull();
        assertThat(auth.getPreferredSecuritySchemes()).hasSize(2);
        assertThat(auth.getPreferredSecuritySchemes().get(0)).isEqualTo("my-oauth-scheme");
        assertThat(auth.getPreferredSecuritySchemes().get(1)).isEqualTo("my-api-key");
    }

    @TestConfiguration
    @EnableConfigurationProperties(ScalarProperties.class)
    static class TestConfig {
        // Empty configuration class to enable @ConfigurationProperties binding
    }

    @org.springframework.boot.autoconfigure.SpringBootApplication
    static class TestApplication {
        // Empty Spring Boot application class for testing
    }
}
