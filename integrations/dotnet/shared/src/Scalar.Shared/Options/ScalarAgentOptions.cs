#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Options for Agent Scalar (AI chat in the API reference).
/// </summary>
public sealed class ScalarAgentOptions
{
    /// <summary>
    /// Agent Scalar API key. Required for production; on localhost a limited free tier is available.
    /// </summary>
    public string? Key { get; set; }

    /// <summary>
    /// When <c>true</c>, disables Agent Scalar for this scope (global or per-document).
    /// </summary>
    public bool? Disabled { get; set; }
}
