import { APIGatewayProxyEventV2, Context } from "aws-lambda"
import Dockerode from "dockerode"

type ContainerDetails = {
  port: number
  tag: string
  buildArgs: Record<string, string>
  binds?: string[] | undefined
}

let dockerode: Dockerode | undefined
export async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const containerDetails: ContainerDetails = JSON.parse(process.env.container!)
  const randomKey = process.env.randomKey ?? ""
  if (!dockerode) {
    console.log("running container")
    dockerode = new Dockerode()
    await runContainer(dockerode, containerDetails, randomKey)
  }

  const url = `http://localhost:${containerDetails.port}/2015-03-31/functions/function/invocations`
  console.log("proxy to", url)
  try {
    
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(event),
      headers: { "Content-Type": "application/json" },
    })
    const data = await response.text()

    return data
  } catch (error) {
    console.log("error", error)
    return {
      statusCode: 500,
      body: "could not proxy, try again soon",
    }
  }
}

async function runContainer(dockerode: Dockerode, container: ContainerDetails, randomKey: string) {
  const allContainers = await dockerode.listContainers({ all: true })
  const alreadyRunning = allContainers.find((c) => c.Labels?.randomKey == randomKey)
  if (alreadyRunning) {
    return 
  }

  await Promise.all(
    allContainers
      .filter((c) => c.Image == container.tag)
      .map(async (c) => {
        const container = await dockerode.getContainer(c.Id)
        await container.stop().catch(() => {})
        await container.remove().catch(() => {})
      })
  )

  dockerode.run(container.tag, [], process.stdout, {
    Labels: {
      "randomKey": randomKey
    },
    Env: [
      ...Object.entries(process.env).map(([key, value]) => `${key}=${value}`),
    ],
    ExposedPorts: {
      "8080/tcp": {},
    },
    HostConfig: {
      PortBindings: {
        "8080/tcp": [
          {
            HostPort: String(container.port),
          },
        ],
      },
      Binds: container.binds,
    },
  })

  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log("running container")
}
