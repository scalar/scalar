using System.Diagnostics.CodeAnalysis;

namespace Scalar.AspNetCore;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarOptions" />.
/// </summary>
public static partial class ScalarOptionsExtensions
{
    /// <summary>
    /// Controls the title of the HTML document.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="title">The title to set. Use the <c>{documentName}</c> placeholder to include the document name in the title.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>The <c>{documentName}</c> placeholder only works when there is one document configured.</remarks>
    public static ScalarOptions WithTitle(this ScalarOptions options, string title)
    {
        options.Title = title;
        return options;
    }

    /// <summary>
    /// Sets the path prefix to access the documentation.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="prefix">The path prefix to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release. Please use the 'endpointPrefix' parameter of the <see cref="ScalarEndpointRouteBuilderExtensions.MapScalarApiReference(Microsoft.AspNetCore.Routing.IEndpointRouteBuilder)" /> method instead.
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use the 'endpointPrefix' parameter of the 'MapScalarApiReference' method instead.")]
    public static ScalarOptions WithEndpointPrefix(this ScalarOptions options, string prefix)
    {
        options.EndpointPathPrefix = prefix;
        return options;
    }

    /// <summary>
    /// Sets the API key authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="apiKeyOptions">The API key options to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release. Use <see cref="AddApiKeyAuthentication" /> instead.
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddApiKeyAuthentication instead.")]
    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, ApiKeyOptions apiKeyOptions)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.ApiKey = apiKeyOptions;
        return options;
    }

    /// <summary>
    /// Configures the API key authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="configureApiKeyOptions">The action to configure the API key options.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release. Use <see cref="AddApiKeyAuthentication" /> instead.
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddApiKeyAuthentication instead.")]
    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, Action<ApiKeyOptions> configureApiKeyOptions)
    {
        var apiKeyOptions = new ApiKeyOptions();
        configureApiKeyOptions(apiKeyOptions);
        return options.WithApiKeyAuthentication(apiKeyOptions);
    }

    /// <summary>
    /// Configures the OAuth2 authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="oauth2Options">The OAuth2 options to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release.
    /// Use one of the following extension methods instead:
    /// <list type="bullet">
    /// <item><description><see cref="ScalarOptionsExtensions.AddClientCredentialsFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddAuthorizationCodeFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddImplicitFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddPasswordFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddOAuth2Flows"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddOAuth2Authentication"/></description></item>
    /// </list>
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddClientCredentialsFlow, AddAuthorizationCodeFlow, AddImplicitFlow, AddPasswordFlow, AddOAuth2Flows or AddOAuth2Authentication instead.")]
    public static ScalarOptions WithOAuth2Authentication(this ScalarOptions options, OAuth2Options oauth2Options)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.OAuth2 = oauth2Options;
        return options;
    }

    /// <summary>
    /// Configures the OAuth2 authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="configureOAuth2Options">The action to configure the OAuth2 options.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release.
    /// Use one of the following extension methods instead:
    /// <list type="bullet">
    /// <item><description><see cref="ScalarOptionsExtensions.AddClientCredentialsFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddAuthorizationCodeFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddImplicitFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddPasswordFlow"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddOAuth2Flows"/></description></item>
    /// <item><description><see cref="ScalarOptionsExtensions.AddOAuth2Authentication"/></description></item>
    /// </list>
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddClientCredentialsFlow, AddAuthorizationCodeFlow, AddImplicitFlow, AddPasswordFlow, AddOAuth2Flows or AddOAuth2Authentication instead.")]
    public static ScalarOptions WithOAuth2Authentication(this ScalarOptions options, Action<OAuth2Options> configureOAuth2Options)
    {
        var oauth2Options = new OAuth2Options();
        configureOAuth2Options(oauth2Options);
        return options.WithOAuth2Authentication(oauth2Options);
    }

    /// <summary>
    /// Sets the HTTP basic authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="httpBasicOptions">The HTTP basic options to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release. Use <see cref="AddHttpAuthentication" /> instead.
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddHttpAuthentication instead.")]
    public static ScalarOptions WithHttpBasicAuthentication(this ScalarOptions options, HttpBasicOptions httpBasicOptions)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.Http ??= new HttpOptions();
        options.Authentication.Http.Basic = httpBasicOptions;
        return options;
    }

    /// <summary>
    /// Configures the HTTP basic authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="configureHttpBasicOptions">The action to configure the HTTP basic options.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release. Use <see cref="AddHttpAuthentication" /> instead.
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddHttpAuthentication instead.")]
    public static ScalarOptions WithHttpBasicAuthentication(this ScalarOptions options, Action<HttpBasicOptions> configureHttpBasicOptions)
    {
        var httpBasicOptions = new HttpBasicOptions();
        configureHttpBasicOptions(httpBasicOptions);
        return options.WithHttpBasicAuthentication(httpBasicOptions);
    }

    /// <summary>
    /// Sets the HTTP bearer authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="httpBearerOptions">The HTTP bearer options to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release. Use <see cref="AddHttpAuthentication" /> instead.
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddHttpAuthentication instead.")]
    public static ScalarOptions WithHttpBearerAuthentication(this ScalarOptions options, HttpBearerOptions httpBearerOptions)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.Http ??= new HttpOptions();
        options.Authentication.Http.Bearer = httpBearerOptions;
        return options;
    }

    /// <summary>
    /// Configures the HTTP bearer authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="configureHttpBearerOptions">The action to configure the HTTP bearer options.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// This method is obsolete and will be removed in a future release. Use <see cref="AddHttpAuthentication" /> instead.
    /// </remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddHttpAuthentication instead.")]
    public static ScalarOptions WithHttpBearerAuthentication(this ScalarOptions options, Action<HttpBearerOptions> configureHttpBearerOptions)
    {
        var httpBearerOptions = new HttpBearerOptions();
        configureHttpBearerOptions(httpBearerOptions);
        return options.WithHttpBearerAuthentication(httpBearerOptions);
    }

    /// <summary>
    /// Controls the bundle URL for the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="url">The bundle URL to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>Use this option to load the API Reference from a different bundle or local server.</remarks>
    public static ScalarOptions WithBundleUrl(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url)
    {
        options.BundleUrl = url;
        return options;
    }

    /// <summary>
    /// Controls the CDN URL for the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="url">The CDN URL to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>Use this option to load the API Reference from a different CDN or local server.</remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use WithBundleUrl() instead.")]
    public static ScalarOptions WithCdnUrl(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url)
    {
        options.BundleUrl = url;
        return options;
    }

    /// <summary>
    /// Controls additional content included in the head section of the HTML document.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="headContent">The additional content to include in the head section.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// The provided content will be appended.
    /// </remarks>
    public static ScalarOptions AddHeadContent(this ScalarOptions options, [StringSyntax("html")] string headContent)
    {
        options.HeadContent += headContent;
        return options;
    }

    /// <summary>
    /// Controls HTML content rendered in the header section of the page.
    /// This content will be embedded after the <c>&lt;body&gt;</c> tag and before the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="headerContent">The additional content to include in the header section.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <example>
    /// The following is an example of how to use this method:
    /// <code>AddHeaderContent("&lt;header&gt;Welcome to my API Reference&lt;/header&gt;");</code>
    /// renders the following HTML:
    /// <code>
    /// <![CDATA[
    /// <body>
    ///     <header>Welcome to my API Reference</header>
    ///     <script id="api-reference"></script>
    /// </body>
    /// ]]>
    /// </code>
    /// </example>
    /// <remarks>The provided content will be appended.</remarks>
    public static ScalarOptions AddHeaderContent(this ScalarOptions options, [StringSyntax("html")] string headerContent)
    {
        options.HeaderContent += headerContent;
        return options;
    }

    /// <summary>
    /// Controls whether the base server URL should be dynamically determined based on the request context.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="dynamicBaseServerUrl">Whether to dynamically adjust the base server URL.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// When set to <c>true</c>, the <see cref="ScalarOptions.BaseServerUrl" /> property will be overwritten and the base server URL will be dynamically
    /// adjusted based on the request context. This only works for relative server URLs.
    /// </remarks>
    public static ScalarOptions WithDynamicBaseServerUrl(this ScalarOptions options, bool dynamicBaseServerUrl = true)
    {
        options.DynamicBaseServerUrl = dynamicBaseServerUrl;
        return options;
    }

    /// <summary>
    /// Controls the path to a custom configuration JavaScript module.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="javaScriptConfiguration">The path to the custom JavaScript module.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    /// <remarks>
    /// If the path is relative, it will be normalized relative to the base path.
    /// </remarks>
    public static ScalarOptions WithJavaScriptConfiguration(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string javaScriptConfiguration)
    {
        options.JavaScriptConfiguration = javaScriptConfiguration;
        return options;
    }
}