import { StackContext } from "sst/constructs"
import { Function, FunctionProps } from "sst/constructs"

import * as lambda from "aws-cdk-lib/aws-lambda"
import * as cdk from "aws-cdk-lib"
import { v4 as uuidv4 } from 'uuid'

import path from "path"
import fs from "fs"


import Dockerode from "dockerode"

type ContainerDetails = {
  port: number
  tag: string
  buildArgs: Record<string, string>
  binds?: string[] | undefined
}

type SwiftFunctionConstructorProps = {
  environment: Record<string, string>
  handler: string,
  container: ContainerDetails
}

export function SwiftFunction(
  { stack, app }: StackContext,
  functionName: string,
  { environment, handler, container }: SwiftFunctionConstructorProps
): [lambda.DockerImageFunction | undefined, Function | undefined] {
  if (!app.local) {
    const swiftFunction = new lambda.DockerImageFunction(stack, functionName, {
      code: lambda.DockerImageCode.fromImageAsset(
        handler.substring(0, handler.lastIndexOf("/")),
        {
          buildArgs: container.buildArgs,
        }
      ),
      memorySize: 1024*2,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64,
      environment,
    })
    return [swiftFunction, undefined]
  }
  const swiftDevFunction = new Function(stack, functionName, {
    handler: "packages/functions/ts/src/proxy.handler",
    runtime: "nodejs18.x",
    timeout: 900,
    nodejs: {
      install: ["dockerode"]
    },
    environment: {
      ...environment,
      container: JSON.stringify(container),
      randomKey: uuidv4()
    },
    hooks: {
      beforeBuild: async (props: FunctionProps, out: string) => {
        const dockerode = new Dockerode()
        console.log("setup image")

        await setupImage(dockerode, container, handler)
      }
    }
  })

  return [undefined, swiftDevFunction]
}

async function setupImage(dockerode: Dockerode, container: ContainerDetails, handler: string) {
  const dockerfile = handler.split("/").pop()!
  const context = handler.substring(0, handler.lastIndexOf("/"))
  const src = [
    dockerfile,
    "Sources",
    "Package.swift",
    "execute.sh"
  ]
  const file = path.join(context, "Package.resolved")
  const fileExists = await fs.promises.stat(file).then(() => true).catch(() => false)
  if (fileExists) {
    src.push("Package.resolved")
  }

  let stream = await dockerode.buildImage(
    {
      context: context,
      src,
    },
    {
      t: container.tag,
      dockerfile,
      buildargs: container.buildArgs
    }
  )
  stream.on("data", (data) => {
    console.log(data.toString())
  })
  await new Promise((resolve, reject) => {
    dockerode.modem.followProgress(stream, (err, res) =>
      err ? reject(err) : resolve(res)
    )
  })
}