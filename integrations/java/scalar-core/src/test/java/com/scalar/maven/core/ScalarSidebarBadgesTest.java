package com.scalar.maven.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class ScalarSidebarBadgesTest {

    @Test
    void disablesSidebarBadgesByDefault() throws Exception {
        ScalarProperties properties = new ScalarProperties();

        assertThat(properties.isShowBadgesInSidebar()).isFalse();
        assertThat(configuration(properties).get("showBadgesInSidebar").booleanValue()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void serializesSidebarBadgesIndependentlyOfSidebarVisibility(boolean enabled) throws Exception {
        ScalarProperties properties = new ScalarProperties();
        properties.setShowBadgesInSidebar(enabled);
        properties.setShowSidebar(false);

        var config = configuration(properties);

        assertThat(config.get("showBadgesInSidebar").booleanValue()).isEqualTo(enabled);
        assertThat(config.get("showSidebar").booleanValue()).isFalse();
    }

    private JsonNode configuration(ScalarProperties properties) throws Exception {
        String html = ScalarHtmlRenderer.render(properties);
        String json = html.split("Scalar.createApiReference\\('#app', ", 2)[1].split("\\)\\s*</script>", 2)[0];
        return new ObjectMapper().readTree(json);
    }
}
