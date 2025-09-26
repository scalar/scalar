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

import java.util.List;

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
            when(properties.getUrl()).thenReturn("https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json");

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
                    .contains("url: \"https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json\"");
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
        @DisplayName("should handle null URL by converting to empty string")
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
                    .contains("url: \"\"");
        }

        @Test
        @DisplayName("should return HTML with custom sources configuration")
        void shouldReturnHtmlWithCustomSources() throws Exception {
            // Given
            final ScalarProperties.ScalarSource source = new ScalarProperties.ScalarSource();
            source.setUrl("https://example.com/api/openapi.json");

            final List<ScalarProperties.ScalarSource> sources = List.of(
                    source,
                    new ScalarProperties.ScalarSource(
                            "https://anotherexample.com/api.json",
                            "API 2",
                            "another-example",
                            true
                    )
            );
            when(properties.getSources()).thenReturn(sources);

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
                    .containsIgnoringWhitespaces("""
                            sources: [
                                {
                                  url: "https://example.com/api/openapi.json"
                                },
                                {
                                  url: "https://anotherexample.com/api.json",
                                  title: "API 2",
                                  slug: "another-example",
                                  default: true
                                }
                            ]
                            """);
        }

        @Test
        @DisplayName("should return HTML with custom sources configuration")
        void shouldIgnoreInvalidSources() throws Exception {
            // Given
            final ScalarProperties.ScalarSource source = new ScalarProperties.ScalarSource();
            source.setUrl("https://example.com/api/openapi.json");

            final List<ScalarProperties.ScalarSource> sources = List.of(
                    source,
                    // this source has an invalid url and should be ignored
                    new ScalarProperties.ScalarSource(
                            " ", // invalid url
                            "API 2",
                            "another-example",
                            true
                    )
            );
            when(properties.getSources()).thenReturn(sources);

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
                    .containsIgnoringWhitespaces("""
                            sources: [
                            {
                              url: "https://example.com/api/openapi.json"
                            }
                            ]
                            """);
        }

        @Test
        @DisplayName("should handle no sources provided")
        void shouldHandleNoSources() throws Exception {
            // Given
            when(properties.getSources()).thenReturn(List.of());

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
                    .doesNotContain("sources:");
        }

        @Test
        @DisplayName("should include showSidebar configuration when disabled")
        void shouldIncludeShowSidebarConfigurationWhenDisabled() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.isShowSidebar()).thenReturn(false);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("showSidebar: false");
        }

        @Test
        @DisplayName("should include hideModels configuration when enabled")
        void shouldIncludeHideModelsConfigurationWhenEnabled() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.isHideModels()).thenReturn(true);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("hideModels: true");
        }

        @Test
        @DisplayName("should include hideTestRequestButton configuration when enabled")
        void shouldIncludeHideTestRequestButtonConfigurationWhenEnabled() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.isHideTestRequestButton()).thenReturn(true);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("hideTestRequestButton: true");
        }

        @Test
        @DisplayName("should include darkMode configuration when enabled")
        void shouldIncludeDarkModeConfigurationWhenEnabled() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.isDarkMode()).thenReturn(true);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("darkMode: true");
        }

        @Test
        @DisplayName("should include hideDarkModeToggle configuration when enabled")
        void shouldIncludeHideDarkModeToggleConfigurationWhenEnabled() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.isHideDarkModeToggle()).thenReturn(true);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("hideDarkModeToggle: true");
        }

        @Test
        @DisplayName("should include customCss configuration when provided")
        void shouldIncludeCustomCssConfigurationWhenProvided() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.getCustomCss()).thenReturn("body { background-color: #BADA55; }");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("customCss: \"body { background-color: #BADA55; }\"");
        }

        @Test
        @DisplayName("should include theme configuration when not default")
        void shouldIncludeThemeConfigurationWhenNotDefault() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.getTheme()).thenReturn("mars");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("theme: \"mars\"");
        }

        @Test
        @DisplayName("should include layout configuration when not modern")
        void shouldIncludeLayoutConfigurationWhenNotModern() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.getLayout()).thenReturn("classic");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("layout: \"classic\"");
        }

        @Test
        @DisplayName("should include hideSearch configuration when enabled")
        void shouldIncludeHideSearchConfigurationWhenEnabled() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.isHideSearch()).thenReturn(true);

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("hideSearch: true");
        }

        @Test
        @DisplayName("should include documentDownloadType configuration when not both")
        void shouldIncludeDocumentDownloadTypeConfigurationWhenNotBoth() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.getDocumentDownloadType()).thenReturn("json");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("documentDownloadType: \"json\"");
        }

        @Test
        @DisplayName("should handle multiple configuration options together")
        void shouldHandleMultipleConfigurationOptionsTogether() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.isShowSidebar()).thenReturn(false);
            when(properties.isHideModels()).thenReturn(true);
            when(properties.isDarkMode()).thenReturn(true);
            when(properties.getTheme()).thenReturn("mars");
            when(properties.getCustomCss()).thenReturn("body { background-color: #BADA55; }");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("url: \"https://example.com/api.json\"")
                    .contains("showSidebar: false")
                    .contains("hideModels: true")
                    .contains("darkMode: true")
                    .contains("theme: \"mars\"")
                    .contains("customCss: \"body { background-color: #BADA55; }\"");
        }

        @Test
        @DisplayName("should escape special characters in customCss")
        void shouldEscapeSpecialCharactersInCustomCss() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
            when(properties.getCustomCss()).thenReturn("body { content: \"quoted text\"; }");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("customCss: \"body { content: \\\"quoted text\\\"; }\"");
        }
    }

    @Nested
    @DisplayName("HTML structure validation")
    class HtmlStructureValidation {

        @BeforeEach
        void setUp() {
            when(properties.getUrl()).thenReturn("https://example.com/api.json");
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
                    .contains("<title>Scalar API Reference</title>")
                    .contains("<div id=\"app\"></div>")
                    .contains("<script src=\"/scalar/scalar.js\"></script>")
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
                    .contains("url: \"https://example.com/api.json\"");
        }

        @Test
        @DisplayName("should use correct scalar.js URL when path is set to root")
        void shouldUseCorrectScalarJsUrlWhenPathIsSetToRoot() throws Exception {
            // Given
            when(properties.getPath()).thenReturn("/");

            // When
            ResponseEntity<String> response = controller.getDocs();

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("<script src=\"/scalar.js\"></script>");
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
