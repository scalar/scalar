package com.scalar.maven.core.config;

/** Path-based navigation. The base path is relative to the application's context path. */
public class ScalarPathRouting {

    private String basePath;

    /** @return the application-relative base path */
    public String getBasePath() {
        return basePath;
    }

    /**
     * Sets a literal absolute path, normalizing trailing slashes.
     *
     * @param basePath a path such as /docs
     * @throws IllegalArgumentException if the path is not a literal absolute path
     */
    public void setBasePath(String basePath) {
        if (basePath == null || !basePath.startsWith("/") || basePath.contains("//")
                || basePath.matches(".*[?#*{}\\\\].*")) {
            throw new IllegalArgumentException("Path routing basePath must be a literal absolute path, such as /docs");
        }
        this.basePath = basePath.length() > 1 && basePath.endsWith("/")
                ? basePath.substring(0, basePath.length() - 1) : basePath;
    }
}
