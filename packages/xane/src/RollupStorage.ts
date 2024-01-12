import { BalanceStorage } from "./BalanceStorage"
import { OrderStorage } from "./OrderStorage"
import { BalanceEntry } from "./BalanceEntry"
import { OrderEntry } from "./OrderEntry"

/**
 * Stores all the data of a rollup.
 */
export class RollupStorage {
    public balanceStorage: BalanceStorage
    public orderStorage: OrderStorage

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
        oldBalances: Array<BalanceEntry>,
        oldOrders: Array<OrderEntry>,
    ): RollupStorage {
        return new RollupStorage(oldBalances, oldOrders)
    }

    /**
     *  The constructor of `RollupStorage` class.
     */
    private constructor(
        initialBalances?: Array<BalanceEntry>,
        initialOrders?: Array<OrderEntry>,
    ) {
        if (initialBalances && initialOrders) {
            this.balanceStorage = BalanceStorage.restore(initialBalances)
            this.orderStorage = OrderStorage.restore(initialOrders)
        } else {
            this.balanceStorage = BalanceStorage.empty()
            this.orderStorage = OrderStorage.empty()
        }
    }
}
