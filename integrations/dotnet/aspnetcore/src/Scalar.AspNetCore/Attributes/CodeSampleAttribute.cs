namespace Scalar.AspNetCore;

/// <summary>
/// Attribute used to attach code samples to API endpoints for documentation purposes.
/// Can be applied to classes, methods, or delegates to provide example code.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method | AttributeTargets.Delegate, AllowMultiple = true)]
public sealed class CodeSampleAttribute : Attribute
{
    /// <summary>
    /// Initializes a new instance of the <see cref="CodeSampleAttribute"/> class.
    /// </summary>
    /// <param name="sample">The code sample content.</param>
    /// <param name="label">An optional label for the code sample.</param>
    public CodeSampleAttribute(string sample, string? label = null)
    {
        Sample = sample;
        Label = label;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="CodeSampleAttribute"/> class with a specific language target.
    /// </summary>
    /// <param name="sample">The code sample content.</param>
    /// <param name="language">The language for the code sample.</param>
    /// <param name="label">An optional label for the code sample.</param>
    public CodeSampleAttribute(string sample, ScalarTarget language, string? label = null)
    {
        Sample = sample;
        Language = language;
        Label = label;
    }

    internal CodeSampleAttribute(string sample, ScalarTarget? language, string? label = null)
    {
        Sample = sample;
        Language = language;
        Label = label;
    }

    internal string Sample { get; set; }

    internal ScalarTarget? Language { get; set; }

    internal string? Label { get; set; }
}