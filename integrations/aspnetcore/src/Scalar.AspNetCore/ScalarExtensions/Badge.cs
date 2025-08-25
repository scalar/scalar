namespace Scalar.AspNetCore;

internal sealed class Badge
{
    public required string Name { get; init; }

    public required BadgePosition? Position { get; init; }

    public required string? Color { get; init; }
}