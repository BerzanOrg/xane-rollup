import { Bool, Field, Poseidon, PublicKey, Struct, UInt64 } from "o1js"

/**
 * A proovable type that represents a user's balance for a specific token.
 */
export class BalanceEntry extends Struct({
    tokenId: Field,
    address: PublicKey,
    amount: UInt64,
}) {
    /**
     * Returns Poseidon hash of the balance entry.
     */
    public hash(): Field {
        return Poseidon.hash([
            ...this.tokenId.toFields(),
            ...this.address.toFields(),
            ...this.amount.toFields(),
        ])
    }

    /**
     *  Returns true, if given token ID and address is the same with the balance entry.
     *
     *  Otherwise, returns false.
     */
    public sameTokenIdAndAddress(other: {
        tokenId: Field
        address: PublicKey
    }): Bool {
        return this.tokenId
            .equals(other.tokenId)
            .and(this.address.equals(other.address))
    }
}
