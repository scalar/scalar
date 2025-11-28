package com.scalar.maven.core.config;

import com.scalar.maven.core.enums.ScalarClient;
import com.scalar.maven.core.enums.ScalarTarget;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DefaultHttpClient")
class DefaultHttpClientTest {

    @Nested
    @DisplayName("construction")
    class Construction {

        @Test
        @DisplayName("should create client with default constructor")
        void shouldCreateClientWithDefaultConstructor() {
            DefaultHttpClient client = new DefaultHttpClient();
            assertThat(client).isNotNull();
            assertThat(client.getTargetKey()).isNull();
            assertThat(client.getClientKey()).isNull();
        }

        @Test
        @DisplayName("should create client with target and client keys")
        void shouldCreateClientWithTargetAndClientKeys() {
            ScalarTarget targetKey = ScalarTarget.SHELL;
            ScalarClient clientKey = ScalarClient.CURL;
            DefaultHttpClient client = new DefaultHttpClient(targetKey, clientKey);
            assertThat(client.getTargetKey()).isEqualTo(targetKey);
            assertThat(client.getClientKey()).isEqualTo(clientKey);
        }
    }

    @Nested
    @DisplayName("properties")
    class Properties {

        @Test
        @DisplayName("should set and get target key")
        void shouldSetAndGetTargetKey() {
            DefaultHttpClient client = new DefaultHttpClient();
            ScalarTarget targetKey = ScalarTarget.SHELL;
            client.setTargetKey(targetKey);
            assertThat(client.getTargetKey()).isEqualTo(targetKey);
        }

        @Test
        @DisplayName("should set and get client key")
        void shouldSetAndGetClientKey() {
            DefaultHttpClient client = new DefaultHttpClient();
            ScalarClient clientKey = ScalarClient.CURL;
            client.setClientKey(clientKey);
            assertThat(client.getClientKey()).isEqualTo(clientKey);
        }
    }
}

