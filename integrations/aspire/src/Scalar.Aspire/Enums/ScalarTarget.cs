using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Represents the different targets available in Scalar.
/// </summary>
[EnumExtensions]
public enum ScalarTarget
{
    /// <summary>
    /// C programming language.
    /// </summary>
    [Description("c")]
    C,

    /// <summary>
    /// Clojure programming language.
    /// </summary>
    [Description("clojure")]
    Clojure,

    /// <summary>
    /// C\# programming language.
    /// </summary>
    [Description("csharp")]
    CSharp,

    /// <summary>
    /// Dart programming language.
    /// </summary>
    [Description("dart")]
    Dart,

    /// <summary>
    /// Go programming language.
    /// </summary>
    [Description("go")]
    Go,

    /// <summary>
    /// HTTP protocol.
    /// </summary>
    [Description("http")]
    Http,

    /// <summary>
    /// Java programming language.
    /// </summary>
    [Description("java")]
    Java,

    /// <summary>
    /// JavaScript programming language.
    /// </summary>
    [Description("js")]
    JavaScript,

    /// <summary>
    /// Kotlin programming language.
    /// </summary>
    [Description("kotlin")]
    Kotlin,

    /// <summary>
    /// Node.js runtime.
    /// </summary>
    [Description("node")]
    Node,

    /// <summary>
    /// Objective-C programming language.
    /// </summary>
    [Description("objc")]
    ObjC,

    /// <summary>
    /// OCaml programming language.
    /// </summary>
    [Description("ocaml")]
    OCaml,

    /// <summary>
    /// PHP programming language.
    /// </summary>
    [Description("php")]
    Php,

    /// <summary>
    /// PowerShell scripting language.
    /// </summary>
    [Description("powershell")]
    PowerShell,

    /// <summary>
    /// Python programming language.
    /// </summary>
    [Description("python")]
    Python,

    /// <summary>
    /// R programming language.
    /// </summary>
    [Description("r")]
    R,

    /// <summary>
    /// Ruby programming language.
    /// </summary>
    [Description("ruby")]
    Ruby,

    /// <summary>
    /// Rust programming language.
    /// </summary>
    [Description("rust")]
    Rust,

    /// <summary>
    /// Shell scripting language.
    /// </summary>
    [Description("shell")]
    Shell,

    /// <summary>
    /// Swift programming language.
    /// </summary>
    [Description("swift")]
    Swift
}