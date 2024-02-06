import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, UInt64 } from "o1js"
import { StorageError, RollupStorage, Liquidity, INITIAL_LP_POINTS } from "xane"
import { utils } from "./utils.js"

describe("Liquidity Storage", async () => {
    const storage = RollupStorage.empty()

    const minaTokenId = Field(1)
    const usdTokenId = Field(2)
    const eurTokenId = Field(3)

    const berzan = utils.generateKeypair()
    const john = utils.generateKeypair()
    const mr305 = utils.generateKeypair()

    it("stores berzan's mina/usd liquidity", async () => {
        const initialLiquidity = new Liquidity({
            baseTokenId: minaTokenId,
            quoteTokenId: usdTokenId,
            provider: berzan.publicKey,
            lpPoints: UInt64.zero,
        })

        utils.unwrapValue(storage.liquidities.store(initialLiquidity))
        storage.updateState()

        const liquidity = utils.unwrapValue(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
                provider: berzan.publicKey,
            }),
        )
        assert.deepEqual(liquidity.baseTokenId, minaTokenId)
        assert.deepEqual(liquidity.quoteTokenId, usdTokenId)
        assert.deepEqual(liquidity.provider, berzan.publicKey)
        assert.deepEqual(liquidity.lpPoints, UInt64.zero)
    })

    it("stores berzan's mina/eur liquidity", async () => {
        const initialLiquidity = new Liquidity({
            baseTokenId: minaTokenId,
            quoteTokenId: eurTokenId,
            provider: berzan.publicKey,
            lpPoints: UInt64.zero,
        })

        utils.unwrapValue(storage.liquidities.store(initialLiquidity))
        storage.updateState()

        const liquidity = utils.unwrapValue(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: eurTokenId,
                provider: berzan.publicKey,
            }),
        )
        assert.deepEqual(liquidity.baseTokenId, minaTokenId)
        assert.deepEqual(liquidity.quoteTokenId, eurTokenId)
        assert.deepEqual(liquidity.provider, berzan.publicKey)
        assert.deepEqual(liquidity.lpPoints, UInt64.zero)
    })

    it("stores john's mina/usd liquidity", async () => {
        const initialLiquidity = new Liquidity({
            baseTokenId: minaTokenId,
            quoteTokenId: usdTokenId,
            provider: john.publicKey,
            lpPoints: UInt64.zero,
        })

        utils.unwrapValue(storage.liquidities.store(initialLiquidity))
        storage.updateState()

        const liquidity = utils.unwrapValue(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
                provider: john.publicKey,
            }),
        )
        assert.deepEqual(liquidity.baseTokenId, minaTokenId)
        assert.deepEqual(liquidity.quoteTokenId, usdTokenId)
        assert.deepEqual(liquidity.provider, john.publicKey)
        assert.deepEqual(liquidity.lpPoints, UInt64.zero)
    })

    it("doesn't store berzan's mina/usd liquidity again", async () => {
        const liquidity = new Liquidity({
            baseTokenId: minaTokenId,
            quoteTokenId: usdTokenId,
            provider: berzan.publicKey,
            lpPoints: UInt64.zero,
        })

        const error = utils.unwrapError(storage.liquidities.store(liquidity))
        assert.deepEqual(error.message, StorageError.LiqudityExists)
    })

    it("updates berzan's mina/usd liquidity", async () => {
        const liquidity = utils.unwrapValue(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
                provider: berzan.publicKey,
            }),
        )

        liquidity.lpPoints = INITIAL_LP_POINTS
        storage.updateState()

        const updatedLiquidity = utils.unwrapValue(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
                provider: berzan.publicKey,
            }),
        )
        assert.deepEqual(updatedLiquidity.baseTokenId, minaTokenId)
        assert.deepEqual(updatedLiquidity.quoteTokenId, usdTokenId)
        assert.deepEqual(updatedLiquidity.provider, berzan.publicKey)
        assert.deepEqual(updatedLiquidity.lpPoints, INITIAL_LP_POINTS)
    })

    it("doesn't get john's mina/eur liquidity", async () => {
        const error = utils.unwrapError(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: eurTokenId,
                provider: john.publicKey,
            }),
        )

        assert.deepEqual(error.message, StorageError.LiqudityNotFound)
    })

    it("doesn't get mr305's mina/usd liquidity", async () => {
        const error = utils.unwrapError(
            storage.liquidities.get({
                baseTokenId: minaTokenId,
                quoteTokenId: usdTokenId,
                provider: mr305.publicKey,
            }),
        )

        assert.deepEqual(error.message, StorageError.LiqudityNotFound)
    })
})
