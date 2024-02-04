import { Field, MerkleTree, MerkleWitness, Poseidon, PublicKey } from "o1js"
import { Errors } from "./RollupErrors.js"
import { Balance } from "./Structs.js"
import { MerkleDoubleWitness } from "./MerkleDoubleWitness.js"

// Change the type of `Error` to provide error messagees in a type-safe way.
declare function Error(msg: `${Errors}`): Error

/**
 * Height of the merkle tree that stores user balance entries.
 */
export const BALANCES_TREE_HEIGHT = 5

/**
 * Merkle witness for the merkle tree that stores user balance entries.
 */
export class BalanceWitness extends MerkleWitness(BALANCES_TREE_HEIGHT) {}

/**
 * Merkle double witness for the merkle tree that stores user balance entries.
 */
export class BalanceDoubleWitness extends MerkleDoubleWitness(BALANCES_TREE_HEIGHT) {}

/**
 * Stores user balance entries with an array and a merkle tree.
 */
export class StorageForBalances {
    private innerTree: MerkleTree
    private innerArray: Array<Balance>
    private counter: number

    /**
     * Creates a new instance of `BalanceStorage`.
     */
    public static empty(): StorageForBalances {
        return new StorageForBalances()
    }

    /**
     * Creates a new instance of `BalanceStorage` by using old balance entries to restore.
     */
    public static restore(oldBalances: Array<Balance>): StorageForBalances {
        return new StorageForBalances(oldBalances)
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
        owner: PublicKey
    }): BalanceWitness | Error {
        const index = this.innerArray.findIndex((balance) => balance.matches(params))

        if (index === -1) return Error("balance is not found")

        const witness = this.innerTree.getWitness(BigInt(index))

        return new BalanceWitness(witness)
    }

    /**
     * Returns the merkle witness for the next empty leaf.
     *
     * Uses the internal counter that stores the count of balance entries.
     */
    public getWitnessNew(): BalanceWitness {
        const index = this.getCounter()

        const witness = this.innerTree.getWitness(BigInt(index))

        return new BalanceWitness(witness)
    }

    /**
     * Stores the given balance.
     *
     * Returns an error if a balance with the same token ID and address already exists.
     */
    public store(balance: Balance): void | Error {
        const existingBalance = this.innerArray.find((bal) => balance.matches(bal))

        if (existingBalance !== undefined) return Error("balance already exists")

        const index = this.getCounter()

        const hash = Poseidon.hash(balance.toFields())

        this.innerArray[index] = balance
        this.innerTree.setLeaf(BigInt(index), hash)

        this.incrementCounter()
    }

    /**
     * Returns the token with the given token ID balance of the given address.
     *
     * Returns an error if a balance with the same token ID and address is not found.
     */
    public get(params: { tokenId: Field; owner: PublicKey }): Balance | Error {
        const balance = this.innerArray.find((balance) => balance.matches(params))

        return balance || Error("balance is not found")
    }
}
