import { Field, PrivateKey, PublicKey } from "o1js"
import { readFileSync, existsSync, writeFileSync } from "fs"
import { Server, createServer } from "http"
import { Balance, Liquidity, Pool, RollupStorage } from "xane"
import { exit } from "process"
import { writeFile } from "fs/promises"
import { RequestSchema, StorageSchema } from "./schemas.js"
import { readBodyJson } from "./utils.js"

/** The interval duration for rollup background process. */
const INTERVAL_DURATION = 5 * 60 * 1000

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

                writeFileSync(config.storageDirectory, dataToSave)
            }

            const savedStorageContent = readFileSync(config.storageDirectory, "utf-8")

            const savedStorage: StorageSchema = JSON.parse(savedStorageContent)

            StorageSchema.parse(savedStorage)

            const savedBalances = savedStorage.balances.map(
                (balance) =>
                    new Balance(
                        Balance.fromJSON({
                            ...balance,
                            tokenId: balance.tokenId.toString(),
                            amount: balance.amount.toString(),
                        }),
                    ),
            )

            const savedPools = savedStorage.pools.map(
                (pool) =>
                    new Pool(
                        Pool.fromJSON({
                            baseTokenId: pool.baseTokenId.toString(),
                            quoteTokenId: pool.quoteTokenId.toString(),
                            baseTokenAmount: pool.baseTokenAmount.toString(),
                            quoteTokenAmount: pool.quoteTokenAmount.toString(),
                            k: pool.k.toString(),
                            lpPoints: pool.lpPoints.toString(),
                        }),
                    ),
            )

            const savedLiquidities = savedStorage.liquidities.map(
                (liquidity) =>
                    new Liquidity(
                        Liquidity.fromJSON({
                            ...liquidity,
                            baseTokenId: liquidity.baseTokenId.toString(),
                            quoteTokenId: liquidity.quoteTokenId.toString(),
                            lpPoints: liquidity.lpPoints.toString(),
                        }),
                    ),
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
        console.log("Xane client is running at port %d", this.port)
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
            try {
                const body = RequestSchema.parse(await readBodyJson(req))
                res.writeHead(200, { "Content-Type": "application/json" })
                res.end(JSON.stringify(this.runMethod(body)))
            } catch (error) {
                res.writeHead(400)
                res.end("non-existent method")
            }
        })
        this.server.listen(this.port)
    }

    /**
     * Saves the rollup state to disk.
     */
    private async saveState() {
        const balances: StorageSchema["balances"] = this.storage.balances
            .getAllBalances()
            .map((balance) => Balance.toJSON(balance))
            .map((balance) => ({
                ...balance,
                tokenId: BigInt(balance.tokenId),
                amount: BigInt(balance.amount),
            }))

        const pools = this.storage.pools
            .getAllPools()
            .map((pool) => Pool.toJSON(pool))
            .map((pool) => ({
                ...pool,
                baseTokenId: BigInt(pool.baseTokenId),
                quoteTokenId: BigInt(pool.quoteTokenId),
                baseTokenAmount: BigInt(pool.baseTokenAmount),
                quoteTokenAmount: BigInt(pool.quoteTokenAmount),
                k: BigInt(pool.k),
                lpPoints: BigInt(pool.lpPoints),
            }))

        const liquidities: StorageSchema["liquidities"] = this.storage.liquidities
            .getAllLiquidities()
            .map((liquidity) => Liquidity.toJSON(liquidity))
            .map((liquidity) => ({
                ...liquidity,
                baseTokenId: BigInt(liquidity.baseTokenId),
                quoteTokenId: BigInt(liquidity.quoteTokenId),
                lpPoints: BigInt(liquidity.lpPoints),
            }))

        const dataToSave = JSON.stringify({
            balances,
            pools,
            liquidities,
        } satisfies StorageSchema)

        await writeFile(this.storageDirectory, dataToSave)
    }

    /** Runs the given method and responds. */
    private runMethod(reqBody: RequestSchema): string {
        switch (reqBody.method) {
            case "getAllBalances": {
                const allBalances = this.storage.balances.getAllBalances()
                return JSON.stringify(allBalances)
            }

            case "getBalancesByOwner": {
                const balancesByOwner = this.storage.balances.getBalancesByOwner({
                    owner: PublicKey.fromBase58(reqBody.owner),
                })
                return JSON.stringify(balancesByOwner)
            }

            case "getBalancesByTokenId": {
                const balancesByTokenId = this.storage.balances.getBalancesByTokenId({
                    tokenId: Field.from(reqBody.tokenId),
                })
                return JSON.stringify(balancesByTokenId)
            }

            case "getBalance": {
                const balance = this.storage.balances.get({
                    tokenId: Field.from(reqBody.tokenId),
                    owner: PublicKey.fromBase58(reqBody.owner),
                })
                return JSON.stringify(balance)
            }

            case "getAllPools": {
                const allPools = this.storage.pools.getAllPools()
                return JSON.stringify(allPools)
            }

            case "getPoolsByBaseTokenId": {
                const poolsByBaseTokenId = this.storage.pools.getPoolsByBaseTokenId({
                    baseTokenId: Field.from(reqBody.baseTokenId),
                })
                return JSON.stringify(poolsByBaseTokenId)
            }

            case "getPoolsByQuoteTokenId": {
                const poolsByQuoteTokenId = this.storage.pools.getPoolsByQuoteTokenId({
                    quoteTokenId: Field.from(reqBody.quoteTokenId),
                })
                return JSON.stringify(poolsByQuoteTokenId)
            }

            case "getPool": {
                const pool = this.storage.pools.get({
                    baseTokenId: Field.from(reqBody.baseTokenId),
                    quoteTokenId: Field.from(reqBody.quoteTokenId),
                })
                return JSON.stringify(pool)
            }

            case "getAllLiquidities": {
                const allLiquidities = this.storage.liquidities.getAllLiquidities()
                return JSON.stringify(allLiquidities)
            }

            case "getLiquiditiesByProvider": {
                const liquiditiesByProvider =
                    this.storage.liquidities.getLiquiditiesByProvider({
                        provider: PublicKey.fromBase58(reqBody.provider),
                    })
                return JSON.stringify(liquiditiesByProvider)
            }

            case "getLiquiditiesByPool": {
                const liquiditiesByPool = this.storage.liquidities.getLiquiditiesByPool({
                    baseTokenId: Field.from(reqBody.baseTokenId),
                    quoteTokenId: Field.from(reqBody.quoteTokenId),
                })
                return JSON.stringify(liquiditiesByPool)
            }

            case "getLiquidity": {
                const liquidity = this.storage.liquidities.get({
                    baseTokenId: Field.from(reqBody.baseTokenId),
                    quoteTokenId: Field.from(reqBody.quoteTokenId),
                    provider: PublicKey.fromBase58(reqBody.provider),
                })
                return JSON.stringify(liquidity)
            }

            default:
                throw Error("Impossible to reach here.")
        }
    }
}
