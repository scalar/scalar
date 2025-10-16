#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Represents a server with a URL and an optional description.
/// </summary>
/// <param name="Url">The URL of the server.</param>
/// <param name="Description">An optional description of the server.</param>
public sealed record ScalarServer(string Url, string? Description = null);