using System.Text.Json.Nodes;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#elif SCALAR_AWS_LAMBDA
namespace Scalar.Aws.Lambda;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// UI localization for the API Reference and embedded API Client.
/// </summary>
public sealed class ScalarLocalizationOptions
{
    /// <summary>
    /// Locale for built-in translations. Regional values use browser fallback rules; unknown locales fall back to English.
    /// </summary>
    public string? Locale { get; set; }

    /// <summary>
    /// Text direction. When omitted or Auto, the direction follows the locale.
    /// </summary>
    public TextDirection? Direction { get; set; }

    /// <summary>
    /// Nested translation overrides merged with the selected locale and English fallback. Embedded client overrides belong under apiClient.
    /// </summary>
    public JsonObject? Translations { get; set; }
}
