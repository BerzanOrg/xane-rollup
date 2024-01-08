import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { MerkleTree, PublicKey, UInt64 } from "o1js"
import {
    MINA_BALANCES_HEIGHT,
    MinaBalancesWitness,
    RollupProgram,
    RollupState,
    UserMinaBalance,
} from "xane"

describe("Rollup tests", async () => {
    await RollupProgram.compile()

    const minaBalancesTree = new MerkleTree(MINA_BALANCES_HEIGHT)

    const rollupState = new RollupState({
        minaBalancesRoot: minaBalancesTree.getRoot(),
    })

    it("updates rollup state", async () => {
        const USER_1_INDEX = 0n

        const user1 = new UserMinaBalance({
            address: PublicKey.empty(),
            balance: UInt64.zero,
        })

        minaBalancesTree.setLeaf(USER_1_INDEX, user1.hash())

        const witness = new MinaBalancesWitness(
            minaBalancesTree.getWitness(USER_1_INDEX),
        )

        rollupState.addUser(witness, user1.address, user1.balance)

        const newBalance = UInt64.from(21000000)

        const proof = await RollupProgram.updateBalance(
            rollupState,
            witness,
            user1.address,
            user1.balance,
            newBalance,
        )

        proof.verify()

        assert.deepEqual(proof.publicInput, rollupState)
    })
})
