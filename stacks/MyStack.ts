import { StackContext, Api, Function } from "sst/constructs";

import { SwiftFunction } from "../helpers/SwiftFunction";

import path from "path";
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export function API({ stack, app }: StackContext) {

  const [swiftFunction, swiftDevFunction] = SwiftFunction(
    { app, stack },
    "hello-swift",
    {
      handler: app.local
        ? "packages/functions/HelloLambda/Dockerfile.dev"
        : "packages/functions/HelloLambda/Dockerfile",
      environment: {
        HELLO: "WORLD",
      },
      container: {
        port: 9000,
        tag: "hello-swift",
        buildArgs: {
          target_name: "HelloLambda",
          build_type: stack.stage === "prod" ? "release" : "debug",
        },
        binds: app.local ? [`${path.join(__dirname, "packages/functions/HelloLambda")}/Sources:/code/Sources`] : undefined
      },
    }
  );

  const api = new Api(stack, "api", {
    routes: {
      "GET /": swiftDevFunction ?? {
        cdk: {
          function: swiftFunction!, //"packages/functions/src/lambda.handler",
        },
      },
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
