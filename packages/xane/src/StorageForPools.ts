import { Field, MerkleTree, MerkleWitness, Poseidon } from "o1js"
import { RollupErrors } from "./RollupErrors.js"
import { Pool } from "./Structs.js"

// Change the type of `Error` to provide error messagees in a type-safe way.
declare function Error(msg: `${RollupErrors}`): Error

/**
 * Height of the merkle tree that stores AMM pools.
 */
export const POOLS_TREE_HEIGHT = 5

/**
 * Merkle witness for the merkle tree that stores AMM pools.
 */
export class PoolWitness extends MerkleWitness(POOLS_TREE_HEIGHT) {}

/**
 * Stores AMM pools with an array and a merkle tree.
 */
export class StorageForPools {
    private innerTree: MerkleTree
    private innerArray: Array<Pool>
    private counter: number

    /**
     * Creates a new instance of `PoolStorage`.
     */
    public static empty(): StorageForPools {
        return new StorageForPools()
    }

    /**
     * Creates a new instance of `PoolStorage` by using old AMM pools to restore.
     */
    public static restore(oldPools: Array<Pool>): StorageForPools {
        return new StorageForPools(oldPools)
    }

    /**
     *  The constructor of `PoolStorage` class.
     */
    private constructor(initialPools?: Array<Pool>) {
        this.innerTree = new MerkleTree(POOLS_TREE_HEIGHT)
        this.innerArray = initialPools ?? []
        this.counter = 0

        this.innerArray.forEach(this.store)
    }

    /**
     *  Increments the internal counter that stores the count of AMM pools.
     */
    private incrementCounter(): void {
        this.counter += 1
    }

    /**
     *  Returns the internal counter that stores the count of AMM pools.
     */
    private getCounter(): number {
        return this.counter
    }

    /**
     *  Returns the Merkle root of the Merkle tree that stores AMM pools.
     */
    public getRoot(): Field {
        return this.innerTree.getRoot()
    }

    /**
     * Returns the merkle witness of the pool with the given base and quote token IDs.
     *
     * Returns an error if an AMM pool with the given base and quote token IDs is not found.
     */
    public getWitness(params: {
        baseTokenId: Field
        quoteTokenId: Field
    }): PoolWitness | Error {
        const index = this.innerArray.findIndex((pool) => pool.matches(params))

        if (index === -1) return Error("pool is not found")

        const witness = this.innerTree.getWitness(BigInt(index))

        return new PoolWitness(witness)
    }

    /**
     * Returns the merkle witness for the next empty leaf.
     *
     * Uses the internal counter that stores the count of AMM pools.
     */
    public getWitnessNew(): PoolWitness {
        const index = this.getCounter()

        const witness = this.innerTree.getWitness(BigInt(index))

        return new PoolWitness(witness)
    }

    /**
     *  Stores the given AMM pool.
     *
     * Returns an error if an AMM pool with the same base & quote tokens already exists.
     */
    public store(pool: Pool): void | Error {
        const existingPool = this.innerArray.find((p) => p.isSimilar(pool))

        if (existingPool !== undefined) return Error("pool already exists")

        const index = this.getCounter()

        const hash = Poseidon.hash(pool.toFields())

        this.innerArray[index] = pool
        this.innerTree.setLeaf(BigInt(index), hash)

        this.incrementCounter()
    }

    /**
     * Returns the AMM pool with the given base and quote token IDs.
     *
     * Returns an error if an AMM pool with the given base and quote token IDs is not found.
     */
    public get(params: { baseTokenId: Field; quoteTokenId: Field }): Pool | Error {
        const pool = this.innerArray.find((pool) => pool.matches(params))

        return pool || Error("pool is not found")
    }
}
