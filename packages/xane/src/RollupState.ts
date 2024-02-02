import { Field, Poseidon, Struct, UInt64 } from "o1js"
import { Balance, Liquidity, Pool } from "./Structs.js"
import { BalanceWitness } from "./StorageForBalances.js"
import { PoolWitness } from "./StorageForPools.js"
import { LiqudityWitness } from "./StorageForLiquidities.js"

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
        baseTokenAmount,
        quoteTokenAmount,
        baseTokenBalance,
        quoteTokenBalance,
        emptyPool,
        emptyLiquidity,
        poolWitness,
        liquidityWitness,
    }: CreatePool) {
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
        baseTokenAmount,
        baseTokenBalance,
        quoteTokenBalance,
        pool,
        liquidity,
        poolWitness,
        liquidityWitness,
    }: AddLiquidity) {
        // Makes calculations.
        const lpPointsToCreate = baseTokenAmount
            .mul(pool.lpPoints)
            .div(pool.baseTokenAmount)

        const quoteTokenAmount = pool.baseTokenAmount
            .add(baseTokenAmount)
            .mul(pool.quoteTokenAmount)
            .div(pool.baseTokenAmount)
            .sub(pool.quoteTokenAmount)

        // Updates data.
        baseTokenBalance.amount = baseTokenBalance.amount.sub(baseTokenAmount)
        quoteTokenBalance.amount = quoteTokenBalance.amount.sub(quoteTokenAmount)

        pool.baseTokenAmount = pool.baseTokenAmount.add(baseTokenAmount)
        pool.quoteTokenAmount = pool.quoteTokenAmount.add(quoteTokenAmount)
        pool.k = pool.baseTokenAmount.mul(pool.quoteTokenAmount)
        pool.lpPoints = pool.lpPoints.add(lpPointsToCreate)

        liquidity.lpPoints = liquidity.lpPoints.add(lpPointsToCreate)

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
        lpPoints,
        baseTokenBalance,
        quoteTokenBalance,
        pool,
        liquidity,
        poolWitness,
        liquidityWitness,
    }: RemoveLiquidity) {
        // Makes calculations.
        const baseTokenAmount = lpPoints.mul(pool.baseTokenAmount).div(pool.lpPoints)
        const quoteTokenAmount = lpPoints.mul(pool.quoteTokenAmount).div(pool.lpPoints)

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
    baseTokenAmount: UInt64
    baseTokenBalance: Balance
    quoteTokenBalance: Balance
    pool: Pool
    liquidity: Liquidity
    poolWitness: PoolWitness
    liquidityWitness: LiqudityWitness
}

interface RemoveLiquidity {
    lpPoints: UInt64
    baseTokenBalance: Balance
    quoteTokenBalance: Balance
    pool: Pool
    liquidity: Liquidity
    poolWitness: PoolWitness
    liquidityWitness: LiqudityWitness
}
