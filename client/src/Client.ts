import { PrivateKey } from "o1js"
import { TIME_IN_MS } from "./contants"
import { Storage } from "./Storage"
import { Server, createServer } from "http"

export class Client {
    private privateKey: PrivateKey
    private port: number
    private storage: Storage
    private server: Server

    private constructor(privateKeyBase58: string, port: string) {
        this.privateKey = PrivateKey.fromBase58(privateKeyBase58)
        this.port = parseInt(port)
        this.storage = Storage.init()
        this.server = createServer()
    }

    public static create(config: { privateKey: string; port: string }) {
        return new Client(config.privateKey, config.port)
    }

    public start() {
        this.startServer()
        this.startBackgroundProcess()
    }

    private startBackgroundProcess() {
        setInterval(async () => {
            // todo: update on-chain state
        }, TIME_IN_MS)
    }

    private startServer() {
        this.server.on("request", async (req, res) => {
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(
                JSON.stringify({
                    data: "Hello World!",
                }),
            )
        })

        this.server.listen(4444)
    }
}
