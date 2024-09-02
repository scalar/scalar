using System.ComponentModel;

namespace Scalar.AspNetCore;

public enum ScalarTargets
{
    [Description("c")]
    C,

    [Description("clojure")]
    Clojure,

    [Description("csharp")]
    CSharp,

    [Description("go")]
    Go,

    [Description("http")]
    Http,

    [Description("java")]
    Java,

    [Description("javascript")]
    JavaScript,

    [Description("kotlin")]
    Kotlin,

    [Description("node")]
    Node,

    [Description("objc")]
    ObjC,

    [Description("ocaml")]
    OCaml,

    [Description("php")]
    PHP,

    [Description("powershell")]
    PowerShell,

    [Description("python")]
    Python,

    [Description("r")]
    R,

    [Description("ruby")]
    Ruby,

    [Description("shell")]
    Shell,

    [Description("swift")]
    Swift
}

internal static class Extensions
{
    public static string GetDescription(this Enum enumValue)
    {
        var field = enumValue.GetType().GetField(enumValue.ToString());
        if (field == null)
            return enumValue.ToString();

        if (Attribute.GetCustomAttribute(field, typeof(DescriptionAttribute)) is DescriptionAttribute attribute) return attribute.Description;

        return enumValue.ToString();
    }
}