package com.scalar.maven.webmvc;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScalarWebMvcController")
class ScalarWebMvcControllerTest {

    @Mock
    private SpringBootScalarProperties properties;

    @Mock
    private ObjectProvider<SpringBootScalarProperties> propertiesProvider;

    @Mock
    private HttpServletRequest request;

    private ScalarWebMvcController controller;

    @BeforeEach
    void setUp() {
        lenient().when(propertiesProvider.getObject()).thenReturn(properties);
        controller = new ScalarWebMvcController();
        ReflectionTestUtils.setField(controller, "propertiesProvider", propertiesProvider);
    }

    @Nested
    @DisplayName("GET /scalar endpoint")
    class GetDocsEndpoint {

        @Test
        @DisplayName("should return HTML with default configuration")
        void shouldReturnHtmlWithDefaultConfiguration() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://registry.scalar.com/@scalar/apis/galaxy?format=json");
            when(properties.getPageTitle()).thenReturn("Scalar API Reference");
            when(properties.getPath()).thenReturn("/scalar");

            // When
            ResponseEntity<String> response = controller.getDocs(request);

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
            when(properties.getPageTitle()).thenReturn("Scalar API Reference");
            when(properties.getPath()).thenReturn("/scalar");

            // When
            ResponseEntity<String> response = controller.getDocs(request);

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
        @DisplayName("should return HTML with custom pageTitle")
        void shouldReturnHtmlWithCustomPageTitle() throws Exception {
            // Given
            when(properties.getPageTitle()).thenReturn("My Custom API Documentation");
            when(properties.getPath()).thenReturn("/scalar");

            // When
            ResponseEntity<String> response = controller.getDocs(request);

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
                    .contains("<title>My Custom API Documentation</title>")
                    .contains("Scalar.createApiReference('#app',");
        }
    }

    @Nested
    @DisplayName("GET /scalar/scalar.js endpoint")
    class GetScalarJsEndpoint {

        @Test
        @DisplayName("should return JavaScript file with correct content type")
        void shouldReturnJavaScriptFileWithCorrectContentType() throws Exception {
            // When
            ResponseEntity<byte[]> response = controller.getScalarJs();

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
    }
}

