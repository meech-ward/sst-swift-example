import AWSLambdaRuntime
import AWSLambdaEvents
import Foundation

@main
struct MyLambda: SimpleLambdaHandler {

  struct Response: Codable {
    let message: String
  }

  func handle(_ request: APIGatewayV2Request, context: LambdaContext) async throws -> Response {
    return Response(message: "Hello Lambda From Swift!")
  }
}
