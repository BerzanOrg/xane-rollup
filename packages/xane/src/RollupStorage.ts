import { StorageForBalances } from "./StorageForBalances.js"
import { StorageForLiquidities } from "./StorageForLiquidities.js"
import { StorageForPools } from "./StorageForPools.js"
import { RollupState } from "./RollupState.js"
import { Balance, Liquidity, Pool } from "./Structs.js"
import { RollupProof } from "./RollupProof.js"

/**
 * Stores all the data of a rollup.
 */
export class RollupStorage {
    public state: RollupState
    public lastProof: RollupProof
    public balances: StorageForBalances
    public pools: StorageForPools
    public liquidities: StorageForLiquidities

    /**
     * Creates a new instance of `RollupStorage`.
     */
    public static empty(lastProof: RollupProof): RollupStorage {
        return new RollupStorage(lastProof)
    }

    /**
     * Creates a new instance of `RollupStorage` by using old balance and order entries to restore.
     */
    public static restore(
        lastProof: RollupProof,
        oldBalances: Array<Balance>,
        oldPools: Array<Pool>,
        oldLiquidites: Array<Liquidity>,
    ): RollupStorage {
        return new RollupStorage(lastProof, oldBalances, oldPools, oldLiquidites)
    }

    /**
     *  The constructor of `RollupStorage` class.
     */
    private constructor(
        lastProof: RollupProof,
        initialBalances?: Array<Balance>,
        initialPools?: Array<Pool>,
        initialLiquidites?: Array<Liquidity>,
    ) {
        this.lastProof = lastProof

        if (initialBalances) {
            this.balances = StorageForBalances.restore(initialBalances)
        } else {
            this.balances = StorageForBalances.empty()
        }

        if (initialPools) {
            this.pools = StorageForPools.restore(initialPools)
        } else {
            this.pools = StorageForPools.empty()
        }

        if (initialLiquidites) {
            this.liquidities = StorageForLiquidities.restore(initialLiquidites)
        } else {
            this.liquidities = StorageForLiquidities.empty()
        }

        this.state = new RollupState({
            balancesRoot: this.balances.getRoot(),
            poolsRoot: this.pools.getRoot(),
            liquiditiesRoot: this.liquidities.getRoot(),
        })
    }

    /**
     * Updates the rollup state.
     *
     * Call this method after updating any item in the storage.
     */
    public updateState() {
        this.state.balancesRoot = this.balances.getRoot()
        this.state.poolsRoot = this.pools.getRoot()
        this.state.liquiditiesRoot = this.liquidities.getRoot()
    }
}
