import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, PrivateKey, UInt64 } from "o1js"
import { Balance, RollupErrors, RollupStorage } from "xane"

describe("Balances", async () => {
    // an empty rollup data storage for testing
    const storage = RollupStorage.empty()

    // a token ID for testing
    const tokenId = Field(1)

    // a secret key for testing
    const secretKey = PrivateKey.random()

    // an address for testing
    const address = secretKey.toPublicKey()

    // the initial balance
    const initialBalance = new Balance({
        tokenId,
        owner: address,
        amount: new UInt64(1_000_000n),
    })

    it("can store the balance of a user", async () => {
        const res1 = storage.balances.store(initialBalance)
        storage.updateState()

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        const res2 = storage.balances.get({
            tokenId,
            owner: address,
        })

        if (res2 instanceof Error) {
            assert.fail(res2)
        }

        assert.deepEqual(res2, initialBalance)
    })

    it("can't store the balance of a user, if it already exists", async () => {
        const res1 = storage.balances.store(initialBalance)

        assert.deepEqual((res1 as Error).message, RollupErrors.BalanceExists)
    })

    it("can update the balance of a user", async () => {
        const res1 = storage.balances.get({
            tokenId,
            owner: address,
        })

        if (res1 instanceof Error) {
            assert.fail(res1)
        }

        assert.deepEqual(res1, initialBalance)

        const newBalanceAmount = res1.amount.add(new UInt64(45_000n))

        initialBalance.amount = newBalanceAmount
        storage.updateState()

        const res2 = storage.balances.get({
            tokenId,
            owner: address,
        })

        if (res2 instanceof Error) {
            assert.fail(res2)
        }

        assert.deepEqual(res2.amount, newBalanceAmount)
    })

    it("can't update the balance of a user, if it isn't stored", async () => {
        const randomAddress = PrivateKey.random().toPublicKey()

        const res1 = storage.balances.get({
            tokenId,
            owner: randomAddress,
        })

        assert.deepEqual((res1 as Error).message, RollupErrors.BalanceNotFound)
    })
})
