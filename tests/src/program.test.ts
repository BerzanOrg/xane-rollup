import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, PrivateKey, PublicKey, Signature, UInt64 } from "o1js"
import { RollupStorage, Balance, RollupProgram, Pool, Liquidity } from "xane"

const utils = {
    storeBalanceThenTest: (storage: RollupStorage, initialBalance: Balance) => {
        const res1 = storage.balances.store(initialBalance)
        storage.updateState()

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        const res2 = storage.balances.get({
            tokenId: initialBalance.tokenId,
            owner: initialBalance.owner,
        })

        if (res2 instanceof Error) {
            assert.fail(res2)
        }

        assert.deepEqual(res2, initialBalance)
    },
    getBalanceThenTest: (storage: RollupStorage, address: PublicKey, tokenId: Field) => {
        const res1 = storage.balances.get({
            tokenId,
            owner: address,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        return res1
    },
    getPoolThenTest: (
        storage: RollupStorage,
        baseTokenId: Field,
        quoteTokenId: Field,
    ) => {
        const res1 = storage.pools.get({
            baseTokenId,
            quoteTokenId,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        return res1
    },
    getPoolWitnessThenTest: (
        storage: RollupStorage,
        baseTokenId: Field,
        quoteTokenId: Field,
    ) => {
        const res1 = storage.pools.getWitness({
            baseTokenId,
            quoteTokenId,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        return res1
    },
    getLiquidityThenTest: (
        storage: RollupStorage,
        baseTokenId: Field,
        quoteTokenId: Field,
        provider: PublicKey,
    ) => {
        const res1 = storage.liquidities.get({
            baseTokenId,
            quoteTokenId,
            provider,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        return res1
    },
    getLiquidityWitnessThenTest: (
        storage: RollupStorage,
        baseTokenId: Field,
        quoteTokenId: Field,
        provider: PublicKey,
    ) => {
        const res1 = storage.liquidities.getWitness({
            baseTokenId,
            quoteTokenId,
            provider,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        return res1
    },
}

describe("Program", async () => {
    const storage = RollupStorage.empty()

    // a token ID that represents MINA's for testing
    const minaTokenId = Field(1)

    // a token ID that represents USDC's for testing
    const usdcTokenId = Field(2)

    // a `Uint64` that represents decimals of both MINA and USDC for testing
    const decimals = new UInt64(10n ** 8n)

    // a secret key that represent Berzan's for testing
    const berzanSecretKey = PrivateKey.random()

    // an address that represent Berzan's for testing
    const berzanAddress = berzanSecretKey.toPublicKey()

    // a secret key that represent John's for testing
    const johnSecretKey = PrivateKey.random()

    // an address that represent John's for testing
    const johnAddress = johnSecretKey.toPublicKey()

    it("can compile the rollup program", async () => {
        // compile the zk program
        // do it before the smart contract as the zk program is a dependency of the smart contract
        await RollupProgram.compile()
    })

    // NOTE: It is necessary to update user balances to test the AMM, and I've just placed balance updates below.
    //       But we don't need to test the logic of balances, because it is already tested in `balances.test.ts` file.
    it("can update user balances", async () => {
        // the initial MINA balance of Berzan for testing
        const berzanInitialMinaBalance = new Balance({
            tokenId: minaTokenId,
            owner: berzanAddress,
            amount: new UInt64(100_000n).mul(decimals),
        })

        // the initial MINA balance of John for testing
        const johnInitialMinaBalance = new Balance({
            tokenId: minaTokenId,
            owner: johnAddress,
            amount: new UInt64(1_000_000n),
        })

        // the initial USDC balance of Berzan for testing
        const berzanInitialUsdcBalance = new Balance({
            tokenId: usdcTokenId,
            owner: berzanAddress,
            amount: new UInt64(1_000_000n),
        })

        // the initial USDC balance of John for testing
        const johnInitialUsdcBalance = new Balance({
            tokenId: usdcTokenId,
            owner: johnAddress,
            amount: new UInt64(1_000_000n),
        })

        utils.storeBalanceThenTest(storage, berzanInitialMinaBalance)
        utils.storeBalanceThenTest(storage, johnInitialMinaBalance)
        utils.storeBalanceThenTest(storage, berzanInitialUsdcBalance)
        utils.storeBalanceThenTest(storage, johnInitialUsdcBalance)
    })

    it("can create a pool", async () => {
        const baseTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            minaTokenId,
        )
        const quoteTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            usdcTokenId,
        )

        const poolWitness = storage.pools.getWitnessNew()
        const liquidityWitness = storage.liquidities.getWitnessNew()

        const baseTokenAmount = UInt64.from(1234n)
        const quoteTokenAmount = UInt64.from(54321n)

        const pool = Pool.empty()
        const liquidity = Liquidity.empty()

        const signature = Signature.create(berzanSecretKey, [
            ...storage.state.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
            ...pool.toFields(),
            ...poolWitness.toFields(),
            ...liquidity.toFields(),
            ...liquidityWitness.toFields(),
            ...baseTokenAmount.toFields(),
            ...quoteTokenAmount.toFields(),
        ])

        const proof = await RollupProgram.createPool(
            storage.state,
            berzanAddress,
            signature,
            baseTokenBalance,
            quoteTokenBalance,
            // balancePairWitness (todo: make a merkle witness for a pair of leaves)
            pool,
            poolWitness,
            liquidity,
            liquidityWitness,
            baseTokenAmount,
            quoteTokenAmount,
        )

        proof.verify()

        storage.pools.store(pool)
        storage.liquidities.store(liquidity)
    })

    it("can' create a pool with a mistaken signature", async () => {
        const baseTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            minaTokenId,
        )
        const quoteTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            usdcTokenId,
        )

        const poolWitness = storage.pools.getWitnessNew()
        const liquidityWitness = storage.liquidities.getWitnessNew()

        const baseTokenAmount = UInt64.from(1234n)
        const quoteTokenAmount = UInt64.from(54321n)

        const pool = Pool.empty()
        const liquidity = Liquidity.empty()

        const signature = Signature.create(berzanSecretKey, [])

        try {
            const proof = await RollupProgram.createPool(
                storage.state,
                berzanAddress,
                signature,
                baseTokenBalance,
                quoteTokenBalance,
                // balancePairWitness (todo: make a merkle witness for a pair of leaves)
                pool,
                poolWitness,
                liquidity,
                liquidityWitness,
                baseTokenAmount,
                quoteTokenAmount,
            )

            proof.verify()

            assert(false, "should've failed")
        } catch {
            // it's failed like expected
        }
    })

    it("can't create a pool when balances are not enough", async () => {
        const baseTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            minaTokenId,
        )
        const quoteTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            usdcTokenId,
        )

        const poolWitness = storage.pools.getWitnessNew()
        const liquidityWitness = storage.liquidities.getWitnessNew()

        const baseTokenAmount = baseTokenBalance.amount.add(1)
        const quoteTokenAmount = quoteTokenBalance.amount.add(1)

        const pool = Pool.empty()
        const liquidity = Liquidity.empty()

        const signature = Signature.create(berzanSecretKey, [
            ...storage.state.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
            ...pool.toFields(),
            ...poolWitness.toFields(),
            ...liquidity.toFields(),
            ...liquidityWitness.toFields(),
            ...baseTokenAmount.toFields(),
            ...quoteTokenAmount.toFields(),
        ])

        try {
            const proof = await RollupProgram.createPool(
                storage.state,
                berzanAddress,
                signature,
                baseTokenBalance,
                quoteTokenBalance,
                // balancePairWitness (todo: make a merkle witness for a pair of leaves)
                pool,
                poolWitness,
                liquidity,
                liquidityWitness,
                baseTokenAmount,
                quoteTokenAmount,
            )

            proof.verify()
        } catch {
            // it's failed like expected
        }
    })

    it("can add liquidty to a pool", async () => {
        const baseTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            minaTokenId,
        )
        const quoteTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            usdcTokenId,
        )

        const pool = utils.getPoolThenTest(storage, minaTokenId, usdcTokenId)

        const poolWitness = utils.getPoolWitnessThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
        )

        const liquidity = utils.getLiquidityThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
            berzanAddress,
        )

        const liquidityWitness = utils.getLiquidityWitnessThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
            berzanAddress,
        )

        const baseTokenAmount = UInt64.from(1234n)
        const quoteTokenAmount = UInt64.from(54321n)

        const signature = Signature.create(berzanSecretKey, [
            ...storage.state.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
            ...pool.toFields(),
            ...poolWitness.toFields(),
            ...liquidity.toFields(),
            ...liquidityWitness.toFields(),
            ...baseTokenAmount.toFields(),
            ...quoteTokenAmount.toFields(),
        ])

        const proof = await RollupProgram.addLiquidity(
            storage.state,
            berzanAddress,
            signature,
            baseTokenBalance,
            quoteTokenBalance,
            // balancePairWitness (todo: make a merkle witness for a pair of leaves)
            pool,
            poolWitness,
            liquidity,
            liquidityWitness,
            baseTokenAmount,
            quoteTokenAmount,
        )

        proof.verify()
    })

    it("can remove liquidty from a pool", async () => {
        const baseTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            minaTokenId,
        )
        const quoteTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            usdcTokenId,
        )

        const pool = utils.getPoolThenTest(storage, minaTokenId, usdcTokenId)

        const poolWitness = utils.getPoolWitnessThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
        )

        const liquidity = utils.getLiquidityThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
            berzanAddress,
        )

        const liquidityWitness = utils.getLiquidityWitnessThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
            berzanAddress,
        )

        const lpTokensToBurn = UInt64.from(9999n)

        const signature = Signature.create(berzanSecretKey, [
            ...storage.state.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
            ...pool.toFields(),
            ...poolWitness.toFields(),
            ...liquidity.toFields(),
            ...liquidityWitness.toFields(),
            ...lpTokensToBurn.toFields(),
        ])

        const proof = await RollupProgram.removeLiquidity(
            storage.state,
            berzanAddress,
            signature,
            baseTokenBalance,
            quoteTokenBalance,
            // balancePairWitness (todo: make a merkle witness for a pair of leaves)
            pool,
            poolWitness,
            liquidity,
            liquidityWitness,
            lpTokensToBurn,
        )

        proof.verify()
    })

    it("can buy base token of a pool", async () => {
        const baseTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            minaTokenId,
        )
        const quoteTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            usdcTokenId,
        )

        const pool = utils.getPoolThenTest(storage, minaTokenId, usdcTokenId)

        const poolWitness = utils.getPoolWitnessThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
        )

        const baseTokensToBuy = UInt64.from(132n)
        const maxQuoteTokensToPay = UInt64.from(132n)

        const signature = Signature.create(berzanSecretKey, [
            ...storage.state.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
            ...pool.toFields(),
            ...poolWitness.toFields(),
            ...baseTokensToBuy.toFields(),
            ...maxQuoteTokensToPay.toFields(),
        ])

        const proof = await RollupProgram.buy(
            storage.state,
            berzanAddress,
            signature,
            baseTokenBalance,
            quoteTokenBalance,
            // balancePairWitness (todo: make a merkle witness for a pair of leaves)
            pool,
            poolWitness,
            baseTokensToBuy,
            maxQuoteTokensToPay,
        )

        proof.verify()
    })

    it("can sell base token of a pool", async () => {
        const baseTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            minaTokenId,
        )
        const quoteTokenBalance = utils.getBalanceThenTest(
            storage,
            berzanAddress,
            usdcTokenId,
        )

        const pool = utils.getPoolThenTest(storage, minaTokenId, usdcTokenId)

        const poolWitness = utils.getPoolWitnessThenTest(
            storage,
            minaTokenId,
            usdcTokenId,
        )

        const baseTokensToSell = UInt64.from(132n)
        const minQuoteTokensToReceive = UInt64.from(132n)

        const signature = Signature.create(berzanSecretKey, [
            ...storage.state.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            // ...balancePairWitness.toFields(), (todo: make a merkle witness for a pair of leaves)
            ...pool.toFields(),
            ...poolWitness.toFields(),
            ...baseTokensToSell.toFields(),
            ...minQuoteTokensToReceive.toFields(),
        ])

        const proof = await RollupProgram.sell(
            storage.state,
            berzanAddress,
            signature,
            baseTokenBalance,
            quoteTokenBalance,
            // balancePairWitness (todo: make a merkle witness for a pair of leaves)
            pool,
            poolWitness,
            baseTokensToSell,
            minQuoteTokensToReceive,
        )

        proof.verify()
    })
})
