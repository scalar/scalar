package com.scalar.maven.webjar.internal;

import com.scalar.maven.webjar.ScalarProperties;

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

    /**
     * Maps ScalarProperties to ScalarConfiguration.
     *
     * @param properties the ScalarProperties to map
     * @return the mapped ScalarConfiguration
     */
    public static ScalarConfiguration map(ScalarProperties properties) {
        ScalarConfiguration config = new ScalarConfiguration();

        // Basic properties
        config.setUrl(properties.getUrl());
        config.setProxyUrl(properties.getProxyUrl());
        config.setShowSidebar(properties.isShowSidebar());
        config.setHideModels(properties.isHideModels());
        config.setHideTestRequestButton(properties.isHideTestRequestButton());
        config.setDarkMode(properties.isDarkMode());
        config.setHideDarkModeToggle(properties.isHideDarkModeToggle());
        config.setCustomCss(properties.getCustomCss());
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
        config.setSources(properties.getSources());
        config.setBaseServerUrl(properties.getBaseServerUrl());
        config.setPersistAuth(properties.isPersistAuth());
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

        return config;
    }
}
