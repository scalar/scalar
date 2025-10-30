package com.scalar.maven.webjar;

import com.scalar.maven.webjar.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.webjar.authentication.schemes.ScalarApiKeySecurityScheme;
import com.scalar.maven.webjar.authentication.schemes.ScalarHttpSecurityScheme;
import com.scalar.maven.webjar.authentication.schemes.ScalarOAuth2SecurityScheme;
import com.scalar.maven.webjar.enums.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test class to verify Spring Boot configuration properties binding works
 * correctly.
 * This tests the actual Spring Boot integration with @ConfigurationProperties.
 */
@SpringBootTest(classes = SpringBootConfigurationBindingTest.TestApplication.class)
@TestPropertySource(properties = {
        // Basic configuration
        "scalar.enabled=true",
        "scalar.path=/docs",
        "scalar.url=https://test.example.com/openapi.json",

        // UI configuration
        "scalar.showSidebar=false",
        "scalar.hideModels=true",
        "scalar.hideTestRequestButton=true",
        "scalar.hideSearch=true",
        "scalar.darkMode=true",
        "scalar.hideDarkModeToggle=true",
        "scalar.customCss=body { background: red; }",

        // Theme and layout (using string values that Spring Boot should convert to
        // enums)
        "scalar.theme=mars",
        "scalar.layout=classic",
        "scalar.forceThemeMode=dark",

        // Content organization
        "scalar.operationTitleSource=summary",
        "scalar.tagSorter=alpha",
        "scalar.operationSorter=method",
        "scalar.schemaPropertyOrder=alpha",
        "scalar.documentDownloadType=yaml",

        // Search and navigation (using available properties)
        "scalar.hideSearch=true",

        // Authentication (single string syntax - works with setPreferredSecurityScheme)
        "scalar.authentication.preferredSecurityScheme=my-api-key",

        // API Key authentication
        "scalar.authentication.apiKey.my-api-key.name=X-API-Key",

        // OAuth2 authentication
        "scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.authorizationUrl=https://auth.example.com/oauth/authorize",
        "scalar.authentication.oauth2.my-oauth-scheme.flows.authorizationCode.tokenUrl=https://auth.example.com/oauth/token",

        // HTTP Basic authentication
        "scalar.authentication.http.my-basic-auth.username=testuser",
        "scalar.authentication.http.my-basic-auth.password=testpass",

        // Server configuration
        "scalar.servers[0].url=https://api.example.com/v1",
        "scalar.servers[0].description=Production server",
        "scalar.servers[1].url=https://staging-api.example.com/v1",
        "scalar.servers[1].description=Staging server",

        // Default HTTP client
        "scalar.defaultHttpClient.targetKey=java",
        "scalar.defaultHttpClient.clientKey=http",
})
class SpringBootConfigurationBindingTest {

    @Autowired
    private ScalarProperties properties;

    @Test
    void shouldBindBasicConfigurationProperties() {
        // Basic configuration
        assertThat(properties.isEnabled()).isTrue();
        assertThat(properties.getPath()).isEqualTo("/docs");
        assertThat(properties.getUrl()).isEqualTo("https://test.example.com/openapi.json");
    }

    @Test
    void shouldBindUIConfigurationProperties() {
        // UI configuration
        assertThat(properties.isShowSidebar()).isFalse();
        assertThat(properties.isHideModels()).isTrue();
        assertThat(properties.isHideTestRequestButton()).isTrue();
        assertThat(properties.isHideSearch()).isTrue();
        assertThat(properties.isDarkMode()).isTrue();
        assertThat(properties.isHideDarkModeToggle()).isTrue();
        assertThat(properties.getCustomCss()).isEqualTo("body { background: red; }");
    }

    @Test
    void shouldBindEnumPropertiesFromStringValues() {
        // Theme and layout - Spring Boot should convert strings to enums
        assertThat(properties.getTheme()).isEqualTo(ScalarTheme.MARS);
        assertThat(properties.getLayout()).isEqualTo(ScalarLayout.CLASSIC);
        assertThat(properties.getForceThemeMode()).isEqualTo(ThemeMode.DARK);
    }

    @Test
    void shouldBindContentOrganizationProperties() {
        // Content organization
        assertThat(properties.getOperationTitleSource()).isEqualTo(OperationTitleSource.SUMMARY);
        assertThat(properties.getTagSorter()).isEqualTo(TagSorter.ALPHA);
        assertThat(properties.getOperationSorter()).isEqualTo(OperationSorter.METHOD);
        assertThat(properties.getSchemaPropertyOrder()).isEqualTo(PropertyOrder.ALPHA);
        assertThat(properties.getDocumentDownloadType()).isEqualTo(DocumentDownloadType.YAML);
    }

    @Test
    void shouldBindSearchAndNavigationProperties() {
        // Search and navigation
        assertThat(properties.isHideSearch()).isTrue();
    }

    @Test
    void shouldBindAuthenticationProperties() {
        // Authentication
        ScalarAuthenticationOptions auth = properties.getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPreferredSecuritySchemes()).containsExactly("my-api-key");

        assertThat(auth.getSecuritySchemes()).hasSize(3);

        // Verify API Key security scheme
        ScalarApiKeySecurityScheme apiKeyScheme = (ScalarApiKeySecurityScheme) auth.getSecuritySchemes()
                .get("my-api-key");
        assertThat(apiKeyScheme).isNotNull();
        assertThat(apiKeyScheme.getName()).isEqualTo("X-API-Key");

        // Verify OAuth2 security scheme
        ScalarOAuth2SecurityScheme oauth2Scheme = (ScalarOAuth2SecurityScheme) auth.getSecuritySchemes()
                .get("my-oauth-scheme");
        assertThat(oauth2Scheme).isNotNull();
        assertThat(oauth2Scheme.getFlows()).isNotNull();
        assertThat(oauth2Scheme.getFlows().getAuthorizationCode()).isNotNull();
        assertThat(oauth2Scheme.getFlows().getAuthorizationCode().getAuthorizationUrl())
                .isEqualTo("https://auth.example.com/oauth/authorize");
        assertThat(oauth2Scheme.getFlows().getAuthorizationCode().getTokenUrl())
                .isEqualTo("https://auth.example.com/oauth/token");

        // Verify HTTP Basic security scheme
        ScalarHttpSecurityScheme httpScheme = (ScalarHttpSecurityScheme) auth.getSecuritySchemes().get("my-basic-auth");
        assertThat(httpScheme).isNotNull();
        assertThat(httpScheme.getUsername()).isEqualTo("testuser");
        assertThat(httpScheme.getPassword()).isEqualTo("testpass");
    }

    @Test
    void shouldBindServerConfigurationProperties() {
        // Server configuration
        assertThat(properties.getServers()).hasSize(2);
        assertThat(properties.getServers().get(0).getUrl()).isEqualTo("https://api.example.com/v1");
        assertThat(properties.getServers().get(0).getDescription()).isEqualTo("Production server");
        assertThat(properties.getServers().get(1).getUrl()).isEqualTo("https://staging-api.example.com/v1");
        assertThat(properties.getServers().get(1).getDescription()).isEqualTo("Staging server");
    }

    @Test
    void shouldBindDefaultHttpClientProperties() {
        // Default HTTP client
        assertThat(properties.getDefaultHttpClient()).isNotNull();
        assertThat(properties.getDefaultHttpClient().getTargetKey()).isEqualTo(ScalarTarget.JAVA);
        assertThat(properties.getDefaultHttpClient().getClientKey()).isEqualTo(ScalarClient.HTTP);
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
