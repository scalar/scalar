namespace Scalar.AspNetCore;

internal interface IScalarDocumentProvider
{
    Task<string> GetDocumentContentAsync(string documentName, CancellationToken cancellationToken);
}