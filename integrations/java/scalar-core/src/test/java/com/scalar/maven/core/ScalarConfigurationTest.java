package com.scalar.maven.core;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.core.enums.*;
import com.scalar.maven.core.internal.ScalarConfiguration;
import com.scalar.maven.core.internal.ScalarConfigurationMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Test class for ScalarConfiguration and related functionality.
 */
public class ScalarConfigurationTest {

    @Test
    public void testEnumSerialization() throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();

        // Test ScalarTheme serialization
        ScalarTheme theme = ScalarTheme.DEEP_SPACE;
        String themeJson = mapper.writeValueAsString(theme);
        assertEquals("\"deepSpace\"", themeJson);

        // Test ScalarLayout serialization
        ScalarLayout layout = ScalarLayout.MODERN;
        String layoutJson = mapper.writeValueAsString(layout);
        assertEquals("\"modern\"", layoutJson);

        // Test DocumentDownloadType serialization
        DocumentDownloadType downloadType = DocumentDownloadType.BOTH;
        String downloadTypeJson = mapper.writeValueAsString(downloadType);
        assertEquals("\"both\"", downloadTypeJson);

        // Test DeveloperToolsVisibility serialization
        DeveloperToolsVisibility visibility = DeveloperToolsVisibility.ALWAYS;
        String visibilityJson = mapper.writeValueAsString(visibility);
        assertEquals("\"always\"", visibilityJson);
    }

    @Test
    public void testEnumDeserialization() throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();

        // Test ScalarTheme deserialization
        ScalarTheme theme = mapper.readValue("\"deepSpace\"", ScalarTheme.class);
        assertEquals(ScalarTheme.DEEP_SPACE, theme);

        // Test ScalarLayout deserialization
        ScalarLayout layout = mapper.readValue("\"modern\"", ScalarLayout.class);
        assertEquals(ScalarLayout.MODERN, layout);

        // Test DocumentDownloadType deserialization
        DocumentDownloadType downloadType = mapper.readValue("\"both\"", DocumentDownloadType.class);
        assertEquals(DocumentDownloadType.BOTH, downloadType);

        // Test DeveloperToolsVisibility deserialization
        DeveloperToolsVisibility visibility = mapper.readValue("\"always\"", DeveloperToolsVisibility.class);
        assertEquals(DeveloperToolsVisibility.ALWAYS, visibility);
    }

    @Test
    public void testScalarConfigurationMapping() {
        ScalarProperties properties = new ScalarProperties();
        properties.setTheme(ScalarTheme.DEEP_SPACE);
        properties.setLayout(ScalarLayout.MODERN);
        properties.setDocumentDownloadType(DocumentDownloadType.BOTH);
        properties.setShowSidebar(false);
        properties.setHideModels(true);
        properties.setTelemetry(false);
        properties.setShowDeveloperTools(DeveloperToolsVisibility.ALWAYS);

        ScalarConfiguration config = ScalarConfigurationMapper.map(properties);

        assertNotNull(config);
        assertEquals(ScalarTheme.DEEP_SPACE, config.getTheme());
        assertEquals(ScalarLayout.MODERN, config.getLayout());
        assertEquals(DocumentDownloadType.BOTH, config.getDocumentDownloadType());
        assertEquals(false, config.getShowSidebar());
        assertEquals(true, config.getHideModels());
        assertEquals(false, config.getTelemetry());
        assertEquals(DeveloperToolsVisibility.ALWAYS, config.getShowDeveloperTools());
    }

    @Test
    public void testScalarConfigurationWithEnums() {
        ScalarProperties properties = new ScalarProperties();
        properties.setTheme(ScalarTheme.BLUE_PLANET);
        properties.setLayout(ScalarLayout.CLASSIC);
        properties.setDocumentDownloadType(DocumentDownloadType.JSON);
        properties.setOperationTitleSource(OperationTitleSource.SUMMARY);
        properties.setTagSorter(TagSorter.ALPHA);
        properties.setOperationSorter(OperationSorter.METHOD);
        properties.setForceThemeMode(ThemeMode.DARK);
        properties.setSchemaPropertyOrder(PropertyOrder.ALPHA);
        properties.setShowDeveloperTools(DeveloperToolsVisibility.NEVER);

        ScalarConfiguration config = ScalarConfigurationMapper.map(properties);

        assertNotNull(config);
        assertEquals(ScalarTheme.BLUE_PLANET, config.getTheme());
        assertEquals(ScalarLayout.CLASSIC, config.getLayout());
        assertEquals(DocumentDownloadType.JSON, config.getDocumentDownloadType());
        assertEquals(OperationTitleSource.SUMMARY, config.getOperationTitleSource());
        assertEquals(TagSorter.ALPHA, config.getTagSorter());
        assertEquals(OperationSorter.METHOD, config.getOperationsSorter());
        assertEquals(ThemeMode.DARK, config.getForceDarkModeState());
        assertEquals(PropertyOrder.ALPHA, config.getOrderSchemaPropertiesBy());
        assertEquals(DeveloperToolsVisibility.NEVER, config.getShowDeveloperTools());
    }

}

