import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { Field, MerkleTree, MerkleWitness, Poseidon } from "o1js"

// run this test with `npx tsc && node --test build/MerkleWitnessPair.test.js`

type Witness = Array<{ isLeft: boolean; sibling: Field }>

function MerkleWitnessPair(height: number) {
    return class {
        common: Witness
        firsty: Witness
        secondy: Witness
        firstyIsLeft: boolean
        constructor(first: Witness, second: Witness) {
            this.common = []
            this.firsty = []
            this.secondy = []
            this.firstyIsLeft = false // will be overwritten

            let i = height - 2
            for (; i >= 0; i--) {
                if (
                    first[i].isLeft === second[i].isLeft &&
                    first[i].sibling.equals(second[i].sibling).toBoolean()
                ) {
                    this.common.push(first[i])
                } else {
                    this.firstyIsLeft = first[i].isLeft
                    break
                }
            }

            i -= 1

            for (; i >= 0; i--) {
                this.firsty.push(first[i])
                this.secondy.push(second[i])
            }

            this.common.reverse()
            this.firsty.reverse()
            this.secondy.reverse()
        }

        calculateRoot(first: Field, second: Field) {
            let k = first
            let m = second

            for (let i = 0; i < this.firsty.length; i++) {
                k = Poseidon.hash(
                    this.firsty[i].isLeft
                        ? [k, this.firsty[i].sibling]
                        : [this.firsty[i].sibling, k],
                )
                m = Poseidon.hash(
                    this.secondy[i].isLeft
                        ? [m, this.secondy[i].sibling]
                        : [this.secondy[i].sibling, m],
                )
            }

            let r = Poseidon.hash(this.firstyIsLeft ? [k, m] : [m, k])

            for (let i = 0; i < this.common.length; i++) {
                r = Poseidon.hash(
                    this.common[i].isLeft
                        ? [r, this.common[i].sibling]
                        : [this.common[i].sibling, r],
                )
            }

            return r
        }
    }
}

describe("MerkleWitnessPair", async () => {
    class MerkleWitness6 extends MerkleWitness(6) {}
    class MerkleWitnessPair6 extends MerkleWitnessPair(6) {}

    it("works as expected", async () => {
        const tree = new MerkleTree(6)

        for (let i = 0; i < 32; i++) {
            tree.setLeaf(BigInt(i), Field(i + 1))
        }

        const witness = new MerkleWitness6(tree.getWitness(20n))
        const witnessPair = new MerkleWitnessPair6(
            tree.getWitness(0n),
            tree.getWitness(20n),
        )

        assert.deepEqual(tree.getRoot(), witness.calculateRoot(Field(21)))
        assert.deepEqual(tree.getRoot(), witnessPair.calculateRoot(Field(1), Field(21)))
        assert.deepEqual(
            witness.calculateRoot(Field(5)),
            witnessPair.calculateRoot(Field(1), Field(5)),
        )
    })
})
