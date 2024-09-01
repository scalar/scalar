using System.ComponentModel;

namespace Scalar.AspNetCore;

public enum ScalarTargets
{
    C,
    Clojure,
    CSharp,
    Go,
    Http,
    Java,
    JavaScript,
    Kotlin,
    Node,
    ObjC,
    OCaml,
    PHP,
    PowerShell,
    Python,
    R,
    Ruby,
    Shell,
    Swift,
}

internal static class Extensions
{
    static public string GetDescription(this Enum enumValue)
    {
        var field = enumValue.GetType().GetField(enumValue.ToString());
        if (field == null)
            return enumValue.ToString();

        var attributes = field.GetCustomAttributes(typeof(DescriptionAttribute), false);
        if (Attribute.GetCustomAttribute(field, typeof(DescriptionAttribute)) is DescriptionAttribute attribute)
        {
            return attribute.Description;
        }

        return enumValue.ToString();
    }
}
