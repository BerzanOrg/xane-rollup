import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, Signature, UInt64 } from "o1js"
import {
    RollupStorage,
    RollupProgram,
    Balance,
    Pool,
    Liquidity,
    INITIAL_LP_POINTS,
    ProgramError,
    RollupState,
} from "xane"
import { utils } from "./utils.js"

describe("Program with V2 methods", async () => {
    await RollupProgram.compile()

    const storage = RollupStorage.empty(
        await RollupProgram.genesis(new RollupState(RollupState.empty())),
    )

    const minaTokenId = Field(1)
    const usdTokenId = Field(2)
    const eurTokenId = Field(3)

    const berzan = utils.generateKeypair()
    const john = utils.generateKeypair()
    const mr305 = utils.generateKeypair()

    it("adds mina balance to berzan", async () => {
        const initialBalance = new Balance({
            tokenId: minaTokenId,
            owner: berzan.publicKey,
            amount: UInt64.zero,
        })
        const balanceWitness = storage.balances.getWitnessNew()
        const amount = utils.createUInt64(2_000, 3)

        const proof = await RollupProgram.addBalanceV2(
            storage.state,
            storage.lastProof,
            amount,
            initialBalance,
            balanceWitness,
        )

        proof.verify()

        storage.state.addBalance({
            amount,
            balance: initialBalance,
            balanceWitness,
        })
        utils.unwrapError(storage.balances.store(initialBalance))
        storage.updateState()
        storage.lastProof = proof

        const balance = utils.unwrapValue(
            storage.balances.get({
                owner: berzan.publicKey,
                tokenId: minaTokenId,
            }),
        )

        assert.deepEqual(balance.tokenId, minaTokenId)
        assert.deepEqual(balance.owner, berzan.publicKey)
        assert.deepEqual(balance.amount, amount)
    })

    it("adds usd balance to berzan", async () => {
        const initialBalance = new Balance({
            tokenId: usdTokenId,
            owner: berzan.publicKey,
            amount: UInt64.zero,
        })
        const balanceWitness = storage.balances.getWitnessNew()
        const amount = utils.createUInt64(5_000, 3)

        const proof = await RollupProgram.addBalanceV2(
            storage.state,
            storage.lastProof,
            amount,
            initialBalance,
            balanceWitness,
        )

        proof.verify()

        storage.state.addBalance({
            amount,
            balance: initialBalance,
            balanceWitness,
        })
        utils.unwrapError(storage.balances.store(initialBalance))
        storage.updateState()
        storage.lastProof = proof

        const balance = utils.unwrapValue(
            storage.balances.get({
                owner: berzan.publicKey,
                tokenId: usdTokenId,
            }),
        )

        assert.deepEqual(balance.tokenId, usdTokenId)
        assert.deepEqual(balance.owner, berzan.publicKey)
        assert.deepEqual(balance.amount, amount)
    })

    it("adds mina balance to john", async () => {
        const initialBalance = new Balance({
            tokenId: minaTokenId,
            owner: john.publicKey,
            amount: UInt64.zero,
        })
        const balanceWitness = storage.balances.getWitnessNew()
        const amount = utils.createUInt64(2_000, 3)

        const proof = await RollupProgram.addBalanceV2(
            storage.state,
            storage.lastProof,
            amount,
            initialBalance,
            balanceWitness,
        )

        proof.verify()

        storage.state.addBalance({
            amount,
            balance: initialBalance,
            balanceWitness,
        })
        utils.unwrapError(storage.balances.store(initialBalance))
        storage.updateState()
        storage.lastProof = proof

        const balance = utils.unwrapValue(
            storage.balances.get({
                owner: john.publicKey,
                tokenId: minaTokenId,
            }),
        )

        assert.deepEqual(balance.tokenId, minaTokenId)
        assert.deepEqual(balance.owner, john.publicKey)
        assert.deepEqual(balance.amount, amount)
    })

    it("adds usd balance to john", async () => {
        const initialBalance = new Balance({
            tokenId: usdTokenId,
            owner: john.publicKey,
            amount: UInt64.zero,
        })
        const balanceWitness = storage.balances.getWitnessNew()
        const amount = utils.createUInt64(5_000, 3)

        const proof = await RollupProgram.addBalanceV2(
            storage.state,
            storage.lastProof,
            amount,
            initialBalance,
            balanceWitness,
        )

        proof.verify()

        storage.state.addBalance({
            amount,
            balance: initialBalance,
            balanceWitness,
        })
        utils.unwrapError(storage.balances.store(initialBalance))
        storage.updateState()
        storage.lastProof = proof

        const balance = utils.unwrapValue(
            storage.balances.get({
                owner: john.publicKey,
                tokenId: usdTokenId,
            }),
        )

        assert.deepEqual(balance.tokenId, usdTokenId)
        assert.deepEqual(balance.owner, john.publicKey)
        assert.deepEqual(balance.amount, amount)
    })

    it("subs mina balance from berzan", async () => {
        const balance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: berzan.publicKey,
            }),
        )
        const balanceWitness = utils.unwrapValue(
            storage.balances.getWitness({
                tokenId: minaTokenId,
                owner: berzan.publicKey,
            }),
        )
        const amount = utils.createUInt64(1_000, 3)

        const proof = await RollupProgram.subBalanceV2(
            storage.state,
            storage.lastProof,
            amount,
            balance,
            balanceWitness,
        )

        proof.verify()

        storage.state.addBalance({
            amount,
            balance,
            balanceWitness,
        })
        storage.updateState()
        storage.lastProof = proof

        assert.deepEqual(balance.tokenId, minaTokenId)
        assert.deepEqual(balance.owner, berzan.publicKey)
        assert.deepEqual(balance.amount, utils.createUInt64(1_000, 3))
    })

    it("creates mina/usd pool with berzan", async () => {
        const berzanMinaBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: berzan.publicKey,
            }),
        )
        const berzanUsdBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: usdTokenId,
                owner: berzan.publicKey,
            }),
        )
        const balanceDoubleWitness = utils.unwrapValue(
            storage.balances.getDoubleWitness({
                firstTokenId: minaTokenId,
                secondTokenId: usdTokenId,
                owner: berzan.publicKey,
            }),
        )
        const minaAmount = utils.createUInt64(300, 3)
        const usdAmount = utils.createUInt64(600, 3)
        const emptyPool = Pool.empty()
        const emptyLiquidity = Liquidity.empty()
        const poolWitness = storage.pools.getWitnessNew()
        const liquidityWitness = storage.liquidities.getWitnessNew()
        const sender = berzan.publicKey
        const signature = Signature.create(berzan.privateKey, [
            ...storage.state.toFields(),
            ...minaAmount.toFields(),
            ...usdAmount.toFields(),
            ...berzanMinaBalance.toFields(),
            ...berzanUsdBalance.toFields(),
            ...balanceDoubleWitness.toFields(),
            ...poolWitness.toFields(),
            ...liquidityWitness.toFields(),
        ])
        const proof = await RollupProgram.createPoolV2(
            storage.state,
            storage.lastProof,
            sender,
            signature,
            minaAmount,
            usdAmount,
            berzanMinaBalance,
            berzanUsdBalance,
            emptyPool,
            emptyLiquidity,
            balanceDoubleWitness,
            poolWitness,
            liquidityWitness,
        )

        proof.verify()

        storage.state.createPool({
            sender,
            signature,
            baseTokenAmount: minaAmount,
            quoteTokenAmount: usdAmount,
            baseTokenBalance: berzanMinaBalance,
            quoteTokenBalance: berzanUsdBalance,
            emptyPool,
            emptyLiquidity,
            balanceDoubleWitness,
            poolWitness,
            liquidityWitness,
        })
        storage.pools.store(emptyPool)
        storage.liquidities.store(emptyLiquidity)
        storage.updateState()
        storage.lastProof = proof

        const pool = utils.unwrapValue(
            storage.pools.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
            }),
        )

        const liquidity = utils.unwrapValue(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
                provider: berzan.publicKey,
            }),
        )

        assert.deepEqual(berzanMinaBalance.tokenId, minaTokenId)
        assert.deepEqual(berzanMinaBalance.owner, berzan.publicKey)
        assert.deepEqual(berzanMinaBalance.amount, utils.createUInt64(700, 3))
        assert.deepEqual(berzanUsdBalance.tokenId, usdTokenId)
        assert.deepEqual(berzanUsdBalance.owner, berzan.publicKey)
        assert.deepEqual(berzanUsdBalance.amount, utils.createUInt64(4_400, 3))

        assert.deepEqual(pool.baseTokenId, minaTokenId)
        assert.deepEqual(pool.quoteTokenId, usdTokenId)
        assert.deepEqual(pool.baseTokenAmount, minaAmount)
        assert.deepEqual(pool.quoteTokenAmount, usdAmount)
        assert.deepEqual(pool.k, minaAmount.mul(usdAmount))
        assert.deepEqual(pool.lpPoints, INITIAL_LP_POINTS)

        assert.deepEqual(liquidity.baseTokenId, minaTokenId)
        assert.deepEqual(liquidity.quoteTokenId, usdTokenId)
        assert.deepEqual(liquidity.provider, berzan.publicKey)
        assert.deepEqual(liquidity.lpPoints, INITIAL_LP_POINTS)
    })

    it("doesn't create mina/usd pool with insufficient usd balance with berzan", async () => {
        const berzanMinaBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: berzan.publicKey,
            }),
        )
        const berzanUsdBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: usdTokenId,
                owner: berzan.publicKey,
            }),
        )
        const balanceDoubleWitness = utils.unwrapValue(
            storage.balances.getDoubleWitness({
                firstTokenId: minaTokenId,
                secondTokenId: usdTokenId,
                owner: berzan.publicKey,
            }),
        )
        const minaAmount = utils.createUInt64(100, 3)
        const usdAmount = utils.createUInt64(10_000, 3)
        const emptyPool = Pool.empty()
        const emptyLiquidity = Liquidity.empty()
        const poolWitness = storage.pools.getWitnessNew()
        const liquidityWitness = storage.liquidities.getWitnessNew()
        const sender = berzan.publicKey
        const signature = Signature.create(berzan.privateKey, [
            ...storage.state.toFields(),
            ...minaAmount.toFields(),
            ...usdAmount.toFields(),
            ...berzanMinaBalance.toFields(),
            ...berzanUsdBalance.toFields(),
            ...balanceDoubleWitness.toFields(),
            ...poolWitness.toFields(),
            ...liquidityWitness.toFields(),
        ])
        try {
            const proof = await RollupProgram.createPoolV2(
                storage.state,
                storage.lastProof,
                sender,
                signature,
                minaAmount,
                usdAmount,
                berzanMinaBalance,
                berzanUsdBalance,
                emptyPool,
                emptyLiquidity,
                balanceDoubleWitness,
                poolWitness,
                liquidityWitness,
            )

            proof.verify()
        } catch (error) {
            if (error instanceof Error) {
                assert.deepEqual(error.message, ProgramError.InsufficientBalance)
            } else {
                throw Error("unknown error type")
            }
        }

        assert.deepEqual(berzanMinaBalance.tokenId, minaTokenId)
        assert.deepEqual(berzanMinaBalance.owner, berzan.publicKey)
        assert.deepEqual(berzanMinaBalance.amount, utils.createUInt64(700, 3))
        assert.deepEqual(berzanUsdBalance.tokenId, usdTokenId)
        assert.deepEqual(berzanUsdBalance.owner, berzan.publicKey)
        assert.deepEqual(berzanUsdBalance.amount, utils.createUInt64(4_400, 3))
    })

    it("adds liquidity to mina/usd pool with john", async () => {
        const johnMinaBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: john.publicKey,
            }),
        )
        const johnUsdBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: usdTokenId,
                owner: john.publicKey,
            }),
        )
        const balanceDoubleWitness = utils.unwrapValue(
            storage.balances.getDoubleWitness({
                firstTokenId: minaTokenId,
                secondTokenId: usdTokenId,
                owner: berzan.publicKey,
            }),
        )
        const pool = utils.unwrapValue(
            storage.pools.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
            }),
        )
        const liquidity = Liquidity.empty()
        const minaAmount = utils.createUInt64(500, 3)
        const usdMaxLimit = utils.createUInt64(1_000, 3)
        const poolWitness = storage.pools.getWitnessNew()
        const liquidityWitness = storage.liquidities.getWitnessNew()
        const sender = berzan.publicKey
        const signature = Signature.create(berzan.privateKey, [
            ...storage.state.toFields(),
            ...minaAmount.toFields(),
            ...usdMaxLimit.toFields(),
            ...johnMinaBalance.toFields(),
            ...johnUsdBalance.toFields(),
            ...pool.toFields(),
            ...liquidity.toFields(),
            ...balanceDoubleWitness.toFields(),
            ...poolWitness.toFields(),
            ...liquidityWitness.toFields(),
        ])
        const proof = await RollupProgram.addLiquidityV2(
            storage.state,
            storage.lastProof,
            sender,
            signature,
            minaAmount,
            usdMaxLimit,
            johnMinaBalance,
            johnUsdBalance,
            pool,
            liquidity,
            balanceDoubleWitness,
            poolWitness,
            liquidityWitness,
        )

        proof.verify()

        storage.state.addLiquidity({
            sender,
            signature,
            baseTokenAmount: minaAmount,
            quoteTokenAmountMaxLimit: usdMaxLimit,
            baseTokenBalance: johnMinaBalance,
            quoteTokenBalance: johnUsdBalance,
            pool,
            liquidity,
            balanceDoubleWitness,
            poolWitness,
            liquidityWitness,
        })
        storage.updateState()
        storage.lastProof = proof

        assert.deepEqual(johnMinaBalance.tokenId, minaTokenId)
        assert.deepEqual(johnMinaBalance.owner, john.publicKey)
        assert.deepEqual(johnMinaBalance.amount, utils.createUInt64(1_500, 3))
        assert.deepEqual(johnUsdBalance.tokenId, usdTokenId)
        assert.deepEqual(johnUsdBalance.owner, john.publicKey)
        assert.deepEqual(johnUsdBalance.amount, utils.createUInt64(4_000, 3))

        assert.deepEqual(pool.baseTokenId, minaTokenId)
        assert.deepEqual(pool.quoteTokenId, usdTokenId)
        assert.deepEqual(pool.baseTokenAmount, utils.createUInt64(800, 3))
        assert.deepEqual(pool.quoteTokenAmount, utils.createUInt64(1_600, 3))
        assert.deepEqual(
            pool.k,
            utils.createUInt64(800, 3).mul(utils.createUInt64(1_600, 3)),
        )
        assert.deepEqual(
            pool.lpPoints,
            utils
                .createUInt64(500, 3)
                .mul(INITIAL_LP_POINTS)
                .div(utils.createUInt64(300, 3)),
        )

        assert.deepEqual(liquidity.baseTokenId, minaTokenId)
        assert.deepEqual(liquidity.quoteTokenId, usdTokenId)
        assert.deepEqual(liquidity.provider, john.publicKey)
        assert.deepEqual(
            liquidity.lpPoints,
            utils
                .createUInt64(500, 3)
                .mul(INITIAL_LP_POINTS)
                .div(utils.createUInt64(300, 3)),
        )
    })

    it("doesn't add liquidity to mina/usd pool with insufficient balance with john", async () => {
        const johnMinaBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: john.publicKey,
            }),
        )
        const johnUsdBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: usdTokenId,
                owner: john.publicKey,
            }),
        )
        const balanceDoubleWitness = utils.unwrapValue(
            storage.balances.getDoubleWitness({
                firstTokenId: minaTokenId,
                secondTokenId: usdTokenId,
                owner: berzan.publicKey,
            }),
        )
        const pool = utils.unwrapValue(
            storage.pools.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
            }),
        )
        const liquidity = Liquidity.empty()
        const minaAmount = utils.createUInt64(1_600, 3)
        const usdMaxLimit = utils.createUInt64(1_000, 3)
        const poolWitness = storage.pools.getWitnessNew()
        const liquidityWitness = storage.liquidities.getWitnessNew()
        const sender = berzan.publicKey
        const signature = Signature.create(berzan.privateKey, [
            ...storage.state.toFields(),
            ...minaAmount.toFields(),
            ...usdMaxLimit.toFields(),
            ...johnMinaBalance.toFields(),
            ...johnUsdBalance.toFields(),
            ...pool.toFields(),
            ...liquidity.toFields(),
            ...balanceDoubleWitness.toFields(),
            ...poolWitness.toFields(),
            ...liquidityWitness.toFields(),
        ])

        try {
            const proof = await RollupProgram.addLiquidityV2(
                storage.state,
                storage.lastProof,
                sender,
                signature,
                minaAmount,
                usdMaxLimit,
                johnMinaBalance,
                johnUsdBalance,
                pool,
                liquidity,
                balanceDoubleWitness,
                poolWitness,
                liquidityWitness,
            )

            proof.verify()
        } catch (error) {
            if (error instanceof Error) {
                assert.deepEqual(error.message, ProgramError.InsufficientBalance)
            } else {
                throw Error("Unknown error type!")
            }
        }

        assert.deepEqual(johnMinaBalance.tokenId, minaTokenId)
        assert.deepEqual(johnMinaBalance.owner, john.publicKey)
        assert.deepEqual(johnMinaBalance.amount, utils.createUInt64(1_500, 3))
        assert.deepEqual(johnUsdBalance.tokenId, usdTokenId)
        assert.deepEqual(johnUsdBalance.owner, john.publicKey)
        assert.deepEqual(johnUsdBalance.amount, utils.createUInt64(4_000, 3))

        assert.deepEqual(pool.baseTokenId, minaTokenId)
        assert.deepEqual(pool.quoteTokenId, usdTokenId)
        assert.deepEqual(pool.baseTokenAmount, utils.createUInt64(800, 3))
        assert.deepEqual(pool.quoteTokenAmount, utils.createUInt64(1_600, 3))
        assert.deepEqual(
            pool.k,
            utils.createUInt64(800, 3).mul(utils.createUInt64(1_600, 3)),
        )
        assert.deepEqual(
            pool.lpPoints,
            utils
                .createUInt64(500, 3)
                .mul(INITIAL_LP_POINTS)
                .div(utils.createUInt64(300, 3)),
        )

        assert.deepEqual(liquidity.baseTokenId, minaTokenId)
        assert.deepEqual(liquidity.quoteTokenId, usdTokenId)
        assert.deepEqual(liquidity.provider, john.publicKey)
        assert.deepEqual(
            liquidity.lpPoints,
            utils
                .createUInt64(500, 3)
                .mul(INITIAL_LP_POINTS)
                .div(utils.createUInt64(300, 3)),
        )
    })
})
