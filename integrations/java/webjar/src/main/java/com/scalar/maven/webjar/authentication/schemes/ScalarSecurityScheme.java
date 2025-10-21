package com.scalar.maven.webjar.authentication.schemes;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Represents the base class for security schemes in Scalar.
 */
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = ScalarHttpSecurityScheme.class, name = "http"),
        @JsonSubTypes.Type(value = ScalarApiKeySecurityScheme.class, name = "apiKey"),
        @JsonSubTypes.Type(value = ScalarOAuth2SecurityScheme.class, name = "oauth2")
})
public abstract class ScalarSecurityScheme {

    /**
     * Gets or sets the description of this security scheme.
     */
    private String description;

    /**
     * Creates a new ScalarSecurityScheme.
     */
    protected ScalarSecurityScheme() {
    }

    /**
     * Gets the description of this security scheme.
     *
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of this security scheme.
     *
     * @param description the description
     */
    public void setDescription(String description) {
        this.description = description;
    }
}
