package com.scalar.maven.webjar.config;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Defines an OpenAPI Reference source
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarSource {

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
     * Creates an OpenAPI Reference source
     * {@link #url} must be set
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
        return url;
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
}
