import { Client } from "./Client"

const clientPrivateKey = process.env.XANE_CLIENT_PRIVATE_KEY
const clientPort = process.env.XANE_CLIENT_PORT

if (!clientPrivateKey) {
    throw Error(
        "Set `XANE_CLIENT_PRIVATE_KEY` environment variable before running Xane client.",
    )
}

if (!clientPort) {
    throw Error(
        "Set `XANE_CLIENT_PORT` environment variable before running Xane client.",
    )
}

const client = Client.create({
    port: clientPort,
    privateKey: clientPrivateKey,
})

client.start()
