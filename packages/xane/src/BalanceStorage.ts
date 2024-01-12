import { Field, MerkleTree, MerkleWitness, PublicKey, UInt64 } from "o1js"
import { XaneError } from "./Error"
import { BalanceEntry } from "./BalanceEntry"

/**
 * Height of the merkle tree that stores user balance entries.
 */
export const BALANCES_TREE_HEIGHT = 10

/**
 * Height of the merkle tree that stores user balance entries.
 */
export class BalanceWitness extends MerkleWitness(BALANCES_TREE_HEIGHT) {}

/**
 * Stores user balance entries with an array and a merkle tree.
 */
export class BalanceStorage {
    private innerTree: MerkleTree
    private innerArray: Array<BalanceEntry>
    private counter: number

    /**
     * Creates a new instance of `BalanceStorage`.
     */
    public static empty(): BalanceStorage {
        return new BalanceStorage()
    }

    /**
     * Creates a new instance of `BalanceStorage` by using old balance entries to restore.
     */
    public static restore(oldBalances: Array<BalanceEntry>): BalanceStorage {
        return new BalanceStorage(oldBalances)
    }

    /**
     *  The constructor of `BalanceStorage` class.
     */
    private constructor(initialBalances?: Array<BalanceEntry>) {
        this.innerTree = new MerkleTree(BALANCES_TREE_HEIGHT)
        this.innerArray = initialBalances ?? []
        this.counter = 0

        this.innerArray.forEach(this.storeBalance)
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
    public getBalancesRoot(): Field {
        return this.innerTree.getRoot()
    }

    /**
     *  Stores the given balance entry.
     *
     * Returns an error if a balance entry with the same token ID and address already exists.
     */
    public storeBalance(balance: BalanceEntry): void | Error {
        const existingBalance = this.innerArray.find((bal) =>
            bal.sameTokenIdAndAddress(balance).toBoolean(),
        )

        if (existingBalance !== undefined)
            return Error(XaneError.BalanceAlreadyExists)

        const index = this.getCounter()

        this.innerArray[index] = balance
        this.innerTree.setLeaf(BigInt(index), balance.hash())

        this.incrementCounter()
    }

    /**
     * Returns the token with the given token ID balance of the given address.
     *
     * Returns an error if a balance entry with the same token ID and address doesn't exist.
     */
    public getBalance(params: {
        tokenId: Field
        address: PublicKey
    }): UInt64 | Error {
        const balance = this.innerArray.find((balance) =>
            balance.sameTokenIdAndAddress(params).toBoolean(),
        )

        return balance?.amount || Error(XaneError.BalanceNotFound)
    }

    /**
     * Adds the given amount to the token with the given token ID balance of the given address.
     *
     * Returns an error if a balance entry with the same token ID and address doesn't exist.
     */
    public addBalance(params: {
        tokenId: Field
        address: PublicKey
        amountToAdd: UInt64
    }): void | Error {
        const balance = this.innerArray.find((balance) =>
            balance.sameTokenIdAndAddress(params).toBoolean(),
        )

        if (!balance) return Error(XaneError.BalanceNotFound)

        balance.amount = balance.amount.add(params.amountToAdd)
    }

    /**
     * Subtracts the given amount to the token with the given token ID balance of the given address.
     *
     * Returns an error if a balance entry with the same token ID and address doesn't exist.
     */
    public subBalance(params: {
        tokenId: Field
        address: PublicKey
        amountToSub: UInt64
    }): void | Error {
        const balance = this.innerArray.find((balance) =>
            balance.sameTokenIdAndAddress(params).toBoolean(),
        )

        if (!balance) return Error(XaneError.BalanceNotFound)

        balance.amount = balance.amount.sub(params.amountToSub)
    }

    /**
     * Returns the merkle witness of the balance entry with the given token ID and address.
     *
     * Returns an error if a balance entry with the same token ID and address doesn't exist.
     */
    public getBalanceWitness(params: {
        tokenId: Field
        address: PublicKey
    }): BalanceWitness | Error {
        const index = this.innerArray.findIndex((balance) =>
            balance.sameTokenIdAndAddress(params).toBoolean(),
        )

        if (index === -1) return Error(XaneError.BalanceNotFound)

        const witness = this.innerTree.getWitness(BigInt(index))

        return new BalanceWitness(witness)
    }
}
