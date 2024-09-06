using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Scalar.AspNetCore.Playground;

internal sealed class ApiKeyAuthenticationSchemeHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    [Obsolete("This constructor is obsolete.")]
    public ApiKeyAuthenticationSchemeHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock) : base(options, logger, encoder, clock)
    {
    }

    public ApiKeyAuthenticationSchemeHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Context.Request.Headers.TryGetValue("X-Api-Key", out var apiKey))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (apiKey != "my-api-key")
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key"));
        }

        var identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Api-Key-User")], Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        var result = AuthenticateResult.Success(ticket);
        return Task.FromResult(result);
    }
}