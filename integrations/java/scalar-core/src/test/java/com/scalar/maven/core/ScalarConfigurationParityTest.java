package com.scalar.maven.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;
import com.scalar.maven.core.internal.ScalarConfiguration;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class ScalarConfigurationParityTest {

    // Explicit exceptions keep newly added frontend options from silently being omitted.
    private static final Set<String> JAVASCRIPT_ONLY = Set.of(
            "customFetch", "fetch", "plugins", "onRequestSent", "onBeforeRequest", "onRequestBuilt",
            "onResponseReceived", "onServerChange", "onDocumentSelect", "onLoaded", "onShowMore",
            "onSidebarClick", "generateHeadingSlug", "generateModelSlug", "generateTagSlug",
            "generateOperationSlug", "generateWebhookSlug", "setPageTitle", "redirect");
    private static final Set<String> DEPRECATED = Set.of("proxy", "hideDownloadButton", "showToolbar", "spec");
    private static final Set<String> EXCLUDED = Set.of(
            "isEditable", // The editor is outside the Java integration's scope.
            "_integration", // Internal frontend integration identifier.
            "default", // Only meaningful per source; ScalarSource supports it.
            "pathRouting"); // TODO: routing follow-up.

    @Test
    void accountsForEveryFrontendConfigurationOption() throws Exception {
        Path root = Path.of("").toAbsolutePath();
        while (root != null && !Files.isDirectory(root.resolve("packages/types/src/api-reference"))) {
            root = root.getParent();
        }
        assumeTrue(root != null, "Frontend configuration parity requires the Scalar monorepo");
        Set<String> frontend = new HashSet<>();
        for (Map.Entry<String, String> schema : Map.of(
                "base-configuration.ts", "baseConfigurationSchema",
                "api-reference-configuration.ts", "apiReferenceConfigurationSchema",
                "source-configuration.ts", "sourceConfigurationSchema").entrySet()) {
            String source = Files.readString(root.resolve("packages/types/src/api-reference/" + schema.getKey()));
            String object = source.split("export const " + schema.getValue() + " =", 2)[1].split("\n\\}\\)", 2)[0];
            var matcher = Pattern.compile("^  ([A-Za-z_][A-Za-z0-9_]*):", Pattern.MULTILINE).matcher(object);
            while (matcher.find()) {
                frontend.add(matcher.group(1));
            }
        }
        ObjectMapper mapper = new ObjectMapper();
        Set<String> supported = mapper.getSerializationConfig()
                .introspect(mapper.constructType(ScalarConfiguration.class)).findProperties().stream()
                .map(BeanPropertyDefinition::getName).collect(Collectors.toSet());
        Set<String> exclusions = new HashSet<>(JAVASCRIPT_ONLY);
        exclusions.addAll(DEPRECATED);
        exclusions.addAll(EXCLUDED);
        assertThat(exclusions).as("Remove stale configuration exclusions").isSubsetOf(frontend);
        frontend.removeAll(exclusions);
        assertThat(supported).as("Map new frontend options or explain their exclusion").containsAll(frontend);
    }
}
