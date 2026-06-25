package com.scalar.maven.core.internal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.core.authentication.ScalarAuthenticationOptions;
import com.scalar.maven.core.authentication.schemes.ScalarApiKeySecurityScheme;
import com.scalar.maven.core.enums.ScalarTheme;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for {@link JacksonJsonSerializer}. The build classpath provides Jackson
 * 2.x, so these exercise the Jackson 2 resolution branch. The output is parsed
 * back with a real mapper to assert structure independently of field ordering.
 */
@DisplayName("JacksonJsonSerializer")
class JacksonJsonSerializerTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonNode serializeAndParse(Object value) throws Exception {
        return MAPPER.readTree(JacksonJsonSerializer.serialize(value));
    }

    @Test
    @DisplayName("honors @JsonProperty renames and omits null fields")
    void honorsJsonPropertyAndNonNull() throws Exception {
        ScalarConfiguration config = new ScalarConfiguration();
        config.setTheme(ScalarTheme.DEFAULT);

        JsonNode json = serializeAndParse(config);

        // @JsonValue enum is serialized as its string value
        assertThat(json.get("theme").asText()).isEqualTo("default");
        // @JsonInclude(NON_NULL) drops unset fields rather than emitting null
        assertThat(json.has("url")).isFalse();
        assertThat(json.has("customCss")).isFalse();
    }

    @Test
    @DisplayName("serializes a polymorphic security scheme without a type discriminator")
    void serializesSchemeWithoutDiscriminator() throws Exception {
        ScalarApiKeySecurityScheme apiKey = new ScalarApiKeySecurityScheme("X-API-Key", "secret");
        ScalarAuthenticationOptions authentication = new ScalarAuthenticationOptions();
        authentication.setApiKey(java.util.Map.of("apiKeyAuth", apiKey));

        JsonNode json = serializeAndParse(authentication);
        JsonNode scheme = json.get("securitySchemes").get("apiKeyAuth");

        assertThat(scheme.get("name").asText()).isEqualTo("X-API-Key");
        assertThat(scheme.get("value").asText()).isEqualTo("secret");
        // JsonTypeInfo.Id.DEDUCTION emits no type tag
        assertThat(scheme.has("type")).isFalse();
    }

    @Test
    @DisplayName("escapes special characters in strings")
    void escapesSpecialCharacters() throws Exception {
        ScalarConfiguration config = new ScalarConfiguration();
        config.setCustomCss("a\"b\\c\n\t/* 🚀 */");

        JsonNode json = serializeAndParse(config);

        // Round-tripping through a real parser proves the escaping is valid
        assertThat(json.get("customCss").asText()).isEqualTo("a\"b\\c\n\t/* 🚀 */");
    }
}
