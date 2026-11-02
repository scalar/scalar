package com.scalar.maven.core.internal;

import com.scalar.maven.core.ScalarProperties;
import com.scalar.maven.core.config.ScalarSource;

/**
 * Mapper class to convert ScalarProperties to ScalarConfiguration for JSON
 * serialization.
 * <p>
 * <strong>Warning:</strong> This class is internal API and should not be used
 * directly.
 * It may change without notice in future versions.
 * </p>
 */
public class ScalarConfigurationMapper {

    private ScalarConfigurationMapper() {
    }


    /**
     * Maps ScalarProperties to ScalarConfiguration.
     *
     * @param properties the ScalarProperties to map
     * @return the mapped ScalarConfiguration
     */
    public static ScalarConfiguration map(ScalarProperties properties) {
        ScalarConfiguration config = new ScalarConfiguration();

        // Basic properties
        config.setUrl(properties.getContent() == null ? properties.getUrl() : null);
        config.setProxyUrl(properties.getProxyUrl());
        config.setShowSidebar(properties.isShowSidebar());
        config.setHideModels(properties.isHideModels());
        config.setHideTestRequestButton(properties.isHideTestRequestButton());
        config.setDarkMode(properties.isDarkMode());
        config.setHideDarkModeToggle(properties.isHideDarkModeToggle());
        config.setCustomCss(properties.getCustomCss());
        config.setPluginUrls(properties.getPluginUrls());
        config.setSearchHotKey(properties.getSearchHotKey());
        config.setServers(properties.getServers());
        config.setMetaData(properties.getMetadata());
        config.setDefaultHttpClient(properties.getDefaultHttpClient());
        config.setAuthentication(properties.getAuthentication());
        config.setWithDefaultFonts(properties.isWithDefaultFonts());
        config.setDefaultOpenAllTags(properties.isDefaultOpenAllTags());
        config.setExpandAllModelSections(properties.isExpandAllModelSections());
        config.setExpandAllResponses(properties.isExpandAllResponses());
        config.setHideSearch(properties.isHideSearch());
        config.setFavicon(properties.getFavicon());
        config.setHideClientButton(properties.isHideClientButton());
        if (properties.getSources() != null) {
            config.setSources(properties.getSources().stream().map(source -> {
                ScalarSource mapped = new ScalarSource(
                        source.getContent() == null ? source.getUrl() : null,
                        source.getTitle(), source.getSlug(), source.isDefault());
                mapped.setContent(source.getContent());
                mapped.setAgent(source.getAgent());
                return mapped;
            }).toList());
        }
        config.setBaseServerUrl(properties.getBaseServerUrl());
        config.setPersistAuth(properties.isPersistAuth());
        config.setTelemetry(properties.isTelemetry());
        config.setOrderRequiredPropertiesFirst(properties.isOrderRequiredPropertiesFirst());
        config.setShowOperationId(properties.isShowOperationId());
        config.setTheme(properties.getTheme());
        config.setLayout(properties.getLayout());
        config.setDocumentDownloadType(properties.getDocumentDownloadType());
        config.setOperationTitleSource(properties.getOperationTitleSource());
        config.setTagSorter(properties.getTagSorter());
        config.setOperationsSorter(properties.getOperationSorter());
        config.setForceDarkModeState(properties.getForceThemeMode());
        config.setOrderSchemaPropertiesBy(properties.getSchemaPropertyOrder());
        config.setShowDeveloperTools(properties.getShowDeveloperTools());
        config.setAgent(properties.getAgent());
        config.setLocalization(properties.getLocalization());
        config.setModelsSectionLabel(properties.getModelsSectionLabel());
        config.setExpandAllSchemaProperties(properties.isExpandAllSchemaProperties());
        config.setDefaultOpenFirstTag(properties.isDefaultOpenFirstTag());
        config.setMcp(properties.getMcp());

        config.setHideModelNames(properties.getHideModelNames());

        config.setSchemaKeyboardNav(properties.getSchemaKeyboardNav());

        config.setExpandAllParameters(properties.getExpandAllParameters());

        config.setMaxVisibleRequestBodyProperties(properties.getMaxVisibleRequestBodyProperties());

        config.setDefaultRequestBodyView(properties.getDefaultRequestBodyView());

        config.setShowExtensions(properties.getShowExtensions());

        config.setFeaturedClients(properties.getFeaturedClients());

        config.setHiddenClients(properties.getHiddenClients());

        config.setUrlRouting(properties.getUrlRouting());

        config.setOauth2RedirectUri(properties.getOauth2RedirectUri());

        config.setExternalUrls(properties.getExternalUrls());

        config.setContent(properties.getContent());

        config.setTitle(properties.getTitle());

        config.setSlug(properties.getSlug());

        config.setPathRouting(properties.getPathRouting());

        return config;
    }
}
