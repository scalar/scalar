#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Options for Model Context Protocol (MCP) integration in the API reference.
/// </summary>
public sealed class ScalarMcpOptions
{
    /// <summary>
    /// Display name for the MCP server.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// URL of the MCP server.
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// When <c>true</c>, disables MCP integration for this API reference.
    /// </summary>
    public bool? Disabled { get; set; }
}
