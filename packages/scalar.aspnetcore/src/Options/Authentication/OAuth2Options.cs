namespace Scalar.AspNetCore;

public sealed class OAuth2Options
{
    public string? ClientId { get; set; }

    public IEnumerable<string>? Scopes { get; set; }
}