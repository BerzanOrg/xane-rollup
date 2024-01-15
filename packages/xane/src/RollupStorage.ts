import { BalanceStorage } from "./BalanceStorage"
import { Balance } from "./Balance"
import { LiquidityStorage } from "./LiquidityStorage"
import { PoolStorage } from "./PoolStorage"
import { Pool } from "./Pool"
import { Liquidity } from "./Liquidity"
import { RollupState } from "./RollupState"

/**
 * Stores all the data of a rollup.
 */
export class RollupStorage {
    public state: RollupState
    public balances: BalanceStorage
    public pools: PoolStorage
    public liquidities: LiquidityStorage

    /**
     * Creates a new instance of `RollupStorage`.
     */
    public static empty(): RollupStorage {
        return new RollupStorage()
    }

    /**
     * Creates a new instance of `RollupStorage` by using old balance and order entries to restore.
     */
    public static restore(
        oldBalances: Array<Balance>,
        oldPools: Array<Pool>,
        oldLiquidites: Array<Liquidity>,
    ): RollupStorage {
        return new RollupStorage(oldBalances, oldPools, oldLiquidites)
    }

    /**
     *  The constructor of `RollupStorage` class.
     */
    private constructor(
        initialBalances?: Array<Balance>,
        initialPools?: Array<Pool>,
        initialLiquidites?: Array<Liquidity>,
    ) {
        if (initialBalances && initialPools && initialLiquidites) {
            this.balances = BalanceStorage.restore(initialBalances)
            this.pools = PoolStorage.restore(initialPools)
            this.liquidities = LiquidityStorage.restore(initialLiquidites)
        } else {
            this.balances = BalanceStorage.empty()
            this.pools = PoolStorage.empty()
            this.liquidities = LiquidityStorage.empty()
        }

        this.state = new RollupState({
            balancesRoot: this.balances.getRoot(),
            poolsRoot: this.pools.getRoot(),
            liquiditiesRoot: this.liquidities.getRoot(),
        })
    }

    /**
     * Updates the rollup state.
     */
    public updateState() {
        this.state.balancesRoot = this.balances.getRoot()
        this.state.poolsRoot = this.pools.getRoot()
        this.state.liquiditiesRoot = this.liquidities.getRoot()
    }
}
