using System.Text.RegularExpressions;

namespace Scalar.AspNetCore;

internal static partial class RegexHelper
{
    [GeneratedRegex("^[a-zA-Z]+://.*", RegexOptions.IgnoreCase)]
    internal static partial Regex IsUrlRegex();
}