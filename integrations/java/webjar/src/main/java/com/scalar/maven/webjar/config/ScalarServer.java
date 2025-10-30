package com.scalar.maven.webjar.config;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Represents a server configuration for the Scalar API Reference.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarServer {

    /**
     * The URL of the server.
     */
    private String url;

    /**
     * A description of the server.
     */
    private String description;

    /**
     * A map of server variables.
     */
    private Map<String, ServerVariable> variables;

    /**
     * Creates a new ScalarServer.
     */
    public ScalarServer() {
    }

    /**
     * Creates a new ScalarServer with the specified URL.
     *
     * @param url the server URL
     */
    public ScalarServer(String url) {
        this.url = url;
    }

    /**
     * Creates a new ScalarServer with the specified URL and description.
     *
     * @param url         the server URL
     * @param description the server description
     */
    public ScalarServer(String url, String description) {
        this.url = url;
        this.description = description;
    }

    /**
     * Gets the server URL.
     *
     * @return the server URL
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the server URL.
     *
     * @param url the server URL
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets the server description.
     *
     * @return the server description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the server description.
     *
     * @param description the server description
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the server variables.
     *
     * @return the server variables
     */
    public Map<String, ServerVariable> getVariables() {
        return variables;
    }

    /**
     * Sets the server variables.
     *
     * @param variables the server variables
     */
    public void setVariables(Map<String, ServerVariable> variables) {
        this.variables = variables;
    }

    /**
     * Represents a server variable.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ServerVariable {
        /**
         * The default value for the variable.
         */
        private String defaultValue;

        /**
         * A description of the variable.
         */
        private String description;

        /**
         * An array of possible values for the variable.
         */
        private String[] enumValues;

        /**
         * Creates a new ServerVariable.
         */
        public ServerVariable() {
        }

        /**
         * Creates a new ServerVariable with the specified default value.
         *
         * @param defaultValue the default value
         */
        public ServerVariable(String defaultValue) {
            this.defaultValue = defaultValue;
        }

        /**
         * Gets the default value.
         *
         * @return the default value
         */
        public String getDefaultValue() {
            return defaultValue;
        }

        /**
         * Sets the default value.
         *
         * @param defaultValue the default value
         */
        public void setDefaultValue(String defaultValue) {
            this.defaultValue = defaultValue;
        }

        /**
         * Gets the description.
         *
         * @return the description
         */
        public String getDescription() {
            return description;
        }

        /**
         * Sets the description.
         *
         * @param description the description
         */
        public void setDescription(String description) {
            this.description = description;
        }

        /**
         * Gets the enum values.
         *
         * @return the enum values
         */
        public String[] getEnumValues() {
            return enumValues;
        }

        /**
         * Sets the enum values.
         *
         * @param enumValues the enum values
         */
        public void setEnumValues(String[] enumValues) {
            this.enumValues = enumValues;
        }
    }
}
