package com.scalar.maven.core.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ScalarServer")
class ScalarServerTest {

    @Nested
    @DisplayName("construction")
    class Construction {

        @Test
        @DisplayName("should create server with default constructor")
        void shouldCreateServerWithDefaultConstructor() {
            ScalarServer server = new ScalarServer();
            assertThat(server).isNotNull();
            assertThat(server.getUrl()).isNull();
            assertThat(server.getDescription()).isNull();
            assertThat(server.getVariables()).isNull();
        }

        @Test
        @DisplayName("should create server with URL")
        void shouldCreateServerWithUrl() {
            String url = "https://api.example.com";
            ScalarServer server = new ScalarServer(url);
            assertThat(server.getUrl()).isEqualTo(url);
        }

        @Test
        @DisplayName("should create server with URL and description")
        void shouldCreateServerWithUrlAndDescription() {
            String url = "https://api.example.com";
            String description = "Production API";
            ScalarServer server = new ScalarServer(url, description);
            assertThat(server.getUrl()).isEqualTo(url);
            assertThat(server.getDescription()).isEqualTo(description);
        }
    }

    @Nested
    @DisplayName("properties")
    class Properties {

        @Test
        @DisplayName("should set and get URL")
        void shouldSetAndGetUrl() {
            ScalarServer server = new ScalarServer();
            String url = "https://api.example.com";
            server.setUrl(url);
            assertThat(server.getUrl()).isEqualTo(url);
        }

        @Test
        @DisplayName("should set and get description")
        void shouldSetAndGetDescription() {
            ScalarServer server = new ScalarServer();
            String description = "Production API";
            server.setDescription(description);
            assertThat(server.getDescription()).isEqualTo(description);
        }

        @Test
        @DisplayName("should set and get variables")
        void shouldSetAndGetVariables() {
            ScalarServer server = new ScalarServer();
            Map<String, ScalarServer.ServerVariable> variables = new HashMap<>();
            ScalarServer.ServerVariable variable = new ScalarServer.ServerVariable("default");
            variables.put("env", variable);
            server.setVariables(variables);
            assertThat(server.getVariables()).isEqualTo(variables);
            assertThat(server.getVariables().get("env")).isEqualTo(variable);
        }
    }

    @Nested
    @DisplayName("ServerVariable")
    class ServerVariableTests {

        @Test
        @DisplayName("should create variable with default constructor")
        void shouldCreateVariableWithDefaultConstructor() {
            ScalarServer.ServerVariable variable = new ScalarServer.ServerVariable();
            assertThat(variable).isNotNull();
            assertThat(variable.getDefaultValue()).isNull();
            assertThat(variable.getDescription()).isNull();
            assertThat(variable.getEnumValues()).isNull();
        }

        @Test
        @DisplayName("should create variable with default value")
        void shouldCreateVariableWithDefaultValue() {
            String defaultValue = "production";
            ScalarServer.ServerVariable variable = new ScalarServer.ServerVariable(defaultValue);
            assertThat(variable.getDefaultValue()).isEqualTo(defaultValue);
        }

        @Test
        @DisplayName("should set and get properties")
        void shouldSetAndGetProperties() {
            ScalarServer.ServerVariable variable = new ScalarServer.ServerVariable();
            variable.setDefaultValue("production");
            variable.setDescription("Environment");
            variable.setEnumValues(new String[]{"production", "staging", "development"});
            assertThat(variable.getDefaultValue()).isEqualTo("production");
            assertThat(variable.getDescription()).isEqualTo("Environment");
            assertThat(variable.getEnumValues()).containsExactly("production", "staging", "development");
        }
    }
}

