#if !SCALAR_ASPIRE
using System.Security.Cryptography;

#if SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Generates cryptographic nonces for Content-Security-Policy compatible script tags.
/// </summary>
internal static class ScalarNonce
{
    /// <summary>
    /// Generates a fresh base64url-encoded cryptographically random nonce.
    /// </summary>
    internal static string Generate()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        // Base64url avoids '+' and '/', which HtmlEncoder.Default would otherwise escape as numeric entities.
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
#endif
