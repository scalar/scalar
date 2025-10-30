package com.scalar.maven.webjar.internal;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.scalar.maven.webjar.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.webjar.config.DefaultHttpClient;
import com.scalar.maven.webjar.config.ScalarServer;
import com.scalar.maven.webjar.config.ScalarSource;
import com.scalar.maven.webjar.enums.*;

import java.util.List;
import java.util.Map;

/**
 * Internal representation of the configuration for the Scalar API Reference.
 * <p>
 * <strong>Warning:</strong> This class is internal API and should not be used
 * directly.
 * It may change without notice in future versions. Use
 * {@link com.scalar.maven.webjar.ScalarProperties} instead.
 * </p>
 * Based on <a href=
 * "https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarConfiguration {

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

    @JsonProperty("persistAuth")
    private Boolean persistAuth;

    @JsonProperty("documentDownloadType")
    private DocumentDownloadType documentDownloadType;

    @JsonProperty("orderRequiredPropertiesFirst")
    private Boolean orderRequiredPropertiesFirst;

    @JsonProperty("orderSchemaPropertiesBy")
    private PropertyOrder orderSchemaPropertiesBy;

    @JsonProperty("showOperationId")
    private Boolean showOperationId;

    /**
     * Creates a new ScalarConfiguration.
     */
    public ScalarConfiguration() {
    }

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

    public Boolean getPersistAuth() {
        return persistAuth;
    }

    public void setPersistAuth(Boolean persistAuth) {
        this.persistAuth = persistAuth;
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
}
