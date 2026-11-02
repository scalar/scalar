package com.scalar.maven.webmvc;

import com.scalar.maven.core.ScalarHtmlRenderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ScalarLocalizationTest {

    @ParameterizedTest
    @ValueSource(strings = {"zh-CN", "fr", "ar"})
    void rendersLocaleBoundFromSpringProperties(String locale) throws Exception {
        SpringBootScalarProperties properties = new SpringBootScalarProperties();
        new Binder(new MapConfigurationPropertySource(Map.of(
                "scalar.localization.locale", locale
        ))).bind("scalar", Bindable.ofInstance(properties));

        assertThat(ScalarHtmlRenderer.render(properties))
                .contains("\"localization\":{\"locale\":\"" + locale + "\"}")
                .doesNotContain("\"direction\"", "\"translations\"");
    }

    @Test
    void rendersDirectionAndNestedTranslationOverrides() throws Exception {
        SpringBootScalarProperties properties = new SpringBootScalarProperties();
        new Binder(new MapConfigurationPropertySource(Map.of(
                "scalar.localization.direction", "rtl",
                "scalar.localization.translations.search.label", "搜索",
                "scalar.localization.translations.operation.testRequest", "发送请求"
        ))).bind("scalar", Bindable.ofInstance(properties));

        assertThat(ScalarHtmlRenderer.render(properties))
                .contains("\"direction\":\"rtl\"")
                .contains("\"search\":{\"label\":\"搜索\"}")
                .contains("\"operation\":{\"testRequest\":\"发送请求\"}");
    }

    @Test
    void omitsLocalizationWhenUnconfigured() throws Exception {
        assertThat(ScalarHtmlRenderer.render(new SpringBootScalarProperties()))
                .doesNotContain("\"localization\"");
    }
}
