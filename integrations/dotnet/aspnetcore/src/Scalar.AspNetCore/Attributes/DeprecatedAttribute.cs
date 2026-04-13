namespace Scalar.AspNetCore.Attributes;


/// <summary>
/// Attribute used to mark API endpoints as deprecated. 
/// This can be applied to methods to indicate that they should no longer be used and may be removed in future versions. 
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class | AttributeTargets.Delegate, AllowMultiple = false, Inherited = true)]
public sealed class DeprecatedAttribute : Attribute
{
    /// <summary>
    /// Gets the text displaying the reason why the endpoint is deprecated and reference to new endpoint if exists.
    /// </summary>
    public string? Reason { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="DeprecatedEndpointAttribute"/> class.
    /// </summary>
    /// <param name="reason">reason why is deprecated. Refference to new endpoint</param>
    public DeprecatedAttribute(string? reason = null)
    {
        Reason = reason;
    }
}
