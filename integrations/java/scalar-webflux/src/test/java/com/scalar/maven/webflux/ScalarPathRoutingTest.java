package com.scalar.maven.webflux;

import org.junit.jupiter.api.Test;
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
    static class WebConfiguration {
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

    private final ReactiveWebApplicationContextRunner runner = new ReactiveWebApplicationContextRunner()
            .withUserConfiguration(WebConfiguration.class)
            .withConfiguration(AutoConfigurations.of(ScalarWebFluxAutoConfiguration.class));

    @Test
    void servesDeepLinksAndBundleWithContextPath() {
        runner.withPropertyValues("scalar.path=/reference/", "scalar.path-routing.base-path=/docs/")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    WebTestClient client = WebTestClient.bindToApplicationContext(context).build();
                    for (String path : new String[] {"/docs", "/docs/", "/docs/example/tag/pets/get/pets"}) {
                        client.get().uri("/app" + path).exchange().expectStatus().isOk()
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
            client.get().uri("/scalar/tag/pets").exchange().expectStatus().isOk();
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
                client.get().uri("/scalar/tag/pets").exchange().expectStatus().isNotFound();
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
            client.get().uri("/docs/tag/pets").exchange().expectStatus().isNotFound();
        });
    }
}
