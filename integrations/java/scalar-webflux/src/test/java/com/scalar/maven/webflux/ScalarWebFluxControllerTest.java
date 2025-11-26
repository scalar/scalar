package com.scalar.maven.webflux;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.Resource;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScalarWebFluxController")
class ScalarWebFluxControllerTest {

    @Mock
    private SpringBootScalarProperties properties;

    @Mock
    private ObjectProvider<SpringBootScalarProperties> propertiesProvider;

    @Mock
    private ServerHttpRequest request;

    private ScalarWebFluxController controller;

    @BeforeEach
    void setUp() {
        lenient().when(propertiesProvider.getObject()).thenReturn(properties);
        controller = new ScalarWebFluxController();
        ReflectionTestUtils.setField(controller, "propertiesProvider", propertiesProvider);
    }

    @Nested
    @DisplayName("GET /scalar endpoint")
    class GetDocsEndpoint {

        @Test
        @DisplayName("should return HTML with default configuration")
        void shouldReturnHtmlWithDefaultConfiguration() {
            // Given
            when(properties.getUrl()).thenReturn("https://registry.scalar.com/@scalar/apis/galaxy?format=json");
            when(properties.getPageTitle()).thenReturn("Scalar API Reference");
            when(properties.getPath()).thenReturn("/scalar");

            // When
            Mono<Resource> resourceMono = controller.getDocs(request);

            // Then
            StepVerifier.create(resourceMono)
                    .assertNext(resource -> {
                        assertThat(resource).isNotNull();
                        assertThat(resource.exists()).isTrue();
                        try {
                            String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                            assertThat(html)
                                    .contains("<!doctype html>")
                                    .contains("<title>Scalar API Reference</title>")
                                    .contains("Scalar.createApiReference('#app',");
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return HTML with custom URL")
        void shouldReturnHtmlWithCustomUrl() {
            // Given
            when(properties.getUrl()).thenReturn("https://example.com/api/openapi.json");
            when(properties.getPageTitle()).thenReturn("Scalar API Reference");
            when(properties.getPath()).thenReturn("/scalar");

            // When
            Mono<Resource> resourceMono = controller.getDocs(request);

            // Then
            StepVerifier.create(resourceMono)
                    .assertNext(resource -> {
                        assertThat(resource).isNotNull();
                        assertThat(resource.exists()).isTrue();
                        try {
                            String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                            assertThat(html)
                                    .contains("<!doctype html>")
                                    .contains("<title>Scalar API Reference</title>");
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return HTML with custom pageTitle")
        void shouldReturnHtmlWithCustomPageTitle() {
            // Given
            when(properties.getPageTitle()).thenReturn("My Custom API Documentation");
            when(properties.getPath()).thenReturn("/scalar");

            // When
            Mono<Resource> resourceMono = controller.getDocs(request);

            // Then
            StepVerifier.create(resourceMono)
                    .assertNext(resource -> {
                        assertThat(resource).isNotNull();
                        assertThat(resource.exists()).isTrue();
                        try {
                            String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                            assertThat(html)
                                    .contains("<title>My Custom API Documentation</title>");
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .verifyComplete();
        }
    }

    @Nested
    @DisplayName("GET /scalar/scalar.js endpoint")
    class GetScalarJsEndpoint {

        @Test
        @DisplayName("should return JavaScript file with correct content type")
        void shouldReturnJavaScriptFileWithCorrectContentType() {
            // When
            Mono<Resource> resourceMono = controller.getScalarJs();

            // Then
            StepVerifier.create(resourceMono)
                    .assertNext(resource -> {
                        assertThat(resource).isNotNull();
                        assertThat(resource.exists()).isTrue();
                        try {
                            byte[] content = resource.getInputStream().readAllBytes();
                            assertThat(content)
                                    .isNotNull()
                                    .isNotEmpty();
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .verifyComplete();
        }
    }
}

