package com.scalar.maven.core.internal;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
 * Internal representation of the configuration for the Scalar API Reference.
 * <p>
 * <strong>Warning:</strong> This class is internal API and should not be used
 * directly.
 * It may change without notice in future versions. Use
 * {@link com.scalar.maven.core.ScalarProperties} instead.
 * </p>
 * Based on <a href=
 * "https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarConfiguration {

    /** The application-relative base path for path-based navigation. */
    @JsonProperty("pathRouting")
    private ScalarPathRouting pathRouting;

    /** The document slug used in navigation URLs. */
    @JsonProperty("slug")
    private String slug;

    /** The document title, separate from the HTML page title. */
    @JsonProperty("title")
    private String title;

    /** The inline API description, as text or an object. */
    @JsonProperty("content")
    private Object content;

    /** The URLs of external Scalar services. */
    @JsonProperty("externalUrls")
    private ScalarExternalUrls externalUrls;

    /** The default OAuth 2.0 redirect URI. */
    @JsonProperty("oauth2RedirectUri")
    private String oauth2RedirectUri;

    /** Whether navigation updates the browser URL and history. */
    @JsonProperty("urlRouting")
    private Boolean urlRouting;

    /** The clients hidden from code sample selection. */
    @JsonProperty("hiddenClients")
    private ScalarHiddenClients hiddenClients;

    /** The full client identifiers shown as tabs, in order. */
    @JsonProperty("featuredClients")
    private List<String> featuredClients;

    /** The extension keys to display, each beginning with x-. */
    @JsonProperty("showExtensions")
    private List<String> showExtensions;

    /** The initial request body view: form or raw. */
    @JsonProperty("defaultRequestBodyView")
    private ScalarRequestBodyView defaultRequestBodyView;

    /** The maximum initially visible request body properties; zero shows all. */
    @JsonProperty("maxVisibleRequestBodyProperties")
    private Integer maxVisibleRequestBodyProperties;

    /** Whether parameter details are initially expanded. */
    @JsonProperty("expandAllParameters")
    private Boolean expandAllParameters;

    /** Whether to enable arrow-key navigation for schema disclosures. */
    @JsonProperty("schemaKeyboardNav")
    private Boolean schemaKeyboardNav;

    /** Whether to show structural types instead of model names. */
    @JsonProperty("hideModelNames")
    private Boolean hideModelNames;

    @JsonProperty("url")
    private String url;

    @JsonProperty("proxyUrl")
    private String proxyUrl;

    @JsonProperty("showSidebar")
    private Boolean showSidebar;

    @JsonProperty("operationTitleSource")
    private OperationTitleSource operationTitleSource;

    @JsonProperty("hideModels")
    private Boolean hideModels;

    @JsonProperty("hideTestRequestButton")
    private Boolean hideTestRequestButton;

    @JsonProperty("darkMode")
    private Boolean darkMode;

    @JsonProperty("forceDarkModeState")
    private ThemeMode forceDarkModeState;

    @JsonProperty("hideDarkModeToggle")
    private Boolean hideDarkModeToggle;

    @JsonProperty("customCss")
    private String customCss;

    @JsonProperty("pluginUrls")
    private List<String> pluginUrls;

    @JsonProperty("searchHotKey")
    private String searchHotKey;

    @JsonProperty("servers")
    private List<ScalarServer> servers;

    @JsonProperty("metaData")
    private Map<String, String> metaData;

    @JsonProperty("defaultHttpClient")
    private DefaultHttpClient defaultHttpClient;

    @JsonProperty("authentication")
    private ScalarAuthenticationOptions authentication;

    @JsonProperty("withDefaultFonts")
    private Boolean withDefaultFonts;

    @JsonProperty("defaultOpenAllTags")
    private Boolean defaultOpenAllTags;

    @JsonProperty("expandAllModelSections")
    private Boolean expandAllModelSections;

    @JsonProperty("expandAllResponses")
    private Boolean expandAllResponses;

    @JsonProperty("hideSearch")
    private Boolean hideSearch;

    @JsonProperty("tagsSorter")
    private TagSorter tagSorter;

    @JsonProperty("operationsSorter")
    private OperationSorter operationsSorter;

    @JsonProperty("theme")
    private ScalarTheme theme;

    @JsonProperty("layout")
    private ScalarLayout layout;

    @JsonProperty("favicon")
    private String favicon;

    @JsonProperty("hideClientButton")
    private Boolean hideClientButton;

    @JsonProperty("sources")
    private List<ScalarSource> sources;

    @JsonProperty("baseServerURL")
    private String baseServerUrl;

    @JsonProperty("persistSelectedClient")
    private Boolean persistSelectedClient;

    @JsonProperty("persistAuth")
    private Boolean persistAuth;

    @JsonProperty("telemetry")
    private Boolean telemetry;

    @JsonProperty("documentDownloadType")
    private DocumentDownloadType documentDownloadType;

    @JsonProperty("orderRequiredPropertiesFirst")
    private Boolean orderRequiredPropertiesFirst;

    @JsonProperty("orderSchemaPropertiesBy")
    private PropertyOrder orderSchemaPropertiesBy;

    @JsonProperty("showOperationId")
    private Boolean showOperationId;

    @JsonProperty("showDeveloperTools")
    private DeveloperToolsVisibility showDeveloperTools;

    @JsonProperty("agent")
    private ScalarAgentOptions agent;

    /**
     * UI localization options. When omitted, the frontend uses English.
     */
    @JsonProperty("localization")
    private ScalarLocalizationOptions localization;

    @JsonProperty("modelsSectionLabel")
    private String modelsSectionLabel;

    @JsonProperty("expandAllSchemaProperties")
    private Boolean expandAllSchemaProperties;

    @JsonProperty("defaultOpenFirstTag")
    private Boolean defaultOpenFirstTag;

    @JsonProperty("mcp")
    private ScalarMcpOptions mcp;

    // Getters and setters
    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getProxyUrl() {
        return proxyUrl;
    }

    public void setProxyUrl(String proxyUrl) {
        this.proxyUrl = proxyUrl;
    }

    public Boolean getShowSidebar() {
        return showSidebar;
    }

    public void setShowSidebar(Boolean showSidebar) {
        this.showSidebar = showSidebar;
    }

    public OperationTitleSource getOperationTitleSource() {
        return operationTitleSource;
    }

    public void setOperationTitleSource(OperationTitleSource operationTitleSource) {
        this.operationTitleSource = operationTitleSource;
    }

    public Boolean getHideModels() {
        return hideModels;
    }

    public void setHideModels(Boolean hideModels) {
        this.hideModels = hideModels;
    }

    public Boolean getHideTestRequestButton() {
        return hideTestRequestButton;
    }

    public void setHideTestRequestButton(Boolean hideTestRequestButton) {
        this.hideTestRequestButton = hideTestRequestButton;
    }

    public Boolean getDarkMode() {
        return darkMode;
    }

    public void setDarkMode(Boolean darkMode) {
        this.darkMode = darkMode;
    }

    public ThemeMode getForceDarkModeState() {
        return forceDarkModeState;
    }

    public void setForceDarkModeState(ThemeMode forceDarkModeState) {
        this.forceDarkModeState = forceDarkModeState;
    }

    public Boolean getHideDarkModeToggle() {
        return hideDarkModeToggle;
    }

    public void setHideDarkModeToggle(Boolean hideDarkModeToggle) {
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

    public String getSearchHotKey() {
        return searchHotKey;
    }

    public void setSearchHotKey(String searchHotKey) {
        this.searchHotKey = searchHotKey;
    }

    public List<ScalarServer> getServers() {
        return servers;
    }

    public void setServers(List<ScalarServer> servers) {
        this.servers = servers;
    }

    public Map<String, String> getMetaData() {
        return metaData;
    }

    public void setMetaData(Map<String, String> metaData) {
        this.metaData = metaData;
    }

    public DefaultHttpClient getDefaultHttpClient() {
        return defaultHttpClient;
    }

    public void setDefaultHttpClient(DefaultHttpClient defaultHttpClient) {
        this.defaultHttpClient = defaultHttpClient;
    }

    public ScalarAuthenticationOptions getAuthentication() {
        return authentication;
    }

    public void setAuthentication(ScalarAuthenticationOptions authentication) {
        this.authentication = authentication;
    }

    public Boolean getWithDefaultFonts() {
        return withDefaultFonts;
    }

    public void setWithDefaultFonts(Boolean withDefaultFonts) {
        this.withDefaultFonts = withDefaultFonts;
    }

    public Boolean getDefaultOpenAllTags() {
        return defaultOpenAllTags;
    }

    public void setDefaultOpenAllTags(Boolean defaultOpenAllTags) {
        this.defaultOpenAllTags = defaultOpenAllTags;
    }

    public Boolean getExpandAllModelSections() {
        return expandAllModelSections;
    }

    public void setExpandAllModelSections(Boolean expandAllModelSections) {
        this.expandAllModelSections = expandAllModelSections;
    }

    public Boolean getExpandAllResponses() {
        return expandAllResponses;
    }

    public void setExpandAllResponses(Boolean expandAllResponses) {
        this.expandAllResponses = expandAllResponses;
    }

    public Boolean getHideSearch() {
        return hideSearch;
    }

    public void setHideSearch(Boolean hideSearch) {
        this.hideSearch = hideSearch;
    }

    public TagSorter getTagSorter() {
        return tagSorter;
    }

    public void setTagSorter(TagSorter tagSorter) {
        this.tagSorter = tagSorter;
    }

    public OperationSorter getOperationsSorter() {
        return operationsSorter;
    }

    public void setOperationsSorter(OperationSorter operationsSorter) {
        this.operationsSorter = operationsSorter;
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

    public String getFavicon() {
        return favicon;
    }

    public void setFavicon(String favicon) {
        this.favicon = favicon;
    }

    public Boolean getHideClientButton() {
        return hideClientButton;
    }

    public void setHideClientButton(Boolean hideClientButton) {
        this.hideClientButton = hideClientButton;
    }

    public List<ScalarSource> getSources() {
        return sources;
    }

    public void setSources(List<ScalarSource> sources) {
        this.sources = sources;
    }

    public String getBaseServerUrl() {
        return baseServerUrl;
    }

    public void setBaseServerUrl(String baseServerUrl) {
        this.baseServerUrl = baseServerUrl;
    }

    public Boolean getPersistSelectedClient() {
        return persistSelectedClient;
    }

    public void setPersistSelectedClient(Boolean persistSelectedClient) {
        this.persistSelectedClient = persistSelectedClient;
    }

    public Boolean getPersistAuth() {
        return persistAuth;
    }

    public void setPersistAuth(Boolean persistAuth) {
        this.persistAuth = persistAuth;
    }

    public Boolean getTelemetry() {
        return telemetry;
    }

    public void setTelemetry(Boolean telemetry) {
        this.telemetry = telemetry;
    }

    public DocumentDownloadType getDocumentDownloadType() {
        return documentDownloadType;
    }

    public void setDocumentDownloadType(DocumentDownloadType documentDownloadType) {
        this.documentDownloadType = documentDownloadType;
    }

    public Boolean getOrderRequiredPropertiesFirst() {
        return orderRequiredPropertiesFirst;
    }

    public void setOrderRequiredPropertiesFirst(Boolean orderRequiredPropertiesFirst) {
        this.orderRequiredPropertiesFirst = orderRequiredPropertiesFirst;
    }

    public PropertyOrder getOrderSchemaPropertiesBy() {
        return orderSchemaPropertiesBy;
    }

    public void setOrderSchemaPropertiesBy(PropertyOrder orderSchemaPropertiesBy) {
        this.orderSchemaPropertiesBy = orderSchemaPropertiesBy;
    }

    public Boolean getShowOperationId() {
        return showOperationId;
    }

    public void setShowOperationId(Boolean showOperationId) {
        this.showOperationId = showOperationId;
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

    public Boolean getExpandAllSchemaProperties() {
        return expandAllSchemaProperties;
    }

    public void setExpandAllSchemaProperties(Boolean expandAllSchemaProperties) {
        this.expandAllSchemaProperties = expandAllSchemaProperties;
    }

    public Boolean getDefaultOpenFirstTag() {
        return defaultOpenFirstTag;
    }

    public void setDefaultOpenFirstTag(Boolean defaultOpenFirstTag) {
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
        return content;
    }

    /**
     * Sets the inline API description, as text or an object.
     *
     * @param content the configured value, or null to use the frontend default
     */
    public void setContent(Object content) {
        this.content = content;
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
