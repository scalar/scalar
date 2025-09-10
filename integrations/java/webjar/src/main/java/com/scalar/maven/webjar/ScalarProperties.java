package com.scalar.maven.webjar;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Configuration properties for the Scalar API Reference integration.
 *
 * <p>This class provides configuration options for customizing the Scalar API Reference
 * endpoint in Spring Boot applications.</p>
 *
 * <p>Example usage in application.properties:</p>
 * <pre>
 * scalar.url=https://my-api-spec.json
 * scalar.path=/docs
 * scalar.enabled=true
 * scalar.showSidebar=true
 * scalar.hideModels=false
 * scalar.darkMode=true
 * scalar.theme=default
 * scalar.layout=modern
 * </pre>
 *
 * @since 0.1.0
 */
@ConfigurationProperties(prefix = "scalar")
public class ScalarProperties {

    /**
     * The URL of the OpenAPI specification to display in the API reference.
     * Defaults to a sample specification from the Scalar Galaxy CDN.
     */
    private String url = "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json";

    /**
     * List of OpenAPI reference sources, allowing to set multiple OpenAPI references (replaces {@link #url})
     */
    private List<ScalarSource> sources;

    /**
     * Whether the Scalar API Reference is enabled.
     * Defaults to false.
     */
    private boolean enabled = false;

    /**
     * The path where the API reference will be available.
     * Defaults to "/scalar".
     */
    private String path = "/scalar";

    /**
     * Whether the sidebar should be shown.
     * Defaults to true.
     */
    private boolean showSidebar = true;

    /**
     * Whether models (components.schemas or definitions) should be hidden from the sidebar, search, and content.
     * Defaults to false.
     */
    private boolean hideModels = false;

    /**
     * Whether to hide the "Test Request" button.
     * Defaults to false.
     */
    private boolean hideTestRequestButton = false;

    /**
     * Whether dark mode is on or off initially.
     * Defaults to false (light mode).
     */
    private boolean darkMode = false;

    /**
     * Whether to show the dark mode toggle.
     * Defaults to false.
     */
    private boolean hideDarkModeToggle = false;

    /**
     * Custom CSS to inject into the API reference.
     * Defaults to null.
     */
    private String customCss;

    /**
     * The theme to use for the API reference.
     * Can be one of: alternate, default, moon, purple, solarized, bluePlanet, saturn, kepler, mars, deepSpace, laserwave, none.
     * Defaults to "default".
     */
    private String theme = "default";

    /**
     * The layout style to use for the API reference.
     * Can be "modern" or "classic".
     * Defaults to "modern".
     */
    private String layout = "modern";

    /**
     * Whether to show the sidebar search bar.
     * Defaults to false.
     */
    private boolean hideSearch = false;

    /**
     * Sets the file type of the document to download.
     * Can be "json", "yaml", "both", or "none".
     * Defaults to "both".
     */
    private String documentDownloadType = "both";

    /**
     * Whether to expose the Scalar UI as an actuator endpoint.
     * When enabled, the Scalar UI will be available at /actuator/scalar.
     * Defaults to false.
     */
    private boolean actuatorEnabled = false;

    /**
     * Gets the list of OpenAPI specification sources
     *
     * @return list of OpenAPI specification sources
     */
    public List<ScalarSource> getSources() {
        return sources;
    }

    /**
     * Sets the list of OpenAPI specification sources
     *
     * @param sources list of OpenAPI specification sources
     */
    public void setSources(List<ScalarSource> sources) {
        this.sources = sources;
    }

    /**
     * Gets the URL of the OpenAPI specification.
     *
     * @return the OpenAPI specification URL
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL of the OpenAPI specification.
     *
     * @param url the OpenAPI specification URL
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Checks if the Scalar API Reference is enabled.
     *
     * @return true if enabled, false otherwise
     */
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Sets whether the Scalar API Reference is enabled.
     *
     * @param enabled true to enable, false to disable
     */
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    /**
     * Gets the path where the API reference will be available.
     *
     * @return the API reference path
     */
    public String getPath() {
        return path;
    }

    /**
     * Sets the path where the API reference will be available.
     *
     * @param path the API reference path
     */
    public void setPath(String path) {
        this.path = path;
    }

    /**
     * Checks if the sidebar should be shown.
     *
     * @return true if sidebar should be shown, false otherwise
     */
    public boolean isShowSidebar() {
        return showSidebar;
    }

    /**
     * Sets whether the sidebar should be shown.
     *
     * @param showSidebar true to show sidebar, false to hide
     */
    public void setShowSidebar(boolean showSidebar) {
        this.showSidebar = showSidebar;
    }

    /**
     * Checks if models should be hidden.
     *
     * @return true if models should be hidden, false otherwise
     */
    public boolean isHideModels() {
        return hideModels;
    }

    /**
     * Sets whether models should be hidden.
     *
     * @param hideModels true to hide models, false to show
     */
    public void setHideModels(boolean hideModels) {
        this.hideModels = hideModels;
    }

    /**
     * Checks if the test request button should be hidden.
     *
     * @return true if test request button should be hidden, false otherwise
     */
    public boolean isHideTestRequestButton() {
        return hideTestRequestButton;
    }

    /**
     * Sets whether the test request button should be hidden.
     *
     * @param hideTestRequestButton true to hide test request button, false to show
     */
    public void setHideTestRequestButton(boolean hideTestRequestButton) {
        this.hideTestRequestButton = hideTestRequestButton;
    }

    /**
     * Checks if dark mode is enabled.
     *
     * @return true if dark mode is enabled, false otherwise
     */
    public boolean isDarkMode() {
        return darkMode;
    }

    /**
     * Sets whether dark mode is enabled.
     *
     * @param darkMode true to enable dark mode, false to disable
     */
    public void setDarkMode(boolean darkMode) {
        this.darkMode = darkMode;
    }

    /**
     * Checks if the dark mode toggle should be hidden.
     *
     * @return true if dark mode toggle should be hidden, false otherwise
     */
    public boolean isHideDarkModeToggle() {
        return hideDarkModeToggle;
    }

    /**
     * Sets whether the dark mode toggle should be hidden.
     *
     * @param hideDarkModeToggle true to hide dark mode toggle, false to show
     */
    public void setHideDarkModeToggle(boolean hideDarkModeToggle) {
        this.hideDarkModeToggle = hideDarkModeToggle;
    }

    /**
     * Gets the custom CSS.
     *
     * @return the custom CSS string, or null if not set
     */
    public String getCustomCss() {
        return customCss;
    }

    /**
     * Sets the custom CSS to inject.
     *
     * @param customCss the custom CSS string
     */
    public void setCustomCss(String customCss) {
        this.customCss = customCss;
    }

    /**
     * Gets the theme.
     *
     * @return the theme name
     */
    public String getTheme() {
        return theme;
    }

    /**
     * Sets the theme.
     *
     * @param theme the theme name
     */
    public void setTheme(String theme) {
        this.theme = theme;
    }

    /**
     * Gets the layout style.
     *
     * @return the layout style
     */
    public String getLayout() {
        return layout;
    }

    /**
     * Sets the layout style.
     *
     * @param layout the layout style ("modern" or "classic")
     */
    public void setLayout(String layout) {
        this.layout = layout;
    }

    /**
     * Checks if the search bar should be hidden.
     *
     * @return true if search bar should be hidden, false otherwise
     */
    public boolean isHideSearch() {
        return hideSearch;
    }

    /**
     * Sets whether the search bar should be hidden.
     *
     * @param hideSearch true to hide search bar, false to show
     */
    public void setHideSearch(boolean hideSearch) {
        this.hideSearch = hideSearch;
    }

    /**
     * Gets the document download type.
     *
     * @return the document download type
     */
    public String getDocumentDownloadType() {
        return documentDownloadType;
    }

    /**
     * Sets the document download type.
     *
     * @param documentDownloadType the document download type ("json", "yaml", "both", or "none")
     */
    public void setDocumentDownloadType(String documentDownloadType) {
        this.documentDownloadType = documentDownloadType;
    }

    /**
     * Checks if the actuator endpoint is enabled.
     *
     * @return true if actuator endpoint is enabled, false otherwise
     */
    public boolean isActuatorEnabled() {
        return actuatorEnabled;
    }

    /**
     * Sets whether the actuator endpoint is enabled.
     *
     * @param actuatorEnabled true to enable actuator endpoint, false to disable
     */
    public void setActuatorEnabled(boolean actuatorEnabled) {
        this.actuatorEnabled = actuatorEnabled;
    }

    /**
     * Defines an OpenAPI reference source
     */
    public static class ScalarSource {

        /**
         * The URL of the OpenAPI specification to display in the API reference.
         */
        private String url;

        /**
         * The display title of the OpenAPI specification
         * optional
         */
        private String title;

        /**
         * The url slug of the OpenAPI specification
         * optional, would be auto-generated from the title or the index
         */
        private String slug;

        /**
         * Whether this is the default source
         * optional
         */
        private Boolean isDefault;

        /**
         * Creates an OpenAPI reference source
         * {@link #url} must be set
         */
        public ScalarSource() {
        }

        /**
         * Creates an OpenAPI reference source
         *
         * @param url the url of the OpenAPI specification
         * @param title the display title of the OpenAPI specification
         * @param slug the url slug of the OpenAPI specification
         * @param isDefault whether this is the default source
         */
        public ScalarSource(String url, String title, String slug, Boolean isDefault) {
            this.url = url;
            this.title = title;
            this.slug = slug;
            this.isDefault = isDefault;
        }

        /**
         * Gets the URL of the OpenAPI specification
         *
         * @return the url
         */
        public String getUrl() {
            return url;
        }

        /**
         * Sets the URL of the OpenAPI specification
         *
         * @param url the url
         */
        public void setUrl(String url) {
            this.url = url;
        }

        /**
         * Gets the display title of the OpenAPI specification
         *
         * @return the display title or null
         */
        public String getTitle() {
            return title;
        }

        /**
         * Sets the display title of the OpenAPI specification
         *
         * @param title the display title
         */
        public void setTitle(String title) {
            this.title = title;
        }

        /**
         * Gets the url slug of the OpenAPI specification
         *
         * @return the url slug or null
         */
        public String getSlug() {
            return slug;
        }

        /**
         * Sets the url slug of the OpenAPI specification
         *
         * @param slug the url slug
         */
        public void setSlug(String slug) {
            this.slug = slug;
        }

        /**
         * Gets whether this is the default source
         *
         * @return whether this is the default source or null
         */
        public Boolean isDefault() {
            return isDefault;
        }

        /**
         * Sets whether this is the default source
         *
         * @param isDefault whether this is the default source
         */
        public void setDefault(Boolean isDefault) {
            this.isDefault = isDefault;
        }
    }
}
