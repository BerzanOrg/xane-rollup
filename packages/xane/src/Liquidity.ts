import { Bool, Field, Poseidon, PublicKey, Struct, UInt64 } from "o1js"

/**
 * A proovable type that represents a user's liquidity in a pool.
 */
export class Liquidity extends Struct({
    baseTokenId: Field,
    quoteTokenId: Field,
    amount: UInt64,
    provider: PublicKey,
}) {
    /**
     * Returns Poseidon hash of the liquidity.
     */
    public hash(): Field {
        return Poseidon.hash([
            ...this.baseTokenId.toFields(),
            ...this.quoteTokenId.toFields(),
            ...this.amount.toFields(),
            ...this.provider.toFields(),
        ])
    }

    /**
     *  Returns true, if given liquidities are the same.
     *
     *  Otherwise, returns false.
     */
    public same(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
    }): Bool {
        return Bool(true)
            .and(this.baseTokenId.equals(params.baseTokenId))
            .and(this.quoteTokenId.equals(params.quoteTokenId))
            .and(this.provider.equals(params.provider))
    }

    /**
     * Adds liquidity using the given amount.
     */
    public addLiquidity(params: { amount: UInt64 }) {
        this.amount = this.amount.add(params.amount)
    }

    /**
     * Subtracts liquidity using the given amount.
     */
    public subLiquidity(params: { amount: UInt64 }) {
        this.amount = this.amount.sub(params.amount)
    }
}
