package com.scalar.maven.webjar;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@RestController
public class ScalarController {

    private static final String DEFAULT_PATH = "/scalar";
    private static final String JS_FILENAME = "scalar.js";

    private final ScalarProperties properties;

    public ScalarController(ScalarProperties properties) {
        this.properties = properties;
    }

    @GetMapping("${scalar.path:" + DEFAULT_PATH + "}")
    public ResponseEntity<String> getDocs() throws IOException {
        // Load the template HTML
        InputStream inputStream = getClass().getResourceAsStream("/META-INF/resources/webjars/scalar/index.html");
        if (inputStream == null) {
            return ResponseEntity.notFound().build();
        }

        String html = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

        // Replace the placeholders with actual values
        String cdnUrl = buildJsBundleUrl();
        String injectedHtml = html
            .replace("__JS_BUNDLE_URL__", cdnUrl)
            .replace("__CONFIGURATION__", """
                {
                  url: "%s"
                }
            """.formatted(properties.getUrl()));

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(injectedHtml);
    }

    @GetMapping("${scalar.path:" + DEFAULT_PATH + "}/" + JS_FILENAME)
    public ResponseEntity<byte[]> getScalarJs() throws IOException {
        // Load the scalar.js file
        InputStream inputStream = getClass().getResourceAsStream("/META-INF/resources/webjars/scalar/" + JS_FILENAME);
        if (inputStream == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] jsContent = inputStream.readAllBytes();

        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/javascript"))
                .body(jsContent);
    }

    /**
     * Builds the CDN URL for the Scalar JavaScript file.
     * Uses the configured path if available, otherwise defaults to the DEFAULT_PATH.
     */
    private String buildJsBundleUrl() {
        String basePath = properties.getPath();

        if (basePath == null || basePath.isEmpty()) {
            basePath = DEFAULT_PATH;
        }

        return basePath + "/" + JS_FILENAME;
    }
}
