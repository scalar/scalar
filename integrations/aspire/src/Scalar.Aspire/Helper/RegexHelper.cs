using System.Text.RegularExpressions;

namespace Scalar.Aspire.Helper;

internal static partial class RegexHelper
{
    [GeneratedRegex("^https?://", RegexOptions.IgnoreCase)]
    internal static partial Regex HttpUrlPattern();
}