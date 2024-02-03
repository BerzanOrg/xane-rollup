import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, PrivateKey, UInt64 } from "o1js"
import { RollupErrors, RollupStorage, Liquidity } from "xane"

describe("Liquidities", async () => {
    // an empty rollup data storage for testing
    const storage = RollupStorage.empty()

    // a token ID for testing
    const baseTokenId = Field(1)

    // a token ID for testing
    const quoteTokenId = Field(2)

    // a secret key for testing
    const secretKey = PrivateKey.random()

    // an address for testing
    const provider = secretKey.toPublicKey()

    // the initial liquidity
    const initialLiquidity = new Liquidity({
        baseTokenId,
        quoteTokenId,
        provider,
        lpPoints: new UInt64(21_000_000n),
    })

    it("can store the liquidity of a user for a specific token pair", async () => {
        const res1 = storage.liquidities.store(initialLiquidity)
        storage.updateState()

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        const res2 = storage.liquidities.get({
            baseTokenId,
            quoteTokenId,
            provider,
        })

        if (res2 instanceof Error) {
            assert.fail(res2)
        }

        assert.deepEqual(res2, initialLiquidity)
    })

    it("can't store the liquidity of a user for a specific token pair, if it already exists", async () => {
        const res1 = storage.liquidities.store(initialLiquidity)

        assert.deepEqual((res1 as Error).message, RollupErrors.LiqudityExists)
    })

    it("can update the liquidity of a user for a specific token pair", async () => {
        const res1 = storage.liquidities.get({
            baseTokenId,
            quoteTokenId,
            provider,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        assert.deepEqual(res1, initialLiquidity)

        const newLiquidityLpTokenAmount = res1.lpPoints.add(new UInt64(83_000n))

        initialLiquidity.lpPoints = newLiquidityLpTokenAmount
        storage.updateState()

        const res2 = storage.liquidities.get({
            baseTokenId,
            quoteTokenId,
            provider,
        })

        if (res2 instanceof Error) {
            assert.fail(res2)
        }

        assert.deepEqual(res2.lpPoints, newLiquidityLpTokenAmount)
    })

    it("can't update the liquidity of a user for a specific token pair, if it isn't stored", async () => {
        const randomAddress = PrivateKey.random().toPublicKey()

        const res1 = storage.liquidities.get({
            baseTokenId,
            quoteTokenId,
            provider: randomAddress,
        })

        assert.deepEqual((res1 as Error).message, RollupErrors.LiqudityNotFound)
    })
})
