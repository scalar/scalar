package com.scalar.maven.webjar;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.webjar.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.webjar.authentication.flows.AuthorizationCodeFlow;
import com.scalar.maven.webjar.authentication.flows.ScalarFlows;
import com.scalar.maven.webjar.authentication.schemes.ScalarApiKeySecurityScheme;
import com.scalar.maven.webjar.authentication.schemes.ScalarHttpSecurityScheme;
import com.scalar.maven.webjar.authentication.schemes.ScalarOAuth2SecurityScheme;
import com.scalar.maven.webjar.config.ScalarServer;
import com.scalar.maven.webjar.config.ScalarSource;
import com.scalar.maven.webjar.enums.*;
import com.scalar.maven.webjar.internal.ScalarConfiguration;
import com.scalar.maven.webjar.internal.ScalarConfigurationMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Scalar JSON Serialization")
class ScalarJsonSerializationTest {

    private ObjectMapper objectMapper;
    private ScalarProperties properties;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        properties = new ScalarProperties();
    }

    @Test
    @DisplayName("should serialize complex configuration with nested types and enums correctly")
    void shouldSerializeComplexConfigurationWithNestedTypesAndEnums() throws JsonProcessingException {
        // Given - Set up a complex configuration with all types of properties
        properties.setUrl("https://api.example.com/openapi.json");
        properties.setProxyUrl("https://proxy.example.com");
        properties.setShowSidebar(true);
        properties.setHideModels(false);
        properties.setDarkMode(true);
        properties.setCustomCss("body { background: #f0f0f0; }");
        properties.setFavicon("https://example.com/favicon.ico");
        properties.setWithDefaultFonts(true);
        properties.setDefaultOpenAllTags(false);
        properties.setExpandAllModelSections(true);
        properties.setExpandAllResponses(false);
        properties.setHideSearch(false);
        properties.setHideClientButton(false);
        properties.setPersistAuth(true);
        properties.setOrderRequiredPropertiesFirst(true);
        properties.setShowOperationId(true);
        properties.setBaseServerUrl("https://api.example.com");
        properties.setSearchHotKey("ctrl+l");

        // Set enum properties
        properties.setTheme(ScalarTheme.MARS);
        properties.setLayout(ScalarLayout.CLASSIC);
        properties.setDocumentDownloadType(DocumentDownloadType.YAML);
        properties.setOperationTitleSource(OperationTitleSource.PATH);
        properties.setTagSorter(TagSorter.ALPHA);
        properties.setOperationSorter(OperationSorter.METHOD);
        properties.setForceThemeMode(ThemeMode.DARK);
        properties.setSchemaPropertyOrder(PropertyOrder.ALPHA);

        // Set up servers
        ScalarServer server1 = new ScalarServer();
        server1.setUrl("https://api.example.com/v1");
        server1.setDescription("Production API");

        ScalarServer server2 = new ScalarServer();
        server2.setUrl("https://staging-api.example.com/v1");
        server2.setDescription("Staging API");

        properties.setServers(List.of(server1, server2));

        // Set up metadata
        properties.setMetadata(Map.of(
                "version", "1.0.0",
                "environment", "production"));

        // Set up sources using the new ScalarSource format
        ScalarSource source1 = new ScalarSource();
        source1.setUrl("https://api.example.com/openapi.json");
        source1.setTitle("Main API");
        source1.setSlug("main-api");
        source1.setDefault(true);

        ScalarSource source2 = new ScalarSource();
        source2.setUrl("https://api.example.com/v2/openapi.json");
        source2.setTitle("API v2");
        source2.setSlug("api-v2");
        source2.setDefault(false);

        properties.setSources(List.of(source1, source2));

        // Set up authentication
        ScalarAuthenticationOptions auth = new ScalarAuthenticationOptions();
        auth.setPreferredSecuritySchemes(List.of("apiKey", "oauth2"));

        // API Key scheme
        ScalarApiKeySecurityScheme apiKeyScheme = new ScalarApiKeySecurityScheme();
        apiKeyScheme.setName("X-API-Key");
        apiKeyScheme.setValue("your-api-key-here");
        auth.getSecuritySchemes().put("apiKey", apiKeyScheme);

        // HTTP Basic scheme
        ScalarHttpSecurityScheme httpScheme = new ScalarHttpSecurityScheme();
        httpScheme.setUsername("admin");
        httpScheme.setPassword("secret");
        auth.getSecuritySchemes().put("httpBasic", httpScheme);

        // OAuth2 scheme
        ScalarOAuth2SecurityScheme oauth2Scheme = new ScalarOAuth2SecurityScheme();
        oauth2Scheme.setDefaultScopes(List.of("read", "write"));

        ScalarFlows flows = new ScalarFlows();
        AuthorizationCodeFlow authCodeFlow = new AuthorizationCodeFlow();
        authCodeFlow.setAuthorizationUrl("https://auth.example.com/oauth/authorize");
        authCodeFlow.setTokenUrl("https://auth.example.com/oauth/token");
        flows.setAuthorizationCode(authCodeFlow);
        oauth2Scheme.setFlows(flows);

        auth.getSecuritySchemes().put("oauth2", oauth2Scheme);
        properties.setAuthentication(auth);

        // When - Map properties to configuration and serialize
        ScalarConfiguration config = ScalarConfigurationMapper.map(properties);
        String json = objectMapper.writeValueAsString(config);

        // Then - Verify the JSON structure and content
        assertThat(json).isNotNull();

        // Verify basic properties
        assertThat(json).contains("\"url\":\"https://api.example.com/openapi.json\"");
        assertThat(json).contains("\"proxyUrl\":\"https://proxy.example.com\"");
        assertThat(json).contains("\"showSidebar\":true");
        assertThat(json).contains("\"hideModels\":false");
        assertThat(json).contains("\"darkMode\":true");
        assertThat(json).contains("\"customCss\":\"body { background: #f0f0f0; }\"");
        assertThat(json).contains("\"favicon\":\"https://example.com/favicon.ico\"");
        assertThat(json).contains("\"withDefaultFonts\":true");
        assertThat(json).contains("\"defaultOpenAllTags\":false");
        assertThat(json).contains("\"expandAllModelSections\":true");
        assertThat(json).contains("\"expandAllResponses\":false");
        assertThat(json).contains("\"hideSearch\":false");
        assertThat(json).contains("\"hideClientButton\":false");
        assertThat(json).contains("\"persistAuth\":true");
        assertThat(json).contains("\"orderRequiredPropertiesFirst\":true");
        assertThat(json).contains("\"showOperationId\":true");
        assertThat(json).contains("\"baseServerURL\":\"https://api.example.com\"");
        assertThat(json).contains("\"searchHotKey\":\"ctrl+l\"");

        // Verify enum serialization (should be lowercase)
        assertThat(json).contains("\"theme\":\"mars\"");
        assertThat(json).contains("\"layout\":\"classic\"");
        assertThat(json).contains("\"documentDownloadType\":\"yaml\"");
        assertThat(json).contains("\"operationTitleSource\":\"path\"");
        assertThat(json).contains("\"tagsSorter\":\"alpha\"");
        assertThat(json).contains("\"operationsSorter\":\"method\"");
        assertThat(json).contains("\"forceDarkModeState\":\"dark\"");
        assertThat(json).contains("\"orderSchemaPropertiesBy\":\"alpha\"");

        // Verify servers array
        assertThat(json).contains("\"servers\":[");
        assertThat(json).contains("\"url\":\"https://api.example.com/v1\"");
        assertThat(json).contains("\"description\":\"Production API\"");
        assertThat(json).contains("\"url\":\"https://staging-api.example.com/v1\"");
        assertThat(json).contains("\"description\":\"Staging API\"");

        // Verify metadata object
        assertThat(json).contains("\"metaData\":{");
        assertThat(json).contains("\"version\":\"1.0.0\"");
        assertThat(json).contains("\"environment\":\"production\"");

        // Verify sources array
        assertThat(json).contains("\"sources\":[");
        assertThat(json).contains("\"url\":\"https://api.example.com/openapi.json\"");
        assertThat(json).contains("\"title\":\"Main API\"");
        assertThat(json).contains("\"slug\":\"main-api\"");
        assertThat(json).contains("\"default\":true");
        assertThat(json).contains("\"url\":\"https://api.example.com/v2/openapi.json\"");
        assertThat(json).contains("\"title\":\"API v2\"");
        assertThat(json).contains("\"slug\":\"api-v2\"");
        assertThat(json).contains("\"default\":false");

        // Verify authentication object
        assertThat(json).contains("\"authentication\":{");
        assertThat(json).contains("\"preferredSecurityScheme\":[\"apiKey\",\"oauth2\"]");

        // Verify security schemes
        assertThat(json).contains("\"securitySchemes\":{");
        assertThat(json).contains("\"apiKey\":{");
        assertThat(json).contains("\"name\":\"X-API-Key\"");
        assertThat(json).contains("\"value\":\"your-api-key-here\"");

        assertThat(json).contains("\"httpBasic\":{");
        assertThat(json).contains("\"username\":\"admin\"");
        assertThat(json).contains("\"password\":\"secret\"");

        assertThat(json).contains("\"oauth2\":{");
        assertThat(json).contains("\"x-default-scopes\":[\"read\",\"write\"]");
        assertThat(json).contains("\"flows\":{");
        assertThat(json).contains("\"authorizationCode\":{");
        assertThat(json).contains("\"authorizationUrl\":\"https://auth.example.com/oauth/authorize\"");
        assertThat(json).contains("\"tokenUrl\":\"https://auth.example.com/oauth/token\"");

        // Verify JSON is valid by parsing it back
        ScalarConfiguration parsedConfig = objectMapper.readValue(json, ScalarConfiguration.class);
        assertThat(parsedConfig).isNotNull();
        assertThat(parsedConfig.getUrl()).isEqualTo("https://api.example.com/openapi.json");
        assertThat(parsedConfig.getTheme()).isEqualTo(ScalarTheme.MARS);
        assertThat(parsedConfig.getLayout()).isEqualTo(ScalarLayout.CLASSIC);
        assertThat(parsedConfig.getDocumentDownloadType()).isEqualTo(DocumentDownloadType.YAML);
    }

    @Test
    @DisplayName("should handle null values correctly with @JsonInclude(NON_NULL)")
    void shouldHandleNullValuesCorrectly() throws JsonProcessingException {
        // Given - Create minimal configuration with mostly null values
        properties.setUrl("https://api.example.com/openapi.json");
        // Leave most other properties as null/default

        // When
        ScalarConfiguration config = ScalarConfigurationMapper.map(properties);
        String json = objectMapper.writeValueAsString(config);

        // Then - Verify null values are excluded
        assertThat(json).isNotNull();
        assertThat(json).contains("\"url\":\"https://api.example.com/openapi.json\"");

        // Verify null values are not present
        assertThat(json).doesNotContain("\"proxyUrl\":null");
        assertThat(json).doesNotContain("\"customCss\":null");
        assertThat(json).doesNotContain("\"favicon\":null");
        assertThat(json).doesNotContain("\"authentication\":null");
        assertThat(json).doesNotContain("\"servers\":null");
        assertThat(json).doesNotContain("\"sources\":null");
    }

    @Test
    public void testSinglePreferredSecurityScheme() {
        ScalarAuthenticationOptions auth = new ScalarAuthenticationOptions();
        auth.setPreferredSecurityScheme("my-api-key");

        assertThat(auth.getPreferredSecuritySchemes()).isNotNull();
        assertThat(auth.getPreferredSecuritySchemes()).hasSize(1);
        assertThat(auth.getPreferredSecuritySchemes().get(0)).isEqualTo("my-api-key");
    }

    @Test
    public void testMultiplePreferredSecuritySchemes() {
        ScalarAuthenticationOptions auth = new ScalarAuthenticationOptions();
        auth.setPreferredSecuritySchemes(List.of("my-oauth-scheme", "my-api-key"));

        assertThat(auth.getPreferredSecuritySchemes()).isNotNull();
        assertThat(auth.getPreferredSecuritySchemes()).hasSize(2);
        assertThat(auth.getPreferredSecuritySchemes().get(0)).isEqualTo("my-oauth-scheme");
        assertThat(auth.getPreferredSecuritySchemes().get(1)).isEqualTo("my-api-key");
    }

    @Test
    public void testSinglePreferredSecuritySchemeNull() {
        ScalarAuthenticationOptions auth = new ScalarAuthenticationOptions();
        auth.setPreferredSecurityScheme(null);

        assertThat(auth.getPreferredSecuritySchemes()).isNull();
    }

    @Test
    @DisplayName("should not include type discriminator in JSON output")
    void shouldNotIncludeTypeDiscriminatorInJsonOutput() throws JsonProcessingException {
        // Given - Set up authentication with all three security scheme types
        properties.setUrl("https://api.example.com/openapi.json");

        ScalarAuthenticationOptions auth = new ScalarAuthenticationOptions();

        // API Key scheme
        ScalarApiKeySecurityScheme apiKeyScheme = new ScalarApiKeySecurityScheme();
        apiKeyScheme.setName("X-API-Key");
        apiKeyScheme.setValue("test-key");
        auth.getSecuritySchemes().put("apiKey", apiKeyScheme);

        // HTTP scheme
        ScalarHttpSecurityScheme httpScheme = new ScalarHttpSecurityScheme();
        httpScheme.setUsername("user");
        httpScheme.setPassword("pass");
        auth.getSecuritySchemes().put("httpBasic", httpScheme);

        // OAuth2 scheme
        ScalarOAuth2SecurityScheme oauth2Scheme = new ScalarOAuth2SecurityScheme();
        oauth2Scheme.setDefaultScopes(List.of("read"));
        auth.getSecuritySchemes().put("oauth2", oauth2Scheme);

        properties.setAuthentication(auth);

        // When - Serialize to JSON
        ScalarConfiguration config = ScalarConfigurationMapper.map(properties);
        String json = objectMapper.writeValueAsString(config);

        // Then - Verify type discriminators are NOT present in the JSON
        assertThat(json).doesNotContain("\"type\"");
    }
}
