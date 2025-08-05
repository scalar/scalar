package com.scalar.webjar;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "scalar")
public class ScalarProperties {
    
    private String url = "https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json";
    private boolean enabled = true;
    private String path = "/scalar";

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
} 
