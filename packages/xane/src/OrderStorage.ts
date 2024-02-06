import { Field, MerkleTree, MerkleWitness } from "o1js"
import { StorageError } from "./RollupErrors.js"
import { OrderEntry } from "./OrderEntry.js"

// Change the type of `Error` to provide error messagees in a type-safe way.
declare function Error(msg: `${StorageError}`): Error

/**
 * Height of the merkle tree that stores order entries.
 */
export const ORDERS_TREE_HEIGHT = 10

/**
 * Merkle witness for the merkle tree that stores order entries.
 */
export class OrderWitness extends MerkleWitness(ORDERS_TREE_HEIGHT) {}

/**
 * Stores order entries with an array and a merkle tree.
 */
export class OrderStorage {
    private innerTree: MerkleTree
    private innerArray: Array<OrderEntry>
    private counter: number

    /**
     * Creates a new instance of `OrderStorage`.
     */
    public static empty(): OrderStorage {
        return new OrderStorage()
    }

    /**
     * Creates a new instance of `OrderStorage` by using old order entries to restore.
     */
    public static restore(oldOrders: Array<OrderEntry>): OrderStorage {
        return new OrderStorage(oldOrders)
    }

    /**
     *  The constructor of `OrderStorage` class.
     */
    private constructor(initialOrders?: Array<OrderEntry>) {
        this.innerTree = new MerkleTree(ORDERS_TREE_HEIGHT)
        this.innerArray = initialOrders ?? []
        this.counter = 0

        this.innerArray.forEach(this.storeOrder)
    }

    /**
     *  Increments `this.counter` by one.
     */
    private incrementCounter(): void {
        this.counter += 1
    }

    /**
     *  Returns `this.counter`.
     */
    private getCounter(): number {
        return this.counter
    }

    /**
     *  Returns the Merkle root of the Merkle tree that stores balance entries.
     */
    public getOrdersRoot(): Field {
        return this.innerTree.getRoot()
    }

    /**
     *  Stores the given order entry.
     */
    public storeOrder(order: OrderEntry): void | Error {
        const index = this.getCounter()

        this.innerArray[index] = order
        this.innerTree.setLeaf(BigInt(index), order.hash())

        this.incrementCounter()
    }

    /**
     * Returns the order entry with the given ID.
     *
     * Returns an error if an order with the given ID doesn't exist.
     */
    public getOrder(params: { orderId: number }): OrderEntry | Error {
        const order = this.innerArray.at(params.orderId)

        return order || Error(StorageError.OrderNotFound)
    }

    /**
     * Makes the order with the given ID cancelled.
     *
     * Returns an error if an order with the given ID doesn't exist.
     */
    public makeCancelled(params: { orderId: number }): void | Error {
        const order = this.innerArray.at(params.orderId)

        if (!order) return Error(StorageError.OrderNotFound)

        order.cancel()
    }

    /**
     * Makes the order with the given ID executed.
     *
     * Returns an error if an order with the given ID doesn't exist.
     */
    public makeExecuted(params: { orderId: number }): void | Error {
        const order = this.innerArray.at(params.orderId)

        if (!order) return Error(StorageError.OrderNotFound)

        order.execute()
    }

    /**
     * Returns the merkle witness of the order entry with the given ID.
     *
     * Returns an error if an order entry with the given ID doesn't exist.
     */
    public getOrderWitness(params: { orderId: number }): OrderWitness | Error {
        const order = this.innerArray.at(params.orderId)

        if (!order) return Error(StorageError.OrderNotFound)

        const witness = this.innerTree.getWitness(BigInt(params.orderId))

        return new OrderWitness(witness)
    }
}
