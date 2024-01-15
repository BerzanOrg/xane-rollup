import { it, describe } from "node:test"
// import assert from "node:assert/strict"
import { Field, Struct, UInt64, ZkProgram } from "o1js"

class User extends Struct({
    age: UInt64,
}) {}

const RollupProgram = ZkProgram({
    name: "rollup-program",

    publicInput: Field,

    methods: {
        createPool: {
            privateInputs: [User],

            method(state: Field, user: User) {
                user
                state
            },
        },
    },
})

describe("Rollup tests", async () => {
    await RollupProgram.compile()

    const user = new User({
        age: UInt64.one,
    })

    it("updates rollup state", async () => {
        const proof = await RollupProgram.createPool(Field.empty(), user)

        proof.verify()
        console.log(proof.publicOutput)
    })
})
