namespace Scalar.AspNetCore;

/// <summary>
/// Attribute used to attach badges to API endpoints for documentation purposes.
/// Can be applied to classes, methods, or delegates to provide visual indicators.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method | AttributeTargets.Delegate, AllowMultiple = true)]
public sealed class BadgeAttribute : Attribute
{
    /// <summary>
    /// Initializes a new instance of the <see cref="BadgeAttribute"/> class.
    /// </summary>
    /// <param name="name">The text that displays in the badge.</param>
    public BadgeAttribute(string name)
    {
        Name = name;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="BadgeAttribute"/> class with position.
    /// </summary>
    /// <param name="name">The text that displays in the badge.</param>
    /// <param name="position">The position of the badge in relation to the header.</param>
    public BadgeAttribute(string name, BadgePosition position)
    {
        Name = name;
        Position = position;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="BadgeAttribute"/> class with position and color.
    /// </summary>
    /// <param name="name">The text that displays in the badge.</param>
    /// <param name="position">The position of the badge in relation to the header.</param>
    /// <param name="color">The color of the badge.</param>
    public BadgeAttribute(string name, BadgePosition position, string color)
    {
        Name = name;
        Position = position;
        Color = color;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="BadgeAttribute"/> class with color.
    /// </summary>
    /// <param name="name">The text that displays in the badge.</param>
    /// <param name="color">The color of the badge.</param>
    public BadgeAttribute(string name, string color)
    {
        Name = name;
        Color = color;
    }

    internal BadgeAttribute(string name, BadgePosition? position = null, string? color = null)
    {
        Name = name;
        Position = position;
        Color = color;
    }

    /// <summary>
    /// Gets the text that displays in the badge.
    /// </summary>
    internal string Name { get; }

    /// <summary>
    /// Gets the position of the badge in relation to the header.
    /// </summary>
    internal BadgePosition? Position { get; }

    /// <summary>
    /// Gets the color of the badge.
    /// </summary>
    internal string? Color { get; }
}