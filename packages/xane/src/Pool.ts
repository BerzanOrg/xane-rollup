import { Bool, Field, Poseidon, Struct, UInt64 } from "o1js"

/**
 * A proovable type that represents an AMM pool for a pair.
 */
export class Pool extends Struct({
    baseTokenId: Field,
    quoteTokenId: Field,
    baseTokenAmount: UInt64,
    quoteTokenAmount: UInt64,
    k: UInt64,
}) {
    /**
     * Returns Poseidon hash of the AMM pool.
     */
    public hash(): Field {
        return Poseidon.hash([
            ...this.baseTokenId.toFields(),
            ...this.quoteTokenId.toFields(),
            ...this.baseTokenAmount.toFields(),
            ...this.baseTokenAmount.toFields(),
            ...this.k.toFields(),
        ])
    }

    /**
     * Creates a new AMM pool with the given configuration.
     */
    public static create(params: {
        baseTokenId: Field
        quoteTokenId: Field
        baseTokenAmount: UInt64
        quoteTokenAmount: UInt64
    }): Pool {
        const k = params.baseTokenAmount.mul(params.quoteTokenAmount)

        return new Pool({
            baseTokenId: params.baseTokenId,
            quoteTokenId: params.quoteTokenId,
            baseTokenAmount: params.baseTokenAmount,
            quoteTokenAmount: params.quoteTokenAmount,
            k,
        })
    }

    /**
     * The constructor of `Pool` class.
     */
    private constructor(params: {
        baseTokenId: Field
        quoteTokenId: Field
        baseTokenAmount: UInt64
        quoteTokenAmount: UInt64
        k: UInt64
    }) {
        super(params)
    }

    /**
     *  Returns true, if given base & quote tokens are the same.
     *
     *  Otherwise, returns false.
     */
    public sameBaseAndQuoteTokens(other: {
        baseTokenId: Field
        quoteTokenId: Field
    }): Bool {
        return this.baseTokenId
            .equals(other.baseTokenId)
            .and(this.quoteTokenId.equals(other.quoteTokenId))
            .or(
                this.baseTokenId
                    .equals(other.quoteTokenId)
                    .and(this.quoteTokenId.equals(other.baseTokenId)),
            )
    }

    /**
     *  Returns true, if the given base and quote tokens' amount are balanced with the pool's liquidity.
     *
     *  Otherwise, returns false.
     */
    public isBalanced(params: {
        baseTokenAmount: UInt64
        quoteTokenAmount: UInt64
    }): Bool {
        return this.baseTokenAmount
            .div(params.baseTokenAmount)
            .equals(this.quoteTokenAmount.div(params.quoteTokenAmount))
    }

    /**
     * Calculates `k` by multiplying base and quote tokens' amount.
     */
    public static calculateK(params: {
        baseTokenAmount: UInt64
        quoteTokenAmount: UInt64
    }): UInt64 {
        const k = params.baseTokenAmount.mul(params.quoteTokenAmount)

        return k
    }

    /**
     * Adds liquidty using the given amounts, and calculates a new `k`.
     */
    public addLiquidity(params: {
        baseTokenAmount: UInt64
        quoteTokenAmount: UInt64
    }) {
        const newBaseTokenAmount = this.baseTokenAmount.add(
            params.baseTokenAmount,
        )

        const newQuoteTokenAmount = this.quoteTokenAmount.add(
            params.quoteTokenAmount,
        )

        const newK = newBaseTokenAmount.mul(newQuoteTokenAmount)

        this.baseTokenAmount = newBaseTokenAmount
        this.quoteTokenAmount = newQuoteTokenAmount
        this.k = newK
    }
}
