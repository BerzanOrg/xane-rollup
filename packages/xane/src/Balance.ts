import { Bool, Field, Poseidon, PublicKey, Struct, UInt64 } from "o1js"

/**
 * A proovable type that represents a user's balance for a specific token.
 */
export class Balance extends Struct({
    tokenId: Field,
    address: PublicKey,
    amount: UInt64,
}) {
    /**
     * Returns Poseidon hash of the balance.
     */
    public hash(): Field {
        return Poseidon.hash([
            ...this.tokenId.toFields(),
            ...this.address.toFields(),
            ...this.amount.toFields(),
        ])
    }

    /**
     *  Returns true, if given token ID and address is the same with the balance.
     *
     *  Otherwise, returns false.
     */
    public same(other: { tokenId: Field; address: PublicKey }): Bool {
        return Bool(true)
            .and(this.tokenId.equals(other.tokenId))
            .and(this.address.equals(other.address))
    }

    /**
     * Adds the given amount to the balance.
     */
    public add(params: { amount: UInt64 }) {
        this.amount = this.amount.add(params.amount)
    }

    /**
     * Subtracts the given amount from the balance.
     */
    public sub(params: { amount: UInt64 }) {
        this.amount = this.amount.sub(params.amount)
    }
}
