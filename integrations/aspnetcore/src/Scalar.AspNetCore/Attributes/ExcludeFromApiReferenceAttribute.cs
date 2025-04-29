namespace Scalar.AspNetCore;

/// <summary>
/// Attribute to mark endpoints or handlers to be excluded from the Scalar API reference.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method | AttributeTargets.Delegate)]
public sealed class ExcludeFromApiReferenceAttribute : Attribute;