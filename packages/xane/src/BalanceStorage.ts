import { Field, MerkleTree, MerkleWitness, PublicKey, UInt64 } from "o1js"
import { Errors } from "./Errors"
import { Balance } from "./Balance"

/**
 * Height of the merkle tree that stores user balance entries.
 */
export const BALANCES_TREE_HEIGHT = 10

/**
 * Merkle witness for the merkle tree that stores user balance entries.
 */
export class BalanceWitness extends MerkleWitness(BALANCES_TREE_HEIGHT) {}

/**
 * Stores user balance entries with an array and a merkle tree.
 */
export class BalanceStorage {
    private innerTree: MerkleTree
    private innerArray: Array<Balance>
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
    public static restore(oldBalances: Array<Balance>): BalanceStorage {
        return new BalanceStorage(oldBalances)
    }

    /**
     *  The constructor of `BalanceStorage` class.
     */
    private constructor(initialBalances?: Array<Balance>) {
        this.innerTree = new MerkleTree(BALANCES_TREE_HEIGHT)
        this.innerArray = initialBalances ?? []
        this.counter = 0

        this.innerArray.forEach(this.store)
    }

    /**
     *  Increments the internal counter that stores the count of balance entries.
     */
    private incrementCounter(): void {
        this.counter += 1
    }

    /**
     *  Returns the internal counter that stores the count of balance entries.
     */
    private getCounter(): number {
        return this.counter
    }

    /**
     *  Returns the Merkle root of the Merkle tree that stores balance entries.
     */
    public getRoot(): Field {
        return this.innerTree.getRoot()
    }

    /**
     * Returns the merkle witness of the balance with the given token ID and address.
     *
     * Returns an error if a balance with the same token ID and address is not found.
     */
    public getWitness(params: {
        tokenId: Field
        address: PublicKey
    }): BalanceWitness | Error {
        const index = this.innerArray.findIndex((balance) =>
            balance.same(params).toBoolean(),
        )

        if (index === -1) return Error(Errors.BalanceNotFound)

        const witness = this.innerTree.getWitness(BigInt(index))

        return new BalanceWitness(witness)
    }

    /**
     *  Stores the given balance.
     *
     * Returns an error if a balance with the same token ID and address already exists.
     */
    public store(balance: Balance): void | Error {
        const existingBalance = this.innerArray.find((bal) =>
            bal.same(balance).toBoolean(),
        )

        if (existingBalance !== undefined) return Error(Errors.BalanceExists)

        const index = this.getCounter()

        this.innerArray[index] = balance
        this.innerTree.setLeaf(BigInt(index), balance.hash())

        this.incrementCounter()
    }

    /**
     * Returns the token with the given token ID balance of the given address.
     *
     * Returns an error if a balance with the same token ID and address is not found.
     */
    public get(params: {
        tokenId: Field
        address: PublicKey
    }): Balance | Error {
        const balance = this.innerArray.find((balance) =>
            balance.same(params).toBoolean(),
        )

        return balance || Error(Errors.BalanceNotFound)
    }

    /**
     * Adds the given amount to the token with the given token ID balance of the given address.
     *
     * Returns an error if a balance with the same token ID and address is not found.
     */
    public addBalance(params: {
        tokenId: Field
        address: PublicKey
        amountToAdd: UInt64
    }): void | Error {
        const balance = this.innerArray.find((balance) =>
            balance.same(params).toBoolean(),
        )

        if (!balance) return Error(Errors.BalanceNotFound)

        balance.amount = balance.amount.add(params.amountToAdd)
    }

    /**
     * Subtracts the given amount from the token with the given token ID balance of the given address.
     *
     * Returns an error if a balance with the same token ID and address is not found.
     */
    public subBalance(params: {
        tokenId: Field
        address: PublicKey
        amountToSub: UInt64
    }): void | Error {
        const balance = this.innerArray.find((balance) =>
            balance.same(params).toBoolean(),
        )

        if (!balance) return Error(Errors.BalanceNotFound)

        balance.amount = balance.amount.sub(params.amountToSub)
    }
}
