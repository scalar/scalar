package com.scalar.maven.webjar;

import jakarta.servlet.http.HttpServletRequest;
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
@DisplayName("ScalarActuatorEndpoint")
class ScalarActuatorEndpointTest {

    @Mock
    private ScalarProperties properties;

    @Mock
    private HttpServletRequest request;

    private ScalarActuatorEndpoint endpoint;

    @BeforeEach
    void setUp() {
        endpoint = new ScalarActuatorEndpoint(properties);
    }

    @Nested
    @DisplayName("Scalar UI Endpoint")
    class ScalarUiEndpoint {

        @Test
        @DisplayName("should return HTML with default configuration")
        void shouldReturnHtmlWithDefaultConfiguration() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json");

            // When
            ResponseEntity<String> response = endpoint.scalarUi(request);

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
                    .contains("Scalar.createApiReference('#app',");
        }

        @Test
        @DisplayName("should return HTML with custom URL")
        void shouldReturnHtmlWithCustomUrl() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api/openapi.json");

            // When
            ResponseEntity<String> response = endpoint.scalarUi(request);

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
                    .contains("Scalar.createApiReference('#app',");
        }

        @Test
        @DisplayName("should return HTML with null URL")
        void shouldReturnHtmlWithNullUrl() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn(null);

            // When
            ResponseEntity<String> response = endpoint.scalarUi(request);

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
                    .contains("Scalar.createApiReference('#app',");
        }

        @Test
        @DisplayName("should return HTML with empty URL")
        void shouldReturnHtmlWithEmptyUrl() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("");

            // When
            ResponseEntity<String> response = endpoint.scalarUi(request);

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
                    .contains("Scalar.createApiReference('#app',");
        }

        @Test
        @DisplayName("should return valid HTML structure")
        void shouldReturnValidHtmlStructure() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");

            // When
            ResponseEntity<String> response = endpoint.scalarUi(request);

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .contains("<!doctype html>")
                    .contains("<html>")
                    .contains("<head>")
                    .contains("<title>Scalar API Reference</title>")
                    .contains("<meta charset=\"utf-8\" />")
                    .contains("<meta")
                    .contains("name=\"viewport\"")
                    .contains("content=\"width=device-width, initial-scale=1\"")
                    .contains("</head>")
                    .contains("<body>")
                    .contains("<div id=\"app\"></div>")
                    .contains("<!-- Load the Script -->")
                    .contains("<script src=\"/scalar/scalar.js\"></script>")
                    .contains("<!-- Initialize the Scalar API Reference -->")
                    .contains("<script>")
                    .contains("Scalar.createApiReference('#app',")
                    .contains("</script>")
                    .contains("</body>")
                    .contains("</html>");
        }

        @Test
        @DisplayName("should not contain configuration placeholder")
        void shouldNotContainConfigurationPlaceholder() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api.json");

            // When
            ResponseEntity<String> response = endpoint.scalarUi(request);

            // Then
            String html = response.getBody();
            assertThat(html)
                    .isNotNull()
                    .doesNotContain("__CONFIGURATION__");
        }
    }

    @Nested
    @DisplayName("JavaScript Endpoint")
    class JavaScriptEndpoint {

        @Test
        @DisplayName("should return JavaScript file with correct content type")
        void shouldReturnJavaScriptFileWithCorrectContentType() throws Exception {
            // When
            ResponseEntity<byte[]> response = endpoint.scalarJs();

            // Then
            assertThat(response)
                    .isNotNull()
                    .satisfies(resp -> {
                        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
                        assertThat(resp.getHeaders().getContentType())
                                .isEqualTo(MediaType.valueOf("application/javascript"));
                    });

            byte[] body = response.getBody();
            assertThat(body)
                    .isNotNull()
                    .isNotEmpty();
        }

        @Test
        @DisplayName("should return JavaScript content")
        void shouldReturnJavaScriptContent() throws Exception {
            // When
            ResponseEntity<byte[]> response = endpoint.scalarJs();

            // Then
            byte[] body = response.getBody();
            assertThat(body)
                    .isNotNull()
                    .isNotEmpty();

            String jsContent = new String(body);
            assertThat(jsContent)
                    .isNotEmpty();
        }
    }
}