package com.scalar.maven.webjar;

import com.scalar.maven.webjar.config.ScalarSource;
import com.scalar.maven.webjar.enums.DocumentDownloadType;
import com.scalar.maven.webjar.enums.ScalarLayout;
import com.scalar.maven.webjar.enums.ScalarTheme;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

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
                    .isEqualTo("https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json");
        }

        @Test
        @DisplayName("should be disabled by default")
        void shouldBeDisabledByDefault() {
            assertThat(properties.isEnabled()).isFalse();
        }

        @Test
        @DisplayName("should have correct default path")
        void shouldHaveCorrectDefaultPath() {
            assertThat(properties.getPath()).isEqualTo("/scalar");
        }

        @Test
        @DisplayName("should have correct default showSidebar")
        void shouldHaveCorrectDefaultShowSidebar() {
            assertThat(properties.isShowSidebar()).isTrue();
        }

        @Test
        @DisplayName("should have correct default hideModels")
        void shouldHaveCorrectDefaultHideModels() {
            assertThat(properties.isHideModels()).isFalse();
        }

        @Test
        @DisplayName("should have correct default hideTestRequestButton")
        void shouldHaveCorrectDefaultHideTestRequestButton() {
            assertThat(properties.isHideTestRequestButton()).isFalse();
        }

        @Test
        @DisplayName("should have correct default darkMode")
        void shouldHaveCorrectDefaultDarkMode() {
            assertThat(properties.isDarkMode()).isFalse();
        }

        @Test
        @DisplayName("should have correct default hideDarkModeToggle")
        void shouldHaveCorrectDefaultHideDarkModeToggle() {
            assertThat(properties.isHideDarkModeToggle()).isFalse();
        }

        @Test
        @DisplayName("should have correct default theme")
        void shouldHaveCorrectDefaultTheme() {
            assertThat(properties.getTheme()).isEqualTo(ScalarTheme.DEFAULT);
        }

        @Test
        @DisplayName("should have correct default layout")
        void shouldHaveCorrectDefaultLayout() {
            assertThat(properties.getLayout()).isEqualTo(ScalarLayout.MODERN);
        }

        @Test
        @DisplayName("should have correct default hideSearch")
        void shouldHaveCorrectDefaultHideSearch() {
            assertThat(properties.isHideSearch()).isFalse();
        }

        @Test
        @DisplayName("should have correct default documentDownloadType")
        void shouldHaveCorrectDefaultDocumentDownloadType() {
            assertThat(properties.getDocumentDownloadType()).isEqualTo(DocumentDownloadType.BOTH);
        }

        @Test
        @DisplayName("should have correct default actuatorEnabled")
        void shouldHaveCorrectDefaultActuatorEnabled() {
            assertThat(properties.isActuatorEnabled()).isFalse();
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
    @DisplayName("Sources property")
    class SourcesProperty {

        @Test
        @DisplayName("should set and get custom sources")
        void shouldSetAndGetCustomSources() {
            // Given
            final List<ScalarSource> sources = List.of(
                    new ScalarSource(
                            "url", "title", "slug", true),
                    new ScalarSource());

            // When
            properties.setSources(sources);

            // Then
            assertThat(properties.getSources()).isEqualTo(sources);
        }

        @Test
        @DisplayName("should handle null sources")
        void shouldHandleNullSources() {
            // When
            properties.setSources(null);

            // Then
            assertThat(properties.getSources()).isNull();
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
    @DisplayName("showSidebar property")
    class ShowSidebarProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get showSidebar state")
        void shouldSetAndGetShowSidebarState(boolean showSidebar) {
            // When
            properties.setShowSidebar(showSidebar);

            // Then
            assertThat(properties.isShowSidebar()).isEqualTo(showSidebar);
        }
    }

    @Nested
    @DisplayName("hideModels property")
    class HideModelsProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get hideModels state")
        void shouldSetAndGetHideModelsState(boolean hideModels) {
            // When
            properties.setHideModels(hideModels);

            // Then
            assertThat(properties.isHideModels()).isEqualTo(hideModels);
        }
    }

    @Nested
    @DisplayName("hideTestRequestButton property")
    class HideTestRequestButtonProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get hideTestRequestButton state")
        void shouldSetAndGetHideTestRequestButtonState(boolean hideTestRequestButton) {
            // When
            properties.setHideTestRequestButton(hideTestRequestButton);

            // Then
            assertThat(properties.isHideTestRequestButton()).isEqualTo(hideTestRequestButton);
        }
    }

    @Nested
    @DisplayName("darkMode property")
    class DarkModeProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get darkMode state")
        void shouldSetAndGetDarkModeState(boolean darkMode) {
            // When
            properties.setDarkMode(darkMode);

            // Then
            assertThat(properties.isDarkMode()).isEqualTo(darkMode);
        }
    }

    @Nested
    @DisplayName("hideDarkModeToggle property")
    class HideDarkModeToggleProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get hideDarkModeToggle state")
        void shouldSetAndGetHideDarkModeToggleState(boolean hideDarkModeToggle) {
            // When
            properties.setHideDarkModeToggle(hideDarkModeToggle);

            // Then
            assertThat(properties.isHideDarkModeToggle()).isEqualTo(hideDarkModeToggle);
        }
    }

    @Nested
    @DisplayName("customCss property")
    class CustomCssProperty {

        @Test
        @DisplayName("should set and get custom CSS")
        void shouldSetAndGetCustomCss() {
            // Given
            String customCss = "body { background-color: #BADA55; }";

            // When
            properties.setCustomCss(customCss);

            // Then
            assertThat(properties.getCustomCss()).isEqualTo(customCss);
        }

        @Test
        @DisplayName("should handle null custom CSS")
        void shouldHandleNullCustomCss() {
            // When
            properties.setCustomCss(null);

            // Then
            assertThat(properties.getCustomCss()).isNull();
        }

        @Test
        @DisplayName("should handle empty custom CSS")
        void shouldHandleEmptyCustomCss() {
            // When
            properties.setCustomCss("");

            // Then
            assertThat(properties.getCustomCss()).isEmpty();
        }
    }

    @Nested
    @DisplayName("hideSearch property")
    class HideSearchProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get hideSearch state")
        void shouldSetAndGetHideSearchState(boolean hideSearch) {
            // When
            properties.setHideSearch(hideSearch);

            // Then
            assertThat(properties.isHideSearch()).isEqualTo(hideSearch);
        }
    }

    @Nested
    @DisplayName("actuatorEnabled property")
    class ActuatorEnabledProperty {

        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("should set and get actuatorEnabled state")
        void shouldSetAndGetActuatorEnabledState(boolean actuatorEnabled) {
            // When
            properties.setActuatorEnabled(actuatorEnabled);

            // Then
            assertThat(properties.isActuatorEnabled()).isEqualTo(actuatorEnabled);
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
            boolean customShowSidebar = false;
            boolean customHideModels = true;
            boolean customHideTestRequestButton = true;
            boolean customDarkMode = true;
            boolean customHideDarkModeToggle = true;
            String customCss = "body { background-color: #BADA55; }";
            String customTheme = "mars";
            String customLayout = "classic";
            boolean customHideSearch = true;
            String customDocumentDownloadType = "json";
            boolean customActuatorEnabled = true;

            // When
            properties.setUrl(customUrl);
            properties.setEnabled(customEnabled);
            properties.setPath(customPath);
            properties.setShowSidebar(customShowSidebar);
            properties.setHideModels(customHideModels);
            properties.setHideTestRequestButton(customHideTestRequestButton);
            properties.setDarkMode(customDarkMode);
            properties.setHideDarkModeToggle(customHideDarkModeToggle);
            properties.setCustomCss(customCss);
            properties.setTheme(ScalarTheme.fromValue(customTheme));
            properties.setLayout(ScalarLayout.fromValue(customLayout));
            properties.setHideSearch(customHideSearch);
            properties.setDocumentDownloadType(DocumentDownloadType.fromValue(customDocumentDownloadType));
            properties.setActuatorEnabled(customActuatorEnabled);

            // Then
            assertThat(properties.getUrl()).isEqualTo(customUrl);
            assertThat(properties.isEnabled()).isEqualTo(customEnabled);
            assertThat(properties.getPath()).isEqualTo(customPath);
            assertThat(properties.isShowSidebar()).isEqualTo(customShowSidebar);
            assertThat(properties.isHideModels()).isEqualTo(customHideModels);
            assertThat(properties.isHideTestRequestButton()).isEqualTo(customHideTestRequestButton);
            assertThat(properties.isDarkMode()).isEqualTo(customDarkMode);
            assertThat(properties.isHideDarkModeToggle()).isEqualTo(customHideDarkModeToggle);
            assertThat(properties.getCustomCss()).isEqualTo(customCss);
            assertThat(properties.getTheme()).isEqualTo(ScalarTheme.fromValue(customTheme));
            assertThat(properties.getLayout()).isEqualTo(ScalarLayout.fromValue(customLayout));
            assertThat(properties.isHideSearch()).isEqualTo(customHideSearch);
            assertThat(properties.getDocumentDownloadType())
                    .isEqualTo(DocumentDownloadType.fromValue(customDocumentDownloadType));
            assertThat(properties.isActuatorEnabled()).isEqualTo(customActuatorEnabled);
        }

        @Test
        @DisplayName("should maintain property independence")
        void shouldMaintainPropertyIndependence() {
            final ScalarSource source = new ScalarSource();
            source.setUrl("https://example.com/openapi.json");
            final List<ScalarSource> sources = List.of(source);

            // Given - set initial values
            properties.setUrl("https://initial.com");
            properties.setSources(sources);
            properties.setEnabled(false);
            properties.setPath("/initial");
            properties.setShowSidebar(false);
            properties.setHideModels(true);
            properties.setDarkMode(true);
            properties.setTheme(ScalarTheme.MARS);

            // When - change only one property
            properties.setUrl("https://changed.com");

            // Then - only URL should change, others should remain
            assertThat(properties.getUrl()).isEqualTo("https://changed.com");
            assertThat(properties.getSources()).isEqualTo(sources);
            assertThat(properties.isEnabled()).isFalse();
            assertThat(properties.getPath()).isEqualTo("/initial");
            assertThat(properties.isShowSidebar()).isFalse();
            assertThat(properties.isHideModels()).isTrue();
            assertThat(properties.isDarkMode()).isTrue();
            assertThat(properties.getTheme()).isEqualTo(ScalarTheme.MARS);
        }
    }
}
