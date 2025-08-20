using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace Scalar.AspNetCore.Playground.Books;

internal static class BookEndpoints
{
    internal static void MapBookEndpoints(this IEndpointRouteBuilder builder)
    {
        var apiVersionSet = builder.NewApiVersionSet()
            .HasApiVersion(new ApiVersion(1))
            .HasApiVersion(new ApiVersion(2))
            .Build();

        var books = builder.MapGroup("v{version:apiVersion}/books")
            .WithTags("bookstore")
            .WithApiVersionSet(apiVersionSet)
            .MapToApiVersion(1)
            .MapToApiVersion(2)
            .RequireAuthorization();

        books
            .MapGet("/", [Stability(Stability.Stable)] ([FromServices] BookStore bookStore) => bookStore.GetAll())
            .Produces<IEnumerable<Book>>();

        books
            .MapGet("/{bookId:guid}", ([FromServices] BookStore bookStore, Guid bookId) =>
            {
                var book = bookStore.GetById(bookId);
                return book is null ? Results.NotFound() : Results.Ok(book);
            })
            .Experimental()
            .Produces<Book>()
            .Produces(StatusCodes.Status404NotFound);

        books
            .MapPost("/", ([FromServices] BookStore bookStore, Book myCustomBook) =>
            {
                var createdBook = bookStore.Add(myCustomBook);
                return createdBook is null ? Results.Conflict() : Results.Created($"/books/{createdBook.BookId}", createdBook);
            })
            .Produces<Book>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status409Conflict);

        books
            .MapPut("/{bookId:guid}", ([FromServices] BookStore bookStore, Guid bookId, Book book) =>
            {
                var updatedBook = bookStore.UpdateById(bookId, book);
                return updatedBook is null ? Results.NotFound() : Results.Ok(updatedBook);
            })
            .Produces<Book>()
            .Produces(StatusCodes.Status404NotFound);

        books.MapDelete("/{bookId:guid}", ([FromServices] BookStore bookStore, Guid bookId) =>
            {
                var deleted = bookStore.DeleteById(bookId);
                return deleted ? Results.NoContent() : Results.NotFound();
            })
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .WithBadge("Caution", BadgePosition.Before, "#ffc2c2");
    }
}