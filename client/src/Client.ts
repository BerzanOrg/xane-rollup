import { Field, PrivateKey, PublicKey, Signature, UInt64 } from "o1js"
import { readFileSync, existsSync, writeFileSync } from "fs"
import { Server, createServer } from "http"
import { Balance, Liquidity, Pool, RollupProgram, RollupStorage } from "xane"
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
                const reqBody = RequestSchema.parse(await readBodyJson(req))
                try {
                    const response = await this.runMethod(reqBody)
                    res.writeHead(200, { "Content-Type": "application/json" })
                    res.end(response)
                } catch (error) {
                    res.writeHead(400, { "Content-Type": "application/json" })
                    if (typeof error === "string") {
                        res.end(error)
                    } else {
                        console.error("Unknown error is below:")
                        console.error(error)
                        res.end("unknown-error")
                    }
                }
            } catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" })
                res.end("mistaken-method")
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
    private async runMethod(reqBody: RequestSchema): Promise<string> {
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

            case "createPool": {
                const sender = PublicKey.fromBase58(reqBody.sender)
                const signature = Signature.fromBase58(reqBody.senderSignature)
                const baseTokenId = Field.from(reqBody.baseTokenId)
                const quoteTokenId = Field.from(reqBody.quoteTokenId)
                const baseTokenAmount = UInt64.from(reqBody.baseTokenAmount)
                const quoteTokenAmount = UInt64.from(reqBody.quoteTokenAmount)

                const baseTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: baseTokenId,
                })

                const quoteTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: quoteTokenId,
                })

                const poolExists = this.storage.pools.exists({
                    baseTokenId,
                    quoteTokenId,
                })

                const emptyPool = Pool.empty()
                const emptyLiquidity = Liquidity.empty()
                const balanceDoubleWitness = this.storage.balances.getDoubleWitness({
                    firstTokenId: baseTokenId,
                    secondTokenId: quoteTokenId,
                    owner: sender,
                })
                const poolWitness = this.storage.pools.getWitnessNew()
                const liquidityWitness = this.storage.liquidities.getWitnessNew()

                if (poolExists) {
                    throw JSON.stringify("pool-already-exists")
                }

                if (baseTokenBalance instanceof Error) {
                    throw JSON.stringify("no-base-token-balance")
                }

                if (quoteTokenBalance instanceof Error) {
                    throw JSON.stringify("no-quote-token-balance")
                }

                if (balanceDoubleWitness instanceof Error) {
                    throw JSON.stringify("no-base-or-quote-token-balance")
                }

                try {
                    const proof = await RollupProgram.createPoolV2(
                        this.storage.state,
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmount,
                        baseTokenBalance,
                        quoteTokenBalance,
                        emptyPool,
                        emptyLiquidity,
                        balanceDoubleWitness,
                        poolWitness,
                        liquidityWitness,
                    )

                    this.storage.state.createPool({
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmount,
                        baseTokenBalance,
                        quoteTokenBalance,
                        emptyPool,
                        emptyLiquidity,
                        balanceDoubleWitness,
                        poolWitness,
                        liquidityWitness,
                    })

                    // todo: use a recursive proof
                    proof

                    this.storage.updateState()

                    return JSON.stringify("ok")
                } catch (error) {
                    if (typeof error === "string") {
                        throw JSON.stringify(error)
                    } else if (error instanceof Error) {
                        throw JSON.stringify(error.message)
                    } else {
                        console.error("Unknown error is below:")
                        console.error(error)
                        throw JSON.stringify("unknown-error")
                    }
                }
            }

            case "addLiquidity": {
                const sender = PublicKey.fromBase58(reqBody.sender)
                const signature = Signature.fromBase58(reqBody.senderSignature)
                const baseTokenId = Field.from(reqBody.baseTokenId)
                const quoteTokenId = Field.from(reqBody.quoteTokenId)
                const baseTokenAmount = UInt64.from(reqBody.baseTokenAmount)

                const quoteTokenAmountMaxLimit = UInt64.from(
                    reqBody.quoteTokenAmountMaxLimit,
                )

                const baseTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: baseTokenId,
                })

                const quoteTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: quoteTokenId,
                })

                const pool = this.storage.pools.get({
                    baseTokenId,
                    quoteTokenId,
                })

                const liquidityExists = this.storage.pools.exists({
                    baseTokenId,
                    quoteTokenId,
                })

                const liquidity = liquidityExists
                    ? this.storage.liquidities.get({
                          baseTokenId,
                          quoteTokenId,
                          provider: sender,
                      })
                    : Liquidity.empty()

                const balanceDoubleWitness = this.storage.balances.getDoubleWitness({
                    firstTokenId: baseTokenId,
                    secondTokenId: quoteTokenId,
                    owner: sender,
                })

                const poolWitness = this.storage.pools.getWitness({
                    baseTokenId,
                    quoteTokenId,
                })

                const liquidityWitness = liquidityExists
                    ? this.storage.liquidities.getWitness({
                          baseTokenId,
                          quoteTokenId,
                          provider: sender,
                      })
                    : this.storage.liquidities.getWitnessNew()

                if (baseTokenBalance instanceof Error) {
                    throw JSON.stringify("no-base-token-balance")
                }

                if (quoteTokenBalance instanceof Error) {
                    throw JSON.stringify("no-quote-token-balance")
                }

                if (pool instanceof Error) {
                    throw JSON.stringify("no-pool")
                }

                if (liquidity instanceof Error) {
                    throw JSON.stringify("no-liquidity")
                }

                if (balanceDoubleWitness instanceof Error) {
                    throw JSON.stringify("no-base-or-quote-token-balance")
                }

                if (poolWitness instanceof Error) {
                    throw JSON.stringify("no-pool-witness")
                }

                if (liquidityWitness instanceof Error) {
                    throw JSON.stringify("no-liquidity-witness")
                }

                try {
                    const proof = await RollupProgram.addLiquidityV2(
                        this.storage.state,
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmountMaxLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        liquidity,
                        balanceDoubleWitness,
                        poolWitness,
                        liquidityWitness,
                    )

                    this.storage.state.addLiquidity({
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmountMaxLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        liquidity,
                        balanceDoubleWitness,
                        poolWitness,
                        liquidityWitness,
                    })

                    if (!liquidityExists) {
                        this.storage.liquidities.store(liquidity)
                    }

                    // todo: use a recursive proof
                    proof

                    this.storage.updateState()

                    return JSON.stringify("ok")
                } catch (error) {
                    if (typeof error === "string") {
                        throw JSON.stringify(error)
                    } else if (error instanceof Error) {
                        throw JSON.stringify(error.message)
                    } else {
                        console.error("Unknown error is below:")
                        console.error(error)
                        throw JSON.stringify("unknown-error")
                    }
                }
            }

            case "removeLiquidity": {
                const sender = PublicKey.fromBase58(reqBody.sender)
                const signature = Signature.fromBase58(reqBody.senderSignature)
                const baseTokenId = Field.from(reqBody.baseTokenId)
                const quoteTokenId = Field.from(reqBody.quoteTokenId)
                const lpPoints = UInt64.from(reqBody.lpPoints)

                const baseTokenAmountMinLimit = UInt64.from(
                    reqBody.baseTokenAmountMinLimit,
                )

                const quoteTokenAmountMinLimit = UInt64.from(
                    reqBody.quoteTokenAmountMinLimit,
                )

                const baseTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: baseTokenId,
                })

                const quoteTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: quoteTokenId,
                })

                const pool = this.storage.pools.get({
                    baseTokenId,
                    quoteTokenId,
                })

                const liquidity = this.storage.liquidities.get({
                    baseTokenId,
                    quoteTokenId,
                    provider: sender,
                })

                const balanceDoubleWitness = this.storage.balances.getDoubleWitness({
                    firstTokenId: baseTokenId,
                    secondTokenId: quoteTokenId,
                    owner: sender,
                })

                const poolWitness = this.storage.pools.getWitness({
                    baseTokenId,
                    quoteTokenId,
                })

                const liquidityWitness = this.storage.liquidities.getWitness({
                    baseTokenId,
                    quoteTokenId,
                    provider: sender,
                })

                if (baseTokenBalance instanceof Error) {
                    throw JSON.stringify("no-base-token-balance")
                }

                if (quoteTokenBalance instanceof Error) {
                    throw JSON.stringify("no-quote-token-balance")
                }

                if (pool instanceof Error) {
                    throw JSON.stringify("no-pool")
                }

                if (liquidity instanceof Error) {
                    throw JSON.stringify("no-liquidity")
                }

                if (balanceDoubleWitness instanceof Error) {
                    throw JSON.stringify("no-base-or-quote-token-balance")
                }

                if (poolWitness instanceof Error) {
                    throw JSON.stringify("no-pool-witness")
                }

                if (liquidityWitness instanceof Error) {
                    throw JSON.stringify("no-liquidity-witness")
                }

                try {
                    const proof = await RollupProgram.removeLiquidityV2(
                        this.storage.state,
                        sender,
                        signature,
                        lpPoints,
                        baseTokenAmountMinLimit,
                        quoteTokenAmountMinLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        liquidity,
                        balanceDoubleWitness,
                        poolWitness,
                        liquidityWitness,
                    )

                    this.storage.state.removeLiquidity({
                        sender,
                        signature,
                        lpPoints,
                        baseTokenAmountMinLimit,
                        quoteTokenAmountMinLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        liquidity,
                        balanceDoubleWitness,
                        poolWitness,
                        liquidityWitness,
                    })

                    // todo: use a recursive proof
                    proof

                    this.storage.updateState()

                    return JSON.stringify("ok")
                } catch (error) {
                    if (typeof error === "string") {
                        throw JSON.stringify(error)
                    } else if (error instanceof Error) {
                        throw JSON.stringify(error.message)
                    } else {
                        console.error("Unknown error is below:")
                        console.error(error)
                        throw JSON.stringify("unknown-error")
                    }
                }
            }

            case "buy": {
                const sender = PublicKey.fromBase58(reqBody.sender)
                const signature = Signature.fromBase58(reqBody.senderSignature)
                const baseTokenId = Field.from(reqBody.baseTokenId)
                const quoteTokenId = Field.from(reqBody.quoteTokenId)
                const baseTokenAmount = UInt64.from(reqBody.baseTokenAmount)

                const quoteTokenAmountMaxLimit = UInt64.from(
                    reqBody.quoteTokenAmountMaxLimit,
                )

                const baseTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: baseTokenId,
                })

                const quoteTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: quoteTokenId,
                })

                const pool = this.storage.pools.get({
                    baseTokenId,
                    quoteTokenId,
                })

                const balanceDoubleWitness = this.storage.balances.getDoubleWitness({
                    firstTokenId: baseTokenId,
                    secondTokenId: quoteTokenId,
                    owner: sender,
                })

                const poolWitness = this.storage.pools.getWitness({
                    baseTokenId,
                    quoteTokenId,
                })

                if (baseTokenBalance instanceof Error) {
                    throw JSON.stringify("no-base-token-balance")
                }

                if (quoteTokenBalance instanceof Error) {
                    throw JSON.stringify("no-quote-token-balance")
                }

                if (pool instanceof Error) {
                    throw JSON.stringify("no-pool")
                }

                if (balanceDoubleWitness instanceof Error) {
                    throw JSON.stringify("no-base-or-quote-token-balance")
                }

                if (poolWitness instanceof Error) {
                    throw JSON.stringify("no-pool-witness")
                }

                try {
                    const proof = await RollupProgram.buyV2(
                        this.storage.state,
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmountMaxLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        balanceDoubleWitness,
                        poolWitness,
                    )

                    this.storage.state.buy({
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmountMaxLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        balanceDoubleWitness,
                        poolWitness,
                    })

                    // todo: use a recursive proof
                    proof

                    this.storage.updateState()

                    return JSON.stringify("ok")
                } catch (error) {
                    if (typeof error === "string") {
                        throw JSON.stringify(error)
                    } else if (error instanceof Error) {
                        throw JSON.stringify(error.message)
                    } else {
                        console.error("Unknown error is below:")
                        console.error(error)
                        throw JSON.stringify("unknown-error")
                    }
                }
            }

            case "sell": {
                const sender = PublicKey.fromBase58(reqBody.sender)
                const signature = Signature.fromBase58(reqBody.senderSignature)
                const baseTokenId = Field.from(reqBody.baseTokenId)
                const quoteTokenId = Field.from(reqBody.quoteTokenId)
                const baseTokenAmount = UInt64.from(reqBody.baseTokenAmount)

                const quoteTokenAmountMinLimit = UInt64.from(
                    reqBody.quoteTokenAmountMinLimit,
                )

                const baseTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: baseTokenId,
                })

                const quoteTokenBalance = this.storage.balances.get({
                    owner: sender,
                    tokenId: quoteTokenId,
                })

                const pool = this.storage.pools.get({
                    baseTokenId,
                    quoteTokenId,
                })

                const balanceDoubleWitness = this.storage.balances.getDoubleWitness({
                    firstTokenId: baseTokenId,
                    secondTokenId: quoteTokenId,
                    owner: sender,
                })

                const poolWitness = this.storage.pools.getWitness({
                    baseTokenId,
                    quoteTokenId,
                })

                if (baseTokenBalance instanceof Error) {
                    throw JSON.stringify("no-base-token-balance")
                }

                if (quoteTokenBalance instanceof Error) {
                    throw JSON.stringify("no-quote-token-balance")
                }

                if (pool instanceof Error) {
                    throw JSON.stringify("no-pool")
                }

                if (balanceDoubleWitness instanceof Error) {
                    throw JSON.stringify("no-base-or-quote-token-balance")
                }

                if (poolWitness instanceof Error) {
                    throw JSON.stringify("no-pool-witness")
                }

                try {
                    const proof = await RollupProgram.sellV2(
                        this.storage.state,
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmountMinLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        balanceDoubleWitness,
                        poolWitness,
                    )

                    this.storage.state.sell({
                        sender,
                        signature,
                        baseTokenAmount,
                        quoteTokenAmountMinLimit,
                        baseTokenBalance,
                        quoteTokenBalance,
                        pool,
                        balanceDoubleWitness,
                        poolWitness,
                    })

                    // todo: use a recursive proof
                    proof

                    this.storage.updateState()

                    return JSON.stringify("ok")
                } catch (error) {
                    if (typeof error === "string") {
                        throw JSON.stringify(error)
                    } else if (error instanceof Error) {
                        throw JSON.stringify(error.message)
                    } else {
                        console.error("Unknown error is below:")
                        console.error(error)
                        throw JSON.stringify("unknown-error")
                    }
                }
            }

            default:
                throw Error("Impossible to reach here.")
        }
    }
}
