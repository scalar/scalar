package com.scalar.maven.webmvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.core.ScalarHtmlRenderer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScalarAdditionalOptionsTest {

    private JsonNode bindAndRender(Map<String, String> values) throws Exception {
        SpringBootScalarProperties properties = new SpringBootScalarProperties();
        new Binder(new MapConfigurationPropertySource(values)).bind("scalar", Bindable.ofInstance(properties));
        String html = ScalarHtmlRenderer.render(properties);
        String json = html.split("Scalar.createApiReference\\('#app', ", 2)[1].split("\\)\\s*</script>", 2)[0];
        return new ObjectMapper().readTree(json);
    }

    @Test
    void bindsAndRendersDefaultClientsWithSdkInstallation() throws Exception {
        assertThat(bindAndRender(Map.of()).get("showDefaultClientsWithSdkInstallation").booleanValue()).isFalse();
        for (boolean enabled : new boolean[]{true, false}) {
            JsonNode config = bindAndRender(Map.of(
                    "scalar.show-default-clients-with-sdk-installation", Boolean.toString(enabled)));
            assertThat(config.get("showDefaultClientsWithSdkInstallation").booleanValue()).isEqualTo(enabled);
        }
    }

    @Test
    void passesUiOptionsIncludingFalseAndZero() throws Exception {
        JsonNode config = bindAndRender(Map.ofEntries(
                Map.entry("scalar.hide-model-names", "true"),
                Map.entry("scalar.schema-keyboard-nav", "true"),
                Map.entry("scalar.expand-all-parameters", "false"),
                Map.entry("scalar.max-visible-request-body-properties", "0"),
                Map.entry("scalar.default-request-body-view", "form"),
                Map.entry("scalar.show-extensions[0]", "x-internal"),
                Map.entry("scalar.featured-clients[0]", "node/fetch"),
                Map.entry("scalar.url-routing", "false"),
                Map.entry("scalar.oauth2-redirect-uri", "https://example.com/callback"),
                Map.entry("scalar.external-urls.registry-url", "https://registry.example.com"),
                Map.entry("scalar.agent.hide-add-api", "true"),
                Map.entry("scalar.sources[0].url", "/api.json"),
                Map.entry("scalar.sources[0].agent.hide-add-api", "false")
        ));
        assertThat(config.get("hideModelNames").booleanValue()).isTrue();
        assertThat(config.get("schemaKeyboardNav").booleanValue()).isTrue();
        assertThat(config.get("expandAllParameters").booleanValue()).isFalse();
        assertThat(config.get("maxVisibleRequestBodyProperties").intValue()).isZero();
        assertThat(config.get("defaultRequestBodyView").textValue()).isEqualTo("form");
        assertThat(config.at("/showExtensions/0").textValue()).isEqualTo("x-internal");
        assertThat(config.at("/featuredClients/0").textValue()).isEqualTo("node/fetch");
        assertThat(config.get("urlRouting").booleanValue()).isFalse();
        assertThat(config.get("oauth2RedirectUri").textValue()).isEqualTo("https://example.com/callback");
        assertThat(config.at("/externalUrls/registryUrl").textValue()).isEqualTo("https://registry.example.com");
        assertThat(config.at("/externalUrls/dashboardUrl").isMissingNode()).isTrue();
        assertThat(config.at("/agent/hideAddApi").booleanValue()).isTrue();
        assertThat(config.at("/sources/0/agent/hideAddApi").booleanValue()).isFalse();
    }

    @Test
    void bindsAllHiddenClientForms() throws Exception {
        assertThat(bindAndRender(Map.of("scalar.hidden-clients.all", "true"))
                .get("hiddenClients").booleanValue()).isTrue();
        assertThat(bindAndRender(Map.of("scalar.hidden-clients.all", "false"))
                .get("hiddenClients").isEmpty()).isTrue();
        assertThat(bindAndRender(Map.of("scalar.hidden-clients.clients[0]", "node/fetch"))
                .at("/hiddenClients/0").textValue()).isEqualTo("node/fetch");
        JsonNode targets = bindAndRender(Map.of(
                "scalar.hidden-clients.targets.python.all", "true",
                "scalar.hidden-clients.targets.node.clients[0]", "fetch"
        )).get("hiddenClients");
        assertThat(targets.get("python").booleanValue()).isTrue();
        assertThat(targets.at("/node/0").textValue()).isEqualTo("fetch");
    }

    @Test
    void rejectsInvalidOptionsDuringBinding() {
        for (Map<String, String> values : java.util.List.of(
                Map.of("scalar.hidden-clients.all", "true", "scalar.hidden-clients.clients[0]", "fetch"),
                Map.of("scalar.hidden-clients.all", "false", "scalar.hidden-clients.targets.node.all", "true"),
                Map.of("scalar.hidden-clients.clients[0]", "fetch", "scalar.hidden-clients.targets.node.all", "true"),
                Map.of("scalar.hidden-clients.targets.node.all", "true", "scalar.hidden-clients.targets.node.clients[0]", "fetch"),
                Map.of("scalar.hidden-clients.targets.node.targets.python.all", "true"),
                Map.of("scalar.default-request-body-view", "invalid"))) {
            assertThatThrownBy(() -> new Binder(new MapConfigurationPropertySource(values))
                    .bind("scalar", Bindable.ofInstance(new SpringBootScalarProperties())))
                    .isInstanceOf(org.springframework.boot.context.properties.bind.BindException.class);
        }
    }

    @Test
    void bindsRawRequestBodyView() throws Exception {
        assertThat(bindAndRender(Map.of("scalar.default-request-body-view", "raw"))
                .get("defaultRequestBodyView").textValue()).isEqualTo("raw");
    }

    @Test
    void leavesNewOptionsUnsetByDefault() throws Exception {
        JsonNode config = bindAndRender(Map.of());
        for (String name : new String[] {"hideModelNames", "schemaKeyboardNav", "expandAllParameters",
                "maxVisibleRequestBodyProperties", "defaultRequestBodyView", "showExtensions",
                "featuredClients", "hiddenClients", "urlRouting", "oauth2RedirectUri", "externalUrls"}) {
            assertThat(config.has(name)).as(name).isFalse();
        }
    }
}
