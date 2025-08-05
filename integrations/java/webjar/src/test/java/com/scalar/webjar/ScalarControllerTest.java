package com.scalar.maven.webjar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScalarController")
class ScalarControllerTest {

    @Mock
    private ScalarProperties properties;

    private ScalarController controller;

    @BeforeEach
    void setUp() {
        controller = new ScalarController(properties);
    }

    @Nested
    @DisplayName("GET /scalar endpoint")
    class GetDocsEndpoint {

        @Test
        @DisplayName("should return HTML with default configuration when URL is not specified")
        void shouldReturnHtmlWithDefaultConfiguration() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            assertThat(response)
                .isNotNull()
                .satisfies(resp -> {
                    assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
                    assertThat(resp.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_HTML);
                });

            String html = response.getBody();
            assertThat(html)
                .isNotNull()
                .contains("<!doctype html>")
                .contains("<title>Scalar API Reference</title>")
                .contains("Scalar.createApiReference('#app',")
                .contains("url: \"https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json\"");
        }

        @Test
        @DisplayName("should return HTML with custom URL configuration")
        void shouldReturnHtmlWithCustomUrl() throws Exception {
            // Given
            String customUrl = "https://example.com/api/openapi.json";
            when(properties.getUrl()).thenReturn(customUrl);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            assertThat(response)
                .isNotNull()
                .satisfies(resp -> {
                    assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
                    assertThat(resp.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_HTML);
                });

            String html = response.getBody();
            assertThat(html)
                .isNotNull()
                .contains("url: \"https://example.com/api/openapi.json\"");
        }

        @Test
        @DisplayName("should handle URLs with special characters correctly")
        void shouldHandleUrlsWithSpecialCharacters() throws Exception {
            // Given
            String urlWithSpecialChars = "https://api.example.com/v1/docs?format=json&version=2.0";
            when(properties.getUrl()).thenReturn(urlWithSpecialChars);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            assertThat(response)
                .isNotNull()
                .satisfies(resp -> assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK));

            String html = response.getBody();
            assertThat(html)
                .isNotNull()
                .contains("url: \"https://api.example.com/v1/docs?format=json&version=2.0\"");
        }

        @Test
        @DisplayName("should handle empty URL gracefully")
        void shouldHandleEmptyUrl() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            assertThat(response)
                .isNotNull()
                .satisfies(resp -> assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK));

            String html = response.getBody();
            assertThat(html)
                .isNotNull()
                .contains("url: \"\"");
        }

        @Test
        @DisplayName("should handle null URL by converting to 'null' string")
        void shouldHandleNullUrl() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn(null);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            assertThat(response)
                .isNotNull()
                .satisfies(resp -> assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK));

            String html = response.getBody();
            assertThat(html)
                .isNotNull()
                .contains("url: \"null\"");
        }
    }

    @Nested
    @DisplayName("HTML structure validation")
    class HtmlStructureValidation {

        @BeforeEach
        void setUp() {
            when(properties.getUrl()).thenReturn("https://test.example.com/api.json");
        }

        @Test
        @DisplayName("should generate valid HTML structure with all required elements")
        void shouldGenerateValidHtmlStructure() throws Exception {
            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                .isNotNull()
                .contains("<!doctype html>")
                .contains("<html>")
                .contains("<head>")
                .contains("<title>Scalar API Reference</title>")
                .contains("<meta charset=\"utf-8\"")
                .contains("name=\"viewport\"")
                .contains("<body>")
                .contains("<div id=\"app\"></div>")
                .contains("<script src=\"https://cdn.jsdelivr.net/npm/@scalar/api-reference\"></script>")
                .contains("Scalar.createApiReference('#app',");
        }

        @Test
        @DisplayName("should replace configuration placeholder with actual configuration")
        void shouldReplaceConfigurationPlaceholder() throws Exception {
            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                .isNotNull()
                .doesNotContain("__CONFIGURATION__")
                .contains("url: \"https://test.example.com/api.json\"");
        }
    }

    @Nested
    @DisplayName("Error handling")
    class ErrorHandling {

        // Note: This test would require mocking the resource loading
        // which is more complex and might not be necessary for this simple controller
        // The current implementation doesn't have explicit error handling for missing resources
    }
}
