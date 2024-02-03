import {
    Bool,
    Field,
    Poseidon,
    Provable,
    PublicKey,
    Signature,
    Struct,
    UInt64,
} from "o1js"
import { Balance, Liquidity, Pool } from "./Structs.js"
import { BalanceWitness } from "./StorageForBalances.js"
import { PoolWitness } from "./StorageForPools.js"
import { LiqudityWitness } from "./StorageForLiquidities.js"
import { Errors } from "./RollupErrors.js"

/** Initial supply of LP points. */
export const INITIAL_LP_POINTS = UInt64.from(65535)

/**
 * A proovable type that represents the rollup state.
 */
export class RollupState extends Struct({
    /** Merkle root for the Merkle tree that stores token balances of users. */
    balancesRoot: Field,
    /** Merkle root for the Merkle tree that stores AMM pools. */
    poolsRoot: Field,
    /** Merkle root for the Merkle tree that stores users' liquidities. */
    liquiditiesRoot: Field,
}) {
    /**
     * Returns the `Array<Field>` representation of the `RollupState`.
     */
    public toFields(): Array<Field> {
        return [
            ...this.balancesRoot.toFields(),
            ...this.poolsRoot.toFields(),
            ...this.liquiditiesRoot.toFields(),
        ]
    }

    /**
     * Adds amount to balance.
     */
    public addBalance({ amount, balance, balanceWitness }: AddBalance) {
        // Calculates root using given data.
        const calculatedBalancesRoot = Provable.if(
            balance.amount.equals(UInt64.zero),
            balanceWitness.calculateRoot(Field.empty()),
            balanceWitness.calculateRoot(Poseidon.hash(balance.toFields())),
        )

        // Requires calculated root to be valid.
        Bool(true)
            .and(this.balancesRoot.equals(calculatedBalancesRoot))
            .assertTrue(Errors.InvalidCalculatedRoot)

        // Adds amount to balance.
        balance.amount = balance.amount.add(amount)

        // Calculates new root using updated data.
        const newBalancesRoot = balanceWitness.calculateRoot(
            Poseidon.hash(balance.toFields()),
        )

        // Updates root.
        this.balancesRoot = newBalancesRoot
    }

    /**
     * Subtracts amount from balance, if given data is valid.
     */
    public subBalance({ amount, balance, balanceWitness }: SubBalance) {
        // Calculates root using given data.
        const calculatedBalancesRoot = Provable.if(
            balance.amount.equals(UInt64.zero),
            balanceWitness.calculateRoot(Field.empty()),
            balanceWitness.calculateRoot(Poseidon.hash(balance.toFields())),
        )

        // Requires calculated root to be valid.
        Bool(true)
            .and(this.balancesRoot.equals(calculatedBalancesRoot))
            .assertTrue(Errors.InvalidCalculatedRoot)

        // Adds amount to balance.
        balance.amount = balance.amount.sub(amount)

        // Calculates new root using updated data.
        const newBalancesRoot = balanceWitness.calculateRoot(
            Poseidon.hash(balance.toFields()),
        )

        // Updates root.
        this.balancesRoot = newBalancesRoot
    }

    /**
     * Creates a pool.
     */
    public createPool({
        sender,
        signature,
        baseTokenAmount,
        quoteTokenAmount,
        baseTokenBalance,
        quoteTokenBalance,
        emptyPool,
        emptyLiquidity,
        poolWitness,
        liquidityWitness,
    }: CreatePool) {
        // Defines variables.
        const calculatedPoolsRoot = poolWitness.calculateRoot(Field.empty())
        const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(Field.empty())
        const message = [
            ...this.toFields(),
            ...baseTokenAmount.toFields(),
            ...quoteTokenAmount.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            ...poolWitness.toFields(),
            ...liquidityWitness.toFields(),
        ]

        // Requires signature to be valid.
        Bool(true)
            .and(signature.verify(sender, message))
            .assertTrue(Errors.InvalidSignature)

        // Requires roots to be valid.
        Bool(true)
            .and(this.poolsRoot.equals(calculatedPoolsRoot))
            .and(this.liquiditiesRoot.equals(calculatedLiquiditiesRoot))
            .assertTrue(Errors.InvalidCalculatedRoot)

        // Requires balances to be sufficient.
        Bool(true)
            .and(baseTokenBalance.amount.greaterThanOrEqual(baseTokenAmount))
            .and(quoteTokenBalance.amount.greaterThanOrEqual(quoteTokenAmount))
            .assertTrue(Errors.InsufficientBalance)

        // Require token identifiers not to be equal.
        Bool(false)
            .and(baseTokenBalance.tokenId.equals(quoteTokenBalance.tokenId))
            .assertFalse(Errors.InvalidTokenId)

        // Requires balance owners to be sender.
        Bool(true)
            .and(baseTokenBalance.owner.equals(sender))
            .and(quoteTokenBalance.owner.equals(sender))
            .assertTrue(Errors.InvalidBalanceOwner)

        // Updates data.
        baseTokenBalance.amount = baseTokenBalance.amount.sub(baseTokenAmount)
        quoteTokenBalance.amount = quoteTokenBalance.amount.sub(quoteTokenAmount)

        emptyPool.baseTokenId = baseTokenBalance.tokenId
        emptyPool.quoteTokenId = quoteTokenBalance.tokenId
        emptyPool.baseTokenAmount = baseTokenAmount
        emptyPool.quoteTokenAmount = quoteTokenAmount
        emptyPool.k = baseTokenAmount.mul(quoteTokenAmount)
        emptyPool.lpPoints = INITIAL_LP_POINTS

        emptyLiquidity.baseTokenId = baseTokenBalance.tokenId
        emptyLiquidity.quoteTokenId = quoteTokenBalance.tokenId
        emptyLiquidity.lpPoints = INITIAL_LP_POINTS
        emptyLiquidity.provider = baseTokenBalance.owner

        // Calculates new roots using updated data.
        const newPoolsRoot = poolWitness.calculateRoot(
            Poseidon.hash(emptyPool.toFields()),
        )
        const newLiquiditiesRoot = liquidityWitness.calculateRoot(
            Poseidon.hash(emptyLiquidity.toFields()),
        )

        // Updates roots.
        this.poolsRoot = newPoolsRoot
        this.liquiditiesRoot = newLiquiditiesRoot
    }

    /**
     * Adds liquidity.
     */
    public addLiquidity({
        sender,
        signature,
        baseTokenAmount,
        quoteTokenAmountMaxLimit,
        baseTokenBalance,
        quoteTokenBalance,
        pool,
        liquidity,
        poolWitness,
        liquidityWitness,
    }: AddLiquidity) {
        // Defines variables.
        const isLiquidityEmpty = liquidity.isEmpty()
        const lpPointsToCreate = baseTokenAmount
            .mul(pool.lpPoints)
            .div(pool.baseTokenAmount)
        const quoteTokenAmount = pool.baseTokenAmount
            .add(baseTokenAmount)
            .mul(pool.quoteTokenAmount)
            .div(pool.baseTokenAmount)
            .sub(pool.quoteTokenAmount)
        const calculatedPoolsRoot = poolWitness.calculateRoot(
            Poseidon.hash(pool.toFields()),
        )
        const calculatedLiquiditiesRoot = Provable.if(
            isLiquidityEmpty,
            liquidityWitness.calculateRoot(Field.empty()),
            liquidityWitness.calculateRoot(Poseidon.hash(liquidity.toFields())),
        )
        const message = [
            ...this.toFields(),
            ...baseTokenAmount.toFields(),
            ...quoteTokenAmountMaxLimit.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            ...pool.toFields(),
            ...liquidity.toFields(),
            ...poolWitness.toFields(),
            ...liquidityWitness.toFields(),
        ]

        // Requires signature to be valid.
        Bool(true)
            .and(signature.verify(sender, message))
            .assertTrue(Errors.InvalidSignature)

        // Requires roots to be valid.
        Bool(true)
            .and(this.poolsRoot.equals(calculatedPoolsRoot))
            .and(this.liquiditiesRoot.equals(calculatedLiquiditiesRoot))
            .assertTrue(Errors.InvalidCalculatedRoot)

        // Requires balance owners to be sender.
        Bool(true)
            .and(baseTokenBalance.owner.equals(sender))
            .and(quoteTokenBalance.owner.equals(sender))
            .assertTrue(Errors.InvalidBalanceOwner)

        // Requires liquidity provider to be sender if liquidity is not empty.
        Provable.if(
            isLiquidityEmpty,
            Bool(true),
            liquidity.provider.equals(sender),
        ).assertTrue(Errors.InvalidLiquidityProvider)

        // Requires balances to be sufficient.
        Bool(true)
            .and(baseTokenBalance.amount.greaterThanOrEqual(baseTokenAmount))
            .and(quoteTokenBalance.amount.greaterThanOrEqual(quoteTokenAmount))
            .assertTrue(Errors.InsufficientBalance)

        // Requires limits not to be exceeded.
        Bool(true)
            .and(quoteTokenAmount.lessThanOrEqual(quoteTokenAmountMaxLimit))
            .assertTrue(Errors.ExceededLimit)

        // Requires token identifiers to be valid.
        Bool(true)
            .and(pool.baseTokenId.equals(baseTokenBalance.tokenId))
            .and(pool.quoteTokenId.equals(quoteTokenBalance.tokenId))
            .assertTrue(Errors.InvalidTokenId)

        // Requires token identifiers to be valid if liquidity is not empty.
        Provable.if(
            isLiquidityEmpty,
            Bool(true),
            liquidity.baseTokenId.equals(baseTokenBalance.tokenId),
        ).assertTrue(Errors.InvalidTokenId)

        // Requires token identifiers to be valid if liquidity is not empty.
        Provable.if(
            isLiquidityEmpty,
            Bool(true),
            liquidity.quoteTokenId.equals(quoteTokenBalance.tokenId),
        ).assertTrue(Errors.InvalidTokenId)

        // Updates data.
        baseTokenBalance.amount = baseTokenBalance.amount.sub(baseTokenAmount)
        quoteTokenBalance.amount = quoteTokenBalance.amount.sub(quoteTokenAmount)

        pool.baseTokenAmount = pool.baseTokenAmount.add(baseTokenAmount)
        pool.quoteTokenAmount = pool.quoteTokenAmount.add(quoteTokenAmount)
        pool.k = pool.baseTokenAmount.mul(pool.quoteTokenAmount)
        pool.lpPoints = pool.lpPoints.add(lpPointsToCreate)

        liquidity.lpPoints = liquidity.lpPoints.add(lpPointsToCreate)
        liquidity.baseTokenId = baseTokenBalance.tokenId // NOTE: In case liquidity is empty, we initialize base token id.
        liquidity.quoteTokenId = quoteTokenBalance.tokenId // NOTE: In case liquidity is empty, we initialize quote token id.
        liquidity.provider = baseTokenBalance.owner // NOTE: In case liquidity is empty, we initialize provider.

        // Calculates new roots using updated data.
        const newPoolsRoot = poolWitness.calculateRoot(Poseidon.hash(pool.toFields()))
        const newLiquiditiesRoot = liquidityWitness.calculateRoot(
            Poseidon.hash(liquidity.toFields()),
        )

        // Updates roots.
        this.poolsRoot = newPoolsRoot
        this.liquiditiesRoot = newLiquiditiesRoot
    }

    /**
     * Removes liquidity.
     */
    public removeLiquidity({
        sender,
        signature,
        lpPoints,
        baseTokenAmountMinLimit,
        quoteTokenAmountMinLimit,
        baseTokenBalance,
        quoteTokenBalance,
        pool,
        liquidity,
        poolWitness,
        liquidityWitness,
    }: RemoveLiquidity) {
        // Defines variables.
        const baseTokenAmount = lpPoints.mul(pool.baseTokenAmount).div(pool.lpPoints)
        const quoteTokenAmount = lpPoints.mul(pool.quoteTokenAmount).div(pool.lpPoints)
        const calculatedPoolsRoot = poolWitness.calculateRoot(
            Poseidon.hash(pool.toFields()),
        )
        const calculatedLiquiditiesRoot = liquidityWitness.calculateRoot(
            Poseidon.hash(liquidity.toFields()),
        )
        const message = [
            ...this.toFields(),
            ...lpPoints.toFields(),
            ...baseTokenAmountMinLimit.toFields(),
            ...quoteTokenAmountMinLimit.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            ...pool.toFields(),
            ...liquidity.toFields(),
            ...poolWitness.toFields(),
            ...liquidityWitness.toFields(),
        ]

        // Requires signature to be valid.
        Bool(true)
            .and(signature.verify(sender, message))
            .assertTrue(Errors.InvalidSignature)

        // Requires roots to be valid.
        Bool(true)
            .and(this.poolsRoot.equals(calculatedPoolsRoot))
            .and(this.liquiditiesRoot.equals(calculatedLiquiditiesRoot))
            .assertTrue(Errors.InvalidCalculatedRoot)

        // Requires balance owners to be sender.
        Bool(true)
            .and(baseTokenBalance.owner.equals(sender))
            .and(quoteTokenBalance.owner.equals(sender))
            .assertTrue(Errors.InvalidBalanceOwner)

        // Requires liquidity provider to be sender if liquidity is not empty.
        Bool(true)
            .and(liquidity.provider.equals(sender))
            .assertTrue(Errors.InvalidLiquidityProvider)

        // Requires balances to be sufficient.
        Bool(true)
            .and(baseTokenBalance.amount.greaterThanOrEqual(baseTokenAmount))
            .and(quoteTokenBalance.amount.greaterThanOrEqual(quoteTokenAmount))
            .assertTrue(Errors.InsufficientBalance)

        // Requires limits not to be exceeded.
        Bool(true)
            .and(baseTokenAmount.greaterThanOrEqual(baseTokenAmountMinLimit))
            .and(quoteTokenAmount.greaterThanOrEqual(quoteTokenAmountMinLimit))
            .assertTrue(Errors.ExceededLimit)

        // Requires token identifiers to be valid.
        Bool(true)
            .and(pool.baseTokenId.equals(baseTokenBalance.tokenId))
            .and(pool.quoteTokenId.equals(quoteTokenBalance.tokenId))
            .and(liquidity.baseTokenId.equals(baseTokenBalance.tokenId))
            .and(liquidity.quoteTokenId.equals(quoteTokenBalance.tokenId))
            .assertTrue(Errors.InvalidTokenId)

        // Updates data.
        baseTokenBalance.amount = baseTokenBalance.amount.add(baseTokenAmount)
        quoteTokenBalance.amount = quoteTokenBalance.amount.add(quoteTokenAmount)

        pool.baseTokenAmount = pool.baseTokenAmount.sub(baseTokenAmount)
        pool.quoteTokenAmount = pool.quoteTokenAmount.sub(quoteTokenAmount)
        pool.k = pool.baseTokenAmount.mul(pool.quoteTokenAmount)
        pool.lpPoints = pool.lpPoints.sub(lpPoints)

        liquidity.lpPoints = liquidity.lpPoints.sub(lpPoints)

        // Calculates new roots using updated data.
        const newPoolsRoot = poolWitness.calculateRoot(Poseidon.hash(pool.toFields()))
        const newLiquiditiesRoot = liquidityWitness.calculateRoot(
            Poseidon.hash(liquidity.toFields()),
        )

        // Updates roots.
        this.poolsRoot = newPoolsRoot
        this.liquiditiesRoot = newLiquiditiesRoot
    }

    /**
     * Buys base token, sells quote token.
     */
    public buy({
        sender,
        signature,
        baseTokenAmount,
        quoteTokenAmountMaxLimit,
        baseTokenBalance,
        quoteTokenBalance,
        pool,
        poolWitness,
    }: Buy) {
        // Defines variables.
        const newBaseTokenAmount = pool.baseTokenAmount.sub(baseTokenAmount)
        const newQuoteTokenAmount = pool.k.div(newBaseTokenAmount)
        const quoteTokenAmount = newQuoteTokenAmount.sub(pool.quoteTokenAmount)
        const calculatedPoolsRoot = poolWitness.calculateRoot(
            Poseidon.hash(pool.toFields()),
        )
        const message = [
            ...this.toFields(),
            ...baseTokenAmount.toFields(),
            ...quoteTokenAmountMaxLimit.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            ...pool.toFields(),
            ...poolWitness.toFields(),
        ]

        // Requires signature to be valid.
        Bool(true)
            .and(signature.verify(sender, message))
            .assertTrue(Errors.InvalidSignature)

        // Requires root to be valid.
        Bool(true)
            .and(this.poolsRoot.equals(calculatedPoolsRoot))
            .assertTrue(Errors.InvalidCalculatedRoot)

        // Requires balance owners to be sender.
        Bool(true)
            .and(baseTokenBalance.owner.equals(sender))
            .and(quoteTokenBalance.owner.equals(sender))
            .assertTrue(Errors.InvalidBalanceOwner)

        // Requires balance to be sufficient.
        Bool(true)
            .and(quoteTokenBalance.amount.greaterThanOrEqual(quoteTokenAmount))
            .assertTrue(Errors.InsufficientBalance)

        // Requires limit not to be exceeded.
        Bool(true)
            .and(quoteTokenAmount.lessThanOrEqual(quoteTokenAmountMaxLimit))
            .assertTrue(Errors.ExceededLimit)

        // Requires token identifiers to be valid.
        Bool(true)
            .and(pool.baseTokenId.equals(baseTokenBalance.tokenId))
            .and(pool.quoteTokenId.equals(quoteTokenBalance.tokenId))
            .assertTrue(Errors.InvalidTokenId)

        // Updates data.
        baseTokenBalance.amount = baseTokenBalance.amount.add(baseTokenAmount)
        quoteTokenBalance.amount = quoteTokenBalance.amount.sub(quoteTokenAmount)

        pool.baseTokenAmount = newBaseTokenAmount
        pool.quoteTokenAmount = newQuoteTokenAmount
        pool.k = newBaseTokenAmount.mul(newQuoteTokenAmount)

        // Calculates new roots using updated data.
        const newPoolsRoot = poolWitness.calculateRoot(Poseidon.hash(pool.toFields()))

        // Updates root.
        this.poolsRoot = newPoolsRoot
    }

    /**
     * Sells base token, buys quote token.
     */
    public sell({
        sender,
        signature,
        baseTokenAmount,
        quoteTokenAmountMinLimit,
        baseTokenBalance,
        quoteTokenBalance,
        pool,
        poolWitness,
    }: Sell) {
        // Defines variables.
        const newBaseTokenAmount = pool.baseTokenAmount.add(baseTokenAmount)
        const newQuoteTokenAmount = pool.k.div(newBaseTokenAmount)
        const quoteTokenAmount = pool.quoteTokenAmount.sub(newQuoteTokenAmount)
        const calculatedPoolsRoot = poolWitness.calculateRoot(
            Poseidon.hash(pool.toFields()),
        )
        const message = [
            ...this.toFields(),
            ...baseTokenAmount.toFields(),
            ...quoteTokenAmountMinLimit.toFields(),
            ...baseTokenBalance.toFields(),
            ...quoteTokenBalance.toFields(),
            ...pool.toFields(),
            ...poolWitness.toFields(),
        ]

        // Requires signature to be valid.
        Bool(true)
            .and(signature.verify(sender, message))
            .assertTrue(Errors.InvalidSignature)

        // Requires root to be valid.
        Bool(true)
            .and(this.poolsRoot.equals(calculatedPoolsRoot))
            .assertTrue(Errors.InvalidCalculatedRoot)

        // Requires balance owners to be sender.
        Bool(true)
            .and(baseTokenBalance.owner.equals(sender))
            .and(quoteTokenBalance.owner.equals(sender))
            .assertTrue(Errors.InvalidBalanceOwner)

        // Requires balance to be sufficient.
        Bool(true)
            .and(quoteTokenBalance.amount.greaterThanOrEqual(quoteTokenAmount))
            .assertTrue(Errors.InsufficientBalance)

        // Requires limit not to be exceeded.
        Bool(true)
            .and(quoteTokenAmount.greaterThanOrEqual(quoteTokenAmountMinLimit))
            .assertTrue(Errors.ExceededLimit)

        // Requires token identifiers to be valid.
        Bool(true)
            .and(pool.baseTokenId.equals(baseTokenBalance.tokenId))
            .and(pool.quoteTokenId.equals(quoteTokenBalance.tokenId))
            .assertTrue(Errors.InvalidTokenId)

        // Updates data.
        baseTokenBalance.amount = baseTokenBalance.amount.sub(baseTokenAmount)
        quoteTokenBalance.amount = quoteTokenBalance.amount.mod(quoteTokenAmount)

        pool.baseTokenAmount = newBaseTokenAmount
        pool.quoteTokenAmount = newQuoteTokenAmount
        pool.k = newBaseTokenAmount.mul(newQuoteTokenAmount)

        // Calculates new roots using updated data.
        const newPoolsRoot = poolWitness.calculateRoot(Poseidon.hash(pool.toFields()))

        // Updates root.
        this.poolsRoot = newPoolsRoot
    }
}

interface AddBalance {
    amount: UInt64
    balance: Balance
    balanceWitness: BalanceWitness
}

interface SubBalance {
    amount: UInt64
    balance: Balance
    balanceWitness: BalanceWitness
}

interface CreatePool {
    sender: PublicKey
    signature: Signature
    baseTokenAmount: UInt64
    quoteTokenAmount: UInt64
    baseTokenBalance: Balance
    quoteTokenBalance: Balance
    emptyPool: Pool
    emptyLiquidity: Liquidity
    poolWitness: PoolWitness
    liquidityWitness: LiqudityWitness
}

interface AddLiquidity {
    sender: PublicKey
    signature: Signature
    baseTokenAmount: UInt64
    quoteTokenAmountMaxLimit: UInt64
    baseTokenBalance: Balance
    quoteTokenBalance: Balance
    pool: Pool
    liquidity: Liquidity
    poolWitness: PoolWitness
    liquidityWitness: LiqudityWitness
}

interface RemoveLiquidity {
    sender: PublicKey
    signature: Signature
    lpPoints: UInt64
    baseTokenAmountMinLimit: UInt64
    quoteTokenAmountMinLimit: UInt64
    baseTokenBalance: Balance
    quoteTokenBalance: Balance
    pool: Pool
    liquidity: Liquidity
    poolWitness: PoolWitness
    liquidityWitness: LiqudityWitness
}

interface Buy {
    sender: PublicKey
    signature: Signature
    baseTokenAmount: UInt64
    quoteTokenAmountMaxLimit: UInt64
    baseTokenBalance: Balance
    quoteTokenBalance: Balance
    pool: Pool
    poolWitness: PoolWitness
}

interface Sell {
    sender: PublicKey
    signature: Signature
    baseTokenAmount: UInt64
    quoteTokenAmountMinLimit: UInt64
    baseTokenBalance: Balance
    quoteTokenBalance: Balance
    pool: Pool
    poolWitness: PoolWitness
}
