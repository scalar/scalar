package com.scalar.maven.core.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ScalarSource")
class ScalarSourceTest {

    @Nested
    @DisplayName("construction")
    class Construction {

        @Test
        @DisplayName("should create source with default constructor")
        void shouldCreateSourceWithDefaultConstructor() {
            ScalarSource source = new ScalarSource();
            assertThat(source).isNotNull();
            assertThat(source.getUrl()).isNull();
            assertThat(source.getTitle()).isNull();
            assertThat(source.getSlug()).isNull();
            assertThat(source.isDefault()).isNull();
        }

        @Test
        @DisplayName("should create source with all parameters")
        void shouldCreateSourceWithAllParameters() {
            String url = "https://api.example.com/openapi.json";
            String title = "Example API";
            String slug = "example-api";
            Boolean isDefault = true;
            ScalarSource source = new ScalarSource(url, title, slug, isDefault);
            assertThat(source.getUrl()).isEqualTo(url);
            assertThat(source.getTitle()).isEqualTo(title);
            assertThat(source.getSlug()).isEqualTo(slug);
            assertThat(source.isDefault()).isEqualTo(isDefault);
        }
    }

    @Nested
    @DisplayName("properties")
    class Properties {

        @Test
        @DisplayName("should set and get URL")
        void shouldSetAndGetUrl() {
            ScalarSource source = new ScalarSource();
            String url = "https://api.example.com/openapi.json";
            source.setUrl(url);
            assertThat(source.getUrl()).isEqualTo(url);
        }

        @Test
        @DisplayName("should set and get title")
        void shouldSetAndGetTitle() {
            ScalarSource source = new ScalarSource();
            String title = "Example API";
            source.setTitle(title);
            assertThat(source.getTitle()).isEqualTo(title);
        }

        @Test
        @DisplayName("should set and get slug")
        void shouldSetAndGetSlug() {
            ScalarSource source = new ScalarSource();
            String slug = "example-api";
            source.setSlug(slug);
            assertThat(source.getSlug()).isEqualTo(slug);
        }

        @Test
        @DisplayName("should set and get isDefault")
        void shouldSetAndGetIsDefault() {
            ScalarSource source = new ScalarSource();
            source.setDefault(true);
            assertThat(source.isDefault()).isTrue();
            source.setDefault(false);
            assertThat(source.isDefault()).isFalse();
            source.setDefault(null);
            assertThat(source.isDefault()).isNull();
        }
    }
}

