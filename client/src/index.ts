import { homedir } from "os"
import { Client } from "./Client.js"

const clientPrivateKey = process.env.XANE_PRIVATE_KEY
const clientPort = process.env.XANE_PORT

if (!clientPrivateKey) {
    throw Error("Set `XANE_PRIVATE_KEY` environment variable before running Xane client.")
}

if (!clientPort) {
    throw Error("Set `XANE_PORT` environment variable before running Xane client.")
}

const client = await Client.create({
    port: clientPort,
    privateKey: clientPrivateKey,
    storageDirectory: homedir() + "/.xane.json",
})

client.start()
