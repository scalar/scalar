namespace Scalar.AspNetCore.Playground.Books;

internal sealed class Book
{
    public Guid BookId { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public required int Pages { get; set; }
}