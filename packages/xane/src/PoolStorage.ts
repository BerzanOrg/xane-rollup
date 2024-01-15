import { Field, MerkleTree, MerkleWitness, UInt64 } from "o1js"
import { Errors } from "./Errors"
import { Pool } from "./Pool"

/**
 * Height of the merkle tree that stores AMM pools.
 */
export const POOLS_TREE_HEIGHT = 10

/**
 * Merkle witness for the merkle tree that stores AMM pools.
 */
export class PoolWitness extends MerkleWitness(POOLS_TREE_HEIGHT) {}

/**
 * Stores AMM pools with an array and a merkle tree.
 */
export class PoolStorage {
    private innerTree: MerkleTree
    private innerArray: Array<Pool>
    private counter: number

    /**
     * Creates a new instance of `PoolStorage`.
     */
    public static empty(): PoolStorage {
        return new PoolStorage()
    }

    /**
     * Creates a new instance of `PoolStorage` by using old AMM pools to restore.
     */
    public static restore(oldPools: Array<Pool>): PoolStorage {
        return new PoolStorage(oldPools)
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
        const index = this.innerArray.findIndex((pool) =>
            pool.same(params).toBoolean(),
        )

        if (index === -1) return Error(Errors.PoolNotFound)

        const witness = this.innerTree.getWitness(BigInt(index))

        return new PoolWitness(witness)
    }

    /**
     *  Stores the given AMM pool.
     *
     * Returns an error if an AMM pool with the same base & quote tokens already exists.
     */
    public store(pool: Pool): void | Error {
        const existingPool = this.innerArray.find((p) =>
            p.same(pool).toBoolean(),
        )

        if (existingPool !== undefined) return Error(Errors.PoolExists)

        const index = this.getCounter()

        this.innerArray[index] = pool
        this.innerTree.setLeaf(BigInt(index), pool.hash())

        this.incrementCounter()
    }

    /**
     * Returns the AMM pool with the given base and quote token IDs.
     *
     * Returns an error if an AMM pool with the given base and quote token IDs is not found.
     */
    public get(params: {
        baseTokenId: Field
        quoteTokenId: Field
    }): Pool | Error {
        const pool = this.innerArray.find((pool) =>
            pool.same(params).toBoolean(),
        )

        return pool || Error(Errors.PoolNotFound)
    }

    /**
     * Adds the given amounts as a liquidity to the AMM pool with the given base and quote token IDs.
     *
     * Returns an error if an AMM pool with the given base and quote token IDs is not found.
     */
    public addLiquidity(params: {
        baseTokenId: Field
        quoteTokenId: Field
        baseTokenAmount: UInt64
        quoteTokenAmount: UInt64
    }): void | Error {
        const pool = this.innerArray.find((pool) =>
            pool.same(params).toBoolean(),
        )

        if (!pool) return Error(Errors.PoolNotFound)

        pool.addLiquidity(params)
    }

    /**
     * Removes the given amounts as a liquidity to the AMM pool with the given base and quote token IDs.
     *
     * Returns an error if an AMM pool with the given base and quote token IDs is not found.
     */
    public removeLiquidity(params: {
        baseTokenId: Field
        quoteTokenId: Field
        baseTokenAmount: UInt64
        quoteTokenAmount: UInt64
    }): void | Error {
        const pool = this.innerArray.find((pool) =>
            pool.same(params).toBoolean(),
        )

        if (!pool) return Error(Errors.PoolNotFound)

        pool.removeLiquidity(params)
    }
}
