using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

[EnumExtensions]
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