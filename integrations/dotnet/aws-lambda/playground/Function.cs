using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.SystemTextJson;
using Scalar.Aws.Lambda;

// Serves the Scalar API reference (and its static assets) from an executable-assembly Lambda function fronted
// by an Amazon API Gateway HTTP API. The route must use the {proxy+} greedy path parameter (see template.yaml).
var handler = ScalarApiReferenceHandler.Create(options =>
{
    options.Title = "Scalar AWS Lambda Playground";
});

await LambdaBootstrapBuilder.Create<APIGatewayHttpApiV2ProxyRequest, APIGatewayHttpApiV2ProxyResponse>(handler, new DefaultLambdaJsonSerializer())
    .Build()
    .RunAsync();
