package com.scalar.maven.core.config;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Overrides for external Scalar service URLs. Unset URLs use frontend defaults. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarExternalUrls {

    /** The apiBase service URL. */
    private String apiBaseUrl;

    /** The proxy service URL. */
    private String proxyUrl;

    /** The registry service URL. */
    private String registryUrl;

    /** The dashboard service URL. */
    private String dashboardUrl;


    /**
     * Gets the dashboard service URL.
     *
     * @return the configured value, or null to use the frontend default
     */
    public String getDashboardUrl() {
        return dashboardUrl;
    }

    /**
     * Sets the dashboard service URL.
     *
     * @param dashboardUrl the configured value, or null to use the frontend default
     */
    public void setDashboardUrl(String dashboardUrl) {
        this.dashboardUrl = dashboardUrl;
    }

    /**
     * Gets the registry service URL.
     *
     * @return the configured value, or null to use the frontend default
     */
    public String getRegistryUrl() {
        return registryUrl;
    }

    /**
     * Sets the registry service URL.
     *
     * @param registryUrl the configured value, or null to use the frontend default
     */
    public void setRegistryUrl(String registryUrl) {
        this.registryUrl = registryUrl;
    }

    /**
     * Gets the proxy service URL.
     *
     * @return the configured value, or null to use the frontend default
     */
    public String getProxyUrl() {
        return proxyUrl;
    }

    /**
     * Sets the proxy service URL.
     *
     * @param proxyUrl the configured value, or null to use the frontend default
     */
    public void setProxyUrl(String proxyUrl) {
        this.proxyUrl = proxyUrl;
    }

    /**
     * Gets the apiBase service URL.
     *
     * @return the configured value, or null to use the frontend default
     */
    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    /**
     * Sets the apiBase service URL.
     *
     * @param apiBaseUrl the configured value, or null to use the frontend default
     */
    public void setApiBaseUrl(String apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }
}
