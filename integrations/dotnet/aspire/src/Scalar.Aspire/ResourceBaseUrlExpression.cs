using System.Net.Sockets;
using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// A lazily-evaluated <see cref="ReferenceExpression"/> value provider that computes the base URL for an API
/// resource at startup, when endpoint addresses and Scalar options are known.
/// </summary>
/// <remarks>
/// Created at <c>WithApiReference</c> call time and configured (via <see cref="Configure"/>) inside the
/// per-annotation options callback — after the user's own callback has run so that
/// <see cref="ScalarAspireOptions.DefaultProxy"/> and <see cref="ScalarOptions.PreferHttpsEndpoint"/> reflect
/// the final values.
/// </remarks>
internal sealed class ResourceBaseUrlExpression(IResource resource) : IValueProvider, IManifestExpressionProvider
{
    private bool _defaultProxy = true;
    private bool _preferHttps;

    /// <summary>
    /// Applies option values that affect the URL scheme and host selection.
    /// Must be called before <see cref="GetValueAsync"/> is invoked.
    /// </summary>
    public void Configure(bool defaultProxy, bool preferHttps)
    {
        _defaultProxy = defaultProxy;
        _preferHttps = preferHttps;
    }

    /// <inheritdoc />
    public string ValueExpression => $"{{{resource.Name}.bindings.http.url}}";

    /// <inheritdoc />
    public ValueTask<string?> GetValueAsync(CancellationToken cancellationToken = default)
    {
        var endpoints = resource.Annotations.OfType<EndpointAnnotation>().ToArray();

        if (endpoints.Length == 0)
        {
            throw new InvalidOperationException(
                $"No endpoints found for resource '{resource.Name}'. Ensure that the resource has at least one endpoint.");
        }

        var httpAvailable = endpoints.Any(e => e.UriScheme == "http");
        var httpsAvailable = endpoints.Any(e => e.UriScheme == "https");

        if (!httpAvailable && !httpsAvailable)
        {
            throw new InvalidOperationException(
                $"No HTTP or HTTPS endpoints found for resource '{resource.Name}'. Ensure that the resource has at least one HTTP or HTTPS endpoint.");
        }

        var shouldUseHttps = (!httpAvailable || _preferHttps) && httpsAvailable;
        var scheme = shouldUseHttps ? "https" : "http";

        string result;
        if (_defaultProxy)
        {
            // Service-discovery mode: use the resource name as the hostname.
            result = $"{scheme}://{resource.Name}";
        }
        else
        {
            var endpoint = endpoints.FirstOrDefault(e => e.UriScheme == scheme)
                           ?? throw new InvalidOperationException(
                               $"No endpoint found for resource '{resource.Name}' with URI scheme '{scheme}'.");
            result = $"{scheme}://{endpoint.TargetHost}:{endpoint.TargetPort ?? endpoint.Port}";
        }

        return ValueTask.FromResult<string?>(result);
    }
}
