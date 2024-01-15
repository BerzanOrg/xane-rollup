import { Field, MerkleTree, MerkleWitness, PublicKey, UInt64 } from "o1js"
import { Errors } from "./Errors"
import { Liquidity } from "./Liquidity"

/**
 * Height of the merkle tree that stores users' liquidities.
 */
export const LIQUIDITY_TREE_HEIGHT = 10

/**
 * Merkle witness for the merkle tree that stores users' liquidities.
 */
export class LiqudityWitness extends MerkleWitness(LIQUIDITY_TREE_HEIGHT) {}

/**
 * Stores users' liquidities with an array and a merkle tree.
 */
export class LiquidityStorage {
    private innerTree: MerkleTree
    private innerArray: Array<Liquidity>
    private counter: number

    /**
     * Creates a new instance of `LiquidityStorage`.
     */
    public static empty(): LiquidityStorage {
        return new LiquidityStorage()
    }

    /**
     * Creates a new instance of `LiquidityStorage` by using old liquidities of users to restore.
     */
    public static restore(oldLiquidities: Array<Liquidity>): LiquidityStorage {
        return new LiquidityStorage(oldLiquidities)
    }

    /**
     *  The constructor of `LiquidityStorage` class.
     */
    private constructor(initialLiquidities?: Array<Liquidity>) {
        this.innerTree = new MerkleTree(LIQUIDITY_TREE_HEIGHT)
        this.innerArray = initialLiquidities ?? []
        this.counter = 0

        this.innerArray.forEach(this.store)
    }

    /**
     *  Increments the internal counter that stores the count of users' liquidities.
     */
    private incrementCounter(): void {
        this.counter += 1
    }

    /**
     *  Returns the internal counter that stores the count of users' liquidities.
     */
    private getCounter(): number {
        return this.counter
    }

    /**
     *  Returns the Merkle root of the Merkle tree that stores users' liquidities.
     */
    public getRoot(): Field {
        return this.innerTree.getRoot()
    }

    /**
     * Returns the merkle witness of the given provider's liquidity for the AMM pool of the given base & quote token IDs.
     *
     * Returns an error if the given provider's liquidity for the AMM pool of the given base & quote token IDs is not found.
     */
    public getWitness(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
    }): LiqudityWitness | Error {
        const index = this.innerArray.findIndex((liquidity) =>
            liquidity.same(params).toBoolean(),
        )

        if (index === -1) return Error(Errors.LiqudityNotFound)

        const witness = this.innerTree.getWitness(BigInt(index))

        return new LiqudityWitness(witness)
    }

    /**
     * Stores the given user liquidity.
     *
     * Returns an error if the user already has a liquidity for the AMM pool of the given base & quote token IDs.
     */
    public store(liquidity: Liquidity): void | Error {
        const doesExist = this.innerArray.find((l) =>
            l.same(liquidity).toBoolean(),
        )

        if (doesExist) return Error(Errors.LiqudityExists)

        const index = this.getCounter()

        this.innerArray[index] = liquidity
        this.innerTree.setLeaf(BigInt(index), liquidity.hash())

        this.incrementCounter()
    }

    /**
     * Returns the given provider's liquidity for the AMM pool of the given base & quote token IDs.
     *
     * Returns an error if the given provider's liquidity for the AMM pool of the given base & quote token IDs is not found.
     */
    public get(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
    }): Liquidity | Error {
        const liquidity = this.innerArray.find((liquidity) =>
            liquidity.same(params).toBoolean(),
        )

        return liquidity || Error(Errors.LiqudityNotFound)
    }

    /**
     * Adds the given amount to the given provider's liquidity for the AMM pool of the given base & quote token IDs.
     *
     * Returns an error if the given provider's liquidity for the AMM pool of the given base & quote token IDs is not found.
     */
    public addLiquidityAmount(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
        amount: UInt64
    }): void | Error {
        const liquidity = this.innerArray.find((liquidity) =>
            liquidity.same(params).toBoolean(),
        )

        if (!liquidity) return Error(Errors.LiqudityNotFound)

        liquidity.addLiquidity(params)
    }

    /**
     * Removes the given amount from the given provider's liquidity for the AMM pool of the given base & quote token IDs.
     *
     * Returns an error if the given provider's liquidity for the AMM pool of the given base & quote token IDs is not found.
     */
    public removeLiquidityAmount(params: {
        baseTokenId: Field
        quoteTokenId: Field
        provider: PublicKey
        amount: UInt64
    }): void | Error {
        const liquidity = this.innerArray.find((liquidity) =>
            liquidity.same(params).toBoolean(),
        )

        if (!liquidity) return Error(Errors.LiqudityNotFound)

        liquidity.subLiquidity(params)
    }
}
