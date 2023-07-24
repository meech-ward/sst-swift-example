import { StackContext, Api, Function } from "sst/constructs";

export function API({ stack, app }: StackContext) {

  new Function(stack, "HelloLambda", {
    runtime: "container",
    handler: app.local
      ? "packages/functions/HelloLambda/Dockerfile.dev"
      : "packages/functions/HelloLambda/Dockerfile",
    environment:{
      "HELLO": "WORLD"
    },
    container: {
      buildArgs: {
        targetName: "HelloLambda",
        buildType: stack.stage === "prod" ? "release" : "debug",
      },
      binds: [
        app.local ? `/packages/functions/HelloLambda/Sources:/code/Sources` : undefined,
      ],
    }
  })

  const api = new Api(stack, "api", {
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
