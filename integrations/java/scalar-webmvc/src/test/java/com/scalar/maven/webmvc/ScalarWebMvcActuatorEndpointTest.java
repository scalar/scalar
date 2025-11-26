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
@DisplayName("ScalarWebMvcActuatorEndpoint")
class ScalarWebMvcActuatorEndpointTest {

    @Mock
    private SpringBootScalarProperties properties;

    @Mock
    private ObjectProvider<SpringBootScalarProperties> propertiesProvider;

    @Mock
    private HttpServletRequest request;

    private ScalarWebMvcActuatorEndpoint endpoint;

    @BeforeEach
    void setUp() {
        lenient().when(propertiesProvider.getObject()).thenReturn(properties);
        endpoint = new ScalarWebMvcActuatorEndpoint();
        ReflectionTestUtils.setField(endpoint, "propertiesProvider", propertiesProvider);
    }

    @Nested
    @DisplayName("Scalar UI Endpoint")
    class ScalarUiEndpoint {

        @Test
        @DisplayName("should return HTML with default configuration")
        void shouldReturnHtmlWithDefaultConfiguration() throws Exception {
            // Given
            when(properties.getUrl()).thenReturn("https://registry.scalar.com/@scalar/apis/galaxy?format=json");
            when(properties.getPageTitle()).thenReturn("Scalar API Reference");
            when(properties.getPath()).thenReturn("/scalar");

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
            when(properties.getPageTitle()).thenReturn("Scalar API Reference");
            when(properties.getPath()).thenReturn("/scalar");

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
    }
}

