package com.scalar.maven.core.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.Map;

/**
 * Defines an OpenAPI Reference source
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarSource {

    /** The inline API description, as text or an object. */
    private Object content;

    @JsonIgnore
    private Map<String, Object> contentMap;

    /**
     * The URL of the OpenAPI specification to display in the API Reference.
     */
    private String url;

    /**
     * The display title of the OpenAPI specification
     * optional
     */
    private String title;

    /**
     * The url slug of the OpenAPI specification
     * optional, would be auto-generated from the title or the index
     */
    private String slug;

    /**
     * Whether this is the default source
     * optional
     */
    private Boolean isDefault;

    /**
     * Agent Scalar options for this source (key for production, or disabled to
     * turn off the agent for this document).
     */
    private ScalarAgentOptions agent;

    /**
     * Creates an OpenAPI Reference source
     * Set a URL or inline content before rendering.
     */
    public ScalarSource() {
    }

    /**
     * Creates an OpenAPI Reference source
     *
     * @param url       the url of the OpenAPI specification
     * @param title     the display title of the OpenAPI specification
     * @param slug      the url slug of the OpenAPI specification
     * @param isDefault whether this is the default source
     */
    public ScalarSource(String url, String title, String slug, Boolean isDefault) {
        this.url = url;
        this.title = title;
        this.slug = slug;
        this.isDefault = isDefault;
    }

    /**
     * Gets the URL of the OpenAPI specification
     *
     * @return the url
     */
    public String getUrl() {
        return getContent() == null ? url : null;
    }

    /**
     * Sets the URL of the OpenAPI specification
     *
     * @param url the url
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets the display title of the OpenAPI specification
     *
     * @return the display title or null
     */
    public String getTitle() {
        return title;
    }

    /**
     * Sets the display title of the OpenAPI specification
     *
     * @param title the display title
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * Gets the url slug of the OpenAPI specification
     *
     * @return the url slug or null
     */
    public String getSlug() {
        return slug;
    }

    /**
     * Sets the url slug of the OpenAPI specification
     *
     * @param slug the url slug
     */
    public void setSlug(String slug) {
        this.slug = slug;
    }

    /**
     * Gets whether this is the default source
     *
     * @return whether this is the default source or null
     */
    public Boolean isDefault() {
        return isDefault;
    }

    /**
     * Sets whether this is the default source
     *
     * @param isDefault whether this is the default source
     */
    public void setDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    /**
     * Gets the Agent Scalar options for this source.
     *
     * @return the agent options or null
     */
    public ScalarAgentOptions getAgent() {
        return agent;
    }

    /**
     * Sets the Agent Scalar options for this source.
     *
     * @param agent the agent options
     */
    public void setAgent(ScalarAgentOptions agent) {
        this.agent = agent;
    }

    /**
     * Gets the inline API description, as text or an object.
     *
     * @return the configured value, or null to use the frontend default
     */
    public Object getContent() {
        return contentMap == null ? content : contentMap;
    }

    /**
     * Sets the inline API description, as text or an object.
     *
     * @param content the configured value, or null to use the frontend default
     */
    public void setContent(Object content) {
        if (content != null && !(content instanceof String) && !(content instanceof java.util.Map<?, ?>)) {
            throw new IllegalArgumentException("Content must be text or an object");
        }
        this.content = content;
        this.contentMap = null;
    }

    /**
     * Gets inline object content for Spring binding.
     *
     * @return the object content, or null when text or programmatic content is used
     */
    @JsonIgnore
    public Map<String, Object> getContentMap() {
        return contentMap;
    }

    /**
     * Sets inline object content through Spring properties, replacing text content.
     * Serialized as content; contentMap is never sent to the frontend.
     *
     * @param contentMap the API description object, or null
     */
    public void setContentMap(Map<String, Object> contentMap) {
        this.contentMap = contentMap;
        this.content = null;
    }
}
