package com.scalar.maven.core;

import com.scalar.maven.core.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.core.config.DefaultHttpClient;
import com.scalar.maven.core.config.ScalarServer;
import com.scalar.maven.core.config.ScalarSource;
import com.scalar.maven.core.enums.*;

import java.util.List;
import java.util.Map;

/**
 * Configuration properties for the Scalar API Reference integration.
 *
 * <p>
 * This class provides configuration options for customizing the Scalar API
 * Reference endpoint.
 * </p>
 *
 * <p>
 * Example usage in application.properties (when used with Spring Boot):
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
 */
public class ScalarProperties {

    /**
     * The URL of the OpenAPI specification to display in the API Reference.
     * Defaults to a sample specification from the Scalar Galaxy CDN.
     */
    private String url = "https://registry.scalar.com/@scalar/apis/galaxy?format=json";

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
     * Controls the title of the HTML document.
     * Defaults to "Scalar API Reference".
     */
    private String pageTitle = "Scalar API Reference";

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
     * Controls whether telemetry is enabled.
     * Telemetry tracks only whether a request was sent through the API client.
     * We don't track who sent the request, what request was sent, or where it was
     * sent to.
     * Defaults to true (enabled).
     */
    private boolean telemetry = true;

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
     * Controls the visibility of the developer tools toolbar.
     */
    private DeveloperToolsVisibility showDeveloperTools;

    // Getters and setters

    public List<ScalarSource> getSources() {
        return sources;
    }

    public void setSources(List<ScalarSource> sources) {
        this.sources = sources;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getPageTitle() {
        return pageTitle;
    }

    public void setPageTitle(String pageTitle) {
        this.pageTitle = pageTitle;
    }

    public boolean isShowSidebar() {
        return showSidebar;
    }

    public void setShowSidebar(boolean showSidebar) {
        this.showSidebar = showSidebar;
    }

    public boolean isHideModels() {
        return hideModels;
    }

    public void setHideModels(boolean hideModels) {
        this.hideModels = hideModels;
    }

    public boolean isHideTestRequestButton() {
        return hideTestRequestButton;
    }

    public void setHideTestRequestButton(boolean hideTestRequestButton) {
        this.hideTestRequestButton = hideTestRequestButton;
    }

    public boolean isDarkMode() {
        return darkMode;
    }

    public void setDarkMode(boolean darkMode) {
        this.darkMode = darkMode;
    }

    public boolean isHideDarkModeToggle() {
        return hideDarkModeToggle;
    }

    public void setHideDarkModeToggle(boolean hideDarkModeToggle) {
        this.hideDarkModeToggle = hideDarkModeToggle;
    }

    public String getCustomCss() {
        return customCss;
    }

    public void setCustomCss(String customCss) {
        this.customCss = customCss;
    }

    public boolean isHideSearch() {
        return hideSearch;
    }

    public void setHideSearch(boolean hideSearch) {
        this.hideSearch = hideSearch;
    }

    public String getSearchHotKey() {
        return searchHotKey;
    }

    public void setSearchHotKey(String searchHotKey) {
        this.searchHotKey = searchHotKey;
    }

    public boolean isActuatorEnabled() {
        return actuatorEnabled;
    }

    public void setActuatorEnabled(boolean actuatorEnabled) {
        this.actuatorEnabled = actuatorEnabled;
    }

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

    public boolean isTelemetry() {
        return telemetry;
    }

    public void setTelemetry(boolean telemetry) {
        this.telemetry = telemetry;
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

    public ScalarTheme getTheme() {
        return theme;
    }

    public void setTheme(ScalarTheme theme) {
        this.theme = theme;
    }

    public ScalarLayout getLayout() {
        return layout;
    }

    public void setLayout(ScalarLayout layout) {
        this.layout = layout;
    }

    public DocumentDownloadType getDocumentDownloadType() {
        return documentDownloadType;
    }

    public void setDocumentDownloadType(DocumentDownloadType documentDownloadType) {
        this.documentDownloadType = documentDownloadType;
    }

    public OperationTitleSource getOperationTitleSource() {
        return operationTitleSource;
    }

    public void setOperationTitleSource(OperationTitleSource operationTitleSource) {
        this.operationTitleSource = operationTitleSource;
    }

    public TagSorter getTagSorter() {
        return tagSorter;
    }

    public void setTagSorter(TagSorter tagSorter) {
        this.tagSorter = tagSorter;
    }

    public OperationSorter getOperationSorter() {
        return operationSorter;
    }

    public void setOperationSorter(OperationSorter operationSorter) {
        this.operationSorter = operationSorter;
    }

    public ThemeMode getForceThemeMode() {
        return forceThemeMode;
    }

    public void setForceThemeMode(ThemeMode forceThemeMode) {
        this.forceThemeMode = forceThemeMode;
    }

    public PropertyOrder getSchemaPropertyOrder() {
        return schemaPropertyOrder;
    }

    public void setSchemaPropertyOrder(PropertyOrder schemaPropertyOrder) {
        this.schemaPropertyOrder = schemaPropertyOrder;
    }

    public DeveloperToolsVisibility getShowDeveloperTools() {
        return showDeveloperTools;
    }

    public void setShowDeveloperTools(DeveloperToolsVisibility showDeveloperTools) {
        this.showDeveloperTools = showDeveloperTools;
    }
}

