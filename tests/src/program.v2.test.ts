import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, UInt64 } from "o1js"
import { RollupStorage, RollupProgram, Balance } from "xane"
import { utils } from "./utils.js"

describe("Program with V2 methods", async () => {
    const storage = RollupStorage.empty()

    const berzan = utils.generateKeypair()

    const minaTokenId = Field(0)

    const usdcTokenId = Field(54321)

    it("can compile the rollup program", async () => {
        await RollupProgram.compile()
    })

    it("can add mina balance", async () => {
        const initialMinaBalance = utils.createNumber(21_000_000, 9)
        const minaBalance = new Balance({
            tokenId: minaTokenId,
            owner: berzan.publicKey,
            amount: UInt64.zero,
        })
        const balanceWitness = storage.balances.getWitnessNew()

        const proof = await RollupProgram.addBalanceV2(
            storage.state,
            initialMinaBalance,
            minaBalance,
            balanceWitness,
        )

        proof.verify()

        storage.balances.store(minaBalance)
        storage.updateState()

        const fetchedMinaBalance = storage.balances.get({
            owner: berzan.publicKey,
            tokenId: minaTokenId,
        })

        assert.deepEqual(minaBalance, fetchedMinaBalance, "balances does not match")
    })

    it("can add usdc balance", async () => {
        const initialUsdcBalance = utils.createNumber(50_000_000_000, 6)
        const usdcBalance = new Balance({
            tokenId: usdcTokenId,
            owner: berzan.publicKey,
            amount: UInt64.zero,
        })
        const balanceWitness = storage.balances.getWitnessNew()

        const proof = await RollupProgram.addBalanceV2(
            storage.state,
            initialUsdcBalance,
            usdcBalance,
            balanceWitness,
        )

        proof.verify()

        storage.balances.store(usdcBalance)
        storage.updateState()

        const fetchedUsdcBalance = storage.balances.get({
            owner: berzan.publicKey,
            tokenId: usdcTokenId,
        })

        assert.deepEqual(usdcBalance, fetchedUsdcBalance, "balances does not match")
    })
})
