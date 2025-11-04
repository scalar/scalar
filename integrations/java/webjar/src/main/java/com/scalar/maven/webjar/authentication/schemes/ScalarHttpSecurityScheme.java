package com.scalar.maven.webjar.authentication.schemes;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Represents a security scheme that uses HTTP authentication mechanisms like Basic or Bearer.
 * This scheme is used to prefill or overwrite authentication values.
 * It supports both Basic authentication (username/password) and Bearer authentication (token).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScalarHttpSecurityScheme extends ScalarSecurityScheme {

    /**
     * Gets or sets the username used for HTTP basic authentication.
     * When provided, this value will be used to prefill or overwrite the username
     * for Basic authentication requests.
     */
    private String username;

    /**
     * Gets or sets the password used for HTTP basic authentication.
     * When provided, this value will be used to prefill or overwrite the password
     * for Basic authentication requests.
     */
    private String password;

    /**
     * Gets or sets the token used for HTTP bearer authentication.
     * When provided, this value will be used to prefill or overwrite the token
     * for Bearer authentication requests.
     */
    private String token;

    /**
     * Creates a new ScalarHttpSecurityScheme.
     */
    public ScalarHttpSecurityScheme() {
    }

    /**
     * Creates a new ScalarHttpSecurityScheme for Basic authentication.
     *
     * @param username the username
     * @param password the password
     */
    public ScalarHttpSecurityScheme(String username, String password) {
        this.username = username;
        this.password = password;
    }

    /**
     * Creates a new ScalarHttpSecurityScheme for Bearer authentication.
     *
     * @param token the bearer token
     */
    public static ScalarHttpSecurityScheme forBearer(String token) {
        ScalarHttpSecurityScheme scheme = new ScalarHttpSecurityScheme();
        scheme.setToken(token);
        return scheme;
    }

    /**
     * Gets the username.
     *
     * @return the username
     */
    public String getUsername() {
        return username;
    }

    /**
     * Sets the username.
     *
     * @param username the username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * Gets the password.
     *
     * @return the password
     */
    public String getPassword() {
        return password;
    }

    /**
     * Sets the password.
     *
     * @param password the password
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * Gets the token.
     *
     * @return the token
     */
    public String getToken() {
        return token;
    }

    /**
     * Sets the token.
     *
     * @param token the token
     */
    public void setToken(String token) {
        this.token = token;
    }
}
