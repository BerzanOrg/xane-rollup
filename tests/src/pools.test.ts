import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, UInt64 } from "o1js"
import { Pool, RollupErrors, RollupStorage } from "xane"

describe("Pools", async () => {
    // an empty rollup data storage for testing
    const storage = RollupStorage.empty()

    // a token ID for testing
    const baseTokenId = Field(1)

    // a token ID for testing
    const quoteTokenId = Field(2)

    // an amount to represent base token amount for testing
    const baseTokenAmount = new UInt64(100_000_000n)

    // an amount to represent quote token amount for testing
    const quoteTokenAmount = new UInt64(40_000_000n)

    // k is calculated using `x * y = k` formula
    const k = baseTokenAmount.mul(quoteTokenAmount)

    // LP tokens initial supply is `uint16_max` which is `65535`.
    const lpTokensSupply = new UInt64(65535)

    // the initial pool
    const initialPool = new Pool({
        baseTokenId,
        quoteTokenId,
        baseTokenAmount,
        quoteTokenAmount,
        k,
        lpTokensSupply,
    })

    it("can store the pool of a specific pair", async () => {
        const res1 = storage.pools.store(initialPool)
        storage.updateState()

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        const res2 = storage.pools.get({
            baseTokenId,
            quoteTokenId,
        })

        if (res2 instanceof Error) {
            assert.fail(res2)
        }

        assert.deepEqual(res2, initialPool)
    })

    it("can't store the pool of a specific pair, if it already exists", async () => {
        const res1 = storage.pools.store(initialPool)

        assert.deepEqual((res1 as Error).message, RollupErrors.PoolExists)
    })

    it("can update the pool of a specific pair", async () => {
        const res1 = storage.pools.get({
            baseTokenId,
            quoteTokenId,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        assert.deepEqual(res1, initialPool)

        const baseTokenAmountNew = res1.baseTokenAmount.add(new UInt64(123_456_789n))

        const quoteTokenAmountNew = baseTokenAmountNew
            .mul(res1.quoteTokenAmount)
            .div(res1.baseTokenAmount)

        const kNew = baseTokenAmountNew.mul(quoteTokenAmountNew)

        const lpTokensSupplyNew = baseTokenAmountNew
            .mul(res1.lpTokensSupply)
            .div(res1.baseTokenAmount)

        initialPool.baseTokenAmount = baseTokenAmountNew
        initialPool.quoteTokenAmount = quoteTokenAmountNew
        initialPool.k = kNew
        initialPool.lpTokensSupply = lpTokensSupplyNew
        storage.updateState()

        const res2 = storage.pools.get({
            baseTokenId,
            quoteTokenId,
        })

        if (res2 instanceof Error) {
            assert.fail(res2)
        }

        assert.deepEqual(res2.baseTokenAmount, baseTokenAmountNew)
        assert.deepEqual(res2.quoteTokenAmount, quoteTokenAmountNew)
        assert.deepEqual(res2.k, kNew)
        assert.deepEqual(res2.lpTokensSupply, lpTokensSupplyNew)
    })

    it("can't update the pool of a specific pair, if it isn't stored", async () => {
        const randomTokenId = Field(45)

        const res1 = storage.pools.get({
            baseTokenId: randomTokenId,
            quoteTokenId,
        })

        assert.deepEqual((res1 as Error).message, RollupErrors.PoolNotFound)
    })
})
