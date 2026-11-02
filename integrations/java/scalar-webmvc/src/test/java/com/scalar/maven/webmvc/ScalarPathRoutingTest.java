package com.scalar.maven.webmvc;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScalarPathRoutingTest {

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    static class WebConfiguration {
    }

    private final WebApplicationContextRunner runner = new WebApplicationContextRunner()
            .withUserConfiguration(WebConfiguration.class)
            .withConfiguration(AutoConfigurations.of(ScalarWebMvcAutoConfiguration.class));

    @Test
    void servesDeepLinksAndBundleWithContextPath() {
        runner.withPropertyValues("scalar.path=/reference/", "scalar.path-routing.base-path=/docs/")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    MockMvc client = MockMvcBuilders.webAppContextSetup(context).build();
                    for (String path : new String[] {"/docs", "/docs/", "/docs/example/tag/pets/get/pets"}) {
                        String html = client.perform(get("/app" + path).contextPath("/app"))
                                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
                        assertThat(html).contains("src=\"/app/reference/scalar.js\"");
                        assertThat(html).contains("\"pathRouting\":{\"basePath\":\"/app/docs\"}");
                    }
                    client.perform(get("/app/reference/scalar.js").contextPath("/app"))
                            .andExpect(status().isOk());
                    client.perform(get("/app/unrelated").contextPath("/app"))
                            .andExpect(status().isNotFound());
                });
    }

    @Test
    void keepsExactBundleRouteWhenBasePathsMatch() {
        runner.withPropertyValues("scalar.path-routing.base-path=/scalar").run(context -> {
            MockMvc client = MockMvcBuilders.webAppContextSetup(context).build();
            client.perform(get("/scalar")).andExpect(status().isOk());
            String type = client.perform(get("/scalar/scalar.js")).andExpect(status().isOk())
                    .andReturn().getResponse().getContentType();
            assertThat(type).startsWith("application/javascript");
            client.perform(get("/scalar/tag/pets")).andExpect(status().isOk());
        });
    }

    @Test
    void doesNotRegisterFallbackWhenRoutingIsDisabledOrAbsent() {
        for (String[] settings : new String[][] {
                {}, {"scalar.path-routing.base-path=/scalar", "scalar.url-routing=false"}
        }) {
            runner.withPropertyValues(settings).run(context -> {
                MockMvc client = MockMvcBuilders.webAppContextSetup(context).build();
                client.perform(get("/scalar")).andExpect(status().isOk());
                client.perform(get("/scalar/tag/pets")).andExpect(status().isNotFound());
            });
        }
    }
}
