package com.scalar.maven.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scalar.maven.core.authentication.schemes.ScalarApiKeySecurityScheme;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ScalarTokenPrefixTest {
    @Test
    void serializesPrefixSeparatelyFromCredential() throws Exception {
        ScalarApiKeySecurityScheme scheme = new ScalarApiKeySecurityScheme("Authorization", "abc");
        scheme.setTokenPrefix("token");
        var json = new ObjectMapper().readTree(new ObjectMapper().writeValueAsString(scheme));
        assertThat(json.get("x-scalar-token-prefix").asText()).isEqualTo("token");
        assertThat(json.get("value").asText()).isEqualTo("abc");
        assertThat(json.has("tokenPrefix")).isFalse();
    }
}
