package com.scalar.webjar;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@RestController
public class ScalarController {

    private final ScalarProperties properties;

    public ScalarController(ScalarProperties properties) {
        this.properties = properties;
    }

    @GetMapping("${scalar.path:/scalar}")
    public ResponseEntity<String> getDocs() throws IOException {
        // Load the template HTML
        InputStream inputStream = getClass().getResourceAsStream("/META-INF/resources/webjars/scalar/0.1.0/index.html");
        if (inputStream == null) {
            return ResponseEntity.notFound().build();
        }

        String html = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

        // Replace the placeholder with actual config
        String injectedHtml = html.replace("__CONFIGURATION__", """
            {
              url: "%s"
            }
        """.formatted(properties.getUrl()));

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(injectedHtml);
    }
} 
