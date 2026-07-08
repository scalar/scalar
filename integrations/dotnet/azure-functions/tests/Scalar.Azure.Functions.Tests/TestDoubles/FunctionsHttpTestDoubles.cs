using System.Net;
using System.Security.Claims;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace Scalar.Azure.Functions.Tests.TestDoubles;

/// <summary>
/// Minimal in-memory test doubles for the built-in Azure Functions HTTP model
/// (<see cref="HttpRequestData" /> / <see cref="HttpResponseData" />). Only the members the Scalar adapter
/// actually touches are implemented; everything else throws so accidental usage surfaces loudly.
/// </summary>
internal sealed class FakeBindingContext(IReadOnlyDictionary<string, object?> bindingData) : BindingContext
{
    public override IReadOnlyDictionary<string, object?> BindingData { get; } = bindingData;
}

internal sealed class FakeFunctionContext(IReadOnlyDictionary<string, object?> bindingData) : FunctionContext
{
    public override string InvocationId => "test-invocation";

    public override string FunctionId => "test-function";

    public override TraceContext TraceContext => throw new NotSupportedException();

    public override BindingContext BindingContext { get; } = new FakeBindingContext(bindingData);

    public override RetryContext RetryContext => throw new NotSupportedException();

    public override IServiceProvider InstanceServices { get; set; } = null!;

    public override FunctionDefinition FunctionDefinition => throw new NotSupportedException();

    public override IDictionary<object, object> Items { get; set; } = new Dictionary<object, object>();

    public override IInvocationFeatures Features => throw new NotSupportedException();
}

internal sealed class FakeHttpResponseData(FunctionContext functionContext) : HttpResponseData(functionContext)
{
    public override HttpStatusCode StatusCode { get; set; }

    public override HttpHeadersCollection Headers { get; set; } = new();

    public override Stream Body { get; set; } = new MemoryStream();

    public override HttpCookies Cookies => throw new NotSupportedException();
}

internal sealed class FakeHttpRequestData : HttpRequestData
{
    private readonly HttpResponseData _response;

    public FakeHttpRequestData(FunctionContext functionContext, Uri url, HttpHeadersCollection headers)
        : base(functionContext)
    {
        Url = url;
        Headers = headers;
        _response = new FakeHttpResponseData(functionContext);
    }

    public override Stream Body => Stream.Null;

    public override HttpHeadersCollection Headers { get; }

    public override IReadOnlyCollection<IHttpCookie> Cookies => throw new NotSupportedException();

    public override Uri Url { get; }

    public override IEnumerable<ClaimsIdentity> Identities => throw new NotSupportedException();

    public override string Method => "GET";

    public override HttpResponseData CreateResponse() => _response;
}
