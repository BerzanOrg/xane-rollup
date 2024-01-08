import { Field, Poseidon, PublicKey, Struct, UInt64 } from "o1js"

export class UserMinaBalance extends Struct({
    address: PublicKey,
    balance: UInt64,
}) {
    setBalance(balance: UInt64) {
        this.balance = balance
    }

    hash(): Field {
        return Poseidon.hash([
            ...this.address.toFields(),
            ...this.balance.toFields(),
        ])
    }
}
