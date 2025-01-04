using Microsoft.AspNetCore.Mvc;

namespace Scalar.AspNetCore.Playground.Books;

internal static class BookEndpoints
{
    internal static void MapBookEndpoints(this IEndpointRouteBuilder builder)
    {
        var books = builder.MapGroup("/books")
            .WithTags("bookstore")
            .RequireAuthorization();

        books
            .MapGet("/", ([FromServices] BookStore bookStore) => bookStore.GetAll())
            .Produces<Book[]>();

        books
            .MapGet("/{bookId:guid}", ([FromServices] BookStore bookStore, Guid bookId) =>
            {
                var book = bookStore.GetById(bookId);
                return book is null ? Results.NotFound() : Results.Ok(book);
            })
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
            .Produces(StatusCodes.Status404NotFound);
    }
}