import { Field, PublicKey, UInt64, ZkProgram } from "o1js"
import { RollupState } from "./RollupState"
import { BalanceWitness } from "./BalanceStorage"
import { BalanceEntry } from "./BalanceEntry"

export const RollupProgram = ZkProgram({
    name: "rollup-program",

    publicInput: RollupState,

    methods: {
        placeOrder: {
            privateInputs: [Field, BalanceWitness, PublicKey, UInt64],

            method(
                rollupState: RollupState,
                tokenId: Field,
                userBalanceWitness: BalanceWitness,
                userAddress: PublicKey,
                currentBalance: UInt64,
            ) {
                const balanceEntry = new BalanceEntry({
                    address: userAddress,
                    amount: currentBalance,
                    tokenId,
                })

                const currentRoot = userBalanceWitness.calculateRoot(
                    balanceEntry.hash(),
                )

                rollupState.balancesRoot.assertEquals(
                    currentRoot,
                    "calculated root doesn't match rollup state",
                )
            },
        },
    },
})
