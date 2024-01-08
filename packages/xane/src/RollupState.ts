import { Field, Poseidon, PublicKey, Struct, UInt64 } from "o1js"
import { MinaBalancesWitness } from "./constants"
import { UserMinaBalance } from "./Structs"

export class RollupState extends Struct({
    /** Merkle root for the Merkle tree that stores MINA balances of all users. */
    minaBalancesRoot: Field,
}) {
    hash() {
        return Poseidon.hash([...this.minaBalancesRoot.toFields()])
    }

    addUser(
        witness: MinaBalancesWitness,
        userAddress: PublicKey,
        initBalance: UInt64,
    ) {
        const currentRoot = witness.calculateRoot(Field.empty())
        this.minaBalancesRoot.assertEquals(currentRoot)

        const user = new UserMinaBalance({
            address: userAddress,
            balance: initBalance,
        })

        const newRoot = witness.calculateRoot(user.hash())
        this.minaBalancesRoot = newRoot
    }

    updateMinaBalance(
        witness: MinaBalancesWitness,
        userAddress: PublicKey,
        currentBalance: UInt64,
        newBalance: UInt64,
    ) {
        const user = new UserMinaBalance({
            address: userAddress,
            balance: currentBalance,
        })

        const currentRoot = witness.calculateRoot(user.hash())
        this.minaBalancesRoot.assertEquals(currentRoot)

        user.setBalance(newBalance)

        const newRoot = witness.calculateRoot(user.hash())
        this.minaBalancesRoot = newRoot
    }
}
