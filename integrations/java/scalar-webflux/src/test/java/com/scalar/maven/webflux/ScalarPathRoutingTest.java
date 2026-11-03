package com.scalar.maven.webflux;

import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.config.WebFluxConfigurer;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ReactiveWebApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.config.EnableWebFlux;
import org.springframework.web.server.WebFilter;
import org.springframework.context.annotation.Bean;

import static org.assertj.core.api.Assertions.assertThat;

class ScalarPathRoutingTest {

    @Configuration(proxyBeanMethods = false)
    @EnableWebFlux
    static class WebConfiguration implements WebFluxConfigurer {
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            registry.addResourceHandler("/**").addResourceLocations("classpath:/static/");
        }

        // Model the context path that a reactive server or reverse-proxy transformer supplies.
        @Bean
        WebFilter contextPath() {
            return (exchange, chain) -> {
                if (exchange.getRequest().getPath().value().startsWith("/app/")) {
                    return chain.filter(exchange.mutate().request(
                            exchange.getRequest().mutate().contextPath("/app").build()).build());
                }
                return chain.filter(exchange);
            };
        }
    }

    @RestController
    static class ApiController {
        @GetMapping(value = "/users/1", produces = "application/json")
        String user() {
            return "{}";
        }
    }

    private final ReactiveWebApplicationContextRunner runner = new ReactiveWebApplicationContextRunner()
            .withUserConfiguration(WebConfiguration.class, ApiController.class)
            .withConfiguration(AutoConfigurations.of(ScalarWebFluxAutoConfiguration.class));

    @Test
    void servesDeepLinksAndBundleWithContextPath() {
        runner.withPropertyValues("scalar.path=/reference/", "scalar.path-routing.base-path=/docs/")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    WebTestClient client = WebTestClient.bindToApplicationContext(context).build();
                    for (String path : new String[] {"/docs", "/docs/", "/docs/example/tag/pets/get/pets"}) {
                        client.get().uri("/app" + path).accept(MediaType.TEXT_HTML).exchange().expectStatus().isOk()
                                .expectHeader().contentTypeCompatibleWith("text/html")
                                .expectBody(String.class).value(html -> {
                                    assertThat(html).contains("src=\"/app/reference/scalar.js\"");
                                    assertThat(html).contains("\"pathRouting\":{\"basePath\":\"/app/docs\"}");
                                });
                    }
                    client.get().uri("/app/reference/scalar.js").exchange().expectStatus().isOk();
                    client.get().uri("/app/unrelated").exchange().expectStatus().isNotFound();
                });
    }

    @Test
    void keepsExactBundleRouteWhenBasePathsMatch() {
        runner.withPropertyValues("scalar.path-routing.base-path=/scalar").run(context -> {
            WebTestClient client = WebTestClient.bindToApplicationContext(context).build();
            client.get().uri("/scalar").exchange().expectStatus().isOk();
            client.get().uri("/scalar/scalar.js").exchange().expectStatus().isOk()
                    .expectHeader().contentType("application/javascript");
            client.get().uri("/scalar/tag/pets").accept(MediaType.TEXT_HTML).exchange().expectStatus().isOk();
        });
    }

    @Test
    void doesNotRegisterFallbackWhenRoutingIsDisabledOrAbsent() {
        for (String[] settings : new String[][] {
                {}, {"scalar.path-routing.base-path=/scalar", "scalar.url-routing=false"}
        }) {
            runner.withPropertyValues(settings).run(context -> {
                WebTestClient client = WebTestClient.bindToApplicationContext(context).build();
                client.get().uri("/scalar").exchange().expectStatus().isOk();
                client.get().uri("/scalar/tag/pets").accept(MediaType.TEXT_HTML).exchange().expectStatus().isNotFound();
            });
        }
    }

    @Test
    void doesNotRequireWebInfrastructureWhenPathRoutingIsAbsent() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(ScalarWebFluxAutoConfiguration.class))
                .run(context -> assertThat(context).hasNotFailed());
    }


    @Test
    void servesNormalizedBundleWhenUrlRoutingIsDisabled() {
        runner.withPropertyValues("scalar.path=/reference/", "scalar.path-routing.base-path=/docs",
                "scalar.url-routing=false").run(context -> {
            WebTestClient client = WebTestClient.bindToApplicationContext(context).build();
            client.get().uri("/reference/").exchange().expectStatus().isOk()
                    .expectBody(String.class).value(html ->
                            assertThat(html).contains("src=\"/reference/scalar.js\""));
            client.get().uri("/reference/scalar.js").exchange().expectStatus().isOk()
                    .expectHeader().contentType("application/javascript");
            client.get().uri("/docs/tag/pets").accept(MediaType.TEXT_HTML).exchange().expectStatus().isNotFound();
        });
    }

    @Test
    void leavesStaticResourcesToTheirHandlers() {
        for (String basePath : new String[] {"/", "/docs"}) {
            runner.withPropertyValues("scalar.path-routing.base-path=" + basePath).run(context -> {
                WebTestClient client = WebTestClient.bindToApplicationContext(context).build();
                for (String path : new String[] {"/docs/openapi.json", "/docs/app.js", "/docs/style.css", "/docs/logo.svg", "/docs/data"}) {
                    for (String accept : new String[] {"*/*", "application/json", "text/*", "text/html;q=0,*/*;q=1"}) {
                        client.get().uri(path).header("Accept", accept).exchange().expectStatus().isOk()
                                .expectBody(String.class).value(body -> assertThat(body).contains("static resource"));
                    }
                }
                client.get().uri("/docs/missing").exchange().expectStatus().isNotFound();
            });
        }
    }

    @Test
    void preservesContentNegotiationErrorsForMalformedAccept() {
        runner.withPropertyValues("scalar.path-routing.base-path=/").run(context -> {
            WebTestClient client = WebTestClient.bindToApplicationContext(context).build();
            client.get().uri("/users/1").header("Accept", "foo").exchange().expectStatus().isEqualTo(406);
        });
    }

    @Test
    void rejectsMalformedAcceptInNavigationCondition() {
        MockServerWebExchange request = MockServerWebExchange.from(
                MockServerHttpRequest.get("/users/1").header("Accept", "foo").build());
        assertThat(new HtmlNavigationCondition().getMatchingCondition(request)).isNull();
    }
}
