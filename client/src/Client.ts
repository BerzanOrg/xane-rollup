import { PrivateKey } from "o1js"
import { readFileSync, existsSync, writeFileSync } from "fs"
import { Server, createServer } from "http"
import { Balance, Liquidity, Pool, RollupStorage } from "xane"
import { exit } from "process"
import z from "zod"
import { writeFile } from "fs/promises"

/** The interval duration for rollup background process. */
const INTERVAL_DURATION = 5 * 60 * 1000

/** The Zod schema used to validate rollup storage in disk. */
const StorageSchema = z.object({
    balances: z.array(
        z.object({
            tokenId: z.string(),
            owner: z.string(),
            amount: z.string(),
        }),
    ),
    pools: z.array(
        z.object({
            baseTokenId: z.string(),
            quoteTokenId: z.string(),
            baseTokenAmount: z.string(),
            quoteTokenAmount: z.string(),
            k: z.string(),
            lpPoints: z.string(),
        }),
    ),
    liquidities: z.array(
        z.object({
            baseTokenId: z.string(),
            quoteTokenId: z.string(),
            lpPoints: z.string(),
            provider: z.string(),
        }),
    ),
})

/** The TypeScript type of the Zod schema used to validate rollup storage in disk. */
type StorageSchema = z.infer<typeof StorageSchema>

/** The rollup client.  */
export class Client {
    private privateKey: PrivateKey
    private port: number
    private storage: RollupStorage
    private storageDirectory: string
    private server: Server

    private constructor(
        privateKeyBase58: string,
        port: string,
        storageDirectory: string,
        oldBalances: Array<Balance>,
        oldPools: Array<Pool>,
        oldLiquidites: Array<Liquidity>,
    ) {
        this.privateKey = PrivateKey.fromBase58(privateKeyBase58)
        this.port = parseInt(port)
        this.storageDirectory = storageDirectory
        this.storage = RollupStorage.restore(oldBalances, oldPools, oldLiquidites)
        this.server = createServer()
    }

    /**
     * Creates a rollup client using given configuration.
     */
    public static create(config: {
        privateKey: string
        port: string
        storageDirectory: string
    }) {
        try {
            if (!existsSync(config.storageDirectory)) {
                const dataToSave = JSON.stringify({
                    balances: [],
                    pools: [],
                    liquidities: [],
                } satisfies StorageSchema)

                writeFileSync(dataToSave, config.storageDirectory)
            }

            const savedStorageContent = readFileSync(config.storageDirectory, "utf-8")

            const savedStorage: StorageSchema = JSON.parse(savedStorageContent)

            StorageSchema.parse(savedStorage)

            const savedBalances = savedStorage.balances.map(
                (balance) => new Balance(Balance.fromJSON(balance)),
            )

            const savedPools = savedStorage.pools.map(
                (pool) => new Pool(Pool.fromJSON(pool)),
            )

            const savedLiquidities = savedStorage.liquidities.map(
                (liquidity) => new Liquidity(Liquidity.fromJSON(liquidity)),
            )

            return new Client(
                config.privateKey,
                config.port,
                config.storageDirectory,
                savedBalances,
                savedPools,
                savedLiquidities,
            )
        } catch (error) {
            console.error(error)
            exit(1)
        }
    }

    /**
     * Starts the rollup client.
     */
    public start() {
        this.startServer()
        this.startBackgroundProcess()
    }

    /**
     * Starts the rollup background process.
     */
    private startBackgroundProcess() {
        setInterval(async () => {
            // todo: update on-chain state
        }, INTERVAL_DURATION)
    }

    /**
     * Starts the rollup server.
     */
    private startServer() {
        this.server.on("request", async (req, res) => {
            req.url
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(
                JSON.stringify({
                    data: "Hello World!",
                }),
            )
        })

        this.server.listen(this.port)
    }
    /**
     * Saves the rollup state to disk.
     */
    private async saveState() {
        const balances = this.storage.balances
            .getBalances()
            .map((balance) => Balance.toJSON(balance))

        const pools = this.storage.pools.getPools().map((pool) => Pool.toJSON(pool))

        const liquidities = this.storage.liquidities
            .getLiquidities()
            .map((liquidity) => Liquidity.toJSON(liquidity))

        const dataToSave = JSON.stringify({
            balances,
            pools,
            liquidities,
        } satisfies StorageSchema)

        await writeFile(this.storageDirectory, dataToSave)
    }
}
