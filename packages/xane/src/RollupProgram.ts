import { PublicKey, UInt64, ZkProgram } from "o1js"
import { RollupState } from "./RollupState"
import { MinaBalancesWitness } from "./constants"

export const RollupProgram = ZkProgram({
    name: "rollup-program",

    publicInput: RollupState,

    methods: {
        updateBalance: {
            privateInputs: [MinaBalancesWitness, PublicKey, UInt64, UInt64],

            method(
                state: RollupState,
                witness: MinaBalancesWitness,
                userAddress: PublicKey,
                currentBalance: UInt64,
                newBalance: UInt64,
            ) {
                state.updateMinaBalance(
                    witness,
                    userAddress,
                    currentBalance,
                    newBalance,
                )
            },
        },
    },
})
