namespace Scalar.AspNetCore;

public class ScalarAuthenticationOptions
{
    /// <summary>
    /// The OpenAPI file has keys for all security schemes
    /// </summary>
    public required string PreferredSecurityScheme { get; set; }

    public ApiKeyOptions? ApiKey { get; set; }

    public OAuth2Options? OAuth2 { get; set; }
}