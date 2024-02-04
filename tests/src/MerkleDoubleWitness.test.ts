import { it, describe, before } from "node:test"
import assert from "node:assert/strict"
import { Field, MerkleTree, MerkleWitness } from "o1js"
import { MerkleDoubleWitness } from "xane"

// run this test with `npx tsc && node --test build/MerkleDoubleWitness.test.js`

describe("MerkleWitnessPair", async () => {
    class MerkleWitness6 extends MerkleWitness(6) {}
    class MerkleDoubleWitness6 extends MerkleDoubleWitness(6) {}

    const tree = new MerkleTree(6)

    before(() => {
        for (let i = 0; i < 32; i++) {
            tree.setLeaf(BigInt(i), Field(i)) // fill each leaf with `i`
        }
    })

    it("can calculate indexes", async () => {
        const witness = new MerkleWitness6(tree.getWitness(0n))

        const doubleWitness = new MerkleDoubleWitness6(
            tree.getWitness(0n),
            tree.getWitness(20n),
        )

        assert.deepEqual(Field(0n), witness.calculateIndex())
        assert.deepEqual(Field(0n), doubleWitness.calculateIndexes()[0])
        assert.deepEqual(Field(20n), doubleWitness.calculateIndexes()[1])
    })

    it("can calculate root", async () => {
        const witness = new MerkleWitness6(tree.getWitness(0n))

        const doubleWitness = new MerkleDoubleWitness6(
            tree.getWitness(0n),
            tree.getWitness(20n),
        )

        assert.deepEqual(tree.getRoot(), witness.calculateRoot(Field(0)))
        assert.deepEqual(tree.getRoot(), doubleWitness.calculateRoot(Field(0), Field(20)))

        tree.setLeaf(0n, Field(999))

        assert.deepEqual(tree.getRoot(), witness.calculateRoot(Field(999)))
        assert.deepEqual(
            tree.getRoot(),
            doubleWitness.calculateRoot(Field(999), Field(20)),
        )

        tree.setLeaf(20n, Field(42))

        assert.deepEqual(
            tree.getRoot(),
            doubleWitness.calculateRoot(Field(999), Field(42)),
        )
    })
})
