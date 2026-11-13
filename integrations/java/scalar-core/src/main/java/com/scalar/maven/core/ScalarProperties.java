package com.scalar.maven.core;


import com.scalar.maven.core.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.core.config.DefaultHttpClient;
import com.scalar.maven.core.config.ScalarHiddenClients;
import com.scalar.maven.core.config.ScalarExternalUrls;
import com.scalar.maven.core.config.ScalarPathRouting;
import com.scalar.maven.core.config.ScalarAgentOptions;
import com.scalar.maven.core.config.ScalarLocalizationOptions;
import com.scalar.maven.core.config.ScalarMcpOptions;
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
 * scalar.url=https://example.com/openapi.json
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

    /** The application-relative base path for path-based navigation. */
    private ScalarPathRouting pathRouting;

    /** The document slug used in navigation URLs. */
    private String slug;

    /** The document title, separate from the HTML page title. */
    private String title;

    /** The inline API description, as text or an object. */
    private Object content;

    private Map<String, Object> contentMap;

    /** The URLs of external Scalar services. */
    private ScalarExternalUrls externalUrls;

    /** The default OAuth 2.0 redirect URI. */
    private String oauth2RedirectUri;

    /** Whether navigation updates the browser URL and history. */
    private Boolean urlRouting;

    /** The clients hidden from code sample selection. */
    private ScalarHiddenClients hiddenClients;

    /** The full client identifiers shown as tabs, in order. */
    private List<String> featuredClients;

    /** The extension keys to display, each beginning with x-. */
    private List<String> showExtensions;

    /** The initial request body view: form or raw. */
    private ScalarRequestBodyView defaultRequestBodyView;

    /** The maximum initially visible request body properties; zero shows all. */
    private Integer maxVisibleRequestBodyProperties;

    /** Whether parameter details are initially expanded. */
    private Boolean expandAllParameters;

    /** Whether to enable arrow-key navigation for schema disclosures. */
    private Boolean schemaKeyboardNav;

    /** Whether to show structural types instead of model names. */
    private Boolean hideModelNames;

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
     * URLs of ESM modules that provide additional API Reference plugins.
     * Each module is imported in the browser before the API Reference mounts,
     * and its default export is registered as a plugin.
     * Defaults to null.
     */
    private List<String> pluginUrls;

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
     * Shows built-in HTTP clients alongside SDK installation tabs in the introduction.
     * Defaults to false, which shows only SDK tabs when installation instructions are available.
     */
    private boolean showDefaultClientsWithSdkInstallation = false;

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

    /**
     * Controls the label for the components.schemas section in the sidebar,
     * content, and search. Use "Schemas" for OpenAPI terminology; "Models" is
     * the default when left unset.
     */
    private String modelsSectionLabel;

    /**
     * Controls whether all nested schema properties are expanded by default.
     * Defaults to false (collapsed).
     */
    private boolean expandAllSchemaProperties = false;

    /**
     * Controls whether the first tag is opened when the URL does not target a
     * specific section.
     * Defaults to true.
     */
    private boolean defaultOpenFirstTag = true;

    /**
     * Controls the MCP (Model Context Protocol) integration. When provided,
     * users can connect the API Reference to MCP-compatible tools.
     */
    private ScalarMcpOptions mcp;

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

    /**
     * Agent Scalar options for single-URL mode. Use a key for production, or set
     * disabled to true to turn off the agent for the entire reference.
     */
    private ScalarAgentOptions agent;

    /**
     * UI localization options. When omitted, the frontend uses English.
     */
    private ScalarLocalizationOptions localization;

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

    public List<String> getPluginUrls() {
        return pluginUrls;
    }

    public void setPluginUrls(List<String> pluginUrls) {
        this.pluginUrls = pluginUrls;
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

    public boolean isShowDefaultClientsWithSdkInstallation() {
        return showDefaultClientsWithSdkInstallation;
    }

    public void setShowDefaultClientsWithSdkInstallation(boolean showDefaultClientsWithSdkInstallation) {
        this.showDefaultClientsWithSdkInstallation = showDefaultClientsWithSdkInstallation;
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

    /**
     * Gets UI localization options.
     *
     * @return the localization options, or null
     */
    public ScalarLocalizationOptions getLocalization() {
        return localization;
    }

    /**
     * Sets UI localization options.
     *
     * @param localization the localization options, or null to use frontend defaults
     */
    public void setLocalization(ScalarLocalizationOptions localization) {
        this.localization = localization;
    }

    public ScalarAgentOptions getAgent() {
        return agent;
    }

    public void setAgent(ScalarAgentOptions agent) {
        this.agent = agent;
    }

    public String getModelsSectionLabel() {
        return modelsSectionLabel;
    }

    public void setModelsSectionLabel(String modelsSectionLabel) {
        this.modelsSectionLabel = modelsSectionLabel;
    }

    public boolean isExpandAllSchemaProperties() {
        return expandAllSchemaProperties;
    }

    public void setExpandAllSchemaProperties(boolean expandAllSchemaProperties) {
        this.expandAllSchemaProperties = expandAllSchemaProperties;
    }

    public boolean isDefaultOpenFirstTag() {
        return defaultOpenFirstTag;
    }

    public void setDefaultOpenFirstTag(boolean defaultOpenFirstTag) {
        this.defaultOpenFirstTag = defaultOpenFirstTag;
    }

    public ScalarMcpOptions getMcp() {
        return mcp;
    }

    public void setMcp(ScalarMcpOptions mcp) {
        this.mcp = mcp;
    }

    /**
     * Gets whether to show structural types instead of model names.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Boolean getHideModelNames() {
        return hideModelNames;
    }

    /**
     * Sets whether to show structural types instead of model names.
     *
     * @param hideModelNames the configured value, or null to use the frontend default
     */
    public void setHideModelNames(Boolean hideModelNames) {
        this.hideModelNames = hideModelNames;
    }

    /**
     * Gets whether to enable arrow-key navigation for schema disclosures.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Boolean getSchemaKeyboardNav() {
        return schemaKeyboardNav;
    }

    /**
     * Sets whether to enable arrow-key navigation for schema disclosures.
     *
     * @param schemaKeyboardNav the configured value, or null to use the frontend default
     */
    public void setSchemaKeyboardNav(Boolean schemaKeyboardNav) {
        this.schemaKeyboardNav = schemaKeyboardNav;
    }

    /**
     * Gets whether parameter details are initially expanded.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Boolean getExpandAllParameters() {
        return expandAllParameters;
    }

    /**
     * Sets whether parameter details are initially expanded.
     *
     * @param expandAllParameters the configured value, or null to use the frontend default
     */
    public void setExpandAllParameters(Boolean expandAllParameters) {
        this.expandAllParameters = expandAllParameters;
    }

    /**
     * Gets the maximum initially visible request body properties; zero shows all.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Integer getMaxVisibleRequestBodyProperties() {
        return maxVisibleRequestBodyProperties;
    }

    /**
     * Sets the maximum initially visible request body properties; zero shows all.
     *
     * @param maxVisibleRequestBodyProperties the configured value, or null to use the frontend default
     */
    public void setMaxVisibleRequestBodyProperties(Integer maxVisibleRequestBodyProperties) {
        this.maxVisibleRequestBodyProperties = maxVisibleRequestBodyProperties;
    }

    /**
     * Gets the initial request body view: form or raw.
     *
     * @return the configured value, or null to use the frontend default
     */
    public ScalarRequestBodyView getDefaultRequestBodyView() {
        return defaultRequestBodyView;
    }

    /**
     * Sets the initial request body view: form or raw.
     *
     * @param defaultRequestBodyView the configured value, or null to use the frontend default
     */
    public void setDefaultRequestBodyView(ScalarRequestBodyView defaultRequestBodyView) {
        this.defaultRequestBodyView = defaultRequestBodyView;
    }

    /**
     * Gets the extension keys to display, each beginning with x-.
     *
     * @return the configured value, or null to use the frontend default
     */
    public List<String> getShowExtensions() {
        return showExtensions;
    }

    /**
     * Sets the extension keys to display, each beginning with x-.
     *
     * @param showExtensions the configured value, or null to use the frontend default
     */
    public void setShowExtensions(List<String> showExtensions) {
        this.showExtensions = showExtensions;
    }

    /**
     * Gets the full client identifiers shown as tabs, in order.
     *
     * @return the configured value, or null to use the frontend default
     */
    public List<String> getFeaturedClients() {
        return featuredClients;
    }

    /**
     * Sets the full client identifiers shown as tabs, in order.
     *
     * @param featuredClients the configured value, or null to use the frontend default
     */
    public void setFeaturedClients(List<String> featuredClients) {
        this.featuredClients = featuredClients;
    }

    /**
     * Gets the clients hidden from code sample selection.
     *
     * @return the configured value, or null to use the frontend default
     */
    public ScalarHiddenClients getHiddenClients() {
        return hiddenClients;
    }

    /**
     * Sets the clients hidden from code sample selection.
     *
     * @param hiddenClients the configured value, or null to use the frontend default
     */
    public void setHiddenClients(ScalarHiddenClients hiddenClients) {
        this.hiddenClients = hiddenClients;
    }

    /**
     * Gets whether navigation updates the browser URL and history.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Boolean getUrlRouting() {
        return urlRouting;
    }

    /**
     * Sets whether navigation updates the browser URL and history.
     *
     * @param urlRouting the configured value, or null to use the frontend default
     */
    public void setUrlRouting(Boolean urlRouting) {
        this.urlRouting = urlRouting;
    }

    /**
     * Gets the default OAuth 2.0 redirect URI.
     *
     * @return the configured value, or null to use the frontend default
     */
    public String getOauth2RedirectUri() {
        return oauth2RedirectUri;
    }

    /**
     * Sets the default OAuth 2.0 redirect URI.
     *
     * @param oauth2RedirectUri the configured value, or null to use the frontend default
     */
    public void setOauth2RedirectUri(String oauth2RedirectUri) {
        this.oauth2RedirectUri = oauth2RedirectUri;
    }

    /**
     * Gets the URLs of external Scalar services.
     *
     * @return the configured value, or null to use the frontend default
     */
    public ScalarExternalUrls getExternalUrls() {
        return externalUrls;
    }

    /**
     * Sets the URLs of external Scalar services.
     *
     * @param externalUrls the configured value, or null to use the frontend default
     */
    public void setExternalUrls(ScalarExternalUrls externalUrls) {
        this.externalUrls = externalUrls;
    }

    /**
     * Gets the inline API description, as text or an object.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Object getContent() {
        return contentMap == null ? content : contentMap;
    }

    /**
     * Sets the inline API description, as text or an object.
     *
     * @param content the configured value, or null to use the frontend default
     */
    public void setContent(Object content) {
        if (content != null && !(content instanceof String) && !(content instanceof java.util.Map<?, ?>)) {
            throw new IllegalArgumentException("Content must be text or an object");
        }
        this.content = content;
        this.contentMap = null;
    }

    /**
     * Gets the document title, separate from the HTML page title.
     *
     * @return the configured value, or null to use the frontend default
     */
    public String getTitle() {
        return title;
    }

    /**
     * Sets the document title, separate from the HTML page title.
     *
     * @param title the configured value, or null to use the frontend default
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * Gets the document slug used in navigation URLs.
     *
     * @return the configured value, or null to use the frontend default
     */
    public String getSlug() {
        return slug;
    }

    /**
     * Sets the document slug used in navigation URLs.
     *
     * @param slug the configured value, or null to use the frontend default
     */
    public void setSlug(String slug) {
        this.slug = slug;
    }

    /**
     * Gets inline object content for Spring binding.
     *
     * @return the object content, or null when text or programmatic content is used
     */
    public Map<String, Object> getContentMap() {
        return contentMap;
    }

    /**
     * Sets inline object content through Spring properties, replacing text content.
     * Serialized as content; contentMap is never sent to the frontend.
     *
     * @param contentMap the API description object, or null
     */
    public void setContentMap(Map<String, Object> contentMap) {
        this.contentMap = contentMap;
        this.content = null;
    }

    /**
     * Gets the application-relative base path for path-based navigation.
     *
     * @return the configured value, or null to use the frontend default
     */
    public ScalarPathRouting getPathRouting() {
        return pathRouting;
    }

    /**
     * Sets the application-relative base path for path-based navigation.
     *
     * @param pathRouting the configured value, or null to use the frontend default
     */
    public void setPathRouting(ScalarPathRouting pathRouting) {
        this.pathRouting = pathRouting;
    }
}
