package com.scalar.maven.webmvc;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
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
    static class WebConfiguration implements WebMvcConfigurer {
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            registry.addResourceHandler("/**").addResourceLocations("classpath:/static/");
        }

    }

    @RestController
    static class ApiController {
        @GetMapping(value = "/users/1", produces = "application/json")
        String user() {
            return "{}";
        }
    }

    private final WebApplicationContextRunner runner = new WebApplicationContextRunner()
            .withUserConfiguration(WebConfiguration.class, ApiController.class)
            .withConfiguration(AutoConfigurations.of(ScalarWebMvcAutoConfiguration.class));

    @Test
    void servesDeepLinksAndBundleWithContextPath() {
        runner.withPropertyValues("scalar.path=/reference/", "scalar.path-routing.base-path=/docs/")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    MockMvc client = MockMvcBuilders.webAppContextSetup(context).build();
                    for (String path : new String[] {"/docs", "/docs/", "/docs/example/tag/pets/get/pets"}) {
                        String html = client.perform(get("/app" + path).contextPath("/app").accept(MediaType.TEXT_HTML))
                                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
                        assertThat(html).contains("src=\"/app/reference/scalar.js\"");
                        assertThat(html).contains("\"pathRouting\":{\"basePath\":\"/app/docs\"}");
                    }
                    client.perform(get("/app/reference/scalar.js").contextPath("/app"))
                            .andExpect(status().isOk());
                    client.perform(get("/app/unrelated").contextPath("/app").accept(MediaType.TEXT_HTML))
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
            client.perform(get("/scalar/tag/pets").accept(MediaType.TEXT_HTML)).andExpect(status().isOk());
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
                client.perform(get("/scalar/tag/pets").accept(MediaType.TEXT_HTML)).andExpect(status().isNotFound());
            });
        }
    }

    @Test
    void doesNotRequireWebInfrastructureWhenPathRoutingIsAbsent() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(ScalarWebMvcAutoConfiguration.class))
                .run(context -> assertThat(context).hasNotFailed());
    }


    @Test
    void servesNormalizedBundleWhenUrlRoutingIsDisabled() {
        runner.withPropertyValues("scalar.path=/reference/", "scalar.path-routing.base-path=/docs",
                "scalar.url-routing=false").run(context -> {
            MockMvc client = MockMvcBuilders.webAppContextSetup(context).build();
            String html = client.perform(get("/reference/")).andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertThat(html).contains("src=\"/reference/scalar.js\"");
            client.perform(get("/reference/scalar.js")).andExpect(status().isOk());
            client.perform(get("/docs/tag/pets").accept(MediaType.TEXT_HTML)).andExpect(status().isNotFound());
        });
    }

    @Test
    void leavesStaticResourcesToTheirHandlers() {
        for (String basePath : new String[] {"/", "/docs"}) {
            runner.withPropertyValues("scalar.path-routing.base-path=" + basePath).run(context -> {
                MockMvc client = MockMvcBuilders.webAppContextSetup(context).build();
                for (String path : new String[] {"/docs/openapi.json", "/docs/app.js", "/docs/style.css", "/docs/logo.svg", "/docs/data"}) {
                    for (String accept : new String[] {"*/*", "application/json", "text/*", "text/html;q=0,*/*;q=1"}) {
                        String body = client.perform(get(path).header("Accept", accept))
                                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
                        assertThat(body).contains("static resource");
                    }
                }
                client.perform(get("/docs/missing")).andExpect(status().isNotFound());
            });
        }
    }

    @Test
    void preservesContentNegotiationErrorsForMalformedAccept() {
        runner.withPropertyValues("scalar.path-routing.base-path=/").run(context -> {
            MockMvc client = MockMvcBuilders.webAppContextSetup(context).build();
            client.perform(get("/users/1").header("Accept", "foo")).andExpect(status().isNotAcceptable());
        });
    }

    @Test
    void rejectsMalformedAcceptInNavigationCondition() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Accept", "foo");
        assertThat(new HtmlNavigationCondition().getMatchingCondition(request)).isNull();
    }
}
