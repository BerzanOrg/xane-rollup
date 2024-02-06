import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, UInt64 } from "o1js"
import { Balance, RollupStorage, StorageError } from "xane"
import { utils } from "./utils.js"

describe("Balance Storage", async () => {
    const storage = RollupStorage.empty()

    const minaTokenId = Field(1)
    const usdTokenId = Field(2)

    const berzan = utils.generateKeypair()
    const john = utils.generateKeypair()
    const mr305 = utils.generateKeypair()

    it("stores berzan's mina balance", async () => {
        const initialBalance = new Balance({
            tokenId: minaTokenId,
            owner: berzan.publicKey,
            amount: UInt64.zero,
        })

        utils.unwrapValue(storage.balances.store(initialBalance))
        storage.updateState()

        const balance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: berzan.publicKey,
            }),
        )

        assert.deepEqual(balance.tokenId, minaTokenId)
        assert.deepEqual(balance.owner, berzan.publicKey)
        assert.deepEqual(balance.amount, UInt64.zero)
    })

    it("stores berzan's usd balance", async () => {
        const initialBalance = new Balance({
            tokenId: usdTokenId,
            owner: berzan.publicKey,
            amount: UInt64.zero,
        })

        utils.unwrapValue(storage.balances.store(initialBalance))
        storage.updateState()

        const balance = utils.unwrapValue(
            storage.balances.get({
                tokenId: usdTokenId,
                owner: berzan.publicKey,
            }),
        )

        assert.deepEqual(balance.tokenId, usdTokenId)
        assert.deepEqual(balance.owner, berzan.publicKey)
        assert.deepEqual(balance.amount, UInt64.zero)
    })

    it("stores john's mina balance", async () => {
        const initialBalance = new Balance({
            tokenId: minaTokenId,
            owner: john.publicKey,
            amount: UInt64.zero,
        })

        utils.unwrapValue(storage.balances.store(initialBalance))
        storage.updateState()

        const balance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: john.publicKey,
            }),
        )

        assert.deepEqual(balance.tokenId, minaTokenId)
        assert.deepEqual(balance.owner, john.publicKey)
        assert.deepEqual(balance.amount, UInt64.zero)
    })

    it("doesn't store berzan's balance again", async () => {
        const balance = new Balance({
            tokenId: minaTokenId,
            owner: berzan.publicKey,
            amount: UInt64.zero,
        })

        const error = utils.unwrapError(storage.balances.store(balance))

        assert.deepEqual(error.message, StorageError.BalanceExists)
    })

    it("updates berzan's mina balance", async () => {
        const balance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: berzan.publicKey,
            }),
        )

        balance.amount = utils.createUInt64(21_000_000, 9)
        storage.updateState()

        const updatedBalance = utils.unwrapValue(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: berzan.publicKey,
            }),
        )

        assert.deepEqual(updatedBalance.tokenId, minaTokenId)
        assert.deepEqual(updatedBalance.owner, berzan.publicKey)
        assert.deepEqual(updatedBalance.amount, utils.createUInt64(21_000_000, 9))
    })

    it("doesn't get john's usd balance", async () => {
        const error = utils.unwrapError(
            storage.balances.get({
                tokenId: usdTokenId,
                owner: john.publicKey,
            }),
        )

        assert.deepEqual(error.message, StorageError.BalanceNotFound)
    })

    it("doesn't get mr305's mina balance", async () => {
        const error = utils.unwrapError(
            storage.balances.get({
                tokenId: minaTokenId,
                owner: mr305.publicKey,
            }),
        )

        assert.deepEqual(error.message, StorageError.BalanceNotFound)
    })
})
