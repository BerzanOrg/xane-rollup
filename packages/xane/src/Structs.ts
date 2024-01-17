import { Bool, Field, PublicKey, Struct, UInt64 } from "o1js"

/**
 * A proovable type that represents a user's balance for a specific token.
 */
export class Balance extends Struct({
    tokenId: Field,
    address: PublicKey,
    amount: UInt64,
}) {
    /**
     * Returns the `Array<Field>` representation of the `Balance`.
     */
    public toFields(): Array<Field> {
        return [
            ...this.tokenId.toFields(),
            ...this.address.toFields(),
            ...this.amount.toFields(),
        ]
    }

    /**
     *  Returns `true`, if given token ID and address matches the `Balance`'s.
     *
     *  Otherwise, returns `false`.
     */
    public matches(other: { tokenId: Field; address: PublicKey }): boolean {
        return Bool(true)
            .and(this.tokenId.equals(other.tokenId))
            .and(this.address.equals(other.address))
            .toBoolean()
    }
}

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
     * Returns the `Array<Field>` representation of the `Liquidity`.
     */
    public toFields(): Array<Field> {
        return [
            ...this.baseTokenId.toFields(),
            ...this.quoteTokenId.toFields(),
            ...this.amount.toFields(),
            ...this.provider.toFields(),
        ]
    }

    /**
     *  Returns true, if given base token ID, quote token ID, and provider matches the `Liquidity`'s.
     *
     *  Otherwise, returns false.
     */
    public matches(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
    }): Bool {
        return Bool(true)
            .and(this.baseTokenId.equals(params.baseTokenId))
            .and(this.quoteTokenId.equals(params.quoteTokenId))
            .and(this.provider.equals(params.provider))
    }
}

/**
 * A proovable type that represents an AMM pool for a specific pair.
 */
export class Pool extends Struct({
    baseTokenId: Field,
    quoteTokenId: Field,
    baseTokenAmount: UInt64,
    quoteTokenAmount: UInt64,
    k: UInt64,
    lpTokensSupply: UInt64,
}) {
    /**
     * Returns the `Array<Field>` representation of the `Pool`.
     */
    public toFields(): Array<Field> {
        return [
            ...this.baseTokenId.toFields(),
            ...this.quoteTokenId.toFields(),
            ...this.baseTokenAmount.toFields(),
            ...this.baseTokenAmount.toFields(),
            ...this.k.toFields(),
            ...this.lpTokensSupply.toFields(),
        ]
    }

    /**
     *  Returns true, if given base token ID, and quote token ID matches the `Pool`'s.
     *
     *  Otherwise, returns false.
     */
    public matches(other: { baseTokenId: Field; quoteTokenId: Field }): Bool {
        return Bool(false)
            .or(
                Bool(true)
                    .and(this.baseTokenId.equals(other.baseTokenId))
                    .and(this.quoteTokenId.equals(other.quoteTokenId)),
            )
            .or(
                Bool(true)
                    .and(this.baseTokenId.equals(other.quoteTokenId))
                    .and(this.quoteTokenId.equals(other.baseTokenId)),
            )
    }
}
