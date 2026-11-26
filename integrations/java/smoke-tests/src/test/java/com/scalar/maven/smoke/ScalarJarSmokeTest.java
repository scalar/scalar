package com.scalar.maven.smoke;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.web.context.WebServerApplicationContext;

class ScalarJarSmokeTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    static class Application {}

    @Test
    void servesReferenceAndBundleFromInstalledJars() throws Exception {
        try (var context = SpringApplication.run(Application.class,
                "--server.address=127.0.0.1", "--server.port=0")) {
            int port = ((WebServerApplicationContext) context).getWebServer().getPort();
            var referenceUri = URI.create("http://127.0.0.1:" + port + "/scalar");
            var client = HttpClient.newHttpClient();

            var reference = client.send(HttpRequest.newBuilder(referenceUri)
                    .timeout(Duration.ofSeconds(10)).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(200, reference.statusCode(), "Scalar HTML status");
            assertTrue(reference.body().contains("src=\"scalar/scalar.js\""), "Scalar HTML references the bundled script");

            var bundle = client.send(HttpRequest.newBuilder(referenceUri.resolve("scalar/scalar.js"))
                    .timeout(Duration.ofSeconds(10)).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(200, bundle.statusCode(), "Scalar JavaScript status");
            assertTrue(bundle.headers().firstValue("Content-Type").orElse("").startsWith("application/javascript"),
                    "Scalar bundle has a JavaScript content type");
            assertFalse(bundle.body().isBlank(), "Scalar JavaScript is bundled in the JAR");
        }
    }
}
