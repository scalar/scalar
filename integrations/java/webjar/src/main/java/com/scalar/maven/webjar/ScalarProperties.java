package com.scalar.maven.webjar;

import com.scalar.maven.webjar.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.webjar.config.DefaultHttpClient;
import com.scalar.maven.webjar.config.ScalarServer;
import com.scalar.maven.webjar.config.ScalarSource;
import com.scalar.maven.webjar.enums.*;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;
import java.util.Map;

/**
 * Configuration properties for the Scalar API Reference integration.
 *
 * <p>
 * This class provides configuration options for customizing the Scalar API
 * Reference
 * endpoint in Spring Boot applications.
 * </p>
 *
 * <p>
 * Example usage in application.properties:
 * </p>
 *
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
     * The URL of the OpenAPI specification to display in the API Reference.
     * Defaults to a sample specification from the Scalar Galaxy CDN.
     */
    private String url = "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json";

    /**
     * List of OpenAPI Reference sources, allowing to set multiple OpenAPI
     * references (replaces {@link #url})
     */
    private List<ScalarSource> sources;

    /**
     * Whether the Scalar API Reference is enabled.
     * Defaults to false.
     */
    private boolean enabled = false;

    /**
     * The path where the API Reference will be available.
     * Defaults to "/scalar".
     */
    private String path = "/scalar";

    /**
     * Whether the sidebar should be shown.
     * Defaults to true.
     */
    private boolean showSidebar = true;

    /**
     * Whether models (components.schemas or definitions) should be hidden from the
     * sidebar, search, and content.
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
     * Custom CSS to inject into the API Reference.
     * Defaults to null.
     */
    private String customCss;

    /**
     * Whether to show the sidebar search bar.
     * Defaults to false.
     */
    private boolean hideSearch = false;

    /**
     * Key used with CTRL/CMD to open the search modal.
     * Defaults to null (uses default key).
     */
    private String searchHotKey;

    /**
     * Whether to expose the Scalar UI as an actuator endpoint.
     * When enabled, the Scalar UI will be available at /actuator/scalar.
     * Defaults to false.
     */
    private boolean actuatorEnabled = false;

    // New properties for enhanced configuration

    /**
     * Controls the path or URL to a favicon for the documentation.
     */
    private String favicon = "favicon.svg";

    /**
     * Controls the proxy URL for API requests.
     */
    private String proxyUrl;

    /**
     * Controls authentication options for prefilling credentials.
     */
    private ScalarAuthenticationOptions authentication;

    /**
     * Controls the default HTTP client (default: shell/curl).
     */
    private DefaultHttpClient defaultHttpClient;

    /**
     * Controls the list of servers for the Scalar API Reference.
     * This list will override the servers defined in the OpenAPI document.
     */
    private List<ScalarServer> servers;

    /**
     * Controls metadata information for configuring meta information out of the
     * box.
     */
    private Map<String, String> metadata;

    // TODO: Add hiddenClients property to support hiding specific HTTP clients

    /**
     * Controls whether to use the default fonts (Inter and JetBrains Mono from
     * CDN).
     * Defaults to true.
     */
    private boolean withDefaultFonts = true;

    /**
     * Controls whether all tags are opened by default.
     * Defaults to false (only relevant tag opened).
     */
    private boolean defaultOpenAllTags = false;

    /**
     * Controls whether all model sections are expanded by default.
     * Defaults to false (collapsed).
     */
    private boolean expandAllModelSections = false;

    /**
     * Controls whether all response sections are expanded by default in operations.
     * Defaults to false (collapsed).
     */
    private boolean expandAllResponses = false;

    /**
     * Controls the base server URL that will be used to prefix all relative OpenAPI
     * server URLs.
     */
    private String baseServerUrl;

    /**
     * Controls whether authentication state is persisted in local storage.
     * Defaults to false (not persisted).
     */
    private boolean persistAuth = false;

    /**
     * Controls whether required properties are ordered first in schema properties.
     * Defaults to true (required first).
     */
    private boolean orderRequiredPropertiesFirst = true;

    /**
     * Controls whether the operation ID is shown in the UI.
     * Defaults to false.
     */
    private boolean showOperationId = false;

    /**
     * Controls whether the client button from the Reference sidebar is hidden.
     * Defaults to false (shown).
     */
    private boolean hideClientButton = false;

    // Primary enum properties (no suffix)

    /**
     * Controls the theme for the Scalar API Reference.
     */
    private ScalarTheme theme = ScalarTheme.DEFAULT;

    /**
     * Controls the layout for the Scalar API Reference.
     */
    private ScalarLayout layout = ScalarLayout.MODERN;

    /**
     * Controls the document download type for the Scalar API Reference.
     */
    private DocumentDownloadType documentDownloadType = DocumentDownloadType.BOTH;

    /**
     * Controls whether the sidebar and search use the operation summary or path.
     */
    private OperationTitleSource operationTitleSource;

    /**
     * Controls the tag sorter for the Scalar API Reference.
     */
    private TagSorter tagSorter;

    /**
     * Controls the operation sorter for the Scalar API Reference.
     */
    private OperationSorter operationSorter;

    /**
     * Forces the theme to always be in the specified state regardless of user
     * preference.
     */
    private ThemeMode forceThemeMode;

    /**
     * Controls the ordering method for schema properties.
     */
    private PropertyOrder schemaPropertyOrder;

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
     * Gets the path where the API Reference will be available.
     *
     * @return the API Reference path
     */
    public String getPath() {
        return path;
    }

    /**
     * Sets the path where the API Reference will be available.
     *
     * @param path the API Reference path
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

    // Getters and setters for new properties

    public String getFavicon() {
        return favicon;
    }

    public void setFavicon(String favicon) {
        this.favicon = favicon;
    }

    public String getProxyUrl() {
        return proxyUrl;
    }

    public void setProxyUrl(String proxyUrl) {
        this.proxyUrl = proxyUrl;
    }

    public ScalarAuthenticationOptions getAuthentication() {
        return authentication;
    }

    public void setAuthentication(ScalarAuthenticationOptions authentication) {
        this.authentication = authentication;
    }

    public DefaultHttpClient getDefaultHttpClient() {
        return defaultHttpClient;
    }

    public void setDefaultHttpClient(DefaultHttpClient defaultHttpClient) {
        this.defaultHttpClient = defaultHttpClient;
    }

    public List<ScalarServer> getServers() {
        return servers;
    }

    public void setServers(List<ScalarServer> servers) {
        this.servers = servers;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    public String getSearchHotKey() {
        return searchHotKey;
    }

    public void setSearchHotKey(String searchHotKey) {
        this.searchHotKey = searchHotKey;
    }

    public boolean isWithDefaultFonts() {
        return withDefaultFonts;
    }

    public void setWithDefaultFonts(boolean withDefaultFonts) {
        this.withDefaultFonts = withDefaultFonts;
    }

    public boolean isDefaultOpenAllTags() {
        return defaultOpenAllTags;
    }

    public void setDefaultOpenAllTags(boolean defaultOpenAllTags) {
        this.defaultOpenAllTags = defaultOpenAllTags;
    }

    public boolean isExpandAllModelSections() {
        return expandAllModelSections;
    }

    public void setExpandAllModelSections(boolean expandAllModelSections) {
        this.expandAllModelSections = expandAllModelSections;
    }

    public boolean isExpandAllResponses() {
        return expandAllResponses;
    }

    public void setExpandAllResponses(boolean expandAllResponses) {
        this.expandAllResponses = expandAllResponses;
    }

    public String getBaseServerUrl() {
        return baseServerUrl;
    }

    public void setBaseServerUrl(String baseServerUrl) {
        this.baseServerUrl = baseServerUrl;
    }

    public boolean isPersistAuth() {
        return persistAuth;
    }

    public void setPersistAuth(boolean persistAuth) {
        this.persistAuth = persistAuth;
    }

    public boolean isOrderRequiredPropertiesFirst() {
        return orderRequiredPropertiesFirst;
    }

    public void setOrderRequiredPropertiesFirst(boolean orderRequiredPropertiesFirst) {
        this.orderRequiredPropertiesFirst = orderRequiredPropertiesFirst;
    }

    public boolean isShowOperationId() {
        return showOperationId;
    }

    public void setShowOperationId(boolean showOperationId) {
        this.showOperationId = showOperationId;
    }

    public boolean isHideClientButton() {
        return hideClientButton;
    }

    public void setHideClientButton(boolean hideClientButton) {
        this.hideClientButton = hideClientButton;
    }

    // Primary enum getters and setters (no suffix)

    /**
     * Gets the theme.
     *
     * @return the theme enum
     */
    public ScalarTheme getTheme() {
        return theme;
    }

    /**
     * Sets the theme.
     *
     * @param theme the theme enum
     */
    public void setTheme(ScalarTheme theme) {
        this.theme = theme;
    }

    /**
     * Gets the layout.
     *
     * @return the layout enum
     */
    public ScalarLayout getLayout() {
        return layout;
    }

    /**
     * Sets the layout.
     *
     * @param layout the layout enum
     */
    public void setLayout(ScalarLayout layout) {
        this.layout = layout;
    }

    /**
     * Gets the document download type.
     *
     * @return the document download type enum
     */
    public DocumentDownloadType getDocumentDownloadType() {
        return documentDownloadType;
    }

    /**
     * Sets the document download type.
     *
     * @param documentDownloadType the document download type enum
     */
    public void setDocumentDownloadType(DocumentDownloadType documentDownloadType) {
        this.documentDownloadType = documentDownloadType;
    }

    /**
     * Gets the operation title source.
     *
     * @return the operation title source enum
     */
    public OperationTitleSource getOperationTitleSource() {
        return operationTitleSource;
    }

    /**
     * Sets the operation title source.
     *
     * @param operationTitleSource the operation title source enum
     */
    public void setOperationTitleSource(OperationTitleSource operationTitleSource) {
        this.operationTitleSource = operationTitleSource;
    }

    /**
     * Gets the tag sorter.
     *
     * @return the tag sorter enum
     */
    public TagSorter getTagSorter() {
        return tagSorter;
    }

    /**
     * Sets the tag sorter.
     *
     * @param tagSorter the tag sorter enum
     */
    public void setTagSorter(TagSorter tagSorter) {
        this.tagSorter = tagSorter;
    }

    /**
     * Gets the operation sorter.
     *
     * @return the operation sorter enum
     */
    public OperationSorter getOperationSorter() {
        return operationSorter;
    }

    /**
     * Sets the operation sorter.
     *
     * @param operationSorter the operation sorter enum
     */
    public void setOperationSorter(OperationSorter operationSorter) {
        this.operationSorter = operationSorter;
    }

    /**
     * Gets the force theme mode.
     *
     * @return the force theme mode enum
     */
    public ThemeMode getForceThemeMode() {
        return forceThemeMode;
    }

    /**
     * Sets the force theme mode.
     *
     * @param forceThemeMode the force theme mode enum
     */
    public void setForceThemeMode(ThemeMode forceThemeMode) {
        this.forceThemeMode = forceThemeMode;
    }

    /**
     * Gets the schema property order.
     *
     * @return the schema property order enum
     */
    public PropertyOrder getSchemaPropertyOrder() {
        return schemaPropertyOrder;
    }

    /**
     * Sets the schema property order.
     *
     * @param schemaPropertyOrder the schema property order enum
     */
    public void setSchemaPropertyOrder(PropertyOrder schemaPropertyOrder) {
        this.schemaPropertyOrder = schemaPropertyOrder;
    }

}
