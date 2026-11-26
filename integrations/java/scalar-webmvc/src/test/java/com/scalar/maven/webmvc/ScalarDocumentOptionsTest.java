package com.scalar.maven.webmvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.core.ScalarHtmlRenderer;
import com.scalar.maven.core.internal.JacksonJsonSerializer;
import com.scalar.maven.core.internal.ScalarConfigurationMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ScalarDocumentOptionsTest {

    private SpringBootScalarProperties bind(Map<String, String> values) {
        SpringBootScalarProperties properties = new SpringBootScalarProperties();
        new Binder(new MapConfigurationPropertySource(values)).bind("scalar", Bindable.ofInstance(properties));
        return properties;
    }

    private JsonNode json(SpringBootScalarProperties properties) throws Exception {
        return new ObjectMapper().readTree(JacksonJsonSerializer.serialize(ScalarConfigurationMapper.map(properties)));
    }

    @Test
    void bindsInlineTextAndDocumentIdentity() throws Exception {
        String description = "openapi: 3.1.2\ninfo: {title: Embedded, version: '1'}\npaths: {}";
        SpringBootScalarProperties properties = bind(Map.of(
                "scalar.content", description,
                "scalar.title", "Document title",
                "scalar.slug", "embedded",
                "scalar.page-title", "Page title"
        ));
        JsonNode config = json(properties);
        assertThat(config.get("content").textValue()).isEqualTo(description);
        assertThat(config.has("url")).isFalse();
        assertThat(config.get("title").textValue()).isEqualTo("Document title");
        assertThat(config.get("slug").textValue()).isEqualTo("embedded");
        assertThat(ScalarHtmlRenderer.render(properties)).contains("<title>Page title</title>");
    }

    @Test
    void bindsInlineObjectsGloballyAndPerSource() throws Exception {
        JsonNode config = json(bind(Map.of(
                "scalar.content-map.openapi", "3.1.2",
                "scalar.content-map.info.title", "Embedded",
                "scalar.content-map.info.version", "1",
                "scalar.sources[0].content-map.openapi", "3.1.2",
                "scalar.sources[0].content-map.info.title", "Source"
        )));
        assertThat(config.at("/content/info/title").textValue()).isEqualTo("Embedded");
        assertThat(config.at("/sources/0/content/info/title").textValue()).isEqualTo("Source");
    }

    @Test
    void bindsAuthenticationGroupsAndExplicitFalse() throws Exception {
        JsonNode config = json(bind(Map.of(
                "scalar.authentication.create-any-security-scheme", "false",
                "scalar.authentication.preferred-security-scheme-groups[0][0]", "apiKey",
                "scalar.authentication.preferred-security-scheme-groups[0][1]", "bearer",
                "scalar.authentication.preferred-security-scheme-groups[1][0]", "oauth"
        )));
        assertThat(config.at("/authentication/createAnySecurityScheme").booleanValue()).isFalse();
        assertThat(config.at("/authentication/preferredSecurityScheme").toString())
                .isEqualTo("[[\"apiKey\",\"bearer\"],[\"oauth\"]]");
        assertThat(config.at("/authentication/preferredSecuritySchemeGroups").isMissingNode()).isTrue();
    }
}
