using Bogus;

namespace Scalar.AspNetCore.Playground.Books;

internal sealed class BookStore
{
    private readonly List<Book> _books;

    public BookStore()
    {
        var faker = new Faker<Book>()
            .UseSeed(69)
            .RuleFor(b => b.BookId, f => f.Random.Guid())
            .RuleFor(b => b.Title, f => f.Lorem.Sentence(3))
            .RuleFor(b => b.Description, f => f.Lorem.Paragraph(1))
            .RuleFor(b => b.Pages, f => f.Random.Int(69, 420));
        _books = faker.Generate(10);
    }

    internal IEnumerable<Book> GetAll() => _books;

    internal Book? GetById(Guid bookId) => _books.FirstOrDefault(x => x.BookId == bookId);

    internal Book? Add(Book book)
    {
        if (_books.Any(x => x.BookId == book.BookId))
        {
            return null;
        }

        _books.Add(book);
        return book;
    }

    internal Book? UpdateById(Guid bookId, Book book)
    {
        var index = _books.FindIndex(x => x.BookId == bookId);
        if (index != -1)
        {
            book.BookId = bookId;
            _books[index] = book;
            return book;
        }

        return null;
    }

    internal bool DeleteById(Guid bookId)
    {
        var book = _books.FirstOrDefault(x => x.BookId == bookId);
        if (book is not null)
        {
            _books.Remove(book);
            return true;
        }

        return false;
    }
}