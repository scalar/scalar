package com.scalar.maven.core;

import com.scalar.maven.core.config.ScalarPathRouting;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScalarPathRoutingConfigurationTest {

    @Test
    void normalizesTrailingSlashAndPrefixesContextWithoutMutatingProperties() throws Exception {
        ScalarProperties properties = new ScalarProperties();
        properties.setPath("/reference/");
        ScalarPathRouting routing = new ScalarPathRouting();
        routing.setBasePath("/docs/");
        properties.setPathRouting(routing);
        String html = ScalarHtmlRenderer.render(properties, "/app");
        assertThat(html).contains("src=\"/app/reference/scalar.js\"");
        assertThat(html).contains("\"basePath\":\"/app/docs\"");
        assertThat(routing.getBasePath()).isEqualTo("/docs");
    }

    @Test
    void supportsExplicitRootAndRejectsPatternsOrUrls() {
        ScalarPathRouting routing = new ScalarPathRouting();
        routing.setBasePath("/");
        assertThat(routing.getBasePath()).isEqualTo("/");
        for (String path : new String[] {"docs", "https://example.com/docs", "//docs", "/docs/*", "/docs?x=1", "/docs#intro"}) {
            assertThatThrownBy(() -> routing.setBasePath(path)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}
