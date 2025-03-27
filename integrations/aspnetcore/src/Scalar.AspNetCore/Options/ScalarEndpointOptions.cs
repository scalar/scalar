namespace Scalar.AspNetCore;

internal sealed record ScalarEndpointOptions(string? CdnUrl, string? Title = null, string? HeadContent = null, string? HeaderContent = null, bool DynamicBaseServerUrl = false);