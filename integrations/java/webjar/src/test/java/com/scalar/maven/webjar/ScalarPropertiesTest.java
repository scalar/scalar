package com.scalar.maven.webjar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ScalarProperties")
class ScalarPropertiesTest {

    private ScalarProperties properties;

    @BeforeEach
    void setUp() {
        properties = new ScalarProperties();
    }

    @Nested
    @DisplayName("default values")
    class DefaultValues {

        @Test
        @DisplayName("should have correct default URL")
        void shouldHaveCorrectDefaultUrl() {
            assertThat(properties.getUrl())
                .isEqualTo("https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json");
        }

        @Test
        @DisplayName("should be enabled by default")
        void shouldBeEnabledByDefault() {
            assertThat(properties.isEnabled()).isTrue();
        }

        @Test
        @DisplayName("should have correct default path")
        void shouldHaveCorrectDefaultPath() {
            assertThat(properties.getPath()).isEqualTo("/scalar");
        }
    }

    @Nested
    @DisplayName("URL property")
    class UrlProperty {

        @Test
        @DisplayName("should set and get custom URL")
        void shouldSetAndGetCustomUrl() {
            // Given
            String customUrl = "https://example.com/api.json";

            // When
            properties.setUrl(customUrl);

            // Then
            assertThat(properties.getUrl()).isEqualTo(customUrl);
        }

        @Test
        @DisplayName("should handle null URL")
        void shouldHandleNullUrl() {
            // When
            properties.setUrl(null);

            // Then
            assertThat(properties.getUrl()).isNull();
        }
    }

    @Nested
    @DisplayName("enabled property")
    class EnabledProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get enabled state")
        void shouldSetAndGetEnabledState(boolean enabled) {
            // When
            properties.setEnabled(enabled);

            // Then
            assertThat(properties.isEnabled()).isEqualTo(enabled);
        }
    }

    @Nested
    @DisplayName("path property")
    class PathProperty {

        @Test
        @DisplayName("should set and get custom path")
        void shouldSetAndGetCustomPath() {
            // Given
            String customPath = "/api/docs";

            // When
            properties.setPath(customPath);

            // Then
            assertThat(properties.getPath()).isEqualTo(customPath);
        }

        @Test
        @DisplayName("should handle empty path")
        void shouldHandleEmptyPath() {
            // When
            properties.setPath("");

            // Then
            assertThat(properties.getPath()).isEmpty();
        }

        @Test
        @DisplayName("should handle null path")
        void shouldHandleNullPath() {
            // When
            properties.setPath(null);

            // Then
            assertThat(properties.getPath()).isNull();
        }
    }

    @Nested
    @DisplayName("property combinations")
    class PropertyCombinations {

        @Test
        @DisplayName("should handle all properties being set together")
        void shouldHandleAllPropertiesBeingSetTogether() {
            // Given
            String customUrl = "https://custom.example.com/api.json";
            String customPath = "/custom/path";
            boolean customEnabled = false;

            // When
            properties.setUrl(customUrl);
            properties.setEnabled(customEnabled);
            properties.setPath(customPath);

            // Then
            assertThat(properties.getUrl()).isEqualTo(customUrl);
            assertThat(properties.isEnabled()).isEqualTo(customEnabled);
            assertThat(properties.getPath()).isEqualTo(customPath);
        }

        @Test
        @DisplayName("should maintain property independence")
        void shouldMaintainPropertyIndependence() {
            // Given - set initial values
            properties.setUrl("https://initial.com");
            properties.setEnabled(false);
            properties.setPath("/initial");

            // When - change only one property
            properties.setUrl("https://changed.com");

            // Then - only URL should change, others should remain
            assertThat(properties.getUrl()).isEqualTo("https://changed.com");
            assertThat(properties.isEnabled()).isFalse();
            assertThat(properties.getPath()).isEqualTo("/initial");
        }
    }
}
