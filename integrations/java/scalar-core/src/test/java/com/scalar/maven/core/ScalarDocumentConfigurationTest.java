package com.scalar.maven.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.core.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.core.config.ScalarSource;
import com.scalar.maven.core.internal.JacksonJsonSerializer;
import com.scalar.maven.core.internal.ScalarConfigurationMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScalarDocumentConfigurationTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void rendersProgrammaticObjectsAndEscapesClosingScriptTags() throws Exception {
        Map<String, Object> document = Map.of(
                "openapi", "3.1.2",
                "info", Map.of("title", "Embedded", "version", "1", "description", "</script><script>alert(1)</script>"),
                "paths", Map.of()
        );
        ScalarProperties properties = new ScalarProperties();
        properties.setContent(document);
        ScalarSource source = new ScalarSource();
        source.setUrl("/ignored.json");
        source.setContent(document);
        properties.setSources(List.of(source));
        JsonNode config = mapper.readTree(JacksonJsonSerializer.serialize(ScalarConfigurationMapper.map(properties)));
        assertThat(config.get("content")).isEqualTo(mapper.valueToTree(document));
        assertThat(config.at("/sources/0/content")).isEqualTo(mapper.valueToTree(document));
        assertThat(config.has("url")).isFalse();
        assertThat(config.at("/sources/0/url").isMissingNode()).isTrue();
        String html = ScalarHtmlRenderer.render(properties);
        assertThat(html).doesNotContain("</script><script>alert(1)");
        assertThat(html).contains("\\u003c/script>");
    }

    @Test
    void preservesLegacyAuthenticationApiAndSupportsGroupedAlternatives() throws Exception {
        ScalarAuthenticationOptions auth = new ScalarAuthenticationOptions();
        auth.setPreferredSecurityScheme("key");
        List<String> legacy = auth.getPreferredSecuritySchemes();
        assertThat(legacy).containsExactly("key");
        auth.setPreferredSecuritySchemes(List.of("key", "oauth"));
        assertThat(mapper.valueToTree(auth).get("preferredSecurityScheme").toString())
                .isEqualTo("[\"key\",\"oauth\"]");
        auth.setPreferredSecuritySchemeGroups(List.of(List.of("key", "bearer"), List.of("oauth")));
        assertThat(mapper.valueToTree(auth).get("preferredSecurityScheme").toString())
                .isEqualTo("[[\"key\",\"bearer\"],[\"oauth\"]]");
        auth.setPreferredSecurityScheme(null);
        assertThat(mapper.valueToTree(auth).has("preferredSecurityScheme")).isFalse();
    }

    @Test
    void readsMixedJsonPreferencesWithoutLosingAndGroups() throws Exception {
        ScalarAuthenticationOptions auth = mapper.readValue(
                "{\"preferredSecurityScheme\":[[\"key\",\"bearer\"],\"oauth\"]}", ScalarAuthenticationOptions.class);
        assertThat(auth.getPreferredSecuritySchemeGroups())
                .containsExactly(List.of("key", "bearer"), List.of("oauth"));
        assertThatThrownBy(() -> auth.setPreferredSecuritySchemeFromJson(List.of(12)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void preservesDefaultsAndEmptyValues() throws Exception {
        ScalarProperties properties = new ScalarProperties();
        JsonNode defaults = mapper.valueToTree(ScalarConfigurationMapper.map(properties));
        assertThat(defaults.has("content")).isFalse();
        assertThat(defaults.has("title")).isFalse();
        assertThat(defaults.has("slug")).isFalse();
        assertThat(defaults.get("url").textValue()).contains("galaxy");
        properties.setContent(Map.of());
        assertThat(mapper.valueToTree(ScalarConfigurationMapper.map(properties)).get("content").isEmpty()).isTrue();
        ScalarAuthenticationOptions auth = new ScalarAuthenticationOptions();
        auth.setPreferredSecuritySchemeGroups(List.of());
        auth.setCreateAnySecurityScheme(false);
        JsonNode json = mapper.valueToTree(auth);
        assertThat(json.get("preferredSecurityScheme").isEmpty()).isTrue();
        assertThat(json.get("createAnySecurityScheme").booleanValue()).isFalse();
    }
}
