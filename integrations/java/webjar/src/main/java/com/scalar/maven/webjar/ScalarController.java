package com.scalar.maven.webjar;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for serving the Scalar API Reference interface.
 *
 * <p>This controller provides endpoints for accessing the Scalar API Reference
 * interface and the associated JavaScript bundle. It automatically configures
 * the interface based on the provided {@link ScalarProperties}.</p>
 *
 * <p>The controller serves two main endpoints:</p>
 * <ul>
 *   <li>{@code /scalar} (or custom path) - The main API reference interface</li>
 *   <li>{@code /scalar/scalar.js} (or custom path) - The JavaScript bundle</li>
 * </ul>
 *
 * <p>This controller can be overridden by providing a custom {@code ScalarController}
 * bean in the application context.</p>
 *
 * @since 0.1.0
 */
@RestController
@ConditionalOnMissingBean(ScalarController.class)
public class ScalarController {

    private static final String DEFAULT_PATH = "/scalar";
    private static final String JS_FILENAME = "scalar.js";

    private final ScalarProperties properties;

    /**
     * Creates a new ScalarController with the specified properties.
     *
     * @param properties the configuration properties for the Scalar integration
     */
    public ScalarController(ScalarProperties properties) {
        this.properties = properties;
    }

    /**
     * Serves the main API reference interface.
     *
     * <p>This endpoint returns an HTML page that displays the Scalar API Reference
     * interface. The page is configured with the OpenAPI specification URL from
     * the properties.</p>
     *
     * @return a ResponseEntity containing the HTML content for the API reference interface
     * @throws IOException if the HTML template cannot be loaded
     */
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
                .replace("__CONFIGURATION__", buildConfigurationJson());

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(injectedHtml);
    }

    /**
     * Serves the JavaScript bundle for the Scalar API Reference.
     *
     * <p>This endpoint returns the JavaScript file that powers the Scalar API Reference
     * interface. The file is served with the appropriate MIME type.</p>
     *
     * @return a ResponseEntity containing the JavaScript bundle
     * @throws IOException if the JavaScript file cannot be loaded
     */
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
     *
     * @return the complete URL for the JavaScript bundle
     */
    private String buildJsBundleUrl() {
        String basePath = properties.getPath();

        if (basePath == null || basePath.isEmpty()) {
            basePath = DEFAULT_PATH;
        }

        // Remove trailing slash to avoid double slashes when concatenating
        if (basePath.endsWith("/")) {
            basePath = basePath.substring(0, basePath.length() - 1);
        }

        return basePath + "/" + JS_FILENAME;
    }

    /**
     * Builds the JSON for the OpenAPI reference sources
     *
     * @param sources list of OpenAPI reference sources
     * @return the sources as a JSON string
     */
    private String buildSourcesJsonArray(List<ScalarProperties.ScalarSource> sources) {
        final StringBuilder builder = new StringBuilder("[");

        // Filter out sources with invalid urls
        final List<ScalarProperties.ScalarSource> filteredSources = sources.stream()
                .filter(source -> isNotNullOrBlank(source.getUrl()))
                .collect(Collectors.toList());

        // Append each source to json array
        for (int i = 0; i < filteredSources.size(); i++) {
            final ScalarProperties.ScalarSource source = filteredSources.get(i);

            final String sourceJson = buildSourceJson(source);
            builder.append("\n").append(sourceJson);

            if (i != filteredSources.size() - 1) {
                builder.append(",");
            }
        }

        builder.append("\n]");
        return builder.toString();
    }

    /**
     * Builds the JSON for an OpenAPI reference source
     *
     * @param source the OpenAPI reference source
     * @return the source as a JSON string
     */
    private String buildSourceJson(ScalarProperties.ScalarSource source) {
        final StringBuilder builder = new StringBuilder("{");

        builder.append("\n  url: \"").append(escapeJson(source.getUrl())).append("\"");


        if (isNotNullOrBlank(source.getTitle())) {
            builder.append(",\n  title: \"").append(escapeJson(source.getTitle())).append("\"");
        }

        if (isNotNullOrBlank(source.getSlug())) {
            builder.append(",\n  slug: \"").append(escapeJson(source.getSlug())).append("\"");
        }

        if (source.isDefault() != null) {
            builder.append(",\n  default: ").append(source.isDefault());
        }

        builder.append("\n}");
        return builder.toString();
    }

    /**
     * Builds the configuration JSON for the Scalar API Reference.
     *
     * @return the configuration JSON as a string
     */
    private String buildConfigurationJson() {
        StringBuilder config = new StringBuilder();
        config.append("{");

        // Add URL
        config.append("\n  url: \"").append(escapeJson(properties.getUrl())).append("\"");

        // Add sources
        if (properties.getSources() != null && !properties.getSources().isEmpty()) {
            config.append(",\n  sources: ").append(buildSourcesJsonArray(properties.getSources()));
        }

        // Add showSidebar
        if (!properties.isShowSidebar()) {
            config.append(",\n  showSidebar: false");
        }

        // Add hideModels
        if (properties.isHideModels()) {
            config.append(",\n  hideModels: true");
        }

        // Add hideTestRequestButton
        if (properties.isHideTestRequestButton()) {
            config.append(",\n  hideTestRequestButton: true");
        }

        // Add darkMode
        if (properties.isDarkMode()) {
            config.append(",\n  darkMode: true");
        }

        // Add hideDarkModeToggle
        if (properties.isHideDarkModeToggle()) {
            config.append(",\n  hideDarkModeToggle: true");
        }

        // Add customCss
        if (properties.getCustomCss() != null && !properties.getCustomCss().trim().isEmpty()) {
            config.append(",\n  customCss: \"").append(escapeJson(properties.getCustomCss())).append("\"");
        }

        // Add theme
        if (properties.getTheme() != null && !"default".equals(properties.getTheme())) {
            config.append(",\n  theme: \"").append(escapeJson(properties.getTheme())).append("\"");
        }

        // Add layout
        if (properties.getLayout() != null && !"modern".equals(properties.getLayout())) {
            config.append(",\n  layout: \"").append(escapeJson(properties.getLayout())).append("\"");
        }

        // Add hideSearch
        if (properties.isHideSearch()) {
            config.append(",\n  hideSearch: true");
        }

        // Add documentDownloadType
        if (properties.getDocumentDownloadType() != null && !"both".equals(properties.getDocumentDownloadType())) {
            config.append(",\n  documentDownloadType: \"").append(escapeJson(properties.getDocumentDownloadType())).append("\"");
        }

        config.append("\n}");
        return config.toString();
    }

    /**
     * Escapes a string for JSON output.
     *
     * @param input the input string
     * @return the escaped string
     */
    private String escapeJson(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Returns whether a String is not null or blank
     *
     * @param input the string
     * @return whether the string is not null or blank
     */
    private boolean isNotNullOrBlank(String input) {
        return input != null && !input.isBlank();
    }
}
