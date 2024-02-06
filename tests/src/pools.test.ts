import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field } from "o1js"
import { Pool, StorageError, RollupStorage, INITIAL_LP_POINTS } from "xane"
import { utils } from "./utils.js"

describe("Pool Storage", async () => {
    const storage = RollupStorage.empty()

    const minaTokenId = Field(1)
    const usdTokenId = Field(2)
    const eurTokenId = Field(3)

    it("stores mina/usd pool", async () => {
        const x = utils.createUInt64(100_000, 3)
        const y = utils.createUInt64(200_000, 3)

        const initialPool = new Pool({
            baseTokenId: minaTokenId,
            quoteTokenId: usdTokenId,
            baseTokenAmount: x,
            quoteTokenAmount: y,
            k: x.mul(y),
            lpPoints: INITIAL_LP_POINTS,
        })

        utils.unwrapValue(storage.pools.store(initialPool))
        storage.updateState()

        const pool = utils.unwrapValue(
            storage.pools.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
            }),
        )
        assert.deepEqual(pool.baseTokenId, minaTokenId)
        assert.deepEqual(pool.quoteTokenId, usdTokenId)
        assert.deepEqual(pool.baseTokenAmount, x)
        assert.deepEqual(pool.quoteTokenAmount, y)
        assert.deepEqual(pool.k, x.mul(y))
        assert.deepEqual(pool.lpPoints, INITIAL_LP_POINTS)
    })

    it("doesn't store mina/usd pool again", async () => {
        const x = utils.createUInt64(100_000, 3)
        const y = utils.createUInt64(200_000, 3)

        const pool = new Pool({
            baseTokenId: minaTokenId,
            quoteTokenId: usdTokenId,
            baseTokenAmount: x,
            quoteTokenAmount: y,
            k: x.mul(y),
            lpPoints: INITIAL_LP_POINTS,
        })

        const error = utils.unwrapError(storage.pools.store(pool))

        assert.deepEqual(error.message, StorageError.PoolExists)
    })

    it("updates mina/usd pool", async () => {
        const pool = utils.unwrapValue(
            storage.pools.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
            }),
        )

        const newX = pool.baseTokenAmount.add(utils.createUInt64(200_000, 3))

        const newY = newX.mul(pool.quoteTokenAmount).div(pool.baseTokenAmount)

        const newK = newX.mul(newY)

        const newLpPoints = newX.mul(pool.lpPoints).div(pool.baseTokenAmount)

        pool.baseTokenAmount = newX
        pool.quoteTokenAmount = newY
        pool.k = newK
        pool.lpPoints = newLpPoints
        storage.updateState()

        const updatedPool = utils.unwrapValue(
            storage.pools.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
            }),
        )

        assert.deepEqual(updatedPool.baseTokenId, minaTokenId)
        assert.deepEqual(updatedPool.quoteTokenId, usdTokenId)
        assert.deepEqual(updatedPool.baseTokenAmount, newX)
        assert.deepEqual(updatedPool.quoteTokenAmount, newY)
        assert.deepEqual(updatedPool.k, newK)
        assert.deepEqual(updatedPool.lpPoints, newLpPoints)
    })

    it("doesn't get mina/eur pool", async () => {
        const error = utils.unwrapError(
            storage.pools.get({
                baseTokenId: minaTokenId,
                quoteTokenId: eurTokenId,
            }),
        )

        assert.deepEqual(error.message, StorageError.PoolNotFound)
    })
})
