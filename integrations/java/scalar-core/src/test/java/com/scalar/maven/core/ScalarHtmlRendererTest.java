package com.scalar.maven.core;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("ScalarHtmlRenderer")
class ScalarHtmlRendererTest {

    @Nested
    @DisplayName("render")
    class Render {

        @Test
        @DisplayName("should render HTML with default properties")
        void shouldRenderHtmlWithDefaultProperties() throws IOException {
            ScalarProperties properties = new ScalarProperties();
            String html = ScalarHtmlRenderer.render(properties);
            assertThat(html)
                    .isNotNull()
                    .contains("<!doctype html>")
                    .contains("<html>")
                    .contains("<head>")
                    .contains("<title>Scalar API Reference</title>")
                    .contains("<body>")
                    .contains("<div id=\"app\"></div>")
                    .contains("Scalar.createApiReference('#app',");
        }

        @Test
        @DisplayName("should render HTML with custom page title")
        void shouldRenderHtmlWithCustomPageTitle() throws IOException {
            ScalarProperties properties = new ScalarProperties();
            properties.setPageTitle("My Custom API");
            String html = ScalarHtmlRenderer.render(properties);
            assertThat(html)
                    .isNotNull()
                    .contains("<title>My Custom API</title>");
        }

        @Test
        @DisplayName("should render HTML with custom path")
        void shouldRenderHtmlWithCustomPath() throws IOException {
            ScalarProperties properties = new ScalarProperties();
            properties.setPath("/api/docs");
            String html = ScalarHtmlRenderer.render(properties);
            assertThat(html)
                    .isNotNull()
                    .contains("/api/docs/scalar.js");
        }

        @Test
        @DisplayName("should handle null properties")
        void shouldHandleNullProperties() {
            assertThatThrownBy(() -> ScalarHtmlRenderer.render(null))
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("properties must not be null");
        }

        @Test
        @DisplayName("should handle null path in properties")
        void shouldHandleNullPathInProperties() throws IOException {
            ScalarProperties properties = new ScalarProperties();
            properties.setPath(null);
            // Should use default path when path is null
            String html = ScalarHtmlRenderer.render(properties);
            assertThat(html)
                    .isNotNull()
                    .contains("/scalar/scalar.js");
        }
    }

    @Nested
    @DisplayName("getScalarJsContent")
    class GetScalarJsContent {

        @Test
        @DisplayName("should return JavaScript content")
        void shouldReturnJavaScriptContent() throws IOException {
            byte[] jsContent = ScalarHtmlRenderer.getScalarJsContent();
            assertThat(jsContent)
                    .isNotNull()
                    .isNotEmpty();
        }
    }
}

